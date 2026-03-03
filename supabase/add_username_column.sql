-- Migration: Add username column to profiles table
-- Fixes: onboarding-flow.tsx writes username but column didn't exist → 400 error

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx
    ON public.profiles(username)
    WHERE username IS NOT NULL;
