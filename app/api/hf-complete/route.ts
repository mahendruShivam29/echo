import { NextResponse } from "next/server";
import { completeTrackFromSourceUrl, createTrackCompletionTimeoutResult } from "@/lib/track-completion";
import { isGenerationModel, type GenerationModel } from "@/lib/models";
import { generateFineTunedTrack } from "@/lib/hf-finetuned";

type HfCompleteRequest = {
  trackId?: string;
  prompt?: string;
  jobId?: string;
  model?: string;
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { trackId, prompt, jobId, model } = (await request.json()) as HfCompleteRequest;
  const selectedModel: GenerationModel | null =
    typeof model === "string" && isGenerationModel(model) ? model : null;

  if (!trackId || !prompt || !jobId || !selectedModel) {
    return NextResponse.json(
      { error: "Missing trackId, prompt, jobId, or valid model." },
      { status: 400 }
    );
  }

  try {
    const audioUrl = await generateFineTunedTrack(prompt, selectedModel);
    const result = await completeTrackFromSourceUrl(trackId, audioUrl, jobId);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, audioUrl });
  } catch (error) {
    console.error("Fine-tuned completion failed", { trackId, jobId, error });
    const failureResult = await createTrackCompletionTimeoutResult(trackId);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fine-tuned generation failed." },
      { status: failureResult.ok ? 502 : failureResult.status }
    );
  }
}
