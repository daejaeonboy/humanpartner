import { supabase } from '../lib/supabase';

export interface UserProfile {
    id?: string;
    firebase_uid: string;
    email: string;
    name: string;
    phone: string;
    company_name: string;
    department?: string;
    position?: string;
    address?: string;
    business_number?: string;
    business_license_url?: string;
    member_type?: 'business' | 'public';
    manager_name?: string;
    is_admin?: boolean;
    is_approved?: boolean;
    agreed_terms: boolean;
    agreed_privacy: boolean;
    agreed_marketing?: boolean;
    created_at?: string;
}

// 사용자 프로필 생성
export const createUserProfile = async (profile: Omit<UserProfile, 'id' | 'created_at' | 'is_admin'>): Promise<UserProfile> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Firebase UID로 사용자 프로필 조회
export const getUserProfileByFirebaseUid = async (firebaseUid: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
};

// 모든 사용자 조회 (Admin용)
export const getUsers = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

// 사용자 프로필 수정
export const updateUserProfile = async (id: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 사용자 삭제
export const deleteUserProfile = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// 사용자 검색
export const searchUsers = async (query: string): Promise<UserProfile[]> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

// 서버 API 기본 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Firebase 이메일 변경 (서버 API 호출)
export const updateFirebaseEmail = async (firebaseUid: string, newEmail: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/users/update-email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid, newEmail })
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || '이메일 변경에 실패했습니다.');
    }
};

// Firebase 비밀번호 변경 (서버 API 호출)
export const updateFirebasePassword = async (firebaseUid: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/users/update-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid, newPassword })
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || '비밀번호 변경에 실패했습니다.');
    }
};
