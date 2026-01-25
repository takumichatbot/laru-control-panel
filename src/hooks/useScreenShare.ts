// src/hooks/useScreenShare.ts
'use client';
import { useState, useRef, useCallback } from 'react';

export const useScreenShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopScreenShare = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    setIsSharing(false);
  }, []);

  const startScreenShare = useCallback(async (onFrame: (base64Frame: string) => void) => {
    try {
      // 1. 画面キャプチャの開始
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false
      });
      streamRef.current = stream;
      setIsSharing(true);

      // 2. 映像を解析するための非表示ビデオ要素
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // スクリーンショットの間隔を 2秒(2000ms) に広げて安定させる
      timerRef.current = setInterval(() => {
        if (ctx && video.videoWidth > 0) {
          // 解像度をさらに下げて高速化 (320px程度でGeminiは十分読めます)
          canvas.width = 320; 
          canvas.height = (video.videoHeight / video.videoWidth) * 320;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 画質を 0.4 に下げて転送量を削減
          const base64Frame = canvas.toDataURL('image/jpeg', 0.4).split(',')[1];
          onFrame(base64Frame);
        }
      }, 2000);

      stream.getVideoTracks()[0].onended = stopScreenShare;

    } catch (e) {
      console.error("Screen Share Error:", e);
      setIsSharing(false);
    }
  }, [stopScreenShare]);

  return { isSharing, startScreenShare, stopScreenShare };
};