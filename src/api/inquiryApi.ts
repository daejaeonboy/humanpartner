import { supabase } from '../lib/supabase';

export interface Inquiry {
    id?: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    company_name?: string;
    category?: string;
    title: string;
    content: string;
    status?: 'pending' | 'answered';
    answer?: string;
    created_at?: string;
    answered_at?: string;
}

const TABLE_NAME = 'inquiries';

// 내 문의 목록 조회
export const getMyInquiries = async (userId: string): Promise<Inquiry[]> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

// 문의 등록
export const addInquiry = async (inquiry: Omit<Inquiry, 'id' | 'created_at' | 'status' | 'answer' | 'answered_at'>): Promise<string> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([inquiry])
        .select()
        .single();

    if (error) throw error;
    return data.id;
};

// 모든 문의 조회 (관리자용)
export const getAllInquiries = async (): Promise<Inquiry[]> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

// 문의 답변 (관리자용)
export const answerInquiry = async (id: string, answer: string): Promise<void> => {
    const { error } = await supabase
        .from(TABLE_NAME)
        .update({
            answer,
            status: 'answered',
            answered_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw error;
};

// 문의 삭제
export const deleteInquiry = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

    if (error) throw error;
};
