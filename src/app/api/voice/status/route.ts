import { connection } from "next/server";
import { NARRATOR_DEFAULT, NARRATOR_VOICES } from "@/lib/narration";

/** Whether the tour narrator is available (the Google key is set), and which voices it offers. */
export async function GET() {
  // Read at request time, so adding the key takes effect without a rebuild of this answer
  await connection();
  const enabled = Boolean(process.env.GOOGLE_TTS_API_KEY);
  return Response.json({ enabled, voices: enabled ? NARRATOR_VOICES : [], default: NARRATOR_DEFAULT }, { headers: { "Cache-Control": "no-store" } });
}
