"use client";

import { create } from "zustand";
import type { Track } from "@/lib/types";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isBuffering: boolean;
  playTrack: (track: Track, queue?: Track[]) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setVolume: (volume: number) => void;
  setIsBuffering: (value: boolean) => void;
  setQueue: (queue: Track[], startIndex?: number) => void;
  clearQueue: () => void;
}

function getPlayableTracks(queue: Track[]) {
  return queue.filter((track) => track.status === "succeeded" && Boolean(track.audio_url));
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  volume: 0.8,
  isBuffering: false,
  playTrack: (track, queue) => {
    if (track.status !== "succeeded" || !track.audio_url) {
      return;
    }

    const nextQueue = getPlayableTracks(queue?.length ? queue : [track]);
    const nextIndex = Math.max(
      0,
      nextQueue.findIndex((queuedTrack) => queuedTrack.id === track.id)
    );

    set({
      currentTrack: track,
      queue: nextQueue,
      currentIndex: nextIndex,
      isPlaying: true
    });
  },
  pauseTrack: () => set({ isPlaying: false }),
  resumeTrack: () => {
    const { currentTrack } = get();
    if (currentTrack?.audio_url && currentTrack.status === "succeeded") {
      set({ isPlaying: true });
    }
  },
  playNext: () => {
    const { queue, currentIndex } = get();
    const playableQueue = getPlayableTracks(queue);

    if (!playableQueue.length) {
      return;
    }

    const nextIndex = (Math.max(0, currentIndex) + 1) % playableQueue.length;
    set({
      queue: playableQueue,
      currentIndex: nextIndex,
      currentTrack: playableQueue[nextIndex],
      isPlaying: true
    });
  },
  playPrevious: () => {
    const { queue, currentIndex } = get();
    const playableQueue = getPlayableTracks(queue);

    if (!playableQueue.length) {
      return;
    }

    const nextIndex = currentIndex <= 0 ? playableQueue.length - 1 : currentIndex - 1;
    set({
      queue: playableQueue,
      currentIndex: nextIndex,
      currentTrack: playableQueue[nextIndex],
      isPlaying: true
    });
  },
  setVolume: (volume) => set({ volume }),
  setIsBuffering: (value) => set({ isBuffering: value }),
  setQueue: (queue, startIndex = 0) => {
    const playableQueue = getPlayableTracks(queue);
    const safeIndex = playableQueue.length ? Math.min(startIndex, playableQueue.length - 1) : -1;

    set({
      queue: playableQueue,
      currentIndex: safeIndex,
      currentTrack: safeIndex >= 0 ? playableQueue[safeIndex] : null
    });
  },
  clearQueue: () =>
    set({
      currentTrack: null,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      isBuffering: false
    })
}));
