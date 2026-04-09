
import { supabase } from '../lib/supabase';

const QUICK_MENU_SELECT = 'id,name,icon,image_url,link,category,display_order,is_active,created_at';
const TAB_MENU_SELECT = 'id,name,link,display_order,is_active,created_at';
const NAV_MENU_SELECT = 'id,name,link,category,display_order,is_active,created_at';
const BANNER_SELECT = 'id,title,subtitle,image_url,link,button_text,brand_text,banner_type,tab_id,display_order,is_active,created_at,target_product_code';
const POPUP_SELECT = 'id,title,image_url,link,start_date,end_date,display_order,is_active,created_at,target_product_code';
const ALLIANCE_CATEGORY_SELECT = 'id,name,display_order,is_active,created_at';
const ALLIANCE_MEMBER_SELECT = 'id,name,category1,category2,address,phone,logo_url,content,display_order,is_active,created_at';
const ALLIANCE_MEMBER_LEGACY_SELECT = 'id,name,category1,category2,address,phone,logo_url,display_order,is_active,created_at';

interface SupabaseErrorShape {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
}

const isMissingColumnError = (error: unknown, columnName: string) => {
    const candidate = error as SupabaseErrorShape | null;
    const message = [candidate?.message, candidate?.details, candidate?.hint].filter(Boolean).join(' ').toLowerCase();
    return (
        candidate?.code === '42703' ||
        (message.includes(columnName.toLowerCase()) && (message.includes('column') || message.includes('schema cache')))
    );
};

const removeAllianceContentField = <T extends { content?: string | null }>(payload: T) => {
    const legacyPayload = { ...payload };
    delete (legacyPayload as { content?: string | null }).content;
    return legacyPayload;
};

const hasAllianceContent = (payload: { content?: string | null }) => Boolean(payload.content?.trim());

// ==================== Quick Menu Items ====================
export interface QuickMenuItem {
    id?: string;
    name: string;
    icon: string; // Legacy: icon name for Lucide icons
    image_url?: string; // New: custom image/svg URL
    link: string;
    category?: string; // 연결할 상품 카테고리
    display_order: number;
    is_active: boolean;
    created_at?: string;
}

