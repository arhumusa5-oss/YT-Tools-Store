'use client';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

/**
 * Call inside a user click/submit gesture (like Confirm Order) so Safari/Chrome
 * unlocks Web Audio cleanly before navigating to /order-success/[id].
 */
export function unlockOrderAudio(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Silent 1ms buffer trigger to satisfy strict iOS Safari audio unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // ignore audio unavailability
  }
}

/**
 * Plays a crisp Apple-Pay / Fintech style ascending crystal bell chime (C5-E5-G5-C6).
 * Returns true if audio played actively, false if suspended/blocked by browser.
 */
export async function playOrderSuccessSound(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
    }
    if (ctx.state !== 'running') return false;

    const now = ctx.currentTime;

    const notes: Array<{ freq: number; delay: number; duration: number; peakGain: number }> = [
      { freq: 523.25, delay: 0.0, duration: 0.28, peakGain: 0.11 }, // C5
      { freq: 659.25, delay: 0.085, duration: 0.30, peakGain: 0.12 }, // E5
      { freq: 783.99, delay: 0.17, duration: 0.34, peakGain: 0.13 }, // G5
      { freq: 1046.5, delay: 0.27, duration: 0.65, peakGain: 0.16 }, // C6 final shimmer
    ];

    for (const note of notes) {
      const start = now + note.delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(note.peakGain, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + note.duration + 0.02);
    }

    // Gentle warm overtone shimmer on the final C6 bell strike
    const overtoneStart = now + 0.27;
    const overtoneOsc = ctx.createOscillator();
    const overtoneGain = ctx.createGain();
    overtoneOsc.type = 'triangle';
    overtoneOsc.frequency.setValueAtTime(2093.0, overtoneStart); // C7 whisper
    overtoneGain.gain.setValueAtTime(0.0001, overtoneStart);
    overtoneGain.gain.linearRampToValueAtTime(0.035, overtoneStart + 0.015);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, overtoneStart + 0.45);
    overtoneOsc.connect(overtoneGain);
    overtoneGain.connect(ctx.destination);
    overtoneOsc.start(overtoneStart);
    overtoneOsc.stop(overtoneStart + 0.48);

    return true;
  } catch {
    return false;
  }
}
