import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@/lib/supabase/server";
import { requireEnv } from "@/lib/env";
import { GENERATION_DURATION_SECONDS } from "@/lib/generation";
import { isLocalSiteUrl } from "@/lib/track-completion";
import { isGenerationModel, type GenerationModel } from "@/lib/models";
import type { TrackCover } from "@/lib/unsplash";
import { searchTrackCover } from "@/lib/unsplash";

const ACE_STEP_VERSION =
  "1319559eccfff10b424a0954901362baa42197892bd3d2e554440b68817a741c";
const MUSICGEN_VERSION =
  "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb";

type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

const trackInsertColumns = [
  "generation_model",
  "cover_image_url",
  "cover_image_alt",
  "cover_photographer_name",
  "cover_photographer_url",
  "cover_unsplash_url"
] as const;

type TrackInsertColumn = (typeof trackInsertColumns)[number];

function getMissingInsertColumn(error: PostgrestLikeError | null | undefined): TrackInsertColumn | null {
  if (!error) {
    return null;
  }

  const combinedText = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!(error.code === "PGRST204" || error.code === "42703")) {
    return null;
  }

  for (const column of trackInsertColumns) {
    if (combinedText.includes(column)) {
      return column;
    }
  }

  return null;
}

function buildPredictionInput(model: GenerationModel, prompt: string) {
  if (model === "ace-step-finetuned" || model === "diffusion-finetuned") {
    return null;
  }

  if (model === "musicgen") {
    return {
      version: MUSICGEN_VERSION,
      input: {
        prompt,
        duration: GENERATION_DURATION_SECONDS,
        model_version: "stereo-large"
      }
    };
  }

  return {
    version: ACE_STEP_VERSION,
    input: {
      prompt,
      duration: GENERATION_DURATION_SECONDS,
      lyrics: "[Instrumental]",
      audio_format: "wav"
    }
  };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");
  const isLocalCompletion = isLocalSiteUrl(siteUrl);
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, model } = (await request.json()) as { prompt?: string; model?: string };
  const normalizedPrompt = prompt?.trim();
  const requestedModel = model ?? "";
  const selectedModel: GenerationModel = isGenerationModel(requestedModel)
    ? requestedModel
    : "ace-step-base";

  if (!normalizedPrompt || normalizedPrompt.length < 8) {
    return NextResponse.json(
      { error: "Prompt must be at least 8 characters." },
      { status: 400 }
    );
  }

  const cover = await searchTrackCover(normalizedPrompt).catch((error) => {
    console.error("Unsplash cover lookup failed", error);
    return null;
  });

  let insertPayload: {
    user_id: string;
    prompt: string;
    generation_model?: GenerationModel;
    cover_image_url?: string;
    cover_image_alt?: string | null;
    cover_photographer_name?: string;
    cover_photographer_url?: string;
    cover_unsplash_url?: string;
    status: "processing";
  } = {
    user_id: user.id,
    prompt: normalizedPrompt,
    generation_model: selectedModel,
    status: "processing"
  };

  if (cover) {
    insertPayload = {
      ...insertPayload,
      ...cover
    };
  }

  let insertResult = await supabase
    .from("tracks")
    .insert(insertPayload)
    .select("id")
    .single();

  while (true) {
    const missingColumn = getMissingInsertColumn(insertResult.error);

    if (!missingColumn) {
      break;
    }

    delete insertPayload[missingColumn];
    insertResult = await supabase
      .from("tracks")
      .insert(insertPayload)
      .select("id")
      .single();
  }

  const { data: track, error: insertError } = insertResult;

  if (insertError || !track) {
    console.error("Track insert failed", insertError);
    return NextResponse.json(
      { error: insertError?.message ?? "Could not create track." },
      { status: 500 }
    );
  }

  const replicate = new Replicate({
    auth: requireEnv("REPLICATE_API_TOKEN")
  });

  try {
    let predictionId: string;
    const usesHfSpace =
      selectedModel === "ace-step-finetuned" || selectedModel === "diffusion-finetuned";

    if (usesHfSpace) {
      predictionId = `hfspace:${crypto.randomUUID()}`;
    } else {
      const predictionConfig = buildPredictionInput(selectedModel, normalizedPrompt);
      if (!predictionConfig) {
        throw new Error("Could not build model prediction config.");
      }

      const prediction = await replicate.predictions.create({
        version: predictionConfig.version,
        input: predictionConfig.input,
        ...(isLocalCompletion
          ? {}
          : {
              webhook: `${siteUrl}/api/webhook?trackId=${track.id}`,
              webhook_events_filter: ["completed"]
            })
      });

      predictionId = prediction.id;
    }

    const { error: updateError } = await supabase
      .from("tracks")
      .update({ replicate_job_id: predictionId })
      .eq("id", track.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Track created, but prediction metadata could not be saved." },
        { status: 500 }
      );
    }

    if (usesHfSpace) {
      void fetch(`${siteUrl}/api/hf-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: track.id,
          prompt: normalizedPrompt,
          jobId: predictionId,
          model: selectedModel
        })
      }).catch((fineTunedCompletionError) => {
        console.error("Fine-tuned completion worker failed to start", fineTunedCompletionError);
      });
    } else if (isLocalCompletion) {
      void fetch(`${siteUrl}/api/dev-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id, predictionId })
      }).catch((devCompletionError) => {
        console.error("Local completion worker failed to start", devCompletionError);
      });
    }

    return NextResponse.json({
      trackId: track.id,
      model: selectedModel,
      cover,
      completion:
        usesHfSpace
          ? "hf-space-worker"
          : isLocalCompletion
            ? "local-dev-worker"
            : "webhook"
    });
  } catch (error) {
    await supabase.from("tracks").update({ status: "failed" }).eq("id", track.id);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed to start." },
      { status: 502 }
    );
  }
}
