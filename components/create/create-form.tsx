"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioWaveform, CheckCircle2, Loader2, Timer, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TrackGrid } from "@/components/track-grid";
import { GENERATION_DURATION_SECONDS } from "@/lib/generation";
import { generationModelLabel, type GenerationModel } from "@/lib/models";
import { createClient } from "@/lib/supabase/client";
import type { Track } from "@/lib/types";
import type { TrackCover } from "@/lib/unsplash";

type GenerateResponse = {
  trackId?: string;
  model?: GenerationModel;
  cover?: TrackCover | null;
  error?: string;
};

const modelOptions: GenerationModel[] = ["ace-step-base", "musicgen"];

const promptSeeds = [
  "Cinematic synthwave with analog bass, glassy arpeggios, and a wide neon chorus.",
  "Minimal piano and warm strings for a quiet midnight city scene.",
  "Fast afro-house instrumental with hand percussion, bright plucks, and a deep rolling groove."
];

function mergeTrack(current: Track[], nextTrack: Track) {
  const exists = current.some((track) => track.id === nextTrack.id);
  const nextTracks = exists
    ? current.map((track) => (track.id === nextTrack.id ? nextTrack : track))
    : [nextTrack, ...current];

  return nextTracks.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function CreateForm({ initialTracks, userId }: { initialTracks: Track[]; userId: string }) {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<GenerationModel>("ace-step-base");
  const [tracks, setTracks] = useState(initialTracks);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const processingCount = tracks.filter((track) => track.status === "processing").length;
  const finishedCount = tracks.filter((track) => track.status === "succeeded").length;

  useEffect(() => {
    const channel = supabase
      .channel(`track-updates-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tracks",
          filter: "user_id=eq." + userId
        },
        (payload) => {
          const updatedTrack = payload.new as Track;
          setTracks((current) => mergeTrack(current, updatedTrack));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  useEffect(() => {
    const processingTrackIds = tracks
      .filter((track) => track.status === "processing")
      .map((track) => track.id);

    if (!processingTrackIds.length) {
      return;
    }

    let cancelled = false;

    async function syncProcessingTracks() {
      const { data, error: syncError } = await supabase
        .from("tracks")
        .select("*")
        .in("id", processingTrackIds);

      if (cancelled || syncError || !data) {
        return;
      }

      setTracks((current) =>
        (data as Track[]).reduce((nextTracks, nextTrack) => mergeTrack(nextTracks, nextTrack), current)
      );
    }

    void syncProcessingTracks();
    const interval = window.setInterval(() => {
      void syncProcessingTracks();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [supabase, tracks, userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: selectedModel })
    });
    const data = (await response.json()) as GenerateResponse;

    setIsSubmitting(false);

    if (!response.ok || !data.trackId) {
      setError(data.error ?? "Could not start generation.");
      return;
    }

    const optimisticTrack: Track = {
      id: data.trackId,
      user_id: userId,
      prompt,
      generation_model: data.model ?? selectedModel,
      cover_image_url: data.cover?.cover_image_url ?? null,
      cover_image_alt: data.cover?.cover_image_alt ?? null,
      cover_photographer_name: data.cover?.cover_photographer_name ?? null,
      cover_photographer_url: data.cover?.cover_photographer_url ?? null,
      cover_unsplash_url: data.cover?.cover_unsplash_url ?? null,
      audio_url: null,
      status: "processing",
      replicate_job_id: null,
      duration_seconds: GENERATION_DURATION_SECONDS,
      created_at: new Date().toISOString()
    };

    setTracks((current) => [optimisticTrack, ...current]);
    setPrompt("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-md bg-white/5 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
          style={{
            background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.85), transparent)"
          }}
        />
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <Wand2 className="h-4 w-4 text-emerald-300" />
              Prompt studio
            </p>
            <p className="mt-1 text-sm text-zinc-400">The webhook will keep rendering after you leave.</p>
          </div>
          <div className="hidden rounded-md bg-emerald-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200 ring-1 ring-emerald-300/20 sm:block">
            {generationModelLabel(selectedModel)}
          </div>
        </div>
        <div className="mb-5 grid gap-2 sm:grid-cols-2">
          {modelOptions.map((modelOption) => {
            const active = modelOption === selectedModel;

            return (
              <button
                key={modelOption}
                type="button"
                onClick={() => setSelectedModel(modelOption)}
                className={`rounded-md border px-4 py-3 text-left transition ${
                  active
                    ? "border-emerald-300/50 bg-emerald-300/10 text-white"
                    : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <p className="text-sm font-bold">{generationModelLabel(modelOption)}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {modelOption === "ace-step-base"
                    ? "Lyrics-capable ACE-Step base model via Replicate."
                    : "Meta MusicGen for text-to-music generation."}
                </p>
              </button>
            );
          })}
        </div>
        <label htmlFor="prompt" className="text-sm font-semibold text-white">
          Describe the instrumental track
        </label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="A cinematic synthwave instrumental with pulsing analog bass, glassy arpeggios, and a wide neon chorus."
          className="mt-3"
          maxLength={800}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {promptSeeds.map((seed) => (
            <button
              key={seed}
              type="button"
              onClick={() => setPrompt(seed)}
              className="rounded-md bg-white/[0.06] px-3 py-2 text-left text-xs font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
            >
              {seed}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.p
                key={error}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="text-sm text-red-300"
              >
                {error}
              </motion.p>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="text-sm text-zinc-400"
              >
                Instrumentals render in the background.
              </motion.p>
            )}
          </AnimatePresence>
          <span className="text-xs text-zinc-500 sm:ml-auto">{prompt.length}/800</span>
          <Button type="submit" disabled={isSubmitting || prompt.trim().length < 8}>
            {isSubmitting ? "Starting..." : "Generate"}
          </Button>
        </div>
      </form>

      <aside className="space-y-3">
        <div className="rounded-md bg-white/5 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-emerald-300">
              {processingCount ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Timer className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="font-bold text-white">
                {processingCount
                  ? `${processingCount} rendering now`
                  : `${GENERATION_DURATION_SECONDS}-second wait state`}
              </p>
              <p className="text-sm text-zinc-400">
                Processing cards update live and fall back to status sync.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-md bg-white/5 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-sky-300">
              {finishedCount ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              ) : (
                <AudioWaveform className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="font-bold text-white">
                {finishedCount ? `${finishedCount} ready to play` : "Persistent playback"}
              </p>
              <p className="text-sm text-zinc-400">
                The player stays mounted across Feed, Create, and Library.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:col-span-2">
        <TrackGrid
          tracks={tracks}
          emptyText="Your generated tracks will appear here."
          currentUserId={userId}
          onTrackDeleted={(trackId) =>
            setTracks((current) => current.filter((track) => track.id !== trackId))
          }
          onTrackRegenerated={(track) => setTracks((current) => mergeTrack(current, track))}
        />
      </div>
    </div>
  );
}
