"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PageHeading({
  eyebrow,
  title,
  description,
  align = "left"
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className={cn("max-w-4xl", align === "center" && "mx-auto text-center")}
    >
      <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
        <span className="h-px w-10 bg-emerald-300" />
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
          {eyebrow}
        </p>
      </div>
      <h1 className="mt-4 text-balance text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
