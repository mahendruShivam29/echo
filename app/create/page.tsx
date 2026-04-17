import { redirect } from "next/navigation";
import { CreateForm } from "@/components/create/create-form";
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
    <section className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Create
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
          Shape a new instrumental from a single prompt.
        </h1>
      </div>
      <CreateForm initialTracks={(data ?? []) as Track[]} />
    </section>
  );
}
