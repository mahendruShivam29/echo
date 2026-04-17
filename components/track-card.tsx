"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessingCard } from "@/components/processing-card";
import { albumArtGradient } from "@/lib/album-art";
import { formatDuration } from "@/lib/utils";
import type { Track } from "@/lib/types";
import { usePlayerStore } from "@/stores/player-store";

export function TrackCard({ track, queue }: { track: Track; queue: Track[] }) {
  const playTrack = usePlayerStore((state) => state.playTrack);

  if (track.status === "processing") {
    return <ProcessingCard prompt={track.prompt} />;
  }

  return (
    <motion.article
      layout
      className="group rounded-md bg-white/5 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="relative aspect-square overflow-hidden rounded-md" style={albumArtGradient(track.id)}>
        <Button
          size="icon"
          className="absolute bottom-3 right-3 opacity-0 shadow-xl transition group-hover:opacity-100"
          onClick={() => playTrack(track, queue)}
          disabled={!track.audio_url || track.status !== "succeeded"}
        >
          <Play className="h-5 w-5" />
        </Button>
      </div>
      <div className="mt-4">
        <p className="line-clamp-2 text-sm font-semibold text-white">{track.prompt}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span>{track.status === "failed" ? "Generation failed" : "Instrumental"}</span>
          <span>{formatDuration(track.duration_seconds)}</span>
        </div>
      </div>
    </motion.article>
  );
}
