"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Library, Music2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Feed", icon: Music2 },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/library", label: "Library", icon: Library }
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="mt-10 space-y-2">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-3 text-sm font-semibold text-zinc-400 transition hover:text-white",
              active && "text-white"
            )}
          >
            {active ? (
              <motion.span
                layoutId="desktop-active-nav"
                className="absolute inset-0 rounded-md bg-white/10 ring-1 ring-white/10"
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              />
            ) : null}
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.04]">
              <item.icon className="h-4 w-4" />
            </span>
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 overflow-hidden rounded-md px-2 py-2 text-xs font-semibold text-zinc-400 transition",
              active && "text-white"
            )}
          >
            {active ? (
              <motion.span
                layoutId="mobile-active-nav"
                className="absolute inset-0 rounded-md bg-white/10 ring-1 ring-white/10"
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              />
            ) : null}
            <item.icon className="relative z-10 h-5 w-5" />
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
