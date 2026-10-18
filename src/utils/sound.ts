/**
 * Web Audio API Sound Synthesizer for Genshin Impact / RPG UI & Dice Effects
 * 100% self-contained, no external mp3 files required.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Auto-unlock AudioContext on first user touch/click for mobile browsers (iOS/Android)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {
      // ignore
    }
  };
  window.addEventListener('click', unlockAudio, { passive: true, once: false });
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: false });
}

export const SoundEffects = {
  /**
   * Delicate crystalline UI chime (like selecting an item in Genshin)
   */
  playChime: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio might be blocked by browser policy until user interaction
    }
  },

  /**
   * Pleasant crystalline double-chime for incoming roleplay message
   */
  playReceive: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Two ascending celestial bells (G5 784Hz -> C6 1046.5Hz)
      const freqs = [783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.25);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // Ignore
    }
  },

  /**
   * Sound played when sending a message
   */
  playSend: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Two harmonic bell tones
      [1046.5, 1318.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.35);
      });
    } catch {
      // Ignore
    }
  },

  /**
   * Dice rolling rattle sound
   */
  playDiceRattle: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Click clack clatter of dice
      for (let i = 0; i < 5; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + i * 0.07 + Math.random() * 0.02;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200 + Math.random() * 300, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.05);
      }
    } catch {
      // Ignore
    }
  },

  /**
   * Glorious triumphal harp/bell arpeggio for Critical Success (Nat 20)
   */
  playCriticalSuccess: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Pentatonic bright chime sequence: C6, E6, G6, B6, C7
      const notes = [1046.5, 1318.5, 1567.98, 1975.53, 2093.0];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + index * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.8);
      });
    } catch {
      // Ignore
    }
  },

  /**
   * Dramatic comic thud for Critical Failure (Nat 1)
   */
  playCriticalFail: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Ignore
    }
  },
};

/**
 * Ambient Audio Synthesizer (Nocturnal breeze, crickets, soft harp atmosphere)
 */
class AmbientPlayer {
  private isPlaying = false;
  private intervalId: number | null = null;

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Periodically play soft mystical chime pads
    const playAtmosphereChord = () => {
      if (!this.isPlaying) return;
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const chords = [
          [440, 554.37, 659.25], // A major
          [392, 493.88, 587.33], // G major
          [523.25, 659.25, 783.99], // C major
          [329.63, 392, 493.88], // E minor
        ];
        const chord = chords[Math.floor(Math.random() * chords.length)];

        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.02, now + 1.5);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 4.5);
        });
      } catch {
        // Ignore
      }
    };

    playAtmosphereChord();
    this.intervalId = window.setInterval(playAtmosphereChord, 5000);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  getStatus(): boolean {
    return this.isPlaying;
  }
}

export const ambientPlayer = new AmbientPlayer();
