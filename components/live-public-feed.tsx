"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrackGrid } from "@/components/track-grid";
import { GENERATION_DURATION_SECONDS } from "@/lib/generation";
import { createClient } from "@/lib/supabase/client";
import type { Track } from "@/lib/types";

export function LivePublicFeed({
  initialTracks,
  userId
}: {
  initialTracks: Track[];
  userId: string;
}) {
  const [tracks, setTracks] = useState(initialTracks);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel("public-feed-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tracks",
          filter: "user_id=eq." + userId
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedTrack = payload.old as Pick<Track, "id">;
            setTracks((current) => current.filter((track) => track.id !== deletedTrack.id));
            return;
          }

          const nextTrack = payload.new as Track;
          if (nextTrack.status !== "succeeded") {
            setTracks((current) => current.filter((track) => track.id !== nextTrack.id));
            return;
          }

          setTracks((current) => {
            const exists = current.some((track) => track.id === nextTrack.id);
            const nextTracks = exists
              ? current.map((track) => (track.id === nextTrack.id ? nextTrack : track))
              : [nextTrack, ...current];

            return nextTracks
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 32);
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <FeedStat label="Recent tracks" value={tracks.length.toString()} />
        <FeedStat label="Render target" value={`${GENERATION_DURATION_SECONDS}s`} tone="emerald" />
        <FeedStat label="Realtime queue" value="Live" tone="sky" className="hidden sm:block" />
      </div>
      <TrackGrid
        tracks={tracks}
        emptyText="Generated tracks will appear here soon."
        currentUserId={userId}
      />
    </div>
  );
}

function FeedStat({
  label,
  value,
  tone = "white",
  className
}: {
  label: string;
  value: string;
  tone?: "white" | "emerald" | "sky";
  className?: string;
}) {
  const toneClass = {
    white: "text-white",
    emerald: "text-emerald-300",
    sky: "text-sky-300"
  }[tone];

  return (
    <motion.div
      layout
      className={className}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
        <p className={`text-2xl font-black ${toneClass}`}>{value}</p>
        <p className="text-zinc-400">{label}</p>
      </div>
    </motion.div>
  );
}
