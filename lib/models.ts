export const generationModels = ["ace-step-base", "musicgen"] as const;

export type GenerationModel = (typeof generationModels)[number];

export function isGenerationModel(value: string): value is GenerationModel {
  return generationModels.includes(value as GenerationModel);
}

export function generationModelLabel(model: GenerationModel | null | undefined) {
  switch (model) {
    case "musicgen":
      return "MusicGen";
    case "ace-step-base":
    default:
      return "ACE-Step 1.5 Base";
  }
}
