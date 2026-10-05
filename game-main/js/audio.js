export const AudioFX = {
  ctx: null,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {  }
    }
  },
  blip(freq = 440) {

    try {
      this.ensure();
      if (!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.value = freq;
      g.gain.value = 0.05;
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + 0.07);
    } catch {  }
  },

  tone(freq, dur, vol, type = "sine") {
    try {
      this.ensure();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + dur);
    } catch {  }
  },
  hit() { this.tone(110, 0.12, 0.14, "sine"); },
  block() { this.tone(660, 0.09, 0.07, "square"); },
  grab() { this.tone(220, 0.08, 0.10, "square"); },

  slide(f0, f1, dur, vol, type = "square") {
    try {
      this.ensure();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(30, f0), t);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + dur);
    } catch {  }
  },
  whoosh() { this.slide(420, 70, 0.20, 0.08); },
  powerup() { this.slide(150, 640, 0.55, 0.09, "sawtooth"); },
  zap() { this.slide(1400, 280, 0.16, 0.09, "sawtooth"); },
  roar() { this.slide(90, 420, 0.45, 0.12, "sawtooth"); },

  ko() {
    this.slide(300, 45, 0.55, 0.15, "sawtooth");
    this.tone(55, 0.45, 0.16, "sine");
  },

  levelUp() {
    [440, 554, 660].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.1, 0.07, "square"), i * 65));
  },

  whiff() { this.slide(520, 190, 0.10, 0.045, "triangle"); },

  land() { this.tone(90, 0.07, 0.08, "sine"); },

  shot() {
    this.tone(1800, 0.04, 0.10, "square");
    this.tone(90, 0.09, 0.12, "sine");
  },

  snikt() { this.slide(2500, 800, 0.09, 0.07, "square"); },

  squelch() { this.slide(300, 90, 0.22, 0.10, "sawtooth"); this.tone(140, 0.15, 0.07, "triangle"); },

  slash() { this.slide(3200, 500, 0.12, 0.09, "sawtooth"); this.tone(4200, 0.05, 0.05, "square"); },

  boom() {
    this.slide(160, 40, 0.40, 0.16, "sawtooth");
    this.tone(50, 0.35, 0.14, "sine");
  },

  repulsor() {
    this.slide(1200, 300, 0.12, 0.08, "sawtooth");
    this.tone(2400, 0.05, 0.05, "square");
  },

  thunder() {
    this.slide(1600, 200, 0.18, 0.10, "sawtooth");
    this.tone(60, 0.25, 0.12, "sine");
  },

  thwip() {
    this.slide(900, 2400, 0.09, 0.08, "square");
    this.tone(3200, 0.04, 0.04, "square");
  },
  snap() {
    this.tone(2400, 0.03, 0.10, "square");
    this.tone(1200, 0.05, 0.08, "square");
  },
};

