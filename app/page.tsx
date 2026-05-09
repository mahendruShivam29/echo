import { MusicLanding } from "@/components/landing/music-landing";
import { LivePublicFeed } from "@/components/live-public-feed";
import { PageHeading } from "@/components/page-heading";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Track } from "@/lib/types";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("tracks")
      .select("*")
      .eq("status", "succeeded")
      .not("audio_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(9);

    return <MusicLanding initialTracks={(data ?? []) as Track[]} />;
  }

  const { data } = await supabase
    .from("tracks")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(32);

  const tracks = (data ?? []) as Track[];

  return (
    <section className="mx-auto max-w-7xl space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeading
          eyebrow="Feed"
          title="Your finished instrumentals."
          description="Play completed generations and keep the queue moving without leaving the feed."
        />
      </div>
      <LivePublicFeed initialTracks={tracks} userId={user.id} />
    </section>
  );
}
