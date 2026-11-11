"use client";

/**
 * The tour's voice. The narrator (Google Chirp 3 HD, voiced on the server and cached)
 * reads when the builder has its key; otherwise, or if a clip can't play, the browser's
 * own speech synthesis reads, with the most natural English voice the device has.
 * One passage at a time: a new one stops the last.
 */
import { NARRATOR_DEFAULT } from "./narration";
import { speechKey, toSpeech } from "./speech-text";

export type NarratorInfo = { enabled: boolean; voices: { name: string; trait: string }[]; default: string };
export type ReadPrefs = { on: boolean; voice: string };

const PREFS = "agenics-page-builder:read-aloud";

let info: NarratorInfo = { enabled: false, voices: [], default: NARRATOR_DEFAULT };
let loading: Promise<NarratorInfo> | null = null;

/** Asks the server once whether the narrator is on. */
export function loadNarrator(): Promise<NarratorInfo> {
  if (typeof window === "undefined") return Promise.resolve(info);
  loading ??= fetch("/api/voice/status")
    .then((r) => (r.ok ? r.json() : info))
    .catch(() => info)
    .then((n: NarratorInfo) => (info = n));
  return loading;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

export function loadPrefs(): ReadPrefs {
  try {
    const raw = localStorage.getItem(PREFS);
    if (raw) return { on: false, voice: NARRATOR_DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* storage blocked: defaults */
  }
  return { on: false, voice: NARRATOR_DEFAULT };
}

export function savePrefs(p: ReadPrefs) {
  try {
    localStorage.setItem(PREFS, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export const narratorUrl = (text: string, voice: string) => `/api/voice/${speechKey(text)}?v=${encodeURIComponent(voice)}`;

/** English voices on the device, most natural first (neural and premium voices lead). */
function deviceVoice(): SpeechSynthesisVoice | undefined {
  const rank = (v: SpeechSynthesisVoice) =>
    (/natural|neural|premium|enhanced/i.test(v.name) ? 0 : 6) +
    (/en-US/i.test(v.lang) ? 0 : 1) +
    (/google us english|samantha|ava|zoe|aria|jenny|guy|andrew|emma|brian/i.test(v.name) ? -2 : 0) +
    (/compact|eloquence|novelty|bells|bad news|whisper|zarvox|trinoids|albert|bubbles|cellos|organ|jester|superstar|wobble/i.test(v.name) ? 20 : 0);
  const voices = window.speechSynthesis.getVoices();
  return voices.filter((v) => /^en(-|_|$)/i.test(v.lang)).sort((a, b) => rank(a) - rank(b))[0] ?? voices[0];
}

class Narrator {
  private audio: HTMLAudioElement | null = null;
  private warm: HTMLAudioElement | null = null;
  private run = 0;

  /** Read one passage. `next` is fetched ahead so the following card starts at once. */
  async say(text: string, voice: string, next?: string) {
    const run = ++this.run;
    this.halt();
    const n = await loadNarrator();
    if (run !== this.run) return;
    if (n.enabled) {
      const v = n.voices.some((x) => x.name === voice) ? voice : n.default;
      const a = new Audio(narratorUrl(text, v));
      this.audio = a;
      let fell = false;
      const fallback = () => {
        if (fell || run !== this.run) return;
        fell = true;
        this.audio = null;
        this.onDevice(text);
      };
      a.onerror = fallback;
      a.play().catch((e: unknown) => {
        // Stopped on purpose (the next card): not a failure
        if ((e as { name?: string })?.name !== "AbortError") fallback();
      });
      if (next) {
        const w = new Audio();
        w.preload = "auto";
        w.src = narratorUrl(next, v);
        this.warm = w;
      }
      return;
    }
    this.onDevice(text);
  }

  private onDevice(text: string) {
    if (!speechSupported()) return;
    const u = new SpeechSynthesisUtterance(toSpeech(text));
    u.lang = "en-US";
    const v = deviceVoice();
    if (v) u.voice = v;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  private halt() {
    if (this.audio) {
      this.audio.onerror = null;
      this.audio.pause();
      this.audio = null;
    }
    this.warm = null;
    if (speechSupported()) window.speechSynthesis.cancel();
  }

  stop() {
    this.run++;
    this.halt();
  }
}

export const narrator = new Narrator();
