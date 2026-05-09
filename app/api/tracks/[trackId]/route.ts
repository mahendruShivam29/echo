import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getStorageObjectPath(audioUrl: string | null) {
  if (!audioUrl) {
    return null;
  }

  try {
    const url = new URL(audioUrl);
    const marker = "/object/public/tracks/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

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

  const storageObjectPath = getStorageObjectPath(track.audio_url);

  if (storageObjectPath) {
    await admin.storage.from("tracks").remove([storageObjectPath]);
  }

  const { data: deletedTrack, error: deleteError } = await admin
    .from("tracks")
    .delete()
    .eq("id", track.id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (!deletedTrack) {
    return NextResponse.json({ error: "Track could not be deleted." }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidatePath("/library");
  revalidatePath("/create");

  return NextResponse.json({ ok: true });
}
