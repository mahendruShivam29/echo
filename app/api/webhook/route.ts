import { NextResponse } from "next/server";
import {
  completeTrackFromPrediction,
  type TrackCompletionPayload
} from "@/lib/track-completion";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const trackId = url.searchParams.get("trackId");

  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId." }, { status: 400 });
  }

  const payload = (await request.json()) as TrackCompletionPayload;
  const result = await completeTrackFromPrediction(trackId, payload);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, ignored: result.ignored });
}
