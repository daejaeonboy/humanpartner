import { supabase } from '../lib/supabase';

export interface Section {
    id?: string;
    name: string;
    display_order: number;
    is_active: boolean;
    created_at?: string;
    categories?: { id: string; name: string; }[];
    layout_mode?: string; // 'default' (4 cols), 'wide' (2 cols), etc.
}

export interface ProductSection {
    id?: string;
    product_id: string;
    section_id: string;
}

// 모든 섹션 조회
export const getSections = async (): Promise<Section[]> => {
    const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
};

// 활성화된 섹션만 조회
// 활성화된 섹션만 조회 (카테고리 정보 포함)
export const getActiveSections = async (): Promise<Section[]> => {
    const { data, error } = await supabase
        .from('sections')
        .select(`
            *,
            section_categories (
                categories (
                    id,
                    name
                )
            )
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) throw error;

    // Transform nested response to flat categories array
    return data?.map((section: any) => ({
        ...section,
        categories: section.section_categories?.map((sc: any) => sc.categories) || []
    })) || [];
};

// 섹션 추가
export const addSection = async (section: Omit<Section, 'id' | 'created_at'>): Promise<Section> => {
    const { data, error } = await supabase
        .from('sections')
        .insert([section])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 섹션 수정
export const updateSection = async (id: string, updates: Partial<Section>): Promise<Section> => {
    const { data, error } = await supabase
        .from('sections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 섹션 삭제
export const deleteSection = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// 상품의 섹션 목록 조회
export const getProductSections = async (productId: string): Promise<string[]> => {
    const { data, error } = await supabase
        .from('product_sections')
        .select('section_id')
        .eq('product_id', productId);

    if (error) throw error;
    return data?.map(ps => ps.section_id) || [];
};

// 상품의 섹션 설정 (기존 것 삭제 후 새로 추가)
export const setProductSections = async (productId: string, sectionIds: string[]): Promise<void> => {
    // 기존 섹션 관계 삭제
    const { error: deleteError } = await supabase
        .from('product_sections')
        .delete()
        .eq('product_id', productId);

    if (deleteError) throw deleteError;

    // 새 섹션 관계 추가
    if (sectionIds.length > 0) {
        const inserts = sectionIds.map(sectionId => ({
            product_id: productId,
            section_id: sectionId
        }));

        const { error: insertError } = await supabase
            .from('product_sections')
            .insert(inserts);

        if (insertError) throw insertError;
    }
};

// 섹션별 상품 조회 (상품 정보 포함)
export const getProductsBySection = async (sectionId: string): Promise<any[]> => {
    // Note: If you have a 'display_order' column in 'product_sections', you can add .order('display_order') here.
    // Currently removing explicit 'display_order' select/order to prevent crashes if column is missing.
    const { data, error } = await supabase
        .from('product_sections')
        .select(`
            product_id,
            products (
                id,
                name,
                category,
                price,
                description,
                image_url,
                stock,
                discount_rate,
                rating,
                review_count
            )
        `)
        .eq('section_id', sectionId);

    if (error) throw error;

    // Sort in JS if needed, or if the DB returns insertion order. 
    // Without display_order column, we can't persist custom order.
    return data?.map(ps => ps.products).filter(Boolean) || [];
};

// 섹션 내 상품 순서 변경
export const reorderSectionProducts = async (sectionId: string, productIds: string[]): Promise<void> => {
    // Note: This requires 'display_order' column in 'product_sections' table.
    // Loop through and update each item's display_order
    const updates = productIds.map((productId, index) => ({
        section_id: sectionId,
        product_id: productId,
        display_order: index + 1
    }));

    // UPSERT doesn't work easily with composite keys in purely one go without conflict config in Supabase typically,
    // but if product_sections has (product_id, section_id) as primary key/unique constraint, we can upsert.
    // Let's assume standard update loop for safety if upsert is tricky.

    // Using upsert with explicit constraint on composite key if configured, 
    // otherwise sequential updates.

    // For simplicity and reliability in this specific context:
    for (const update of updates) {
        const { error } = await supabase
            .from('product_sections')
            .update({ display_order: update.display_order })
            .eq('section_id', sectionId)
            .eq('product_id', update.product_id);

        if (error) throw error;
    }
};

// 섹션의 카테고리 목록 설정 (기존 것 삭제 후 새로 추가)
export const setSectionCategories = async (sectionId: string, categoryIds: string[]): Promise<void> => {
    // 기존 카테고리 관계 삭제
    const { error: deleteError } = await supabase
        .from('section_categories')
        .delete()
        .eq('section_id', sectionId);

    if (deleteError) throw deleteError;

    // 새 카테고리 관계 추가
    if (categoryIds.length > 0) {
        const inserts = categoryIds.map(categoryId => ({
            section_id: sectionId,
            category_id: categoryId
        }));

        const { error: insertError } = await supabase
            .from('section_categories')
            .insert(inserts);

        if (insertError) throw insertError;
    }
};

// 섹션에 연결된 카테고리 ID 목록 조회
export const getSectionCategories = async (sectionId: string): Promise<string[]> => {
    const { data, error } = await supabase
        .from('section_categories')
        .select('category_id')
        .eq('section_id', sectionId);

    if (error) throw error;
    return data?.map(sc => sc.category_id) || [];
};