export const getQuickMenuItems = async (): Promise<QuickMenuItem[]> => {
    const { data, error } = await supabase
        .from('quick_menu_items')
        .select(QUICK_MENU_SELECT)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getAllQuickMenuItems = async (): Promise<QuickMenuItem[]> => {
    const { data, error } = await supabase
        .from('quick_menu_items')
        .select(QUICK_MENU_SELECT)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const addQuickMenuItem = async (item: Omit<QuickMenuItem, 'id' | 'created_at'>): Promise<QuickMenuItem> => {
    const { data, error } = await supabase
        .from('quick_menu_items')
        .insert([item])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateQuickMenuItem = async (id: string, updates: Partial<QuickMenuItem>): Promise<QuickMenuItem> => {
    const { data, error } = await supabase
        .from('quick_menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteQuickMenuItem = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('quick_menu_items')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// ==================== Tab Menu Items ====================
export interface TabMenuItem {
    id?: string;
    name: string;
    link: string;
    display_order: number;
    is_active: boolean;
    created_at?: string;
}

export const getTabMenuItems = async (): Promise<TabMenuItem[]> => {
    const { data, error } = await supabase
        .from('tab_menu_items')
        .select(TAB_MENU_SELECT)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getAllTabMenuItems = async (): Promise<TabMenuItem[]> => {
    const { data, error } = await supabase
        .from('tab_menu_items')
        .select(TAB_MENU_SELECT)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const addTabMenuItem = async (item: Omit<TabMenuItem, 'id' | 'created_at'>): Promise<TabMenuItem> => {
    const { data, error } = await supabase
        .from('tab_menu_items')
        .insert([item])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateTabMenuItem = async (id: string, updates: Partial<TabMenuItem>): Promise<TabMenuItem> => {
    const { data, error } = await supabase
        .from('tab_menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteTabMenuItem = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('tab_menu_items')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// ==================== Navigation Menu Items (Header) ====================
export interface NavMenuItem {
    id?: string;
    name: string;
    link: string;
    category?: string; // 연결할 상품 카테고리
    display_order: number;
    is_active: boolean;
    created_at?: string;
}

export const getNavMenuItems = async (): Promise<NavMenuItem[]> => {
    const { data, error } = await supabase
        .from('nav_menu_items')
        .select(NAV_MENU_SELECT)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getAllNavMenuItems = async (): Promise<NavMenuItem[]> => {
    const { data, error } = await supabase
        .from('nav_menu_items')
        .select(NAV_MENU_SELECT)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const addNavMenuItem = async (item: Omit<NavMenuItem, 'id' | 'created_at'>): Promise<NavMenuItem> => {
    const { data, error } = await supabase
        .from('nav_menu_items')
        .insert([item])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateNavMenuItem = async (id: string, updates: Partial<NavMenuItem>): Promise<NavMenuItem> => {
    const { data, error } = await supabase
        .from('nav_menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteNavMenuItem = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('nav_menu_items')
        .delete()
        .eq('id', id);
    if (error) throw error;
};
// ==================== Banners ====================
export interface Banner {
    id?: string;
    title: string;
    subtitle: string;
    image_url: string;
    link: string;
    button_text: string;
    brand_text?: string; // For hero banners: small text above title (e.g., "Human Partner Mice")
    banner_type: 'hero' | 'promo'; // 'hero' for main slider, 'promo' for tab section
    tab_id?: string; // For promo banners: which tab this banner belongs to
    display_order: number;
    is_active: boolean;
    created_at?: string;
    target_product_code?: string; // New: Link to product by code
}

export const getBanners = async (): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('banners')
        .select(BANNER_SELECT)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getHeroBanners = async (): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('banners')
        .select(BANNER_SELECT)
        .eq('is_active', true)
        .eq('banner_type', 'hero')
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getPromoBanners = async (): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('banners')
        .select(BANNER_SELECT)
        .eq('is_active', true)
        .eq('banner_type', 'promo')
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getPromoBannersByTab = async (tabId: string): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('banners')
        .select(BANNER_SELECT)
        .eq('is_active', true)
        .eq('banner_type', 'promo')
        .eq('tab_id', tabId)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getAllBanners = async (): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('banners')
        .select(BANNER_SELECT)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const addBanner = async (banner: Omit<Banner, 'id' | 'created_at'>): Promise<Banner> => {
    const { data, error } = await supabase
        .from('banners')
        .insert([banner])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateBanner = async (id: string, updates: Partial<Banner>): Promise<Banner> => {
    const { data, error } = await supabase
        .from('banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteBanner = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// ==================== Popups ====================
export interface Popup {
    id?: string;
    title: string;
    image_url: string;
    link: string;
    start_date?: string; // ISO Date String
    end_date?: string; // ISO Date String
    display_order: number;
    is_active: boolean;
    created_at?: string;
    target_product_code?: string;
}

export const getPopups = async (): Promise<Popup[]> => {
    const { data, error } = await supabase
        .from('popups')
        .select(POPUP_SELECT)
        .eq('is_active', true)
        // Filter by date range if fields exist
        // This logic handles nulls appropriately or assumes data is clean.
        // For simplicity in client-side filtering often, but Supabase query is better.
        // .lte('start_date', now) 
        // .gte('end_date', now)
        // Let's rely on client side date filtering or exact query if needed.
        // For now, just active status and order.
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getAllPopups = async (): Promise<Popup[]> => {
    const { data, error } = await supabase
        .from('popups')
        .select(POPUP_SELECT)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const addPopup = async (popup: Omit<Popup, 'id' | 'created_at'>): Promise<Popup> => {
    const { data, error } = await supabase
        .from('popups')
        .insert([popup])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updatePopup = async (id: string, updates: Partial<Popup>): Promise<Popup> => {
    const { data, error } = await supabase
        .from('popups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deletePopup = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// ==================== Alliance Categories ====================
export interface AllianceCategory {
    id?: string;
    name: string;
    display_order: number;
    is_active: boolean;
    created_at?: string;
}

const ALLIANCE_CATEGORY_TABLE = 'alliance_categories';

export const DEFAULT_ALLIANCE_CATEGORY_NAMES = [
    'MICE 시설분과',
    'MICE 기획 · 운영분과',
    'MICE 지원분과',
] as const;

export const normalizeAllianceCategoryName = (category?: string | null) => {
    const normalized = category?.trim() || '';
    if (normalized === 'MICE 기획분과') return 'MICE 기획 · 운영분과';
    if (normalized === '기타') return 'MICE 지원분과';
    return normalized;
};

const getAllianceCategoryOrderWeight = (name: string) => {
    const defaultIndex = DEFAULT_ALLIANCE_CATEGORY_NAMES.indexOf(name as typeof DEFAULT_ALLIANCE_CATEGORY_NAMES[number]);
    return defaultIndex === -1 ? Number.MAX_SAFE_INTEGER : defaultIndex;
};

export const getAllianceCategories = async (): Promise<AllianceCategory[]> => {
    const { data, error } = await supabase
        .from(ALLIANCE_CATEGORY_TABLE)
        .select(ALLIANCE_CATEGORY_SELECT)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getAllAllianceCategories = async (): Promise<AllianceCategory[]> => {
    const { data, error } = await supabase
        .from(ALLIANCE_CATEGORY_TABLE)
        .select(ALLIANCE_CATEGORY_SELECT)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const addAllianceCategory = async (category: Omit<AllianceCategory, 'id' | 'created_at'>): Promise<AllianceCategory> => {
    const payload = {
        ...category,
        name: normalizeAllianceCategoryName(category.name),
    };

    const { data, error } = await supabase
        .from(ALLIANCE_CATEGORY_TABLE)
        .insert([payload])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateAllianceCategory = async (id: string, updates: Partial<AllianceCategory>): Promise<AllianceCategory> => {
    const payload = {
        ...updates,
        ...(typeof updates.name === 'string' ? { name: normalizeAllianceCategoryName(updates.name) } : {}),
    };

    const { data, error } = await supabase
        .from(ALLIANCE_CATEGORY_TABLE)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteAllianceCategory = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from(ALLIANCE_CATEGORY_TABLE)
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// ==================== Alliance Members ====================
export interface AllianceMember {
    id?: string;
    name: string;
    category1: string;
    category2: string;
    address: string;
    phone: string;
    logo_url: string;
    content?: string;
    display_order: number;
    is_active: boolean;
    created_at?: string;
}

export interface AllianceMemberCategoryEntry {
    category1?: string | null;
}

const getAllianceCategoryFilterValues = (category?: string) => {
    const normalizedCategory = normalizeAllianceCategoryName(category);
    if (!normalizedCategory) return [];
    if (normalizedCategory === 'MICE 기획 · 운영분과') return ['MICE 기획 · 운영분과', 'MICE 기획분과'];
    if (normalizedCategory === 'MICE 지원분과') return ['MICE 지원분과', '기타'];
    return [normalizedCategory];
};

export const getAllianceCategoryNames = (
    categories: Pick<AllianceCategory, 'name' | 'display_order' | 'is_active'>[] = [],
    members: Array<{ category1?: string | null }> = []
) => {
    const memberCategoryNames = Array.from(
        new Set(
            members
                .map((member) => normalizeAllianceCategoryName(member.category1))
                .filter(Boolean)
        )
    );

    const tableCategoryNames = categories
        .filter((category) => category.is_active !== false)
        .map((category) => ({
            name: normalizeAllianceCategoryName(category.name),
            display_order: category.display_order ?? 0,
        }))
        .filter((category) => Boolean(category.name))
        .sort((a, b) =>
            a.display_order - b.display_order ||
            getAllianceCategoryOrderWeight(a.name) - getAllianceCategoryOrderWeight(b.name) ||
            a.name.localeCompare(b.name, 'ko-KR')
        )
        .map((category) => category.name);

    if (tableCategoryNames.length === 0) {
        const orderedDefaults = DEFAULT_ALLIANCE_CATEGORY_NAMES.filter((category) =>
            memberCategoryNames.includes(category)
        );
        const extraCategories = memberCategoryNames.filter(
            (category) => !DEFAULT_ALLIANCE_CATEGORY_NAMES.includes(category as typeof DEFAULT_ALLIANCE_CATEGORY_NAMES[number])
        );

        return [...orderedDefaults, ...extraCategories];
    }

    const extraCategories = memberCategoryNames.filter((category) => !tableCategoryNames.includes(category));
    return [...tableCategoryNames, ...extraCategories];
};

export const getAllianceMembers = async (): Promise<AllianceMember[]> => {
    const buildRequest = (selectColumns: string) =>
        supabase
            .from('alliance_members')
            .select(selectColumns)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

    const { data, error } = await buildRequest(ALLIANCE_MEMBER_SELECT);
    if (error && isMissingColumnError(error, 'content')) {
        const fallbackResponse = await buildRequest(ALLIANCE_MEMBER_LEGACY_SELECT);
        if (fallbackResponse.error) throw fallbackResponse.error;
        return (fallbackResponse.data || []).map((item) => ({ ...item, content: undefined }));
    }

    if (error) throw error;
    return data || [];
};

export const getAllianceMemberCategories = async (): Promise<AllianceMemberCategoryEntry[]> => {
    const { data, error } = await supabase
        .from('alliance_members')
        .select('category1')
        .eq('is_active', true);
    if (error) throw error;
    return data || [];
};

export const getAllianceMembersPage = async ({
    page,
    pageSize,
    category,
    searchTerm,
}: {
    page: number;
    pageSize: number;
    category?: string;
    searchTerm?: string;
}): Promise<{ data: AllianceMember[]; count: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const categoryValues = getAllianceCategoryFilterValues(category);

    const buildRequest = (selectColumns: string) =>
        supabase
            .from('alliance_members')
            .select(selectColumns, { count: 'exact' })
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .range(from, to);

    let request = buildRequest(ALLIANCE_MEMBER_SELECT);

    if (categoryValues.length === 1) {
        request = request.eq('category1', categoryValues[0]);
    } else if (categoryValues.length > 1) {
        request = request.in('category1', categoryValues);
    }

    const normalizedSearch = searchTerm?.trim();
    if (normalizedSearch) {
        request = request.ilike('name', `%${normalizedSearch}%`);
    }

    const { data, error, count } = await request;
    if (error && isMissingColumnError(error, 'content')) {
        let fallbackRequest = buildRequest(ALLIANCE_MEMBER_LEGACY_SELECT);

        if (categoryValues.length === 1) {
            fallbackRequest = fallbackRequest.eq('category1', categoryValues[0]);
        } else if (categoryValues.length > 1) {
            fallbackRequest = fallbackRequest.in('category1', categoryValues);
        }

        if (normalizedSearch) {
            fallbackRequest = fallbackRequest.ilike('name', `%${normalizedSearch}%`);
        }

        const fallbackResponse = await fallbackRequest;
        if (fallbackResponse.error) throw fallbackResponse.error;

        return {
            data: (fallbackResponse.data || []).map((item) => ({ ...item, content: undefined })),
            count: fallbackResponse.count || 0,
        };
    }

    if (error) throw error;
    return {
        data: data || [],
        count: count || 0,
    };
};

export const getAllAllianceMembers = async (): Promise<AllianceMember[]> => {
    const buildRequest = (selectColumns: string) =>
        supabase
            .from('alliance_members')
            .select(selectColumns)
            .order('display_order', { ascending: true });

    const { data, error } = await buildRequest(ALLIANCE_MEMBER_SELECT);
    if (error && isMissingColumnError(error, 'content')) {
        const fallbackResponse = await buildRequest(ALLIANCE_MEMBER_LEGACY_SELECT);
        if (fallbackResponse.error) throw fallbackResponse.error;
        return (fallbackResponse.data || []).map((item) => ({ ...item, content: undefined }));
    }

    if (error) throw error;
    return data || [];
};

export const getAllianceMemberById = async (id: string): Promise<AllianceMember | null> => {
    const buildRequest = (selectColumns: string) =>
        supabase
            .from('alliance_members')
            .select(selectColumns)
            .eq('id', id)
            .eq('is_active', true)
            .maybeSingle();

    const { data, error } = await buildRequest(ALLIANCE_MEMBER_SELECT);
    if (error && isMissingColumnError(error, 'content')) {
        const fallbackResponse = await buildRequest(ALLIANCE_MEMBER_LEGACY_SELECT);
        if (fallbackResponse.error) throw fallbackResponse.error;
        return fallbackResponse.data ? { ...fallbackResponse.data, content: undefined } : null;
    }

    if (error) throw error;
    return data;
};

export const addAllianceMember = async (member: Omit<AllianceMember, 'id' | 'created_at'>): Promise<AllianceMember> => {
    const { data, error } = await supabase
        .from('alliance_members')
        .insert([member])
        .select()
        .single();
    if (error && isMissingColumnError(error, 'content')) {
        if (hasAllianceContent(member)) {
            throw new Error('회원사 본문을 저장하려면 `add_alliance_member_content.sql`을 먼저 실행해주세요.');
        }

        const fallbackResponse = await supabase
            .from('alliance_members')
            .insert([removeAllianceContentField(member)])
            .select()
            .single();

        if (fallbackResponse.error) throw fallbackResponse.error;
        return { ...fallbackResponse.data, content: undefined };
    }

    if (error) throw error;
    return data;
};

export const updateAllianceMember = async (id: string, updates: Partial<AllianceMember>): Promise<AllianceMember> => {
    const { data, error } = await supabase
        .from('alliance_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error && isMissingColumnError(error, 'content')) {
        if (hasAllianceContent(updates)) {
            throw new Error('회원사 본문을 저장하려면 `add_alliance_member_content.sql`을 먼저 실행해주세요.');
        }

        const fallbackResponse = await supabase
            .from('alliance_members')
            .update(removeAllianceContentField(updates))
            .eq('id', id)
            .select()
            .single();

        if (fallbackResponse.error) throw fallbackResponse.error;
        return { ...fallbackResponse.data, content: undefined };
    }

    if (error) throw error;
    return data;
};

export const deleteAllianceMember = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('alliance_members')
        .delete()
        .eq('id', id);
    if (error) throw error;
};
