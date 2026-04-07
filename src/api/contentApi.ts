import { supabase } from '../lib/supabase';

const INSTALLATION_CASE_TABLE = 'installation_cases';
const NOTICE_TABLE = 'notices';
const INSTALLATION_CASE_CATEGORY_TABLE = 'installation_case_categories';
const NOTICE_CATEGORY_TABLE = 'notice_categories';

const INSTALLATION_CASE_SELECT =
  'id,category,title,summary,content,image_url,display_order,is_active,published_at,created_at,updated_at';
const INSTALLATION_CASE_LEGACY_SELECT =
  'id,title,summary,content,image_url,display_order,is_active,published_at,created_at,updated_at';
const NOTICE_SELECT =
  'id,category,title,summary,content,image_url,display_order,is_active,published_at,created_at,updated_at';
const CONTENT_CATEGORY_SELECT = 'id,name,display_order,is_active,created_at';

interface SupabaseErrorShape {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export interface InstallationCase {
  id?: string;
  category?: string;
  title: string;
  summary: string;
  content?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Notice {
  id?: string;
  category?: string;
  title: string;
  summary: string;
  content?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ContentCategory {
  id?: string;
  name: string;
  display_order: number;
  is_active?: boolean;
  created_at?: string;
}

export type InstallationCaseCategory = ContentCategory;
export type NoticeCategory = ContentCategory;

export interface ContentCategoryEntry {
  category?: string | null;
}

const normalizeSearchTerm = (value?: string) => value?.trim() || '';
export const normalizeContentCategoryName = (value?: string | null) => value?.trim() || '';

const isMissingColumnError = (error: unknown, columnName: string) => {
  const candidate = error as SupabaseErrorShape | null;
  const message = [candidate?.message, candidate?.details, candidate?.hint].filter(Boolean).join(' ').toLowerCase();
  return (
    candidate?.code === '42703' ||
    (message.includes(columnName.toLowerCase()) && (message.includes('column') || message.includes('schema cache')))
  );
};

const buildOrderedCategoryNames = (
  categories: Pick<ContentCategory, 'name' | 'display_order' | 'is_active'>[] = [],
  entries: ContentCategoryEntry[] = [],
  fallbackNames: string[] = []
) => {
  const entryNames = Array.from(
    new Set(entries.map((entry) => normalizeContentCategoryName(entry.category)).filter(Boolean))
  );

  const activeCategories = categories
    .filter((category) => category.is_active !== false)
    .map((category) => ({
      name: normalizeContentCategoryName(category.name),
      display_order: category.display_order ?? 0,
    }))
    .filter((category) => Boolean(category.name))
    .sort((left, right) => {
      if (left.display_order !== right.display_order) {
        return left.display_order - right.display_order;
      }

      return left.name.localeCompare(right.name, 'ko');
    });

  const tableNames = activeCategories.map((category) => category.name);
  const extraNames = entryNames
    .filter((name) => !tableNames.includes(name))
    .sort((left, right) => left.localeCompare(right, 'ko'));

  const orderedNames = [...tableNames, ...extraNames];
  return orderedNames.length > 0 ? orderedNames : fallbackNames.map((name) => normalizeContentCategoryName(name)).filter(Boolean);
};

const applySearchFilter = <T>(query: T, searchTerm?: string) => {
  const normalizedSearch = normalizeSearchTerm(searchTerm);
  if (!normalizedSearch) return query;

  return (query as any).or(`title.ilike.%${normalizedSearch}%,summary.ilike.%${normalizedSearch}%`);
};

const getCategoryTableItems = async (tableName: string, activeOnly = true): Promise<ContentCategory[]> => {
  try {
    let request = supabase.from(tableName).select(CONTENT_CATEGORY_SELECT).order('display_order', { ascending: true });

    if (activeOnly) {
      request = request.eq('is_active', true);
    }

    const { data, error } = await request;
    if (error) throw error;
    return data || [];
  } catch (error) {
    const candidate = error as SupabaseErrorShape | null;
    const message = [candidate?.message, candidate?.details, candidate?.hint].filter(Boolean).join(' ').toLowerCase();
    if (candidate?.code === '42P01' || message.includes('does not exist') || message.includes('schema cache')) {
      return [];
    }

    throw error;
  }
};

const getCategoryEntries = async (
  tableName: string,
  { activeOnly = true, ignoreMissingCategoryColumn = false }: { activeOnly?: boolean; ignoreMissingCategoryColumn?: boolean } = {}
): Promise<ContentCategoryEntry[]> => {
  try {
    let request = supabase.from(tableName).select('category');

    if (activeOnly) {
      request = request.eq('is_active', true);
    }

    request = request.not('category', 'is', null).order('category', { ascending: true });

    const { data, error } = await request;
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (ignoreMissingCategoryColumn && isMissingColumnError(error, 'category')) {
      return [];
    }

    throw error;
  }
};

const sanitizeCategoryPayload = <T extends { category?: string | null }>(payload: T) => ({
  ...payload,
  category: normalizeContentCategoryName(payload.category) || null,
});

export const getInstallationCasesPage = async ({
  page,
  pageSize,
  category,
  searchTerm,
}: {
  page: number;
  pageSize: number;
  category?: string;
  searchTerm?: string;
}): Promise<{ data: InstallationCase[]; count: number }> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const normalizedCategory = normalizeContentCategoryName(category);

  const buildRequest = (selectColumns: string, allowCategoryFilter: boolean) => {
    let request = supabase
      .from(INSTALLATION_CASE_TABLE)
      .select(selectColumns, { count: 'exact' })
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false })
      .range(from, to);

