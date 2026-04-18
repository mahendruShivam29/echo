import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BottomPlayer } from "@/components/player/bottom-player";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { cn } from "@/lib/utils";
import { AmbientStage } from "@/components/app/ambient-stage";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta"
});

export const metadata: Metadata = {
  title: "Project Echo",
  description: "Premium AI instrumental music generation."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(plusJakarta.variable, "font-sans")}>
        <div className="relative min-h-[100dvh]">
          <AmbientStage />
          <Sidebar />
          <main className="min-h-[100dvh] px-4 pb-48 pt-6 md:ml-64 md:px-8 md:pb-40 md:pt-8">
            {children}
          </main>
          <MobileNav />
          <BottomPlayer />
        </div>
      </body>
    </html>
  );
}
