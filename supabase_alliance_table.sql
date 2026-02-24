-- Create alliance_members table
CREATE TABLE IF NOT EXISTS public.alliance_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category1 TEXT,
    category2 TEXT,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Turn on RLS
ALTER TABLE public.alliance_members ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on alliance_members"
ON public.alliance_members
FOR SELECT
TO public
USING (true);

-- Allow authenticated users (admin) full access
CREATE POLICY "Allow authenticated users full access on alliance_members"
ON public.alliance_members
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
