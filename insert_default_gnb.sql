-- 기본 GNB 메뉴 데이터 추가 (회사소개, MICE 회원사, EVENT, BLANK)
INSERT INTO public.gnb_menu_items (name, link, display_order, is_active)
VALUES 
    ('회사소개', '/company', 1, true),
    ('MICE 회원사', '/alliance', 2, true),
    ('EVENT', '/event', 3, true),
    ('BLANK', '/blank', 4, true);
