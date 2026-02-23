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
