-- Create GNB Menu Items Table
CREATE TABLE IF NOT EXISTS public.gnb_menu_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    link text NOT NULL,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup RLS
ALTER TABLE public.gnb_menu_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on gnb_menu_items"
    ON public.gnb_menu_items FOR SELECT
    USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert on gnb_menu_items"
    ON public.gnb_menu_items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update on gnb_menu_items"
    ON public.gnb_menu_items FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete on gnb_menu_items"
    ON public.gnb_menu_items FOR DELETE
    USING (auth.role() = 'authenticated');
