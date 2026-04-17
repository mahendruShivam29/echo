"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TrackGrid } from "@/components/track-grid";
import { createClient } from "@/lib/supabase/client";
import type { Track } from "@/lib/types";

type GenerateResponse = {
  trackId?: string;
  error?: string;
};

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
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-md bg-white/5 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
      >
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
          <Button type="submit" disabled={isSubmitting || prompt.trim().length < 8}>
            <Sparkles className="h-4 w-4" />
            {isSubmitting ? "Starting..." : "Generate"}
          </Button>
        </div>
      </form>

      <TrackGrid tracks={tracks} emptyText="Your generated tracks will appear here." />
    </div>
  );
}
