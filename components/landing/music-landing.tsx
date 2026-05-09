"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  Disc3,
  MessageCircle,
  Music4,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTrackArtworkStyle } from "@/lib/cover-art";
import { generationModelLabel } from "@/lib/models";
import type { Track } from "@/lib/types";
import { usePlayerStore } from "@/stores/player-store";

const carouselTransition = {
  type: "spring",
  stiffness: 150,
  damping: 25,
  mass: 1.2
} as const;

const fallbackShowcaseTracks = [
  {
    id: "landing-punjabi-bollywood",
    prompt: "Punjabi Bollywood instrumental with dhol drums, tumbi melody, bright harmonium, dance groove, and cinematic strings.",
  },
  {
    id: "landing-reggae",
    prompt: "Moody reggae with soulful male vocals, warm bass, tape delay guitar, and sunset percussion.",
  },
  {
    id: "landing-synthwave",
    prompt: "Retro synthwave with analog bass, glassy arpeggios, gated drums, and a wide neon chorus.",
  },
  {
    id: "landing-cinematic",
    prompt: "A rich orchestral cue with symphonic strings, brass, woodwinds, epic fantasy motion, and a triumphant finale.",
  },
  {
    id: "landing-afro-house",
    prompt: "Fast afro-house instrumental with hand percussion, bright plucks, deep rolling groove, and festival energy.",
  },
  {
    id: "landing-lofi",
    prompt: "Lo-fi hip hop with jazzy chords, vinyl texture, soft drums, and a quiet midnight city mood.",
  },
  {
    id: "landing-game",
    prompt: "Mysterious jungle game soundtrack with tribal percussion, marimba patterns, deep pads, and rhythmic tension.",
  },
  {
    id: "landing-indie",
    prompt: "Slow dreamy indie rock with reverb guitars, retro keys, soft drums, and atmospheric melodic hooks.",
  },
  {
    id: "landing-corporate",
    prompt: "Downtempo corporate music with warm piano, clean percussion, soft synth pulses, and modern optimism.",
  }
] as const;

function getTrackPrompt(track: Track | (typeof fallbackShowcaseTracks)[number]) {
  return track.prompt;
}

function getTrackTitle(track: Track | (typeof fallbackShowcaseTracks)[number]) {
  const prompt = getTrackPrompt(track);
  const [firstChunk] = prompt.split(/[,.]/);
  return firstChunk.trim().slice(0, 42) || "Featured Track";
}

function getTrackModel(track: Track | (typeof fallbackShowcaseTracks)[number]) {
  if ("generation_model" in track && track.generation_model) {
    return generationModelLabel(track.generation_model);
  }

  return "Project Echo Showcase";
}

function getTrackAttribution(track: Track | (typeof fallbackShowcaseTracks)[number]) {
  if (
    "cover_photographer_name" in track &&
    track.cover_photographer_name &&
    track.cover_photographer_url &&
    track.cover_unsplash_url
  ) {
    return {
      photographerName: track.cover_photographer_name,
      photographerUrl: track.cover_photographer_url,
      unsplashUrl: track.cover_unsplash_url
    };
  }

  return null;
}

export function MusicLanding({ initialTracks }: { initialTracks: Track[] }) {
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_12%,rgba(52,211,153,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_50%_82%,rgba(251,113,133,0.1),transparent_34%)]" />
      <LandingHeader />
      <main className="min-h-[100dvh] px-4 pb-20 pt-24 sm:px-6 lg:px-10">
        <section className="mx-auto flex max-w-7xl flex-col items-center overflow-hidden">
          <SpatialCarousel tracks={initialTracks} />
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="mt-10 max-w-6xl text-center text-6xl font-black tracking-tighter text-white sm:text-7xl lg:text-8xl"
          >
            Your AI Music
            <br />
            Generation Toolkit
          </motion.h1>
          <p className="mt-6 max-w-2xl text-center text-base leading-7 text-zinc-400 sm:text-lg">
            Generate, save, play, and refine original instrumental tracks from a single prompt.
            Sign in to start building your private music library.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="rounded-full bg-emerald-300 px-6 font-black text-zinc-950 hover:bg-emerald-200">
              <Link href="/create">Start creating</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full border border-white/10 bg-white/10 px-6 text-white hover:bg-white/15">
              <Link href="/library">View library</Link>
            </Button>
          </div>
        </section>
      </main>
      <VoiceChatFab />
    </div>
  );
}

