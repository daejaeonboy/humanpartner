import { supabase } from '../lib/supabase';

export interface Category {
    id?: string;
    name: string;
    display_order: number;
    parent_id?: string | null;  // 부모 카테고리 ID (null이면 최상위)
    level?: number;             // 1: 대분류, 2: 중분류, 3: 소분류
    created_at?: string;
}

// 계층 구조로 정리된 카테고리 타입
export interface CategoryTree extends Category {
    children?: CategoryTree[];
}

// 모든 카테고리 조회
export const getCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
};

// 레벨별 카테고리 조회
export const getCategoriesByLevel = async (level: number): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('level', level)
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
};

// 부모 ID로 자식 카테고리 조회
export const getCategoriesByParent = async (parentId: string | null): Promise<Category[]> => {
    let query = supabase.from('categories').select('*');

    if (parentId === null) {
        query = query.is('parent_id', null);
    } else {
        query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query.order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
};

// 카테고리를 트리 구조로 변환
export const buildCategoryTree = (categories: Category[]): CategoryTree[] => {
    const map = new Map<string, CategoryTree>();
    const roots: CategoryTree[] = [];

    // 먼저 모든 카테고리를 맵에 저장
    categories.forEach(cat => {
        map.set(cat.id!, { ...cat, children: [] });
    });

    // 부모-자식 관계 설정
    categories.forEach(cat => {
        const node = map.get(cat.id!);
        if (!node) return;

        if (cat.parent_id && map.has(cat.parent_id)) {
            const parent = map.get(cat.parent_id)!;
            parent.children = parent.children || [];
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
};

// 카테고리 추가
export const addCategory = async (category: Omit<Category, 'id' | 'created_at'>): Promise<Category> => {
    const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 카테고리 수정
export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 카테고리 삭제
export const deleteCategory = async (id: string): Promise<void> => {
    // 먼저 자식 카테고리가 있는지 확인
    const { data: children } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', id);

    if (children && children.length > 0) {
        throw new Error('하위 카테고리가 있는 경우 삭제할 수 없습니다.');
    }

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
