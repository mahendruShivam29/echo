"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioWaveform, Sparkles, Timer, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TrackGrid } from "@/components/track-grid";
import { createClient } from "@/lib/supabase/client";
import type { Track } from "@/lib/types";

type GenerateResponse = {
  trackId?: string;
  error?: string;
};

const promptSeeds = [
  "Cinematic synthwave with analog bass, glassy arpeggios, and a wide neon chorus.",
  "Minimal piano and warm strings for a quiet midnight city scene.",
  "Fast afro-house instrumental with hand percussion, bright plucks, and a deep rolling groove."
];

export function CreateForm({ initialTracks }: { initialTracks: Track[] }) {
  const [prompt, setPrompt] = useState("");
  const [tracks, setTracks] = useState(initialTracks);
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!pendingTrackId) {
      return;
    }

    const channel = supabase
      .channel("track-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tracks",
          filter: "id=eq." + pendingTrackId
        },
        (payload) => {
          const updatedTrack = payload.new as Track;
          setTracks((current) =>
            current.map((track) => (track.id === updatedTrack.id ? updatedTrack : track))
          );
          if (updatedTrack.status !== "processing") {
            setPendingTrackId(null);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pendingTrackId, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = (await response.json()) as GenerateResponse;

    setIsSubmitting(false);

    if (!response.ok || !data.trackId) {
      setError(data.error ?? "Could not start generation.");
      return;
    }

    const optimisticTrack: Track = {
      id: data.trackId,
      user_id: "current-user",
      prompt,
      audio_url: null,
      status: "processing",
      replicate_job_id: null,
      duration_seconds: 60,
      created_at: new Date().toISOString()
    };

    setTracks((current) => [optimisticTrack, ...current]);
    setPendingTrackId(data.trackId);
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
            MusicGen
          </div>
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
                Instrumentals render in about a minute.
              </motion.p>
            )}
          </AnimatePresence>
          <span className="text-xs text-zinc-500 sm:ml-auto">{prompt.length}/800</span>
          <Button type="submit" disabled={isSubmitting || prompt.trim().length < 8}>
            <Sparkles className="h-4 w-4" />
            {isSubmitting ? "Starting..." : "Generate"}
          </Button>
        </div>
      </form>

      <aside className="space-y-3">
        <div className="rounded-md bg-white/5 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-emerald-300">
              <Timer className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-white">60-second wait state</p>
              <p className="text-sm text-zinc-400">Processing cards update live through Supabase Realtime.</p>
            </div>
          </div>
        </div>
        <div className="rounded-md bg-white/5 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-sky-300">
              <AudioWaveform className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-white">Persistent playback</p>
              <p className="text-sm text-zinc-400">The player stays mounted across Feed, Create, and Library.</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:col-span-2">
        <TrackGrid tracks={tracks} emptyText="Your generated tracks will appear here." />
      </div>
    </div>
  );
}
