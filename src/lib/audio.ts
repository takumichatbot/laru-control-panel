'use client';

class OmegaAudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  init() {
    if (typeof window === 'undefined') return;
    // 既にコンテキストがあり、閉じられていなければ何もしない
    if (this.ctx && this.ctx.state !== 'closed') return;

    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;

      this.ctx = new Ctx();
      this.masterGain = this.ctx!.createGain();
      this.masterGain.connect(this.ctx!.destination);
      this.masterGain.gain.value = 0.3; // 音量
    } catch(e) {
      console.error(">> Audio System: Init Failed", e);
    }
  }

  // 音声認識の前などにリソースを解放するためのメソッド
  async releaseResources() {
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        await this.ctx.close();
        this.ctx = null;
        this.masterGain = null;
      } catch (e) {
        console.warn(">> Audio System: Close failed", e);
      }
    }
  }

  playSFX(type: 'click' | 'enter' | 'alert' | 'start_ping') {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    
    // サスペンド状態なら再開
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);

      if (type === 'start_ping') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.3);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
      } else if (type === 'enter') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.3);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
      }
    } catch (e) {}
  }
}

export const sfx = new OmegaAudioSystem();