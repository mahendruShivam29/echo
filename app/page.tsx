import { TrackGrid } from "@/components/track-grid";
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
    <section className="mx-auto max-w-7xl space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Public Feed
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
          Fresh instrumentals from the Echo community.
        </h1>
      </div>
      <TrackGrid tracks={tracks} emptyText="Generated tracks will appear here soon." />
    </section>
  );
}
