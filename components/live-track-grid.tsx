"use client";

import { useEffect, useMemo, useState } from "react";
import { TrackGrid } from "@/components/track-grid";
import { createClient } from "@/lib/supabase/client";
import type { Track } from "@/lib/types";

export function LiveTrackGrid({
  initialTracks,
  userId,
  emptyText
}: {
  initialTracks: Track[];
  userId: string;
  emptyText: string;
}) {
  const [tracks, setTracks] = useState(initialTracks);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`library-track-updates-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tracks",
          filter: "user_id=eq." + userId
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedTrack = payload.old as Pick<Track, "id">;
            setTracks((current) => current.filter((track) => track.id !== deletedTrack.id));
            return;
          }

          const nextTrack = payload.new as Track;
          setTracks((current) => {
            const exists = current.some((track) => track.id === nextTrack.id);
            const nextTracks = exists
              ? current.map((track) => (track.id === nextTrack.id ? nextTrack : track))
              : [nextTrack, ...current];

            return nextTracks.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return (
    <TrackGrid
      tracks={tracks}
      emptyText={emptyText}
      currentUserId={userId}
      onTrackDeleted={(trackId) =>
        setTracks((current) => current.filter((track) => track.id !== trackId))
      }
    />
  );
}
