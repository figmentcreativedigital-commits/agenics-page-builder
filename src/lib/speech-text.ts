/**
 * Text for speech, shared by the browser and the narration server so both agree on
 * exactly what is spoken and how each passage is keyed. (Same scheme as the Figment
 * Page Builder narrator.)
 */

/** Builder shorthand into words a speech engine says well. Pure, so it's tested. */
export function toSpeech(input: string): string {
  let s = ` ${input} `;
  s = s.replace(/⌘\s*\\/g, "Command backslash");
  s = s.replace(/⌘\s*\+/g, "Command plus");
  s = s.replace(/⌘\s*[−-]/g, "Command minus");
  s = s.replace(/⌘\s*/g, "Command ");
  s = s.replace(/⇧\s*/g, "Shift ");
  s = s.replace(/⌥\s*/g, "Option ");
  s = s.replace(/⋯/g, "the three dots");
  s = s.replace(/\bEsc\b/g, "Escape");
  s = s.replace(/\s+[–—]\s+/g, ", ");
  s = s.replace(/(\d)\s*–\s*(\d)/g, "$1 to $2");
  s = s.replace(/\s*·\s*/g, ", ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** A short stable key for a passage, from its spoken form (cyrb53, base 36). */
export function speechKey(text: string): string {
  const str = toSpeech(text);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