    if (allowCategoryFilter && normalizedCategory && normalizedCategory !== '전체') {
      request = request.eq('category', normalizedCategory);
    }

    return applySearchFilter(request, searchTerm);
  };

  const { data, error, count } = await buildRequest(INSTALLATION_CASE_SELECT, true);
  if (error && isMissingColumnError(error, 'category')) {
    const fallbackResponse = await buildRequest(INSTALLATION_CASE_LEGACY_SELECT, false);
    if (fallbackResponse.error) throw fallbackResponse.error;

    return {
      data: (fallbackResponse.data || []).map((item) => ({ ...item, category: undefined })),
      count: fallbackResponse.count || 0,
    };
  }

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
  };
};

export const getAllInstallationCases = async (): Promise<InstallationCase[]> => {
  const request = () =>
    supabase
      .from(INSTALLATION_CASE_TABLE)
      .select(INSTALLATION_CASE_SELECT)
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false });

  const { data, error } = await request();
  if (error && isMissingColumnError(error, 'category')) {
    const fallbackResponse = await supabase
      .from(INSTALLATION_CASE_TABLE)
      .select(INSTALLATION_CASE_LEGACY_SELECT)
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false });

    if (fallbackResponse.error) throw fallbackResponse.error;
    return (fallbackResponse.data || []).map((item) => ({ ...item, category: undefined }));
  }

  if (error) throw error;
  return data || [];
};

export const getInstallationCaseById = async (id: string): Promise<InstallationCase | null> => {
  const buildRequest = (selectColumns: string) =>
    supabase
      .from(INSTALLATION_CASE_TABLE)
      .select(selectColumns)
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

  const { data, error } = await buildRequest(INSTALLATION_CASE_SELECT);
  if (error && isMissingColumnError(error, 'category')) {
    const fallbackResponse = await buildRequest(INSTALLATION_CASE_LEGACY_SELECT);
    if (fallbackResponse.error) throw fallbackResponse.error;

    return fallbackResponse.data ? { ...fallbackResponse.data, category: undefined } : null;
  }

  if (error) throw error;
  return data;
};

export const addInstallationCase = async (
  item: Omit<InstallationCase, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  const payload = sanitizeCategoryPayload(item);
  const { data, error } = await supabase
    .from(INSTALLATION_CASE_TABLE)
    .insert([payload])
    .select()
    .single();

  if (error && isMissingColumnError(error, 'category')) {
    const legacyPayload = { ...payload };
    delete (legacyPayload as { category?: string | null }).category;

    const fallbackResponse = await supabase
      .from(INSTALLATION_CASE_TABLE)
      .insert([legacyPayload])
      .select()
      .single();

    if (fallbackResponse.error) throw fallbackResponse.error;
    return fallbackResponse.data.id;
  }

  if (error) throw error;
  return data.id;
};

export const updateInstallationCase = async (
  id: string,
  updates: Partial<InstallationCase>
): Promise<void> => {
  const payload = sanitizeCategoryPayload({
    ...updates,
    updated_at: new Date().toISOString(),
  });

  const { error } = await supabase
    .from(INSTALLATION_CASE_TABLE)
    .update(payload)
    .eq('id', id);

  if (error && isMissingColumnError(error, 'category')) {
    const legacyPayload = { ...payload };
    delete (legacyPayload as { category?: string | null }).category;

    const fallbackResponse = await supabase
      .from(INSTALLATION_CASE_TABLE)
      .update(legacyPayload)
      .eq('id', id);

    if (fallbackResponse.error) throw fallbackResponse.error;
    return;
  }

  if (error) throw error;
};

export const deleteInstallationCase = async (id: string): Promise<void> => {
  const { error } = await supabase.from(INSTALLATION_CASE_TABLE).delete().eq('id', id);
  if (error) throw error;
};

export const getInstallationCaseCategoryEntries = async (): Promise<ContentCategoryEntry[]> =>
  getCategoryEntries(INSTALLATION_CASE_TABLE, { ignoreMissingCategoryColumn: true });

export const getNoticeCategoryEntries = async (): Promise<ContentCategoryEntry[]> =>
  getCategoryEntries(NOTICE_TABLE);

export const getInstallationCaseCategories = async (): Promise<InstallationCaseCategory[]> =>
  getCategoryTableItems(INSTALLATION_CASE_CATEGORY_TABLE, true);

