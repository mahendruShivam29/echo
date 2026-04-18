import { TrackGrid } from "@/components/track-grid";
import { PageHeading } from "@/components/page-heading";
import { createClient } from "@/lib/supabase/server";
import type { Track } from "@/lib/types";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("tracks")
    .select("*")
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(32);

  const tracks = (data ?? []) as Track[];

  return (
    <section className="mx-auto max-w-7xl space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeading
          eyebrow="Public Feed"
          title="Fresh instrumentals from the Echo community."
          description="Play finished generations, explore prompts, and keep the queue moving without leaving the feed."
        />
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
            <p className="text-2xl font-black text-white">{tracks.length}</p>
            <p className="text-zinc-400">Recent tracks</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
            <p className="text-2xl font-black text-emerald-300">60s</p>
            <p className="text-zinc-400">Render target</p>
          </div>
          <div className="hidden rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl sm:block">
            <p className="text-2xl font-black text-sky-300">Live</p>
            <p className="text-zinc-400">Realtime queue</p>
          </div>
        </div>
      </div>
      <TrackGrid tracks={tracks} emptyText="Generated tracks will appear here soon." />
    </section>
  );
}
