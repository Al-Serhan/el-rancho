-- Add gold_coins column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gold_coins INTEGER DEFAULT 100;

-- Update RLS if necessary, but profiles are already viewable by everyone.
-- Ensure users can't update their own gold_coins directly via client-side API.
-- We'll handle gold updates via SECURITY DEFINER functions or server-side admin client.
