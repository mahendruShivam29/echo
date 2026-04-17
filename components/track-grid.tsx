import type { Track } from "@/lib/types";
import { TrackCard } from "@/components/track-card";

export function TrackGrid({ tracks, emptyText }: { tracks: Track[]; emptyText: string }) {
  if (!tracks.length) {
    return (
      <div className="rounded-md border border-dashed border-white/15 px-6 py-14 text-center text-zinc-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} queue={tracks} />
      ))}
    </div>
  );
}
