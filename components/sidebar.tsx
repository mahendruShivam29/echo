import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AuthButton } from "@/components/auth/auth-button";
import { DesktopNavLinks } from "@/components/navigation/nav-links";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-zinc-950/72 px-5 py-6 shadow-2xl backdrop-blur-xl md:block">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[linear-gradient(135deg,#34d399,#38bdf8,#fb7185)] text-zinc-950 shadow-lg shadow-emerald-950/40">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="text-lg font-black tracking-tight">Project Echo</span>
      </Link>
      <DesktopNavLinks />
      <div className="absolute bottom-6 left-5 right-5">
        <AuthButton />
      </div>
    </aside>
  );
}
