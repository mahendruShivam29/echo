import { Client, handle_file } from "@gradio/client";
import { getEnv } from "@/lib/env";
import type { GenerationModel } from "@/lib/models";

const DEFAULT_AUDIO_PLACEHOLDER =
  "https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav";

function getSpaceConfig() {
  const spaceId = getEnv("HF_FINE_TUNED_SPACE_ID");
  const token = getEnv("HF_TOKEN");

  if (!spaceId) {
    throw new Error("Missing required environment variable: HF_FINE_TUNED_SPACE_ID");
  }

  return { spaceId, token };
}

type GradioPredictionResult = {
  data?: unknown[] | null;
};

const fineTunedLoRaByModel: Partial<Record<GenerationModel, string>> = {
  "ace-step-finetuned": "lokr_weights.safetensors",
  "diffusion-finetuned": "lokr_weights_diffusion.safetensors"
};

type GradioLikeError = {
  message?: string;
  original_msg?: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as GradioLikeError;
    if (typeof candidate.message === "string" && candidate.message.length > 0) {
      return candidate.message;
    }

    if (typeof candidate.original_msg === "string" && candidate.original_msg.length > 0) {
      return candidate.original_msg;
    }
  }

  return "Fine-tuned generation failed.";
}

type GradioFileDataLike = {
  path?: string;
  url?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildSpaceFileUrl(spaceRoot: string | undefined, apiPrefix: string | undefined, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (!spaceRoot) {
    return null;
  }

  const normalizedRoot = spaceRoot.endsWith("/") ? spaceRoot.slice(0, -1) : spaceRoot;
  const normalizedPrefix = apiPrefix
    ? apiPrefix.startsWith("/")
      ? apiPrefix
      : `/${apiPrefix}`
    : "/gradio_api";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedRoot}${normalizedPrefix}/file=${normalizedPath}`;
}

function extractAudioUrl(
  value: unknown,
  spaceRoot: string | undefined,
  apiPrefix: string | undefined
): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedUrl = extractAudioUrl(item, spaceRoot, apiPrefix);
      if (nestedUrl) {
        return nestedUrl;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const fileLike = value as GradioFileDataLike;
  if (typeof fileLike.url === "string" && fileLike.url.length > 0) {
    return fileLike.url;
  }

  if (typeof fileLike.path === "string" && fileLike.path.length > 0) {
    const resolvedUrl = buildSpaceFileUrl(spaceRoot, apiPrefix, fileLike.path);
    if (resolvedUrl) {
      return resolvedUrl;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const nestedUrl = extractAudioUrl(nestedValue, spaceRoot, apiPrefix);
    if (nestedUrl) {
      return nestedUrl;
    }
  }

  return null;
}

export async function generateFineTunedTrack(prompt: string, model: GenerationModel) {
  const { spaceId, token } = getSpaceConfig();
  const hfToken = token as `hf_${string}` | undefined;
  const app = await Client.connect(spaceId, hfToken ? { hf_token: hfToken } : undefined);
  const placeholderAudio = handle_file(DEFAULT_AUDIO_PLACEHOLDER);
  const loraPath = fineTunedLoRaByModel[model];

  if (!loraPath) {
    throw new Error(`Unsupported fine-tuned model: ${model}`);
  }

  await app.predict("/load_lora", {
    lora_path: loraPath
  });

  let result: GradioPredictionResult;

  try {
    result = (await app.predict("/generation_wrapper", {
      selected_model: "acestep-v15-turbo",
      generation_mode: "custom",
      simple_query_input: prompt,
      simple_vocal_language: "unknown",
      param_4: prompt,
      param_5: "[instrumental]",
      param_6: 0,
      param_7: "",
      param_8: "",
      param_9: "unknown",
      param_10: 8,
      param_11: 7,
      param_12: true,
      param_13: "-1",
      param_14: placeholderAudio,
      param_15: -1,
      param_16: 1,
      param_17: placeholderAudio,
      param_18: "",
      param_19: 0,
      param_20: -1,
      param_21: "Fill the audio semantic mask based on the given conditions:",
      param_22: 1,
      param_23: "text2music",
      param_24: false,
      param_25: 0,
      param_26: 1,
      param_27: 3,
      param_28: "ode",
      param_29: "",
      param_30: "mp3",
      param_31: 0.85,
      param_32: true,
      param_33: 2,
      param_34: 0,
      param_35: 0.9,
      param_36: "NO USER INPUT",
      param_37: true,
      param_38: true,
      param_39: true,
      param_41: false,
      param_42: true,
      param_43: false,
      param_44: false,
      param_45: 0.5,
      param_46: 8,
      param_47: "woodwinds",
      param_48: [],
      param_49: false
    })) as GradioPredictionResult;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }

  const audioUrl = extractAudioUrl(result.data, app.config?.root, app.config?.api_prefix);

  if (!audioUrl) {
    console.error("Fine-tuned model response did not include a usable audio file", {
      resultData: result.data
    });
    throw new Error("Fine-tuned model did not return an audio URL.");
  }

  return audioUrl;
}
