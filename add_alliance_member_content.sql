ALTER TABLE public.alliance_members
ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
