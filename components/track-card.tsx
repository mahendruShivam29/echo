"use client";

import { motion } from "framer-motion";
import { Music2, Pause, Play, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessingCard } from "@/components/processing-card";
import { albumArtGradient } from "@/lib/album-art";
import { cn, formatDuration } from "@/lib/utils";
import type { Track } from "@/lib/types";
import { usePlayerStore } from "@/stores/player-store";

export function TrackCard({ track, queue }: { track: Track; queue: Track[] }) {
  const { currentTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const active = currentTrack?.id === track.id;
  const playable = Boolean(track.audio_url && track.status === "succeeded");

  if (track.status === "processing") {
    return <ProcessingCard prompt={track.prompt} />;
  }

  return (
    <motion.article
      layout
      className={cn(
        "group relative overflow-hidden rounded-md bg-white/5 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl",
        active && "ring-emerald-300/50"
      )}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(115deg, transparent 18%, rgba(255,255,255,0.12) 42%, transparent 62%)"
        }}
        animate={{ x: ["-120%", "120%"] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
      />
      <div
        className="relative aspect-square overflow-hidden rounded-md shadow-2xl"
        style={albumArtGradient(track.id)}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.6),transparent_55%)]" />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-zinc-950/45 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white ring-1 ring-white/10 backdrop-blur-md">
          {track.status === "failed" ? (
            "Failed"
          ) : active && isPlaying ? (
            <>
              <Radio className="h-3 w-3 text-emerald-300" />
              Live
            </>
          ) : (
            <>
              <Music2 className="h-3 w-3 text-emerald-300" />
              Echo
            </>
          )}
        </div>
        <Button
          size="icon"
          className="absolute bottom-3 right-3 h-12 w-12 shadow-xl opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
          onClick={() => {
            if (active && isPlaying) {
              pauseTrack();
              return;
            }
            playTrack(track, queue);
          }}
          disabled={!playable}
        >
          {active && isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
      </div>
      <div className="relative mt-4">
        <p className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-white">{track.prompt}</p>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-400">
          <span>{track.status === "failed" ? "Generation failed" : "Instrumental"}</span>
          <span>{formatDuration(track.duration_seconds)}</span>
        </div>
      </div>
    </motion.article>
  );
}
