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
    <div className="rounded-md bg-white/5 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
      <motion.div
        className="aspect-square rounded-md"
        animate={{
          background: [
            "radial-gradient(circle at 25% 20%, #14b8a6, transparent 38%), radial-gradient(circle at 80% 70%, #f43f5e, transparent 35%), #09090b",
            "radial-gradient(circle at 70% 25%, #facc15, transparent 38%), radial-gradient(circle at 30% 75%, #38bdf8, transparent 35%), #09090b"
          ],
          scale: [1, 1.02, 1]
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
      />
      <div className="mt-4">
        <p className="line-clamp-2 text-sm font-semibold text-white">{prompt}</p>
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
