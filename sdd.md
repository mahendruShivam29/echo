SOFTWARE DESIGN DOCUMENT (SDD)
Project Name: Project Echo (Premium AI Music Generator)
Target Executor: Autonomous Coding AI / Advanced LLM
Objective: Build a full-stack, production-ready AI instrumental music generation web application with an event-driven webhook architecture, user authentication, a persistent database, and an ultra-premium, animated, consumer-grade UI comparable to Spotify or Suno.com.

1. System Architecture & Tech Stack
The AI MUST strictly adhere to the following stack. Do not substitute libraries unless explicitly instructed.
Framework: Next.js 14+ (App Router, React 18+)
Language: TypeScript (Strict mode enabled)
Styling: Tailwind CSS + shadcn/ui (Lucide React for icons)
Animations: framer-motion
State Management: Zustand
Database, Auth, & Storage: Supabase (PostgreSQL) + Supabase Realtime
AI Provider: Replicate API (Strict Model Version: meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e31a5448a0d0f) Note: This model generates instrumental audio.
Audio Player: wavesurfer.js (for waveform visualization)
Deployment: Vercel

2. Environment Variables
The AI must configure the project to expect the following .env.local variables.
CRITICAL NOTE FOR LOCAL DEV: NEXT_PUBLIC_SITE_URL must be an Ngrok or Localtunnel URL during local development so Replicate can reach the local webhook endpoint.

```code
Env
NEXT_PUBLIC_SITE_URL=<your_production_or_ngrok_url>
NEXT_PUBLIC_SUPABASE_URL=<supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<supabase_service_role_key>
REPLICATE_API_TOKEN=<replicate_api_token>
```

3. Database Schema (Supabase PostgreSQL)
The AI must execute the following SQL to set up the database, Row Level Security (RLS), Storage (with CORS), and Auth Triggers.
CRITICAL SECURITY NOTE: Clients MUST NOT have insert access to the storage bucket. Only the backend Service Role will upload audio.

```code
SQL
-- Table: profiles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tracks
CREATE TABLE tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    audio_url TEXT, -- Nullable until generation completes
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'succeeded', 'failed')),
    replicate_job_id TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all tracks" ON tracks FOR SELECT USING (true);
CREATE POLICY "Users can insert own tracks" ON tracks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tracks" ON tracks FOR UPDATE USING (auth.uid() = user_id);

-- Insert CORS policy for the storage bucket so Wavesurfer.js can read the audio data
INSERT INTO storage.buckets (id, name, public, cors_rules)
VALUES (
    'tracks',
    'tracks',
    true,
    '[{
        "allowedOrigins":["*"],
        "allowedMethods":["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
        "allowedHeaders":["*"],
        "exposeHeaders":["*"],
        "maxAgeSeconds": 3600
    }]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET cors_rules = EXCLUDED.cors_rules;

-- STORAGE POLICIES
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'tracks');
-- NO INSERT POLICY FOR CLIENTS. The backend Service Role bypasses RLS to handle uploads securely.

-- Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

4. Application Routing (Next.js App Router)
The AI must implement the following route structure:
/(root): Public feed of recently generated tracks (status = 'succeeded').
/create: Protected route. Form to input text prompt and generate music.
/library: Protected route. Displays tracks where user_id matches the logged-in user.
/auth: Login/Signup page using Supabase Auth UI.
/api/generate: Next.js Route Handler to initiate the Replicate job and pass the webhook URL.
/api/webhook: Next.js Route Handler to receive Replicate POST requests, process audio, and update the DB.

5. Core Logic: Event-Driven Generation Flow (Webhooks + Realtime)
To prevent Vercel timeouts and Replicate rate limits, the AI MUST implement an event-driven architecture. Do not use polling.
Step 1: Server Action (/api/generate)
Validate user session.
Insert a new row into tracks table with status = 'processing'.
Call replicate.predictions.create() with the MusicGen model version.
CRITICAL: Pass a webhook URL to Replicate (${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook?trackId=${track.id}) and set webhook_events_filter: ["completed"].
Update the tracks row with the replicate_job_id.
Return the track.id to the client.

Step 2: Client Side (Supabase Realtime UI Updates)
Add a dummy track to the UI with a loading skeleton.
CRITICAL: Subscribe to Supabase Realtime for the specific track ID:

```supabase.channel('track-updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tracks', filter: 'id=eq.' + trackId }, (payload) => { /* Update UI state */ }).subscribe();
```

Unsubscribe from the channel in the useEffect cleanup function.

Step 3: Webhook Handler (/api/webhook)
Receive the POST request from Replicate. Extract trackId from the query params.
If the prediction status is succeeded:
Fetch the audio URL output as an ArrayBuffer.
Instantiate the Supabase client using the SUPABASE_SERVICE_ROLE_KEY (to bypass RLS).
Upload the ArrayBuffer to the tracks Supabase Storage bucket. Specify a unique file path (e.g., ${trackId}.wav) and explicitly set contentType: 'audio/wav'.
Update the tracks database row: set status = 'succeeded' and audio_url = <supabase_public_url>.
CRITICAL CACHE INVALIDATION: Call revalidatePath('/', 'layout') to ensure Next.js clears the router cache so the new track appears in the feed and library on next navigation.
If the prediction status is failed, update the DB status to failed.

6. UI/UX Specifications (Ultra-Premium Aesthetic)
The AI MUST build a premium, modern music streaming application with extreme attention to micro-interactions, fluidity, and depth.
Design Language & Advanced Styling (Tailwind):
Theme: Deep dark mode. Background must be bg-zinc-950 with a subtle, fixed SVG noise texture overlay (opacity 2%).
Viewport: Use min-h-[100dvh] (dynamic viewport height) globally to prevent mobile Safari address bar UI breaks.
Typography: Use next/font/google for 'Plus Jakarta Sans'. Apply antialiased globally.
Advanced Glassmorphism: Track cards and the Bottom Player must use bg-white/5 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl.
Deterministic Album Art: The AI MUST implement a utility function that takes the track.id (UUID) and generates a unique, vibrant CSS mesh gradient to serve as the track's album art.
Layout Structure & Persistence (CRITICAL):
Root Layout (layout.tsx): The <BottomPlayer> and <Sidebar> MUST be rendered in the root layout outside of the main <main> content area. Navigating between routes MUST NOT interrupt audio playback.
Mobile Navigation: On mobile (max-w-md), the sidebar must disappear and become a floating glassmorphic bottom navigation bar sitting exactly above the Bottom Global Player, utilizing pb-safe (iOS safe area padding).
The 60-Second "Wait State" (World-Class UX):
When a track is 'processing', render a skeleton card.
Visuals: The album art square must feature a Framer Motion infinite pulsing gradient.
Micro-interaction: Include a small animated equalizer icon next to an array of rotating loading strings ("Tuning the instruments...", "Warming up the synths...", "Mixing the track..."). The strings must crossfade using <AnimatePresence mode="wait">.
Fluid Animations (Framer Motion):
Custom Easing: The AI MUST NOT use default linear animations. Use premium easing curves: transition={{ duration: 0.4, ease:[0.32, 0.72, 0, 1] }}.
Page Transitions: Wrap the children inside a template.tsx file with <AnimatePresence mode="wait"> and <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>.

7. Global State & Audio Queue Management (CRITICAL)
A premium music app requires a robust queue system. The AI MUST implement a Zustand store (usePlayerStore) with the following specifications:
Zustand Store Interface:

```code
TypeScript
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
```
