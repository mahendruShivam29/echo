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

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  volume: 0.8,
  isBuffering: false,
  playTrack: (track, queue) => {
    const nextQueue = queue?.length ? queue : [track];
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
    if (get().currentTrack) {
      set({ isPlaying: true });
    }
  },
  playNext: () => {
    const { queue, currentIndex } = get();
    if (!queue.length) {
      return;
    }

    const nextIndex = (currentIndex + 1) % queue.length;
    set({ currentIndex: nextIndex, currentTrack: queue[nextIndex], isPlaying: true });
  },
  playPrevious: () => {
    const { queue, currentIndex } = get();
    if (!queue.length) {
      return;
    }

    const nextIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    set({ currentIndex: nextIndex, currentTrack: queue[nextIndex], isPlaying: true });
  },
  setVolume: (volume) => set({ volume }),
  setIsBuffering: (value) => set({ isBuffering: value }),
  setQueue: (queue, startIndex = 0) =>
    set({
      queue,
      currentIndex: queue.length ? startIndex : -1,
      currentTrack: queue[startIndex] ?? null
    }),
  clearQueue: () =>
    set({
      currentTrack: null,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      isBuffering: false
    })
}));
