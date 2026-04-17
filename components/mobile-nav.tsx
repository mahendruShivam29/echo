import Link from "next/link";
import { Library, Music2, PlusCircle } from "lucide-react";

const navItems = [
  { href: "/", label: "Feed", icon: Music2 },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/library", label: "Library", icon: Library }
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-24 left-3 right-3 z-40 grid grid-cols-3 rounded-md bg-white/5 p-2 pb-safe shadow-2xl ring-1 ring-white/10 backdrop-blur-xl md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
