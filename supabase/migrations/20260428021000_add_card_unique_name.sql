-- Add unique constraint to card name for upserting
ALTER TABLE public.cards ADD CONSTRAINT cards_name_unique UNIQUE (name);
