import { redirect } from "next/navigation";
import { TrackGrid } from "@/components/track-grid";
import { createClient } from "@/lib/supabase/server";
import type { Track } from "@/lib/types";

export const revalidate = 0;

export default async function LibraryPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data } = await supabase
    .from("tracks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Library
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
          Your finished and in-flight tracks.
        </h1>
      </div>
      <TrackGrid tracks={(data ?? []) as Track[]} emptyText="Create your first instrumental." />
    </section>
  );
}