function LandingHeader() {
  const navItems = [
    { href: "/", label: "Feed" },
    { href: "/create", label: "Create" },
    { href: "/library", label: "Library" }
  ];

  return (
    <header className="fixed left-1/2 top-4 z-[90] w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 rounded-full border border-white/10 bg-zinc-950/70 px-4 py-3 shadow-[0_18px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link href="/" className="flex items-center">
          <span className="text-sm font-black tracking-tight text-white">
            Project Echo
          </span>
        </Link>

        <nav className="hidden justify-center gap-2 text-sm font-semibold text-zinc-400 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" className="hidden rounded-full text-zinc-300 hover:bg-white/10 hover:text-white sm:inline-flex">
            <Link href="/auth">Sign in</Link>
          </Button>
          <Button asChild className="rounded-full bg-emerald-300 px-5 font-black text-zinc-950 hover:bg-emerald-200">
            <Link href="/create">Generate</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function SpatialCarousel({ tracks }: { tracks: Track[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [localPlaying, setLocalPlaying] = useState(false);
  const { currentTrack, isPlaying, pauseTrack, resumeTrack, playTrack } = usePlayerStore();
  const playableTracks = useMemo(
    () => tracks.filter((track) => track.status === "succeeded" && Boolean(track.audio_url)),
    [tracks]
  );
  const showcaseTracks = playableTracks.length ? playableTracks : fallbackShowcaseTracks;
  const currentPlayableIndex = playableTracks.findIndex((track) => track.id === currentTrack?.id);
  const resolvedActiveIndex =
    currentPlayableIndex >= 0
      ? currentPlayableIndex
      : Math.min(activeIndex, Math.max(0, showcaseTracks.length - 1));
  const activeTrack = showcaseTracks[resolvedActiveIndex];
  const activePlayableTrack = playableTracks[resolvedActiveIndex] ?? null;
  const storeTrackActive = activePlayableTrack ? currentTrack?.id === activePlayableTrack.id : false;
  const playing = storeTrackActive ? isPlaying : localPlaying;

  useEffect(() => {
    if (currentPlayableIndex >= 0 && currentPlayableIndex !== activeIndex) {
      setActiveIndex(currentPlayableIndex);
      setLocalPlaying(false);
    }
  }, [activeIndex, currentPlayableIndex]);

  useEffect(() => {
    if (activeIndex > showcaseTracks.length - 1) {
      setActiveIndex(Math.max(0, showcaseTracks.length - 1));
    }
  }, [activeIndex, showcaseTracks.length]);

  function goToIndex(nextIndex: number) {
    const normalizedIndex = (nextIndex + showcaseTracks.length) % showcaseTracks.length;
    setActiveIndex(normalizedIndex);
    setLocalPlaying(false);

    const nextTrack = playableTracks[normalizedIndex];
    if (nextTrack) {
      playTrack(nextTrack, playableTracks);
      pauseTrack();
    }
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const intent = info.offset.x + info.velocity.x * 0.18;

    if (intent < -90) {
      goToIndex(resolvedActiveIndex + (Math.abs(info.velocity.x) > 900 ? 2 : 1));
      return;
    }

    if (intent > 90) {
      goToIndex(resolvedActiveIndex - (Math.abs(info.velocity.x) > 900 ? 2 : 1));
    }
  }

  function togglePlay() {
    if (!activePlayableTrack) {
      return;
    }

    if (playing) {
      pauseTrack();
      setLocalPlaying(false);
      return;
    }

    playTrack(activePlayableTrack, playableTracks);
    resumeTrack();
    setLocalPlaying(true);
  }

  return (
    <section className="relative flex w-full flex-col items-center">
      <div
        className="relative flex h-[500px] w-full items-center justify-center overflow-visible"
        style={{ perspective: "2000px", perspectiveOrigin: "center 40%" }}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.14}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <motion.div
            className="relative h-full w-full"
            style={{ transformStyle: "preserve-3d" }}
            transition={carouselTransition}
          >
            {showcaseTracks.map((track, index) => (
              <CarouselCard
                key={track.id}
                index={index}
                activeIndex={resolvedActiveIndex}
                trackCount={showcaseTracks.length}
                track={track}
                trackId={track.id}
                prompt={track.prompt}
                onClick={() => goToIndex(index)}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Previous track"
          onClick={() => goToIndex(resolvedActiveIndex - 1)}
          className="text-zinc-500 transition hover:text-white"
        >
          <SkipBack className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label={playing ? "Pause track" : "Play track"}
          onClick={togglePlay}
          disabled={!activePlayableTrack}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-zinc-950 shadow-xl shadow-black/30 ring-1 ring-white/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:bg-white/40"
        >
          {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7 fill-zinc-950" />}
        </button>
        <button
          type="button"
          aria-label="Next track"
          onClick={() => goToIndex(resolvedActiveIndex + 1)}
          className="text-zinc-500 transition hover:text-white"
        >
          <SkipForward className="h-6 w-6" />
        </button>
      </div>

      <div className="mt-8 flex justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={activeTrack.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-lg text-center text-lg font-medium tracking-tight text-zinc-400"
          >
            {activeTrack.prompt}
          </motion.p>
        </AnimatePresence>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
        className="mt-8 w-full max-w-5xl rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Featured Sound
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {getTrackTitle(activeTrack)}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              {getTrackPrompt(activeTrack)}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <FeatureChip
              icon={Music4}
              label="Source"
              value={getTrackModel(activeTrack)}
            />
            <FeatureChip
              icon={Disc3}
              label="Playback"
              value={activePlayableTrack ? "Live on landing page" : "Preview mode"}
            />
            <FeatureChip
              icon={Sparkles}
              label="Queue"
              value={`${playableTracks.length || showcaseTracks.length} tracks in rotation`}
            />
          </div>
        </div>
        {getTrackAttribution(activeTrack) ? (
          <p className="mt-4 text-xs text-zinc-500">
            Photo by{" "}
            <a
              href={getTrackAttribution(activeTrack)?.photographerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 transition hover:text-white"
            >
              {getTrackAttribution(activeTrack)?.photographerName}
            </a>{" "}
            on{" "}
            <a
              href={getTrackAttribution(activeTrack)?.unsplashUrl}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 transition hover:text-white"
            >
              Unsplash
            </a>
          </p>
        ) : null}
      </motion.div>
      {!playableTracks.length ? (
        <p className="mt-4 text-center text-sm text-zinc-500">
          No published tracks yet. Generate a few tracks to make the landing player live.
        </p>
      ) : null}
    </section>
  );
}

function CarouselCard({
  index,
  activeIndex,
  trackCount,
  track,
  trackId,
  prompt,
  onClick
}: {
  index: number;
  activeIndex: number;
  trackCount: number;
  track: Track | (typeof fallbackShowcaseTracks)[number];
  trackId: string;
  prompt: string;
  onClick: () => void;
}) {
  let relative = index - activeIndex;
  if (relative > trackCount / 2) {
    relative -= trackCount;
  }
  if (relative < -trackCount / 2) {
    relative += trackCount;
  }

  const styles = getCardStyles(relative);
  return (
    <motion.button
      type="button"
      aria-label="Select track"
      onClick={onClick}
      className="absolute h-[380px] w-[380px] cursor-pointer overflow-hidden rounded-[40px] bg-zinc-900 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.65)] outline-none ring-1 ring-white/10"
      initial={false}
      animate={{
        x: styles.x,
        y: styles.y,
        z: styles.z,
        rotateY: styles.rotateY,
        scale: styles.scale,
        opacity: styles.opacity
      }}
      transition={carouselTransition}
      style={{
        left: "calc(50% - 190px)",
        top: "calc(50% - 190px)",
        zIndex: styles.zIndex,
        transformStyle: "preserve-3d",
        pointerEvents: styles.opacity > 0 ? "auto" : "none"
      }}
    >
      <div
        aria-hidden="true"
        className="h-full w-full"
        style={
          "cover_image_url" in track
            ? getTrackArtworkStyle({
                id: trackId,
                cover_image_url: track.cover_image_url ?? null
              })
            : getTrackArtworkStyle({ id: trackId, cover_image_url: null })
        }
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_34%)] mix-blend-screen" />
      <div className="absolute inset-x-6 top-6 flex items-center justify-between">
        <span className="rounded-full border border-white/15 bg-zinc-950/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
          Project Echo
        </span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200 backdrop-blur-md">
          Live Preview
        </span>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.65),transparent_45%)]" />
      <div className="absolute inset-x-6 bottom-24 flex items-end gap-1 opacity-80">
        {[18, 28, 14, 34, 20, 26, 12, 30, 16, 24, 10, 22, 15, 32, 18, 27].map((height, index) => (
          <span
            key={`${trackId}-${index}`}
            className="w-full rounded-full bg-white/35"
            style={{ height }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6 text-left">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200/90">
          {getTrackTitle({ id: trackId, prompt } as Track)}
        </p>
        <p className="line-clamp-3 text-sm font-semibold text-white/90">{prompt}</p>
      </div>
    </motion.button>
  );
}

function FeatureChip({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/35 p-4 ring-1 ring-white/5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        <Icon className="h-4 w-4 text-emerald-300" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function getCardStyles(distance: number) {
  const absDist = Math.abs(distance);
  const sign = Math.sign(distance);

  if (absDist === 0) {
    return { x: 0, y: 0, z: 400, rotateY: 0, scale: 1.1, opacity: 1, zIndex: 50 };
  }
  if (absDist === 1) {
    return { x: sign * 380, y: 0, z: 100, rotateY: sign * -45, scale: 0.8, opacity: 0.9, zIndex: 40 };
  }
  if (absDist === 2) {
    return { x: sign * 650, y: 0, z: -150, rotateY: sign * -70, scale: 0.6, opacity: 0.6, zIndex: 30 };
  }
  if (absDist === 3) {
    return { x: sign * 850, y: 0, z: -400, rotateY: sign * -85, scale: 0.4, opacity: 0.3, zIndex: 20 };
  }

  return { x: sign * 900, y: 0, z: -500, rotateY: sign * -90, scale: 0, opacity: 0, zIndex: 10 };
}

function VoiceChatFab() {
  return (
    <Link
      href="/create"
      className="fixed bottom-6 right-6 z-[90] flex items-center gap-3 rounded-full border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm font-bold text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-zinc-900"
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full overflow-hidden">
        <motion.span
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 30% 20%, #34d399, transparent 35%), radial-gradient(circle at 70% 70%, #38bdf8, transparent 40%), #111827",
              "radial-gradient(circle at 70% 25%, #f472b6, transparent 35%), radial-gradient(circle at 30% 75%, #facc15, transparent 40%), #111827",
              "radial-gradient(circle at 30% 20%, #34d399, transparent 35%), radial-gradient(circle at 70% 70%, #38bdf8, transparent 40%), #111827"
            ]
          }}
          transition={{ duration: 3.4, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
        />
        <MessageCircle className="relative z-10 h-4 w-4 text-white" />
      </span>
      Create prompt
    </Link>
  );
}
