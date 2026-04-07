-- 설치사례 테이블
CREATE TABLE IF NOT EXISTS installation_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT DEFAULT '일반',
    title TEXT NOT NULL,
    summary TEXT DEFAULT '',
    content TEXT DEFAULT '',
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS installation_cases_active_order_idx
    ON installation_cases (is_active, display_order, published_at DESC);

CREATE INDEX IF NOT EXISTS installation_cases_category_idx
    ON installation_cases (category);

ALTER TABLE installation_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "installation_cases_read" ON installation_cases;
CREATE POLICY "installation_cases_read" ON installation_cases FOR SELECT USING (true);

DROP POLICY IF EXISTS "installation_cases_insert" ON installation_cases;
CREATE POLICY "installation_cases_insert" ON installation_cases FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "installation_cases_update" ON installation_cases;
CREATE POLICY "installation_cases_update" ON installation_cases FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "installation_cases_delete" ON installation_cases;
CREATE POLICY "installation_cases_delete" ON installation_cases FOR DELETE USING (true);

-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT DEFAULT '일반',
    title TEXT NOT NULL,
    summary TEXT DEFAULT '',
    content TEXT DEFAULT '',
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notices_active_order_idx
    ON notices (is_active, display_order, published_at DESC);

CREATE INDEX IF NOT EXISTS notices_category_idx
    ON notices (category);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notices_read" ON notices;
CREATE POLICY "notices_read" ON notices FOR SELECT USING (true);

DROP POLICY IF EXISTS "notices_insert" ON notices;
CREATE POLICY "notices_insert" ON notices FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "notices_update" ON notices;
CREATE POLICY "notices_update" ON notices FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notices_delete" ON notices;
CREATE POLICY "notices_delete" ON notices FOR DELETE USING (true);
