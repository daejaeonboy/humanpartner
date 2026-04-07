-- 설치사례/공지사항 카테고리 관리용 테이블 및 설치사례 category 컬럼 추가

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'installation_cases'
    ) THEN
        RAISE EXCEPTION 'public.installation_cases table does not exist. Run create_installation_cases_and_notices_tables.sql first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'installation_cases'
          AND column_name = 'category'
    ) THEN
        EXECUTE 'ALTER TABLE public.installation_cases ADD COLUMN category TEXT DEFAULT ''일반''';
    END IF;

    EXECUTE $sql$
        UPDATE public.installation_cases
        SET category = '일반'
        WHERE TRIM(COALESCE(category, '')) = ''
    $sql$;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'installation_cases_category_idx'
    ) THEN
        EXECUTE 'CREATE INDEX installation_cases_category_idx ON public.installation_cases (category)';
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'notices'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notices'
          AND column_name = 'category'
    ) THEN
        EXECUTE 'ALTER TABLE public.notices ADD COLUMN category TEXT DEFAULT ''일반''';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notices'
          AND column_name = 'category'
    ) THEN
        EXECUTE $sql$
            UPDATE public.notices
            SET category = '일반'
            WHERE TRIM(COALESCE(category, '')) = ''
        $sql$;
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.installation_case_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.installation_case_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "installation_case_categories_read" ON public.installation_case_categories;
DROP POLICY IF EXISTS "installation_case_categories_insert" ON public.installation_case_categories;
DROP POLICY IF EXISTS "installation_case_categories_update" ON public.installation_case_categories;
DROP POLICY IF EXISTS "installation_case_categories_delete" ON public.installation_case_categories;

CREATE POLICY "installation_case_categories_read"
ON public.installation_case_categories
FOR SELECT
USING (true);

CREATE POLICY "installation_case_categories_insert"
ON public.installation_case_categories
FOR INSERT
WITH CHECK (true);

CREATE POLICY "installation_case_categories_update"
ON public.installation_case_categories
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "installation_case_categories_delete"
ON public.installation_case_categories
FOR DELETE
USING (true);

CREATE TABLE IF NOT EXISTS public.notice_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notice_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notice_categories_read" ON public.notice_categories;
DROP POLICY IF EXISTS "notice_categories_insert" ON public.notice_categories;
DROP POLICY IF EXISTS "notice_categories_update" ON public.notice_categories;
DROP POLICY IF EXISTS "notice_categories_delete" ON public.notice_categories;

CREATE POLICY "notice_categories_read"
ON public.notice_categories
FOR SELECT
USING (true);

CREATE POLICY "notice_categories_insert"
ON public.notice_categories
FOR INSERT
WITH CHECK (true);

CREATE POLICY "notice_categories_update"
ON public.notice_categories
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "notice_categories_delete"
ON public.notice_categories
FOR DELETE
USING (true);

DO $$
BEGIN
    EXECUTE $sql$
        INSERT INTO public.installation_case_categories (name, display_order, is_active)
        SELECT category_name, ROW_NUMBER() OVER (ORDER BY category_name), true
        FROM (
            SELECT DISTINCT TRIM(category) AS category_name
            FROM public.installation_cases
            WHERE TRIM(COALESCE(category, '')) <> ''
        ) categories
        ON CONFLICT (name) DO NOTHING
    $sql$;
END
$$;

INSERT INTO public.installation_case_categories (name, display_order, is_active)
VALUES ('일반', 1, true)
ON CONFLICT (name) DO NOTHING;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notices'
          AND column_name = 'category'
    ) THEN
        EXECUTE $sql$
            INSERT INTO public.notice_categories (name, display_order, is_active)
            SELECT category_name, ROW_NUMBER() OVER (ORDER BY category_name), true
            FROM (
                SELECT DISTINCT TRIM(category) AS category_name
                FROM public.notices
                WHERE TRIM(COALESCE(category, '')) <> ''
            ) categories
            ON CONFLICT (name) DO NOTHING
        $sql$;
    END IF;
END
$$;

INSERT INTO public.notice_categories (name, display_order, is_active)
VALUES ('일반', 1, true)
ON CONFLICT (name) DO NOTHING;

COMMIT;
