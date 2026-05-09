import type { Track } from "@/lib/types";
import { TrackCard } from "@/components/track-card";

export function TrackGrid({
  tracks,
  emptyText,
  currentUserId,
  onTrackDeleted,
  onTrackRegenerated
}: {
  tracks: Track[];
  emptyText: string;
  currentUserId?: string;
  onTrackDeleted?: (trackId: string) => void;
  onTrackRegenerated?: (track: Track) => void;
}) {
  const playableQueue = tracks.filter(
    (track) => track.status === "succeeded" && Boolean(track.audio_url)
  );

  if (!tracks.length) {
    return (
      <div className="rounded-md border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center text-zinc-400 backdrop-blur-xl">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          queue={playableQueue}
          currentUserId={currentUserId}
          onTrackDeleted={onTrackDeleted}
          onTrackRegenerated={onTrackRegenerated}
        />
      ))}
    </div>
  );
}
