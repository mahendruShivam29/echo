import { revalidatePath } from "next/cache";
import { GENERATION_DURATION_SECONDS } from "@/lib/generation";
import { createAdminClient } from "@/lib/supabase/admin";

export type PredictionStatus = "starting" | "processing" | "succeeded" | "failed" | "canceled";

export type TrackCompletionPayload = {
  id: string;
  status: PredictionStatus;
  output?: string | string[] | null;
};

type TrackCompletionState = {
  id: string;
  status: "processing" | "succeeded" | "failed";
  replicate_job_id: string | null;
};

export type CompletionResult =
  | { ok: true; ignored?: string }
  | { ok: false; status: number; error: string };

function getAudioOutput(output: TrackCompletionPayload["output"]) {
  if (Array.isArray(output)) {
    return output[0] ?? null;
  }

  return output ?? null;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function markTrackFailed(trackId: string): Promise<CompletionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("tracks").update({ status: "failed" }).eq("id", trackId);

  if (error) {
    return { ok: false, status: 500, error: "Could not update failed track." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function completeTrackFromPrediction(
  trackId: string,
  payload: TrackCompletionPayload
): Promise<CompletionResult> {
  const supabase = createAdminClient();
  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .select("id,status,replicate_job_id")
    .eq("id", trackId)
    .single<TrackCompletionState>();

  if (trackError || !track) {
    return { ok: false, status: 404, error: "Unknown track." };
  }

  if (track.status !== "processing") {
    return { ok: true, ignored: "Track already completed." };
  }

  if (!payload.id || track.replicate_job_id !== payload.id) {
    return { ok: false, status: 403, error: "Prediction does not match track." };
  }

  if (payload.status === "failed" || payload.status === "canceled") {
    return markTrackFailed(trackId);
  }

  if (payload.status !== "succeeded") {
    return { ok: true };
  }

  const audioUrl = getAudioOutput(payload.output);

  if (!audioUrl || !isHttpUrl(audioUrl)) {
    const failedResult = await markTrackFailed(trackId);
    return failedResult.ok
      ? { ok: false, status: 422, error: "Prediction completed without audio." }
      : failedResult;
  }

  const audioResponse = await fetch(audioUrl);

  if (!audioResponse.ok) {
    const failedResult = await markTrackFailed(trackId);
    return failedResult.ok
      ? { ok: false, status: 502, error: "Could not download generated audio." }
      : failedResult;
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const filePath = `${trackId}.wav`;
  const { error: uploadError } = await supabase.storage
    .from("tracks")
    .upload(filePath, audioBuffer, {
      contentType: "audio/wav",
      upsert: true
    });

  if (uploadError) {
    const failedResult = await markTrackFailed(trackId);
    return failedResult.ok
      ? { ok: false, status: 500, error: "Could not upload generated audio." }
      : failedResult;
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from("tracks").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("tracks")
    .update({
      status: "succeeded",
      audio_url: publicUrl,
      replicate_job_id: payload.id,
      duration_seconds: GENERATION_DURATION_SECONDS
    })
    .eq("id", trackId);

  if (updateError) {
    return { ok: false, status: 500, error: "Could not save completed track." };
  }

  revalidatePath("/", "layout");

  return { ok: true };
}

export function isLocalSiteUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
