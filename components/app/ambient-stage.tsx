"use client";

import { motion } from "framer-motion";

export function AmbientStage() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-zinc-950">
      <motion.div
        className="absolute inset-0 opacity-70"
        animate={{
          backgroundPosition: ["0% 0%", "100% 55%", "0% 0%"]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
        style={{
          backgroundImage:
            "linear-gradient(125deg, rgba(20,184,166,0.18), transparent 28%, rgba(244,63,94,0.12) 48%, transparent 68%, rgba(250,204,21,0.12)), linear-gradient(180deg, rgba(255,255,255,0.05), transparent 42%)",
          backgroundSize: "180% 180%, 100% 100%"
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <motion.div
        className="absolute inset-x-0 top-0 h-64 opacity-40"
        animate={{ x: ["-12%", "8%", "-12%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
        style={{
          background:
            "linear-gradient(100deg, transparent, rgba(52,211,153,0.16), rgba(56,189,248,0.12), rgba(251,113,133,0.12), transparent)"
        }}
      />
    </div>
  );
}
