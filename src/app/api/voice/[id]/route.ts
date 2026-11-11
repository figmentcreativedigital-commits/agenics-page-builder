import { getCache } from "@vercel/functions";
import { NARRATOR_DEFAULT, NARRATOR_VOICES, narrationFor } from "@/lib/narration";
import { toSpeech } from "@/lib/speech-text";

const VOICES = new Set<string>(NARRATOR_VOICES.map((v) => v.name));

/** Bump when the way text is turned into speech changes, so old audio isn't reused. */
const SPEECH_VERSION = "1";
const YEAR = 60 * 60 * 24 * 365;

/**
 * One tour card, voiced. The id is the passage's key; only passages the builder itself
 * reads are accepted. Audio never changes for a given key and voice, so Vercel's CDN keeps
 * the response; its cache is cleared on every deploy, so the audio is also kept in Vercel's
 * runtime cache, which lasts across deploys. Google is asked once per passage and voice.
 * (The same design as the Figment Page Builder narrator.)
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const text = narrationFor(id);
  if (!text) return new Response("Unknown passage", { status: 404 });
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) return new Response("Narrator is off", { status: 503 });
  const voice = new URL(req.url).searchParams.get("v") ?? NARRATOR_DEFAULT;
  if (!VOICES.has(voice)) return new Response("Unknown voice", { status: 400 });

  const cacheKey = `tour-narration:${SPEECH_VERSION}:${voice}:${id}`;
  let audio: string | null = null;
  try {
    const hit = await getCache().get(cacheKey);
    if (typeof hit === "string") audio = hit;
  } catch {
    // The runtime cache is optional; fall through to Google.
  }
  if (audio) return mp3(audio, "hit");

  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: toSpeech(text) },
      voice: { languageCode: "en-US", name: `en-US-Chirp3-HD-${voice}` },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });
  if (!res.ok) {
    console.error(`Narration failed (${res.status}): ${(await res.text()).slice(0, 400)}`);
    return new Response("Narration failed", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  const { audioContent } = (await res.json()) as { audioContent?: string };
  if (!audioContent) return new Response("Narration failed", { status: 502, headers: { "Cache-Control": "no-store" } });
  try {
    await getCache().set(cacheKey, audioContent, { ttl: YEAR, tags: ["tour-narration"], name: `tour narration ${voice} ${id}` });
  } catch {
    // Not fatal: the CDN still keeps this response until the next deploy.
  }
  return mp3(audioContent, "miss");
}

function mp3(base64: string, cache: "hit" | "miss"): Response {
  return new Response(Buffer.from(base64, "base64"), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Narration-Cache": cache,
    },
  });
}
