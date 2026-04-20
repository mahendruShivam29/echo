import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@/lib/supabase/server";
import { requireEnv } from "@/lib/env";
import { GENERATION_DURATION_SECONDS } from "@/lib/generation";
import { isLocalSiteUrl } from "@/lib/track-completion";

const MUSICGEN_VERSION =
  "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb";

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

  const { prompt } = (await request.json()) as { prompt?: string };
  const normalizedPrompt = prompt?.trim();

  if (!normalizedPrompt || normalizedPrompt.length < 8) {
    return NextResponse.json(
      { error: "Prompt must be at least 8 characters." },
      { status: 400 }
    );
  }

  const { data: track, error: insertError } = await supabase
    .from("tracks")
    .insert({
      user_id: user.id,
      prompt: normalizedPrompt,
      status: "processing"
    })
    .select("id")
    .single();

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
    const prediction = await replicate.predictions.create({
      version: MUSICGEN_VERSION,
      input: {
        prompt: normalizedPrompt,
        duration: GENERATION_DURATION_SECONDS,
        model_version: "stereo-large"
      },
      ...(isLocalCompletion
        ? {}
        : {
            webhook: `${siteUrl}/api/webhook?trackId=${track.id}`,
            webhook_events_filter: ["completed"]
          })
    });

    const { error: updateError } = await supabase
      .from("tracks")
      .update({ replicate_job_id: prediction.id })
      .eq("id", track.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Track created, but prediction metadata could not be saved." },
        { status: 500 }
      );
    }

    if (isLocalCompletion) {
      void fetch(`${siteUrl}/api/dev-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id, predictionId: prediction.id })
      }).catch((devCompletionError) => {
        console.error("Local completion worker failed to start", devCompletionError);
      });
    }

    return NextResponse.json({
      trackId: track.id,
      completion: isLocalCompletion ? "local-dev-worker" : "webhook"
    });
  } catch (error) {
    await supabase.from("tracks").update({ status: "failed" }).eq("id", track.id);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed to start." },
      { status: 502 }
    );
  }
}
