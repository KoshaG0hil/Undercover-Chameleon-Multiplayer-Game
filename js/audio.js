/**
 * Web Audio API Synthesizer Engine
 * Generates rich cyberpunk sound effects procedurally without any external audio files.
 * Works seamlessly across mobile iOS/Android and desktop browsers.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Quick futuristic blip when navigating or clicking buttons
   */
  playBlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  /**
   * Cyber chime when a new player joins the lobby
   */
  playPlayerJoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.15);
    });
  }

  /**
   * Dramatic synth drone when roles and secret words are revealed
   */
  playRoleReveal(isChameleon = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isChameleon) {
      // Ominous minor tension chord
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(164.81, this.ctx.currentTime + 0.4);

      sub.type = "sine";
      sub.frequency.setValueAtTime(110, this.ctx.currentTime);
    } else {
      // Heroic synth chord
      osc.type = "triangle";
      osc.frequency.setValueAtTime(329.63, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(493.88, this.ctx.currentTime + 0.35);

      sub.type = "sine";
      sub.frequency.setValueAtTime(164.81, this.ctx.currentTime);
    }

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    sub.start();
    osc.stop(this.ctx.currentTime + 0.7);
    sub.stop(this.ctx.currentTime + 0.7);
  }

  /**
   * Short tick for timer countdowns
   */
  playTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  /**
   * Voting lockout buzzer
   */
  playVoteCast() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  /**
   * Victory celebratory fanfare
   */
  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.1);
      osc.stop(this.ctx.currentTime + idx * 0.1 + 0.35);
    });
  }

  /**
   * Haptic vibration for mobile devices
   */
  vibrate(pattern = [50]) {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignored if browser permission denies
      }
    }
  }
}

const audio = new SoundSynthesizer();
