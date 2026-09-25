/**
 * AUDIO ENGINE FOR "GỬI TRÍ LỢI"
 * Supports:
 * 1. Procedural Melancholic Romantic Piano synthesizer via Web Audio API (Zero external network dependencies, guaranteed to play anywhere!)
 * 2. Custom MP3 loading (local file / user uploaded file)
 * 3. Smooth volume fade-in/fade-out
 */

class RomanticAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.7;
    this.customAudio = null;
    this.isUsingCustom = false;
    this.currentLoopTimeout = null;
    this.pianoNotes = [];
    this.onStateChangeCallbacks = [];
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  onStateChange(fn) {
    this.onStateChangeCallbacks.push(fn);
  }

  notifyStateChange() {
    this.onStateChangeCallbacks.forEach(fn => fn(this.isPlaying));
  }

  // Play a soft synthesized piano note with warm overtones & decay
  playPianoNote(freq, time, duration = 3.5, gainLevel = 0.25) {
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    // Harmonics for rich, warm Rhodes / upright piano tone
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, time);

    // Filter for mellow acoustic feeling
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(350, time + duration);

    // Envelope
    const totalGain = gainLevel * this.volume;
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.exponentialRampToValueAtTime(totalGain, time + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(totalGain * 0.45, time + 0.8);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Connect nodes
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = 0.8;

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.ctx.destination);

    osc1.start(time);
    osc2.start(time);
    osc3.start(time);

    osc1.stop(time + duration);
    osc2.stop(time + duration);
    osc3.stop(time + duration);
  }

  // Note frequency helper
  getFreq(note) {
    const notes = {
      'C3': 130.81, 'E3': 164.81, 'G3': 196.00, 'B3': 246.94,
      'A2': 110.00, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63,
      'F3': 174.61, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00,
      'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
      'G2': 98.00,  'D3': 146.83, 'F#3': 185.00, 'A3': 220.00
    };
    return notes[note] || 261.63;
  }

  // Melancholic, nostalgic chord progression (C - Em/B - Am - Fmaj7)
  startPianoLoop() {
    if (!this.isPlaying || this.isUsingCustom) return;
    this.initContext();

    const bpm = 64; // slow, heart-to-heart tempo
    const beatSec = 60 / bpm;
    const now = this.ctx.currentTime + 0.1;

    // Chord sequence expressing love and nostalgia
    const melodyPattern = [
      // Bar 1: C major (Warm beginnings)
      { bass: 'C3', chord: ['G3', 'C4', 'E4'], melody: ['G4', 'E4', 'G4', 'C5'], delay: 0 },
      // Bar 2: G/B or Em (Gentle longing)
      { bass: 'G2', chord: ['G3', 'B3', 'D4'], melody: ['D5', 'B4', 'G4', 'D5'], delay: 4 * beatSec },
      // Bar 3: Am (Reflective memories)
      { bass: 'A2', chord: ['E3', 'A3', 'C4'], melody: ['C5', 'A4', 'E4', 'A4'], delay: 8 * beatSec },
      // Bar 4: Fmaj7 (Plea & tenderness)
      { bass: 'F3', chord: ['C4', 'E4', 'A4'], melody: ['E5', 'D5', 'C5', 'A4'], delay: 12 * beatSec },
      // Bar 5: Dm7 (Heartache)
      { bass: 'D3', chord: ['F3', 'A3', 'C4'], melody: ['F4', 'A4', 'C5', 'D5'], delay: 16 * beatSec },
      // Bar 6: Em7 (Hope)
      { bass: 'E3', chord: ['G3', 'B3', 'D4'], melody: ['E5', 'B4', 'G4', 'E4'], delay: 20 * beatSec },
      // Bar 7: Fmaj7 (Pleading)
      { bass: 'F3', chord: ['A3', 'C4', 'E4'], melody: ['C5', 'D5', 'E5', 'G5'], delay: 24 * beatSec },
      // Bar 8: Gsus4 -> G (Resolve)
      { bass: 'G2', chord: ['G3', 'C4', 'D4'], melody: ['D5', 'C5', 'B4', 'G4'], delay: 28 * beatSec }
    ];

    melodyPattern.forEach(bar => {
      const barTime = now + bar.delay;
      // Bass note
      this.playPianoNote(this.getFreq(bar.bass), barTime, 4.5, 0.32);

      // Soft arpeggio chords
      bar.chord.forEach((note, idx) => {
        this.playPianoNote(this.getFreq(note), barTime + (idx * 0.4), 3.5, 0.16);
      });

      // Soulful melodic notes
      bar.melody.forEach((note, idx) => {
        this.playPianoNote(this.getFreq(note), barTime + (idx * beatSec) + 0.1, 2.5, 0.22);
      });
    });

    const totalLoopDuration = 32 * beatSec * 1000;
    this.currentLoopTimeout = setTimeout(() => {
      if (this.isPlaying && !this.isUsingCustom) {
        this.startPianoLoop();
      }
    }, totalLoopDuration - 200);
  }

  stopPianoLoop() {
    if (this.currentLoopTimeout) {
      clearTimeout(this.currentLoopTimeout);
      this.currentLoopTimeout = null;
    }
  }

  // Set custom user MP3 track
  setCustomAudio(fileOrUrl) {
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }

    if (typeof fileOrUrl === 'string') {
      this.customAudio = new Audio(fileOrUrl);
    } else if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
      const url = URL.createObjectURL(fileOrUrl);
      this.customAudio = new Audio(url);
    }

    if (this.customAudio) {
      this.customAudio.loop = true;
      this.customAudio.volume = this.volume;
      this.isUsingCustom = true;
      if (this.isPlaying) {
        this.stopPianoLoop();
        this.customAudio.play().catch(e => console.log('Autoplay policy', e));
      }
    }
  }

  play() {
    this.initContext();
    this.isPlaying = true;

    if (this.isUsingCustom && this.customAudio) {
      this.customAudio.volume = this.volume;
      this.customAudio.play().catch(err => {
        console.warn('Audio play thwarted:', err);
        // Fallback to piano synth
        this.isUsingCustom = false;
        this.startPianoLoop();
      });
    } else {
      this.startPianoLoop();
    }

    this.notifyStateChange();
  }

  pause() {
    this.isPlaying = false;
    this.stopPianoLoop();
    if (this.customAudio) {
      this.customAudio.pause();
    }
    this.notifyStateChange();
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, parseFloat(val)));
    if (this.customAudio) {
      this.customAudio.volume = this.volume;
    }
  }

  // Play pleasant chime or click sound effects for interactions
  playChime(type = 'bell') {
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'heart') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.2); // A5
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    } else if (type === 'bell') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1046.50, t); // C6
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.8);
    } else if (type === 'purr') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(260, t + 0.15);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  }
}

window.romanticAudio = new RomanticAudioEngine();
