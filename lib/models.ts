export const generationModels = [
  "ace-step-base",
  "musicgen",
  "ace-step-finetuned",
  "diffusion-finetuned"
] as const;

export type GenerationModel = (typeof generationModels)[number];

export function isGenerationModel(value: string): value is GenerationModel {
  return generationModels.includes(value as GenerationModel);
}

export function generationModelLabel(model: GenerationModel | null | undefined) {
  switch (model) {
    case "diffusion-finetuned":
      return "Diffusion Fine-Tuned";
    case "ace-step-finetuned":
      return "ACE-Step 1.5 Fine-Tuned";
    case "musicgen":
      return "MusicGen";
    case "ace-step-base":
    default:
      return "ACE-Step 1.5 Base";
  }
}
