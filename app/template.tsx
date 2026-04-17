"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
