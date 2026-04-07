import { supabase } from '../lib/supabase';

export interface Product {
    id?: string;
    product_code?: string;
    name: string;
    category?: string; // 카테고리 (중분류)
    _parent_category?: string; // VIEW 등에서 조인으로 가져올 대분류
    price: number;
    description?: string;
    short_description?: string;
    image_url?: string;
    stock: number;
    discount_rate?: number;
    created_at?: string;
    
    // 패키지 및 상품옵션 타입
    product_type?: 'basic' | 'essential' | 'additional' | 'cooperative' | 'place' | 'food'; // New: basic(package), essential(basic component), additional, cooperative, place, food
    
    // 관계형 데이터 (JSON 형태로 저장)
    basic_components?: { name: string; model_name?: string; quantity: number; product_id?: string; image_url?: string }[];
    additional_components?: { name: string; model_name?: string; price: number; _category?: string }[];
    cooperative_components?: { name: string; model_name?: string; price: number; _category?: string }[];
    place_components?: { name: string; price: number }[];
    food_components?: { name: string; price: number }[];
}

const PRODUCT_LIST_SELECT = `
    id,
    product_code,
    name,
    category,
    price,
    short_description,
    description,
    image_url,
    stock,
    discount_rate,
    created_at,
    product_type
`;

const PRODUCT_DETAIL_SELECT = `
    id,
    product_code,
    name,
    category,
    price,
    description,
    short_description,
    image_url,
    stock,
    discount_rate,
    created_at,
    product_type,
    basic_components,
    additional_components,
    cooperative_components,
    place_components,
    food_components
`;

const toUniqueArray = (values: (string | null | undefined)[]) =>
    Array.from(new Set(values.filter((value): value is string => Boolean(value))));
const PRODUCT_TYPE_CACHE_TTL_MS = 60_000;
const productTypeCache = new Map<string, { data: Product[]; cachedAt: number }>();
const productTypePromiseCache = new Map<string, Promise<Product[]>>();

const getProductTypeCacheKey = (type: string, categories: string[]) =>
    [type, ...categories].join('|');

const invalidateProductTypeCache = () => {
    productTypeCache.clear();
    productTypePromiseCache.clear();
};

