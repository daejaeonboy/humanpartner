import { supabase } from '../lib/supabase';

export interface FAQ {
    id?: string;
    category: string;
    question: string;
    answer: string;
    display_order: number;
    created_at?: string;
    updated_at?: string;
}

const TABLE_NAME = 'faqs';

export const getFAQs = async (): Promise<FAQ[]> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
};

export const addFAQ = async (faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([faq])
        .select()
        .single();

    if (error) throw error;
    return data.id;
};

export const updateFAQ = async (id: string, faq: Partial<FAQ>): Promise<void> => {
    const { error } = await supabase
        .from(TABLE_NAME)
        .update({
            ...faq,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw error;
};

export const deleteFAQ = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// ===== FAQ Categories =====

export interface FAQCategory {
    id?: string;
    name: string;
    display_order: number;
    created_at?: string;
}

const CATEGORY_TABLE = 'faq_categories';

export const getFAQCategories = async (): Promise<FAQCategory[]> => {
    const { data, error } = await supabase
        .from(CATEGORY_TABLE)
        .select('*')
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
};

export const addFAQCategory = async (category: Omit<FAQCategory, 'id' | 'created_at'>): Promise<string> => {
    const { data, error } = await supabase
        .from(CATEGORY_TABLE)
        .insert([category])
        .select()
        .single();

    if (error) throw error;
    return data.id;
};

export const updateFAQCategory = async (id: string, category: Partial<FAQCategory>): Promise<void> => {
    const { error } = await supabase
        .from(CATEGORY_TABLE)
        .update(category)
        .eq('id', id);

    if (error) throw error;
};

export const deleteFAQCategory = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from(CATEGORY_TABLE)
        .delete()
        .eq('id', id);

    if (error) throw error;
};
