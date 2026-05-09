import { NextResponse } from "next/server";
import Replicate from "replicate";
import { requireEnv } from "@/lib/env";
import {
  completeTrackFromPrediction,
  createTrackCompletionTimeoutResult,
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

const MAX_POLL_ATTEMPTS = 300;
const POLL_INTERVAL_MS = 2000;

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

  try {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      const prediction = (await replicate.predictions.get(predictionId)) as ReplicatePrediction;

      if (
        prediction.status === "succeeded" ||
        prediction.status === "failed" ||
        prediction.status === "canceled"
      ) {
        const payload: TrackCompletionPayload = {
          id: prediction.id,
          status: prediction.status,
          output: prediction.output
        };
        const result = await completeTrackFromPrediction(trackId, payload);

        if (!result.ok) {
          console.error("Local completion failed", {
            trackId,
            predictionId,
            status: prediction.status,
            error: result.error
          });
          return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({ ok: true, status: prediction.status });
      }

      await sleep(POLL_INTERVAL_MS);
    }
  } catch (error) {
    console.error("Local completion worker crashed", { trackId, predictionId, error });
    const timeoutResult = await createTrackCompletionTimeoutResult(trackId);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prediction completion failed." },
      { status: timeoutResult.ok ? 502 : timeoutResult.status }
    );
  }

  const timeoutResult = await createTrackCompletionTimeoutResult(trackId);
  return NextResponse.json(
    { error: "Prediction did not complete in time." },
    { status: timeoutResult.ok ? 504 : timeoutResult.status }
  );
}
