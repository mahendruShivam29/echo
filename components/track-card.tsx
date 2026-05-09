"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Loader2,
  Music2,
  Pause,
  PencilLine,
  Play,
  Radio,
  Trash2,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProcessingCard } from "@/components/processing-card";
import { getTrackArtworkStyle } from "@/lib/cover-art";
import { GENERATION_DURATION_SECONDS } from "@/lib/generation";
import { generationModelLabel } from "@/lib/models";
import { cn, formatDuration } from "@/lib/utils";
import type { Track } from "@/lib/types";
import { usePlayerStore } from "@/stores/player-store";

export function TrackCard({
  track,
  queue,
  currentUserId,
  onTrackDeleted,
  onTrackRegenerated
}: {
  track: Track;
  queue: Track[];
  currentUserId?: string;
  onTrackDeleted?: (trackId: string) => void;
  onTrackRegenerated?: (track: Track) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(track.prompt);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const { currentTrack, isPlaying, playTrack, pauseTrack, removeTrack } = usePlayerStore();
  const active = currentTrack?.id === track.id;
  const playable = Boolean(track.audio_url && track.status === "succeeded");
  const canDelete = currentUserId === track.user_id;
  const canEdit = canDelete && track.status !== "processing";

  async function handleDelete() {
    if (!canDelete || isDeleting) {
      return;
    }

    const confirmed = window.confirm("Delete this track permanently?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const response = await fetch(`/api/tracks/${track.id}`, {
      method: "DELETE"
    });

    setIsDeleting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      window.alert(data?.error ?? "Could not delete track.");
      return;
    }

    removeTrack(track.id);

    onTrackDeleted?.(track.id);
  }

  async function handleRegenerate() {
    if (!canEdit || isRegenerating) {
      return;
    }

    const normalizedPrompt = editedPrompt.trim();
    if (normalizedPrompt.length < 8) {
      setEditError("Prompt must be at least 8 characters.");
      return;
    }

    setEditError(null);
    setIsRegenerating(true);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: normalizedPrompt,
        model: track.generation_model ?? "ace-step-base"
      })
    });
    const data = (await response.json().catch(() => null)) as { trackId?: string; error?: string } | null;

    setIsRegenerating(false);

    if (!response.ok || !data?.trackId) {
      setEditError(data?.error ?? "Could not start a new generation.");
      return;
    }

    onTrackRegenerated?.({
      id: data.trackId,
      user_id: currentUserId ?? track.user_id,
      prompt: normalizedPrompt,
      generation_model: track.generation_model ?? "ace-step-base",
      cover_image_url: track.cover_image_url,
      cover_image_alt: track.cover_image_alt,
      cover_photographer_name: track.cover_photographer_name,
      cover_photographer_url: track.cover_photographer_url,
      cover_unsplash_url: track.cover_unsplash_url,
      audio_url: null,
      status: "processing",
      replicate_job_id: null,
      duration_seconds: GENERATION_DURATION_SECONDS,
      created_at: new Date().toISOString()
    });
    setIsEditing(false);
  }

  if (track.status === "processing") {
    return (
      <div className="relative">
        {canDelete ? (
          <DeleteButton
            isDeleting={isDeleting}
            onClick={handleDelete}
            className="absolute right-3 top-3 z-20"
          />
        ) : null}
        <ProcessingCard trackId={track.id} prompt={track.prompt} createdAt={track.created_at} />
      </div>
    );
  }

  return (
    <motion.article
      layout
        className={cn(
          "group relative overflow-hidden rounded-md bg-white/5 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl",
          isDeleting && "pointer-events-none opacity-60",
          active && "ring-emerald-300/50"
        )}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(115deg, transparent 18%, rgba(255,255,255,0.12) 42%, transparent 62%)"
        }}
        animate={{ x: ["-120%", "120%"] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
      />
      <div
        className="relative aspect-square overflow-hidden rounded-md shadow-2xl"
        style={getTrackArtworkStyle(track)}
        aria-label={track.cover_image_alt ?? undefined}
      >
        {canDelete ? (
          <DeleteButton
            isDeleting={isDeleting}
            onClick={handleDelete}
            className="absolute right-3 top-3 z-20 opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.6),transparent_55%)]" />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-zinc-950/45 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white ring-1 ring-white/10 backdrop-blur-md">
          {track.status === "failed" ? (
            <>
              <AlertTriangle className="h-3 w-3 text-red-300" />
              Failed
            </>
          ) : active && isPlaying ? (
            <>
              <Radio className="h-3 w-3 text-emerald-300" />
              Live
            </>
          ) : (
            <>
              <Music2 className="h-3 w-3 text-emerald-300" />
              Echo
            </>
          )}
        </div>
        <Button
          size="icon"
          className={cn(
            "absolute bottom-3 right-3 h-12 w-12 shadow-xl opacity-100 transition md:opacity-0 md:group-hover:opacity-100",
            track.status === "failed" && "bg-white/10 text-zinc-400"
          )}
          onClick={() => {
            if (active && isPlaying) {
              pauseTrack();
              return;
            }
            playTrack(track, queue);
          }}
          disabled={!playable}
        >
          {active && isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
      </div>
      <div className="relative mt-4">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedPrompt}
              onChange={(event) => setEditedPrompt(event.target.value)}
              maxLength={800}
              className="min-h-28 text-sm"
            />
            {editError ? <p className="text-xs font-medium text-red-300">{editError}</p> : null}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-500">{editedPrompt.length}/800</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditedPrompt(track.prompt);
                    setEditError(null);
                    setIsEditing(false);
                  }}
                  disabled={isRegenerating}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating || editedPrompt.trim().length < 8}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Generate again
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-white">{track.prompt}</p>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-400">
          <span className={cn("truncate", track.status === "failed" && "text-red-300")}>
            {track.status === "failed"
              ? "Generation failed"
              : generationModelLabel(track.generation_model)}
          </span>
          <div className="flex items-center gap-2">
            {canEdit && !isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setEditedPrompt(track.prompt);
                  setEditError(null);
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1 font-bold text-emerald-200 transition hover:text-emerald-100"
              >
                <PencilLine className="h-3.5 w-3.5" />
                Edit
              </button>
            ) : null}
            <span>{formatDuration(track.duration_seconds)}</span>
          </div>
        </div>
        {track.cover_photographer_name && track.cover_photographer_url && track.cover_unsplash_url ? (
          <p className="mt-3 text-[11px] text-zinc-500">
            Photo by{" "}
            <a
              href={track.cover_photographer_url}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 transition hover:text-white"
            >
              {track.cover_photographer_name}
            </a>{" "}
            on{" "}
            <a
              href={track.cover_unsplash_url}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 transition hover:text-white"
            >
              Unsplash
            </a>
          </p>
        ) : null}
      </div>
    </motion.article>
  );
}

function DeleteButton({
  isDeleting,
  onClick,
  className
}: {
  isDeleting: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Delete track"
      disabled={isDeleting}
      onClick={onClick}
      className={cn(
        "h-9 w-9 bg-zinc-950/55 text-zinc-200 ring-1 ring-white/10 backdrop-blur-md hover:bg-red-500/20 hover:text-red-100",
        className
      )}
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}
