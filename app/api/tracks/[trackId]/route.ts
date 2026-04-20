import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { trackId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .select("id,user_id,audio_url")
    .eq("id", params.trackId)
    .single<{ id: string; user_id: string; audio_url: string | null }>();

  if (trackError || !track) {
    return NextResponse.json({ error: "Track not found." }, { status: 404 });
  }

  if (track.user_id !== user.id) {
    return NextResponse.json({ error: "You can only delete your own tracks." }, { status: 403 });
  }

  const admin = createAdminClient();

  if (track.audio_url) {
    await admin.storage.from("tracks").remove([`${track.id}.wav`]);
  }

  const { error: deleteError } = await supabase.from("tracks").delete().eq("id", track.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
