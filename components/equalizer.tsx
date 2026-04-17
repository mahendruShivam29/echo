"use client";

import { motion } from "framer-motion";

export function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((bar) => (
        <motion.span
          key={bar}
          className="w-1 rounded-full bg-emerald-300"
          animate={{ height: [4, 14, 7, 12, 4] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: bar * 0.12,
            ease: [0.32, 0.72, 0, 1]
          }}
        />
      ))}
    </span>
  );
}
