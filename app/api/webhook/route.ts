import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ReplicateWebhookPayload = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: unknown;
};

function getAudioOutput(output: ReplicateWebhookPayload["output"]) {
  if (Array.isArray(output)) {
    return output[0] ?? null;
  }

  return output ?? null;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const trackId = url.searchParams.get("trackId");

  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId." }, { status: 400 });
  }

  const payload = (await request.json()) as ReplicateWebhookPayload;
  const supabase = createAdminClient();

  if (payload.status === "failed" || payload.status === "canceled") {
    await supabase
      .from("tracks")
      .update({ status: "failed", replicate_job_id: payload.id })
      .eq("id", trackId);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  }

  if (payload.status !== "succeeded") {
    return NextResponse.json({ ok: true });
  }

  const audioUrl = getAudioOutput(payload.output);

  if (!audioUrl) {
    await supabase.from("tracks").update({ status: "failed" }).eq("id", trackId);
    revalidatePath("/", "layout");
    return NextResponse.json({ error: "Prediction completed without audio." }, { status: 422 });
  }

  const audioResponse = await fetch(audioUrl);

  if (!audioResponse.ok) {
    await supabase.from("tracks").update({ status: "failed" }).eq("id", trackId);
    return NextResponse.json({ error: "Could not download generated audio." }, { status: 502 });
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
    await supabase.from("tracks").update({ status: "failed" }).eq("id", trackId);
    return NextResponse.json({ error: "Could not upload generated audio." }, { status: 500 });
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from("tracks").getPublicUrl(filePath);

  await supabase
    .from("tracks")
    .update({
      status: "succeeded",
      audio_url: publicUrl,
      replicate_job_id: payload.id,
      duration_seconds: 60
    })
    .eq("id", trackId);

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
