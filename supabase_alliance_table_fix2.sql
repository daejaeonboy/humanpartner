-- Drop existing policies if they exist to prevent errors
DROP POLICY IF EXISTS "Allow public read access on alliance_members" ON public.alliance_members;
DROP POLICY IF EXISTS "Allow authenticated users full access on alliance_members" ON public.alliance_members;
DROP POLICY IF EXISTS "Allow public insert access on alliance_members" ON public.alliance_members;
DROP POLICY IF EXISTS "Allow public update access on alliance_members" ON public.alliance_members;
DROP POLICY IF EXISTS "Allow public delete access on alliance_members" ON public.alliance_members;

-- Allow public read access
CREATE POLICY "Allow public read access on alliance_members"
ON public.alliance_members
FOR SELECT
TO public
USING (true);

-- Allow public insert access (since the CMS might be used without strict auth in this demo environment)
CREATE POLICY "Allow public insert access on alliance_members"
ON public.alliance_members
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Allow public update access on alliance_members"
ON public.alliance_members
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow public delete access
CREATE POLICY "Allow public delete access on alliance_members"
ON public.alliance_members
FOR DELETE
TO public
USING (true);
