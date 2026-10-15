import { SongTrack, SynthesizerType } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private currentTrack: SongTrack | null = null;
  private isCurrentlyPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private volumeNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  // Nodes for custom buffer or synth
  private bufferSource: AudioBufferSourceNode | null = null;
  private synthInterval: number | null = null;
  private activeSynthNodes: AudioNode[] = [];

  private listeners: Set<(playing: boolean, time: number) => void> = new Set();
  private animFrameId: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.volumeNode = this.ctx.createGain();
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.destinationNode = this.ctx.createMediaStreamDestination();

      // Chain: source -> volumeNode -> analyser -> ctx.destination & destinationNode (for recorder)
      this.volumeNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);
      this.analyserNode.connect(this.destinationNode);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getContext(): AudioContext {
    this.initContext();
    return this.ctx!;
  }

  public getDestinationStream(): MediaStream {
    this.initContext();
    return this.destinationNode!.stream;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(32);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  public setVolume(vol: number) {
    if (this.volumeNode && this.ctx) {
      this.volumeNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public async decodeFile(file: File): Promise<AudioBuffer> {
    this.initContext();
    const arrayBuffer = await file.arrayBuffer();
    return await this.ctx!.decodeAudioData(arrayBuffer);
  }

  public async decodeUrl(url: string): Promise<AudioBuffer> {
    this.initContext();
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to load audio from URL: ${resp.statusText}`);
    }
    const arrayBuffer = await resp.arrayBuffer();
    return await this.ctx!.decodeAudioData(arrayBuffer);
  }

  public async play(track: SongTrack, offsetSec = 0, volume = 0.8) {
    this.initContext();
    this.stop();

    this.currentTrack = track;
    this.setVolume(volume);

    if (track.audioBuffer) {
      this.playBuffer(track.audioBuffer, offsetSec);
    } else if (track.audioUrl) {
      try {
        const buf = await this.decodeUrl(track.audioUrl);
        track.audioBuffer = buf;
        if (this.currentTrack?.id === track.id) {
          this.playBuffer(buf, offsetSec);
        }
      } catch (err) {
        console.error('Failed to stream audio track from URL', err);
      }
    } else if (track.synthesizerType) {
      this.playSynth(track.synthesizerType, offsetSec);
    }

    this.isCurrentlyPlaying = true;
    this.startTime = this.ctx!.currentTime - offsetSec;
    this.startTicker();
    this.notify();
  }

  public pause() {
    if (!this.isCurrentlyPlaying) return;
    this.pauseTime = this.getCurrentTime();
    this.stopInternal();
    this.isCurrentlyPlaying = false;
    this.notify();
  }

  public resume() {
    if (this.currentTrack && !this.isCurrentlyPlaying) {
      this.play(this.currentTrack, this.pauseTime);
    }
  }

  public stop() {
    this.stopInternal();
    this.pauseTime = 0;
    this.isCurrentlyPlaying = false;
    this.notify();
  }

  private stopInternal() {
    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
        this.bufferSource.disconnect();
      } catch {
        // already stopped
      }
      this.bufferSource = null;
    }
    if (this.synthInterval) {
      window.clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    this.activeSynthNodes.forEach(n => {
      try { (n as AudioScheduledSourceNode).stop?.(); n.disconnect(); } catch { /* ignore */ }
    });
    this.activeSynthNodes = [];

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public getCurrentTime(): number {
    if (!this.ctx || !this.isCurrentlyPlaying) return this.pauseTime;
    return this.ctx.currentTime - this.startTime;
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  public subscribe(cb: (playing: boolean, time: number) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const time = this.getCurrentTime();
    this.listeners.forEach(cb => cb(this.isCurrentlyPlaying, time));
  }

  private startTicker() {
    const tick = () => {
      if (this.isCurrentlyPlaying) {
        this.notify();
        this.animFrameId = requestAnimationFrame(tick);
      }
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  // ---- BUFFER PLAYBACK ----
  private playBuffer(buffer: AudioBuffer, offsetSec: number) {
    if (!this.ctx || !this.volumeNode) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this.volumeNode);
    src.start(0, offsetSec % buffer.duration);
    this.bufferSource = src;
  }

  // ---- SYNTHESIZER ENGINES FOR INDIAN & MODERN TRACKS ----
  private playSynth(type: SynthesizerType, offsetSec: number) {
    if (!this.ctx || !this.volumeNode) return;
    const ctx = this.ctx;
    const out = this.volumeNode;

    switch (type) {
      case 'saraswati_flute':
        this.createSaraswatiFlute(ctx, out, offsetSec);
        break;
      case 'ganesh_dhol':
        this.createGaneshDhol(ctx, out, offsetSec);
        break;
      case 'maratha_beat':
        this.createMarathaBeat(ctx, out, offsetSec);
        break;
      case 'real_estate_lofi':
        this.createRealEstateLofi(ctx, out, offsetSec);
        break;
      case 'morning_bansuri':
        this.createMorningBansuri(ctx, out, offsetSec);
        break;
      case 'shankh_devotional':
        this.createShankhDevotional(ctx, out, offsetSec);
        break;
      case 'festive_diwali':
        this.createFestiveDiwali(ctx, out, offsetSec);
        break;
    }
  }

  // 6. Shankh & Temple Chimes
  private createShankhDevotional(ctx: AudioContext, out: GainNode, _offset: number) {
    // Sacred Shankh drone
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(196.00, ctx.currentTime); // G3
    osc.frequency.linearRampToValueAtTime(220.00, ctx.currentTime + 1.2);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    osc.start();
    osc.stop(ctx.currentTime + 3.0);

    const playChime = () => {
      if (!this.isCurrentlyPlaying) return;
      this.playBellChime(ctx, out, 987.77);
      setTimeout(() => {
        if (this.isCurrentlyPlaying) this.playBellChime(ctx, out, 1318.51);
      }, 400);
    };
    playChime();
    this.synthInterval = window.setInterval(playChime, 1400);
  }

  // 7. Festive Diwali Shehnai & Dholak
  private createFestiveDiwali(ctx: AudioContext, out: GainNode, _offset: number) {
    let beat = 0;
    const playStep = () => {
      if (!this.isCurrentlyPlaying) return;
      const b = beat % 8;
      beat++;
      // Shehnai lead tone
      const shehnaiFreqs = [440, 493.88, 554.37, 659.25, 739.99];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(shehnaiFreqs[b % shehnaiFreqs.length], ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(out);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);

      // Dholak beat
      if (b === 0 || b === 4) this.playDrumThump(ctx, out, 90, 0.3, 0.2);
      if (b === 2 || b === 6) this.playTashaSnap(ctx, out, 0.2);
    };
    playStep();
    this.synthInterval = window.setInterval(playStep, 260);
  }

  // 1. Saraswati Flute & Sitar Drone (Peaceful, divine, traditional)
  private createSaraswatiFlute(ctx: AudioContext, out: GainNode, _offset: number) {
    // Tanpura Drone (Sa - Pa - Sa')
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.18, ctx.currentTime);
    droneGain.connect(out);

    [146.83, 220.00, 293.66].forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      osc.connect(filter);
      filter.connect(droneGain);
      osc.start();
      this.activeSynthNodes.push(osc, filter);
    });

    // Melodic Flute Raag Notes (D4, E4, F#4, A4, B4, D5)
    const notes = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 493.88, 440.00, 369.99, 329.63];
    let noteIdx = 0;

    const playFluteNote = () => {
      if (!this.isCurrentlyPlaying) return;
      const freq = notes[noteIdx % notes.length];
      noteIdx++;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Subtle breath vibrato
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.value = 5.2; // 5Hz vibrato
      vibratoGain.gain.value = 4.5;
      vibrato.connect(osc.frequency);
      vibrato.start();

      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 3.0;

      // Soft flute envelope (slow attack, sustained singing tone)
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(out);

      osc.start(now);
      osc.stop(now + 1.0);
      vibrato.stop(now + 1.0);

      // Bell chime on every 4th note
      if (noteIdx % 4 === 0) {
        this.playBellChime(ctx, out, 1174.66);
      }
    };

    playFluteNote();
    this.synthInterval = window.setInterval(playFluteNote, 850);
  }

  // 2. Ganesh Mangalmurti Dhol Beat (Energizing festival rhythm)
  private createGaneshDhol(ctx: AudioContext, out: GainNode, _offset: number) {
    let beat = 0;
    const intervalMs = 280; // ~107 BPM dhol tasha groove

    const playDholStep = () => {
      if (!this.isCurrentlyPlaying) return;
      const step = beat % 8;
      beat++;

      // Dhol bass on 0, 3, 4, 6
      if (step === 0 || step === 3 || step === 4 || step === 6) {
        this.playDrumThump(ctx, out, step === 0 ? 65 : 85, 0.45, 0.28);
      }

      // Tasha snap / high rim on every beat with syncopation
      if (step === 1 || step === 2 || step === 5 || step === 7) {
        this.playTashaSnap(ctx, out, 0.22);
      }

      // Ghanta / Brass Bell on 0 and 4
      if (step === 0) {
        this.playBellChime(ctx, out, 880);
      }
    };

    playDholStep();
    this.synthInterval = window.setInterval(playDholStep, intervalMs);
  }

  // 3. Maratha Royal Beat (Majestic, celebratory)
  private createMarathaBeat(ctx: AudioContext, out: GainNode, _offset: number) {
    let step = 0;
    const intervalMs = 320;

    const playMarathaStep = () => {
      if (!this.isCurrentlyPlaying) return;
      const beat = step % 8;
      step++;

      // Gallop rhythm
      this.playDrumThump(ctx, out, beat % 2 === 0 ? 70 : 90, 0.35, 0.22);
      if (beat === 2 || beat === 6) {
        this.playTashaSnap(ctx, out, 0.25);
      }
      if (beat === 0) {
        this.playBrassHorn(ctx, out, 220); // Royal Tutari / Horn tone
      }
    };

    playMarathaStep();
    this.synthInterval = window.setInterval(playMarathaStep, intervalMs);
  }

  // 4. Real Estate Golden Lo-Fi (Modern, premium, acoustic electric piano chords)
  private createRealEstateLofi(ctx: AudioContext, out: GainNode, _offset: number) {
    // Chords (Fmaj7 - G - Em7 - Am)
    const chords = [
      [349.23, 440.00, 523.25, 659.25], // Fmaj7
      [392.00, 493.88, 587.33, 783.99], // G
      [329.63, 392.00, 493.88, 587.33], // Em7
      [440.00, 523.25, 659.25, 880.00], // Am
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.isCurrentlyPlaying) return;
      const freqs = chords[chordIdx % chords.length];
      chordIdx++;

      // Electric piano Rhodes chord
      freqs.forEach((f, i) => {
        setTimeout(() => {
          if (!this.isCurrentlyPlaying) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = f;

          const now = ctx.currentTime;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 1.8);
        }, i * 40); // slight strum
      });

      // Warm bass note
      const bassFreq = freqs[0] / 2;
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.value = bassFreq;
      const now = ctx.currentTime;
      bassGain.gain.setValueAtTime(0.25, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      bassOsc.connect(bassGain);
      bassGain.connect(out);
      bassOsc.start(now);
      bassOsc.stop(now + 1.4);
    };

    playChord();
    this.synthInterval = window.setInterval(playChord, 1800);
  }

  // 5. Morning Bansuri & Nature (Gentle morning flute)
  private createMorningBansuri(ctx: AudioContext, out: GainNode, _offset: number) {
    const ragaNotes = [329.63, 392.00, 440.00, 493.88, 587.33, 659.25];
    let idx = 0;

    const playNote = () => {
      if (!this.isCurrentlyPlaying) return;
      const f = ragaNotes[idx % ragaNotes.length];
      idx++;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 1.5);
    };

    playNote();
    this.synthInterval = window.setInterval(playNote, 950);
  }

  // --- Helpers for drum/bell percussion ---
  private playDrumThump(ctx: AudioContext, out: GainNode, freq: number, gainVal: number, duration: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.8, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + duration);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + duration);
  }

  private playTashaSnap(ctx: AudioContext, out: GainNode, gainVal: number) {
    // Noise buffer for snap
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    noise.start(now);
    noise.stop(now + 0.09);
  }

  private playBellChime(ctx: AudioContext, out: GainNode, freq: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 1.3);
  }

  private playBrassHorn(ctx: AudioContext, out: GainNode, freq: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.25);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(2200, now + 0.25);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.65);
  }
}

export const audioEngine = new AudioEngine();
