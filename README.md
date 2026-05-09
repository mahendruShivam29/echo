# Project Echo

Premium AI music generation app built with Next.js 14, Supabase, Replicate ACE-Step 1.5 + MusicGen, Unsplash-backed cover art, Zustand, Framer Motion, and Wavesurfer.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in the values.

During local webhook testing, `NEXT_PUBLIC_SITE_URL` must be a public tunnel URL from ngrok or localtunnel so Replicate can reach `/api/webhook`.

Set `UNSPLASH_ACCESS_KEY` to enable prompt-matched cover photos. The integration uses server-side Unsplash search, hotlinked images, and UI attribution.

3. Run `database/schema.sql` in the Supabase SQL editor.

The `tracks` storage bucket is public for reads only. Client insert policies are intentionally omitted; `/api/webhook` uploads generated audio with the Supabase service role key.

4. Start the app:

```bash
npm run dev
```

## Verification

Current local checks:

```bash
npm run typecheck
npm run lint
npm run build
```

The production build was verified with placeholder environment values. Real generation requires valid Supabase and Replicate credentials. Unsplash integration requires a valid access key.
