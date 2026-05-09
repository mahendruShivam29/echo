# Project Echo

Premium AI music generation app built with Next.js 14, Supabase, Replicate ACE-Step 1.5 + MusicGen, Zustand, Framer Motion, and Wavesurfer.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in the values.

During local webhook testing, `NEXT_PUBLIC_SITE_URL` must be a public tunnel URL from ngrok or localtunnel so Replicate can reach `/api/webhook`.

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

The production build was verified with placeholder environment values. Real generation requires valid Supabase and Replicate credentials.
