import Link from "next/link";
import { Library, Music2, PlusCircle, Sparkles } from "lucide-react";
import { AuthButton } from "@/components/auth/auth-button";

const navItems = [
  { href: "/", label: "Feed", icon: Music2 },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/library", label: "Library", icon: Library }
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-zinc-950/80 px-5 py-6 backdrop-blur-xl md:block">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-400 text-emerald-950">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="text-lg font-bold tracking-tight">Project Echo</span>
      </Link>
      <nav className="mt-10 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-6 left-5 right-5">
        <AuthButton />
      </div>
    </aside>
  );
}
