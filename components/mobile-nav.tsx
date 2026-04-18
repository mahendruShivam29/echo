import { MobileNavLinks } from "@/components/navigation/nav-links";

export function MobileNav() {
  return (
    <nav className="fixed bottom-24 left-3 right-3 z-40 grid grid-cols-3 rounded-md bg-white/5 p-2 pb-safe shadow-2xl ring-1 ring-white/10 backdrop-blur-xl md:hidden">
      <MobileNavLinks />
    </nav>
  );
}
