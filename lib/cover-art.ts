import { albumArtGradient } from "@/lib/album-art";
import type { Track } from "@/lib/types";

export function getTrackArtworkStyle(track: Pick<Track, "id" | "cover_image_url">) {
  if (track.cover_image_url) {
    return {
      backgroundImage: `url(${track.cover_image_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    };
  }

  return albumArtGradient(track.id);
}
