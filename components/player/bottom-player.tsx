"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ListMusic, Pause, Play, SkipBack, SkipForward, Volume2, Waves } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import { getTrackArtworkStyle } from "@/lib/cover-art";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";

export function BottomPlayer() {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    volume,
    isBuffering,
    pauseTrack,
    resumeTrack,
    playNext,
    playPrevious,
    setVolume,
    setIsBuffering
  } = usePlayerStore();

  useEffect(() => {
    if (!waveformRef.current || !currentTrack?.audio_url) {
      return;
    }

    waveSurferRef.current?.destroy();
    setIsBuffering(true);

    const waveSurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "rgba(255,255,255,0.22)",
      progressColor: "#34d399",
      cursorColor: "transparent",
      barWidth: 2,
      barGap: 3,
      height: 38,
      normalize: true,
      url: currentTrack.audio_url
    });

    waveSurfer.setVolume(usePlayerStore.getState().volume);
    waveSurfer.on("ready", () => {
      setIsBuffering(false);
      if (usePlayerStore.getState().isPlaying) {
        void waveSurfer.play();
      }
    });
    waveSurfer.on("finish", () => playNext());
    waveSurferRef.current = waveSurfer;

    return () => {
      waveSurfer.destroy();
      waveSurferRef.current = null;
    };
  }, [currentTrack?.id, currentTrack?.audio_url, playNext, setIsBuffering]);

  useEffect(() => {
    waveSurferRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    const waveSurfer = waveSurferRef.current;
    if (!waveSurfer || !currentTrack?.audio_url) {
      return;
    }

    if (isPlaying) {
      void waveSurfer.play();
    } else {
      waveSurfer.pause();
    }
  }, [isPlaying, currentTrack?.audio_url]);

  const canPlay = Boolean(currentTrack?.audio_url);

  return (
    <motion.footer
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-white/5 px-3 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl md:left-64 md:px-6"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(52,211,153,0.65),rgba(56,189,248,0.45),transparent)]" />
      <div className="grid items-center gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(300px,2fr)_minmax(190px,1fr)]">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md shadow-2xl"
            style={
              currentTrack
                ? getTrackArtworkStyle(currentTrack)
                : getTrackArtworkStyle({ id: "empty", cover_image_url: null })
            }
            animate={isPlaying ? { scale: [1, 1.035, 1] } : { scale: 1 }}
            transition={{ duration: 1.4, repeat: isPlaying ? Infinity : 0, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.45),transparent)]" />
          </motion.div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {currentTrack?.prompt ?? "No track selected"}
            </p>
            <p className="flex items-center gap-1 text-xs text-zinc-400">
              <Waves className="h-3.5 w-3.5" />
              {isBuffering ? "Buffering" : currentTrack ? "Project Echo" : "Choose a track"}
            </p>
            {currentTrack?.cover_photographer_name &&
            currentTrack.cover_photographer_url &&
            currentTrack.cover_unsplash_url ? (
              <p className="truncate text-[11px] text-zinc-500">
                Photo by{" "}
                <a
                  href={currentTrack.cover_photographer_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 transition hover:text-white"
                >
                  {currentTrack.cover_photographer_name}
                </a>{" "}
                on{" "}
                <a
                  href={currentTrack.cover_unsplash_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 transition hover:text-white"
                >
                  Unsplash
                </a>
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" onClick={playPrevious} disabled={!currentTrack}>
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            onClick={isPlaying ? pauseTrack : resumeTrack}
            disabled={!canPlay}
            className={cn("rounded-md", isPlaying && "bg-white text-zinc-950 hover:bg-zinc-200")}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={playNext} disabled={!currentTrack}>
            <SkipForward className="h-5 w-5" />
          </Button>
          </div>
          <div className="h-10 min-w-0 rounded-md bg-zinc-950/30 px-3 ring-1 ring-white/10">
            <div ref={waveformRef} className="hidden h-10 min-w-0 md:block" />
            <div className="flex h-10 items-center justify-center gap-1 md:hidden">
              {[...Array(28)].map((_, index) => (
                <motion.span
                  key={index}
                  className="w-0.5 rounded-full bg-white/25"
                  animate={isPlaying ? { height: [6, 18 - (index % 7), 8] } : { height: 8 }}
                  transition={{
                    duration: 1.2,
                    repeat: isPlaying ? Infinity : 0,
                    delay: index * 0.025,
                    ease: [0.32, 0.72, 0, 1]
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="hidden items-center justify-end gap-5 text-zinc-400 md:flex">
          <div className="flex items-center gap-2 text-xs">
            <ListMusic className="h-4 w-4" />
            <span>
              {queue.length ? currentIndex + 1 : 0}/{queue.length}
            </span>
          </div>
          <label className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <input
              aria-label="Volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="w-28 accent-emerald-400"
            />
          </label>
        </div>
      </div>
    </motion.footer>
  );
}
