import { TOUR_STEPS, type TourStep } from "./tour";
import { speechKey } from "./speech-text";

/*
  The tour narrator. Each tour card is voiced by one of Google's Chirp 3 HD voices on the
  server, once per card and voice, and cached (see app/api/voice). Only the passages listed
  here can be voiced, so the key behind the builder can't be used to say anything else. The
  tour card and the narrator build the words from the same function, so they always match.
  Without the key, the browser's own voice reads instead.
*/

export const NARRATOR_VOICES = [
  { name: "Charon", trait: "Informative" },
  { name: "Sulafat", trait: "Warm" },
  { name: "Achird", trait: "Friendly" },
  { name: "Sadaltager", trait: "Knowledgeable" },
  { name: "Gacrux", trait: "Mature" },
  { name: "Algenib", trait: "Gravelly" },
] as const;

/** The same voice as the Figment Page Builder tour, so the two tools sound alike */
export const NARRATOR_DEFAULT = "Charon";

/** What a tour card says: its title, then its text. Keyboard keys shown as chips are not read. */
export function tourReading(step: Pick<TourStep, "title" | "body">): string {
  return `${step.title}. ${step.body}`;
}

/** Every passage the narrator may voice. */
export function narrationTexts(): string[] {
  return TOUR_STEPS.map(tourReading);
}

let index: Map<string, string> | null = null;

/** The passage for a key, if it's one the narrator may voice. */
export function narrationFor(key: string): string | undefined {
  if (!index) {
    index = new Map();
    for (const t of narrationTexts()) index.set(speechKey(t), t);
  }
  return index.get(key);
}
