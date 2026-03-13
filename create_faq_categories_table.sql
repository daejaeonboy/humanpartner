-- FAQ 카테고리 관리 테이블
CREATE TABLE IF NOT EXISTS faq_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 카테고리 삽입
INSERT INTO faq_categories (name, display_order) VALUES
    ('자주 묻는 질문', 1),
    ('공통', 2),
    ('이용문의', 3),
    ('예약/결제', 4),
    ('취소/환불', 5),
    ('상품문의', 6),
    ('기타', 7)
ON CONFLICT (name) DO NOTHING;

-- RLS 정책
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faq_categories_read" ON faq_categories;
CREATE POLICY "faq_categories_read" ON faq_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "faq_categories_insert" ON faq_categories;
CREATE POLICY "faq_categories_insert" ON faq_categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "faq_categories_update" ON faq_categories;
CREATE POLICY "faq_categories_update" ON faq_categories FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "faq_categories_delete" ON faq_categories;
CREATE POLICY "faq_categories_delete" ON faq_categories FOR DELETE USING (true);
