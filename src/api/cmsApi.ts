
import { supabase } from '../lib/supabase';

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
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getAllQuickMenuItems = async (): Promise<QuickMenuItem[]> => {
    const { data, error } = await supabase
        .from('quick_menu_items')
        .select('*')
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
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getAllTabMenuItems = async (): Promise<TabMenuItem[]> => {
    const { data, error } = await supabase
        .from('tab_menu_items')
        .select('*')
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
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getAllNavMenuItems = async (): Promise<NavMenuItem[]> => {
    const { data, error } = await supabase
        .from('nav_menu_items')
        .select('*')
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
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getHeroBanners = async (): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .eq('banner_type', 'hero')
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getPromoBanners = async (): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .eq('banner_type', 'promo')
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const getPromoBannersByTab = async (tabId: string): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('banners')
        .select('*')
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
        .select('*')
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
}

export const getPopups = async (): Promise<Popup[]> => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('popups')
        .select('*')
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
        .select('*')
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
