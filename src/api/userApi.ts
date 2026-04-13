import { auth } from '../firebase';
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

const USER_PROFILE_SELECT = `
    id,
    firebase_uid,
    email,
    name,
    phone,
    company_name,
    department,
    position,
    address,
    business_number,
    business_license_url,
    member_type,
    manager_name,
    is_admin,
    is_approved,
    agreed_terms,
    agreed_privacy,
    agreed_marketing,
    created_at
`;
const USER_PROFILE_CACHE_TTL_MS = 60_000;
const userProfileCache = new Map<string, { data: UserProfile | null; cachedAt: number }>();
const userProfilePromiseCache = new Map<string, Promise<UserProfile | null>>();

const setCachedUserProfile = (firebaseUid: string, data: UserProfile | null) => {
    userProfileCache.set(firebaseUid, {
        data,
        cachedAt: Date.now(),
    });
};

const invalidateCachedUserProfile = (firebaseUid?: string) => {
    if (!firebaseUid) {
        userProfileCache.clear();
        userProfilePromiseCache.clear();
        return;
    }

    userProfileCache.delete(firebaseUid);
    userProfilePromiseCache.delete(firebaseUid);
};

// 사용자 프로필 생성
export const createUserProfile = async (profile: Omit<UserProfile, 'id' | 'created_at' | 'is_admin'>): Promise<UserProfile> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single();

    if (error) throw error;
    setCachedUserProfile(data.firebase_uid, data);
    return data;
};

// Firebase UID로 사용자 프로필 조회
export const getUserProfileByFirebaseUid = async (firebaseUid: string): Promise<UserProfile | null> => {
    const cached = userProfileCache.get(firebaseUid);
    if (cached && Date.now() - cached.cachedAt < USER_PROFILE_CACHE_TTL_MS) {
        return cached.data;
    }

    const pendingRequest = userProfilePromiseCache.get(firebaseUid);
    if (pendingRequest) {
        return pendingRequest;
    }

    const request = supabase
        .from('user_profiles')
        .select(USER_PROFILE_SELECT)
        .eq('firebase_uid', firebaseUid)
        .single()
        .then(({ data, error }) => {
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            setCachedUserProfile(firebaseUid, data || null);
            return data || null;
        })
        .finally(() => {
            userProfilePromiseCache.delete(firebaseUid);
        });

    userProfilePromiseCache.set(firebaseUid, request);
    return request;
};

// 모든 사용자 조회 (Admin용)
export const getUsers = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select(USER_PROFILE_SELECT)
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
    if (data.firebase_uid) {
        setCachedUserProfile(data.firebase_uid, data);
    }
    return data;
};

// 사용자 삭제
export const deleteUserProfile = async (id: string): Promise<void> => {
    invalidateCachedUserProfile();
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
        .select(USER_PROFILE_SELECT)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const getUsersPage = async (
    page: number,
    pageSize: number,
    query?: string,
): Promise<{ data: UserProfile[]; count: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let request = supabase
        .from('user_profiles')
        .select(USER_PROFILE_SELECT, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (query?.trim()) {
        request = request.or(`name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`);
    }

    const { data, error, count } = await request;

    if (error) throw error;
    return {
        data: data || [],
        count: count || 0,
    };
};

const isLocalhost = () =>
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const resolveUserApiBaseUrl = () => {
    const configuredUrl = import.meta.env.VITE_API_URL?.trim();
    if (configuredUrl) {
        return configuredUrl.replace(/\/$/, '');
    }

    return isLocalhost() ? 'http://localhost:4000' : '';
};

const API_BASE_URL = resolveUserApiBaseUrl();

const buildUserApiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

const getAuthorizedHeaders = async (includeContentType = true): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};

    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
        try {
            const idToken = await currentUser.getIdToken();
            headers.Authorization = `Bearer ${idToken}`;
        } catch (error) {
            console.warn('Failed to get Firebase ID token for user API request:', error);
        }
    }

    return headers;
};

// Firebase 이메일 변경 (서버 API 호출)
export const updateFirebaseEmail = async (firebaseUid: string, newEmail: string): Promise<void> => {
    const response = await fetch(buildUserApiUrl('/api/users/update-email'), {
        method: 'PUT',
        headers: await getAuthorizedHeaders(),
        body: JSON.stringify({ firebaseUid, newEmail })
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || '이메일 변경에 실패했습니다.');
    }
};

// Firebase 비밀번호 변경 (서버 API 호출)
export const updateFirebasePassword = async (firebaseUid: string, newPassword: string): Promise<void> => {
    const response = await fetch(buildUserApiUrl('/api/users/update-password'), {
        method: 'PUT',
        headers: await getAuthorizedHeaders(),
        body: JSON.stringify({ firebaseUid, newPassword })
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || '비밀번호 변경에 실패했습니다.');
    }
};

// 관리자 회원 삭제 (Firebase Auth + user_profiles)
export const deleteManagedUser = async (firebaseUid: string): Promise<void> => {
    const response = await fetch(buildUserApiUrl(`/api/users/${firebaseUid}`), {
        method: 'DELETE',
        headers: await getAuthorizedHeaders(false),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || '회원 삭제에 실패했습니다.');
    }
};
