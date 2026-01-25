'use client';

import { useState, useRef, useCallback } from 'react';

export const useGeminiLive = (onTextReceived?: (text: string) => void) => {
  const [isLive, setIsLive] = useState(false);
  
  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // 音声再生用キュー
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // 送信用バッファ (クライアント側で溜めてから送る)
  const pcmBufferRef = useRef<Int16Array[]>([]);
  const pcmBufferLengthRef = useRef<number>(0);

  const stopLive = useCallback(() => {
    // 再生停止
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch(e){}
    }
    currentSourceRef.current = null;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    
    // バッファクリア
    pcmBufferRef.current = [];
    pcmBufferLengthRef.current = 0;

    // マイク処理停止
    if (sourceRef.current) sourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    if (gainNodeRef.current) gainNodeRef.current.disconnect();
    
    // マイクストリーム停止
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // ソケット切断
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // AudioContext破棄
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    
    setIsLive(false);
    console.log("🛑 Nexus Live: STOPPED");
  }, []);

  const playNextChunk = () => {
    if (!audioCtxRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const float32 = audioQueueRef.current.shift();
    if (!float32) return;

    const audioBuffer = audioCtxRef.current.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtxRef.current.destination);

    if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch(e){}
    }
    currentSourceRef.current = source;

    source.start(0);

    source.onended = () => {
      if (currentSourceRef.current === source) {
        currentSourceRef.current = null;
        playNextChunk();
      }
    };
  };

  const startLive = useCallback(async (url: string) => {
    if (audioCtxRef.current) return;

    try {
      console.log("🎤 Requesting Mic Access (Optimized)...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1 
        } 
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        latencyHint: 'interactive',
      });
      audioCtxRef.current = audioCtx;
      await audioCtx.resume();

      const socket = new WebSocket(url);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;

      socket.onopen = () => console.log("✅ Nexus Live: CONNECTED");
      socket.onclose = () => stopLive();

      socket.onmessage = async (event) => {
        if (typeof event.data === 'string') {
           try {
             const data = JSON.parse(event.data);
             if (data.type === 'LOG' && onTextReceived) {
               onTextReceived(data.payload.msg);
             }
           } catch(e){}
           return;
        }
        if (event.data instanceof ArrayBuffer) {
          const pcm16 = new Int16Array(event.data);
          if (pcm16.length > 0) {
             const float32 = new Float32Array(pcm16.length);
             for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768.0;
             audioQueueRef.current.push(float32);
             if (!isPlayingRef.current) playNextChunk();
          }
        }
      };

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // バッファサイズを4096に固定
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const muteNode = audioCtx.createGain();
      muteNode.gain.value = 0;
      gainNodeRef.current = muteNode;

      source.connect(processor);
      processor.connect(muteNode);
      muteNode.connect(audioCtx.destination);

      let sendCount = 0;

      // 【重要設定】ノイズゲート閾値を上げる
      // 0.02だと環境音を拾いすぎて「無言」と判定されないため、0.05まで上げる
      // これにより、喋り終わった瞬間に送信が止まり、AIが即座に返答生成に移れる
      const NOISE_THRESHOLD = 0.05;

      processor.onaudioprocess = (e) => {
        if (socket.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // ゲイン調整（少し控えめに）
        const BOOST = 1.2; 
        
        let maxVal = 0;
        for (let i = 0; i < inputData.length; i++) {
            let val = inputData[i] * BOOST;
            if (val > 1.0) val = 1.0;
            if (val < -1.0) val = -1.0;
            // バッファを書き換える
            inputData[i] = val;
            if (Math.abs(val) > maxVal) maxVal = Math.abs(val);
        }

        sendCount++;
        if (sendCount % 20 === 0) {
            console.log(`🎤 Vol: ${maxVal.toFixed(4)}`);
        }

        // ノイズゲート判定: 音が小さければ無視（送信しない）
        if (maxVal < NOISE_THRESHOLD) {
            // 無音の時は溜まっているバッファがあれば即座に送ってフラッシュする
            // これが「語尾の切れ目」をAIに伝える合図になる
            if (pcmBufferLengthRef.current > 0) {
                flushBuffer(socket);
            }
            return; 
        }

        // ダウンサンプリング処理 (44.1kHz/48kHz -> 16kHz)
        const targetSampleRate = 16000;
        const currentSampleRate = audioCtx.sampleRate;
        const compression = currentSampleRate / targetSampleRate;
        const outputLength = Math.floor(inputData.length / compression);
        const pcm16 = new Int16Array(outputLength);

        for (let i = 0; i < outputLength; i++) {
            const idx = Math.floor(i * compression);
            let s = inputData[idx];
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // 【クライアント側バッファリング】
        // 小さなデータを何度も送ると通信が詰まるので、ある程度まとめて送る
        pcmBufferRef.current.push(pcm16);
        pcmBufferLengthRef.current += pcm16.length;

        // 約0.25秒分（4000サンプル）溜まったら送信
        // これで通信回数が減り、サーバー負荷が下がる
        if (pcmBufferLengthRef.current >= 4000) {
            flushBuffer(socket);
        }
      };

      const flushBuffer = (sock: WebSocket) => {
          if (pcmBufferRef.current.length === 0) return;

          // 溜まったチャンクを結合
          const totalLength = pcmBufferLengthRef.current;
          const combined = new Int16Array(totalLength);
          let offset = 0;
          for (const chunk of pcmBufferRef.current) {
              combined.set(chunk, offset);
              offset += chunk.length;
          }

          // 送信
          sock.send(combined.buffer);

          // リセット
          pcmBufferRef.current = [];
          pcmBufferLengthRef.current = 0;
      };

      setIsLive(true);

    } catch (e) {
      console.error("Live Start Error:", e);
      stopLive();
    }
  }, [stopLive, onTextReceived]);

  return { isLive, startLive, stopLive };
};