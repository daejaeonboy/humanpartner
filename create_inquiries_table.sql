-- 1:1 문의 테이블
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    company_name TEXT,
    category TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE
);

-- RLS 정책
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiries_read" ON inquiries;
CREATE POLICY "inquiries_read" ON inquiries FOR SELECT USING (true);

DROP POLICY IF EXISTS "inquiries_insert" ON inquiries;
CREATE POLICY "inquiries_insert" ON inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "inquiries_update" ON inquiries;
CREATE POLICY "inquiries_update" ON inquiries FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "inquiries_delete" ON inquiries;
CREATE POLICY "inquiries_delete" ON inquiries FOR DELETE USING (true);
