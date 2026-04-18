import { redirect } from "next/navigation";
import { TrackGrid } from "@/components/track-grid";
import { PageHeading } from "@/components/page-heading";
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
    <section className="mx-auto max-w-7xl space-y-10">
      <PageHeading
        eyebrow="Library"
        title="Your finished and in-flight tracks."
        description="Every generation stays here, from the first processing state to the final mastered waveform."
      />
      <TrackGrid tracks={(data ?? []) as Track[]} emptyText="Create your first instrumental." />
    </section>
  );
}
