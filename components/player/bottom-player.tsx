"use client";

import { useEffect, useRef } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, Waves } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import { albumArtGradient } from "@/lib/album-art";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";

export function BottomPlayer() {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const {
    currentTrack,
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

    waveSurfer.setVolume(volume);
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
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-white/5 px-3 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl md:left-64 md:px-6">
      <div className="grid items-center gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(280px,2fr)_minmax(160px,1fr)]">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="h-12 w-12 shrink-0 rounded-md shadow-lg"
            style={albumArtGradient(currentTrack?.id ?? "empty")}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {currentTrack?.prompt ?? "No track selected"}
            </p>
            <p className="flex items-center gap-1 text-xs text-zinc-400">
              <Waves className="h-3.5 w-3.5" />
              {isBuffering ? "Buffering" : currentTrack ? "Project Echo" : "Choose a track"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
          <div ref={waveformRef} className="hidden h-10 min-w-0 flex-1 md:block" />
        </div>

        <label className="hidden items-center gap-2 justify-self-end text-zinc-400 md:flex">
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
    </footer>
  );
}
