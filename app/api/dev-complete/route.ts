import { NextResponse } from "next/server";
import Replicate from "replicate";
import { requireEnv } from "@/lib/env";
import {
  completeTrackFromPrediction,
  isLocalSiteUrl,
  type PredictionStatus,
  type TrackCompletionPayload
} from "@/lib/track-completion";

export const dynamic = "force-dynamic";

type DevCompleteRequest = {
  trackId?: string;
  predictionId?: string;
};

type ReplicatePrediction = {
  id: string;
  status: PredictionStatus;
  output?: string | string[] | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  if (!isLocalSiteUrl(requireEnv("NEXT_PUBLIC_SITE_URL"))) {
    return NextResponse.json({ error: "Dev completion is only available on localhost." }, { status: 404 });
  }

  const { trackId, predictionId } = (await request.json()) as DevCompleteRequest;

  if (!trackId || !predictionId) {
    return NextResponse.json({ error: "Missing trackId or predictionId." }, { status: 400 });
  }

  const replicate = new Replicate({
    auth: requireEnv("REPLICATE_API_TOKEN")
  });

  for (let attempt = 0; attempt < 90; attempt += 1) {
    const prediction = (await replicate.predictions.get(predictionId)) as ReplicatePrediction;

    if (prediction.status === "succeeded" || prediction.status === "failed" || prediction.status === "canceled") {
      const payload: TrackCompletionPayload = {
        id: prediction.id,
        status: prediction.status,
        output: prediction.output
      };
      const result = await completeTrackFromPrediction(trackId, payload);

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json({ ok: true, status: prediction.status });
    }

    await sleep(2000);
  }

  return NextResponse.json({ error: "Prediction did not complete in time." }, { status: 504 });
}
