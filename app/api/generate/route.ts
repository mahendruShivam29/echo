import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@/lib/supabase/server";
import { requireEnv } from "@/lib/env";

const MUSICGEN_VERSION =
  "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e31a5448a0d0f";

export async function POST(request: Request) {
  const supabase = createClient();
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
    return NextResponse.json({ error: "Could not create track." }, { status: 500 });
  }

  const replicate = new Replicate({
    auth: requireEnv("REPLICATE_API_TOKEN")
  });

  try {
    const prediction = await replicate.predictions.create({
      version: MUSICGEN_VERSION,
      input: {
        prompt: normalizedPrompt,
        duration: 60,
        model_version: "stereo-large"
      },
      webhook: `${requireEnv("NEXT_PUBLIC_SITE_URL")}/api/webhook?trackId=${track.id}`,
      webhook_events_filter: ["completed"]
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

    return NextResponse.json({ trackId: track.id });
  } catch (error) {
    await supabase.from("tracks").update({ status: "failed" }).eq("id", track.id);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed to start." },
      { status: 502 }
    );
  }
}
