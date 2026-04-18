"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Equalizer } from "@/components/equalizer";

const loadingStrings = [
  "Tuning the instruments...",
  "Warming up the synths...",
  "Mixing the track..."
];

export function ProcessingCard({ prompt }: { prompt: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % loadingStrings.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-md bg-white/5 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
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
        animate={{
          background: [
            "radial-gradient(circle at 25% 20%, #14b8a6, transparent 38%), radial-gradient(circle at 80% 70%, #f43f5e, transparent 35%), radial-gradient(circle at 44% 86%, #facc15, transparent 42%), #09090b",
            "radial-gradient(circle at 70% 25%, #facc15, transparent 38%), radial-gradient(circle at 30% 75%, #38bdf8, transparent 35%), radial-gradient(circle at 62% 42%, #22c55e, transparent 42%), #09090b"
          ],
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
            animate={{ x: ["-70%", "95%"] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
            style={{ width: "72%" }}
          />
        </div>
        <p className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-white">{prompt}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-300">
          <Equalizer />
          <AnimatePresence mode="wait">
            <motion.span
              key={loadingStrings[index]}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              {loadingStrings[index]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