// 모든 상품 조회
export const getProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_DETAIL_SELECT)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const getBasicProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_LIST_SELECT)
        .not('product_type', 'in', '(essential,additional,cooperative,place,food)')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const getProductSummaries = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_LIST_SELECT)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const getBasicProductsByCategories = async (categories: string[]): Promise<Product[]> => {
    const uniqueCategories = toUniqueArray(categories);

    let query = supabase
        .from('products')
        .select(PRODUCT_LIST_SELECT)
        .not('product_type', 'in', '(essential,additional,cooperative,place,food)');

    if (uniqueCategories.length > 0) {
        query = query.in('category', uniqueCategories);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

// 카테고리별 상품 조회
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
    const query = supabase.from('products').select(PRODUCT_LIST_SELECT);

    if (category && category !== 'all') {
        query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

// 타입별 상품 조회 (basic, essential, additional, cooperative, place, food)
export const getProductsByType = async (
    type: string,
    categories: string[] = [],
    bypassCache = false,
): Promise<Product[]> => {
    const uniqueCategories = toUniqueArray(categories).sort((a, b) => a.localeCompare(b, 'ko-KR'));
    const cacheKey = getProductTypeCacheKey(type, uniqueCategories);
    const cached = productTypeCache.get(cacheKey);

    if (!bypassCache && cached && Date.now() - cached.cachedAt < PRODUCT_TYPE_CACHE_TTL_MS) {
        return cached.data;
    }

    const pendingRequest = !bypassCache ? productTypePromiseCache.get(cacheKey) : null;
    if (pendingRequest) {
        return pendingRequest;
    }

    let query = supabase.from('products').select(PRODUCT_LIST_SELECT);

    if (type === 'additional' || type === 'essential') {
        // 'essential'와 'additional'은 '물품'으로 통합 관리
        query = query.in('product_type', ['essential', 'additional']);
    } else {
        query = query.eq('product_type', type);
    }

    if (uniqueCategories.length > 0) {
        query = query.in('category', uniqueCategories);
    }

    const request = query
        .order('name', { ascending: true })
        .then(({ data, error }) => {
            if (error) throw error;
            const products = data || [];
            productTypeCache.set(cacheKey, {
                data: products,
                cachedAt: Date.now(),
            });
            return products;
        })
        .finally(() => {
            productTypePromiseCache.delete(cacheKey);
        });

    if (!bypassCache) {
        productTypePromiseCache.set(cacheKey, request);
    }
    return request;
};

// 상품 검색 API
export const searchProducts = async (keyword: string): Promise<Product[]> => {
    if (!keyword) return [];

    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_LIST_SELECT)
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,short_description.ilike.%${keyword}%`)
        .not('product_type', 'in', '(essential,additional,cooperative,place,food)')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

// 단일 상품 조회
export const getProductById = async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_DETAIL_SELECT)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const getProductsByIds = async (ids: string[]): Promise<Product[]> => {
    const uniqueIds = toUniqueArray(ids);
    if (uniqueIds.length === 0) return [];

    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_LIST_SELECT)
        .in('id', uniqueIds);

    if (error) throw error;
    return data || [];
};

export const getProductsByNames = async (names: string[]): Promise<Product[]> => {
    const uniqueNames = toUniqueArray(names);
    if (uniqueNames.length === 0) return [];

    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_LIST_SELECT)
        .in('name', uniqueNames);

    if (error) throw error;
    return data || [];
};

export const getProductsByIdentifiers = async (identifiers: string[]): Promise<Product[]> => {
    const uniqueIdentifiers = toUniqueArray(identifiers);
    if (uniqueIdentifiers.length === 0) return [];

    const uuidLike = uniqueIdentifiers.filter((value) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    );
    const codes = uniqueIdentifiers.filter((value) => !uuidLike.includes(value));

    const [idMatches, codeMatches] = await Promise.all([
        uuidLike.length > 0
            ? supabase.from('products').select(PRODUCT_LIST_SELECT).in('id', uuidLike)
            : Promise.resolve({ data: [], error: null }),
        codes.length > 0
            ? supabase.from('products').select(PRODUCT_LIST_SELECT).in('product_code', codes)
            : Promise.resolve({ data: [], error: null }),
    ]);

    if (idMatches.error) throw idMatches.error;
    if (codeMatches.error) throw codeMatches.error;

    return Array.from(
        new Map([...(idMatches.data || []), ...(codeMatches.data || [])].map((product) => [product.id, product])).values(),
    );
};

// 상품 추가
// 상품 추가
export const addProduct = async (product: Omit<Product, 'id' | 'created_at'>): Promise<Product> => {
    const userData = { ...product };

    // 상품 번호 자동 생성 로직 제거
    // if (!userData.product_code) ...


    const { data, error } = await supabase
        .from('products')
        .insert([userData])
        .select()
        .single();

    if (error) throw error;
    invalidateProductTypeCache();
    return data;
};

// 상품 수정
export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    invalidateProductTypeCache();
    return data;
};

// 상품 삭제
export const deleteProduct = async (id: string): Promise<void> => {
    // 상품-섹션 연결 관계 먼저 삭제
    await supabase.from('product_sections').delete().eq('product_id', id);
    // 예약 내역 삭제 (FK 제약조건 해결)
    await supabase.from('bookings').delete().eq('product_id', id);

    // 이후 상품 삭제
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
    invalidateProductTypeCache();
};

// 상품 번호로 조회
export const getProductByCode = async (code: string): Promise<Product | null> => {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_DETAIL_SELECT)
        .eq('product_code', code)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }
    return data;
};
