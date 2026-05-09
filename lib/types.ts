import type { GenerationModel } from "@/lib/models";

export type TrackStatus = "processing" | "succeeded" | "failed";

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface Track {
  id: string;
  user_id: string;
  prompt: string;
  generation_model: GenerationModel | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_photographer_name: string | null;
  cover_photographer_url: string | null;
  cover_unsplash_url: string | null;
  audio_url: string | null;
  status: TrackStatus;
  replicate_job_id: string | null;
  duration_seconds: number | null;
  created_at: string;
}
