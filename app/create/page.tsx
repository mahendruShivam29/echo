import { redirect } from "next/navigation";
import { CreateForm } from "@/components/create/create-form";
import { PageHeading } from "@/components/page-heading";
import { createClient } from "@/lib/supabase/server";
import type { Track } from "@/lib/types";

export const revalidate = 0;

export default async function CreatePage() {
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
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <section className="mx-auto max-w-6xl space-y-10">
      <PageHeading
        eyebrow="Create"
        title="Shape a new instrumental from a single prompt."
        description="Describe mood, instruments, tempo, space, and texture. Echo handles the generation in the background and updates this page live."
      />
      <CreateForm initialTracks={(data ?? []) as Track[]} userId={user.id} />
    </section>
  );
}