export const getAllInstallationCaseCategories = async (): Promise<InstallationCaseCategory[]> =>
  getCategoryTableItems(INSTALLATION_CASE_CATEGORY_TABLE, false);

export const addInstallationCaseCategory = async (
  category: Omit<InstallationCaseCategory, 'id' | 'created_at'>
): Promise<string> => {
  const payload = {
    ...category,
    name: normalizeContentCategoryName(category.name),
  };

  const { data, error } = await supabase
    .from(INSTALLATION_CASE_CATEGORY_TABLE)
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const updateInstallationCaseCategory = async (
  id: string,
  category: Partial<InstallationCaseCategory>
): Promise<void> => {
  const payload = {
    ...category,
    ...(typeof category.name === 'string' ? { name: normalizeContentCategoryName(category.name) } : {}),
  };

  const { error } = await supabase
    .from(INSTALLATION_CASE_CATEGORY_TABLE)
    .update(payload)
    .eq('id', id);

  if (error) throw error;
};

export const deleteInstallationCaseCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from(INSTALLATION_CASE_CATEGORY_TABLE).delete().eq('id', id);
  if (error) throw error;
};

export const getInstallationCaseCategoryNames = (
  categories: Pick<InstallationCaseCategory, 'name' | 'display_order' | 'is_active'>[] = [],
  entries: ContentCategoryEntry[] = []
) => buildOrderedCategoryNames(categories, entries);

export const getNoticeCategoryTableItems = async (): Promise<NoticeCategory[]> =>
  getCategoryTableItems(NOTICE_CATEGORY_TABLE, true);

export const getAllNoticeCategories = async (): Promise<NoticeCategory[]> =>
  getCategoryTableItems(NOTICE_CATEGORY_TABLE, false);

export const addNoticeCategory = async (
  category: Omit<NoticeCategory, 'id' | 'created_at'>
): Promise<string> => {
  const payload = {
    ...category,
    name: normalizeContentCategoryName(category.name),
  };

  const { data, error } = await supabase
    .from(NOTICE_CATEGORY_TABLE)
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const updateNoticeCategory = async (
  id: string,
  category: Partial<NoticeCategory>
): Promise<void> => {
  const payload = {
    ...category,
    ...(typeof category.name === 'string' ? { name: normalizeContentCategoryName(category.name) } : {}),
  };

  const { error } = await supabase
    .from(NOTICE_CATEGORY_TABLE)
    .update(payload)
    .eq('id', id);

  if (error) throw error;
};

export const deleteNoticeCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from(NOTICE_CATEGORY_TABLE).delete().eq('id', id);
  if (error) throw error;
};

export const getNoticeCategoryNames = (
  categories: Pick<NoticeCategory, 'name' | 'display_order' | 'is_active'>[] = [],
  entries: ContentCategoryEntry[] = []
) => buildOrderedCategoryNames(categories, entries);

export const getNoticeCategories = async (): Promise<string[]> => {
  const [categories, entries] = await Promise.all([getNoticeCategoryTableItems(), getNoticeCategoryEntries()]);
  return getNoticeCategoryNames(categories, entries);
};

export const getNoticesPage = async ({
  page,
  pageSize,
  category,
  searchTerm,
}: {
  page: number;
  pageSize: number;
  category?: string;
  searchTerm?: string;
}): Promise<{ data: Notice[]; count: number }> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from(NOTICE_TABLE)
    .select(NOTICE_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('published_at', { ascending: false })
    .range(from, to);

  const normalizedCategory = category?.trim();
  if (normalizedCategory && normalizedCategory !== '전체') {
    request = request.eq('category', normalizedCategory);
  }

  request = applySearchFilter(request, searchTerm);

  const { data, error, count } = await request;
  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
  };
};

export const getAllNotices = async (): Promise<Notice[]> => {
  const { data, error } = await supabase
    .from(NOTICE_TABLE)
    .select(NOTICE_SELECT)
    .order('display_order', { ascending: true })
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getNoticeById = async (id: string): Promise<Notice | null> => {
  const { data, error } = await supabase
    .from(NOTICE_TABLE)
    .select(NOTICE_SELECT)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const addNotice = async (
  item: Omit<Notice, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  const payload = sanitizeCategoryPayload(item);
  const { data, error } = await supabase.from(NOTICE_TABLE).insert([payload]).select().single();

  if (error) throw error;
  return data.id;
};

export const updateNotice = async (id: string, updates: Partial<Notice>): Promise<void> => {
  const payload = sanitizeCategoryPayload({
    ...updates,
    updated_at: new Date().toISOString(),
  });

  const { error } = await supabase
    .from(NOTICE_TABLE)
    .update(payload)
    .eq('id', id);

  if (error) throw error;
};

export const deleteNotice = async (id: string): Promise<void> => {
  const { error } = await supabase.from(NOTICE_TABLE).delete().eq('id', id);
  if (error) throw error;
};
