"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Equalizer } from "@/components/equalizer";
import { albumArtGradient } from "@/lib/album-art";
import { GENERATION_DURATION_SECONDS } from "@/lib/generation";

const loadingStrings = [
  "Tuning the instruments...",
  "Warming up the synths...",
  "Mixing the track..."
];

export function ProcessingCard({
  trackId,
  prompt,
  createdAt
}: {
  trackId: string;
  prompt: string;
  createdAt: string;
}) {
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000))
  );
  const progress = Math.min(
    96,
    Math.max(12, Math.round((elapsed / GENERATION_DURATION_SECONDS) * 100))
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % loadingStrings.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [createdAt]);

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-md bg-white/5 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.9), transparent)"
        }}
      />
      <motion.div
        className="relative aspect-square overflow-hidden rounded-md"
        style={albumArtGradient(trackId)}
        animate={{
          filter: ["saturate(1)", "saturate(1.35)", "saturate(1)"],
          scale: [1, 1.02, 1]
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.div
          className="absolute inset-6 rounded-md border border-white/25"
          animate={{ opacity: [0.15, 0.55, 0.15], scale: [0.92, 1, 0.92] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.5),transparent_60%)]" />
      </motion.div>
      <div className="mt-4">
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#38bdf8,#fb7185)]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>
        <p className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-white">{prompt}</p>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-300">
          <div className="flex min-w-0 items-center gap-2">
            <Equalizer />
            <AnimatePresence mode="wait">
              <motion.span
                key={loadingStrings[index]}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="truncate"
              >
                {loadingStrings[index]}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="shrink-0 text-zinc-500">{elapsed}s</span>
        </div>
      </div>
    </motion.div>
  );
}
