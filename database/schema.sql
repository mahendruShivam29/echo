-- Project Echo Supabase schema
-- Run this in the Supabase SQL editor before using the app.

CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    generation_model TEXT DEFAULT 'ace-step-base' CHECK (generation_model IN ('ace-step-base', 'musicgen')),
    cover_image_url TEXT,
    cover_image_alt TEXT,
    cover_photographer_name TEXT,
    cover_photographer_url TEXT,
    cover_unsplash_url TEXT,
    audio_url TEXT,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'succeeded', 'failed')),
    replicate_job_id TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS generation_model TEXT DEFAULT 'ace-step-base';

ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS cover_image_alt TEXT;

ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS cover_photographer_name TEXT;

ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS cover_photographer_url TEXT;

ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS cover_unsplash_url TEXT;

ALTER TABLE tracks
DROP CONSTRAINT IF EXISTS tracks_generation_model_check;

ALTER TABLE tracks
ADD CONSTRAINT tracks_generation_model_check
CHECK (generation_model IN ('ace-step-base', 'musicgen'));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view own tracks" ON tracks;
CREATE POLICY "Users can view own tracks" ON tracks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tracks" ON tracks;
CREATE POLICY "Users can insert own tracks" ON tracks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tracks" ON tracks;
CREATE POLICY "Users can update own tracks" ON tracks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tracks" ON tracks;
CREATE POLICY "Users can delete own tracks" ON tracks FOR DELETE USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES (
    'tracks',
    'tracks',
    true
)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'tracks');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
