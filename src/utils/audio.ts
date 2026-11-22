/**
 * Synthesizes subtle, sweet chimes and UI feedback tones via Web Audio API.
 * High-quality procedural sounds inspired by cozy games and candy pop aesthetics.
 * Zero external audio asset dependencies — reliable, fast, and responsive.
 */
class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private lastSoundTime: number = 0;
  private isUnlocked: boolean = false;

  constructor() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('wyn_sound_enabled');
        if (stored !== null) {
          this.enabled = stored === 'true';
        }
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Initializes or resumes the AudioContext on user gesture.
   */
  public unlock() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else if (this.ctx && this.ctx.state === 'running') {
        this.isUnlocked = true;
      }
    } catch {
      // Ignore audio unlock restrictions
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Sweet, crisp candy pop for general button clicks across the whole website.
   */
  playButtonClick() {
    if (!this.enabled) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    // 50ms cooldown prevents rapid accidental double clicks
    if (now - this.lastSoundTime < 50) return;
    this.lastSoundTime = now;

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Primary bubbly pitch sweep (520Hz -> 880Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.065);

      // Subtle harmonic overtone for a sweet "candy drop" texture
      const harmonic = ctx.createOscillator();
      const hGain = ctx.createGain();

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(1040, t);
      harmonic.frequency.exponentialRampToValueAtTime(1320, t + 0.035);

      hGain.gain.setValueAtTime(0.025, t);
      hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      harmonic.connect(hGain);
      hGain.connect(ctx.destination);

      harmonic.start(t);
      harmonic.stop(t + 0.045);
    } catch {
      // Ignore
    }
  }

  /**
   * Bubble pop effect
   */
  playPop() {
    if (!this.enabled) return;
    this.lastSoundTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(460, t);
      osc.frequency.exponentialRampToValueAtTime(920, t + 0.07);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Ignore
    }
  }

  /**
   * Sparkling chime for modals, discoveries, and highlights
   */
  playChime() {
    if (!this.enabled) return;
    this.lastSoundTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const baseT = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = baseT + idx * 0.045;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.23);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Success / Save / Copy confirmation chime
   */
  playSuccess() {
    if (!this.enabled) return;
    this.lastSoundTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6
      const baseT = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = baseT + idx * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.21);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Warm glissando for liking / hearting
   */
  playHeart() {
    if (!this.enabled) return;
    this.lastSoundTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, t);
      osc.frequency.linearRampToValueAtTime(880, t + 0.12);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.165);
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundEffects();

// Universal click sound handler: attaches to any clickable button or link across the entire web app
if (typeof window !== 'undefined') {
  // Pre-unlock AudioContext on first touch / gesture
  const unlockEvents = ['pointerdown', 'touchstart', 'mousedown', 'keydown'];
  const onUserGesture = () => {
    sound.unlock();
  };

  unlockEvents.forEach((ev) => {
    window.addEventListener(ev, onUserGesture, { passive: true });
  });

  // Delegated click listener in capture phase to reliably trigger on ANY button or interactive element
  document.addEventListener(
    'click',
    (e) => {
      if (!sound.enabled) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Match buttons, clickable roles, interactive labels, links, tabs, and custom interactive items
      const clickable = target.closest<HTMLElement>(
        'button, [role="button"], a, input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], summary, select, [data-sound], .cursor-pointer'
      );

      if (clickable) {
        sound.playButtonClick();
      }
    },
    { capture: true, passive: true }
  );
}
