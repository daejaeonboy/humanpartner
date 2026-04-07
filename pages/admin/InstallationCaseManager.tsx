import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  Images,
  Eye,
  EyeOff,
  Upload,
  Tag,
  Check,
} from 'lucide-react';
import {
  addInstallationCase,
  addInstallationCaseCategory,
  deleteInstallationCase,
  deleteInstallationCaseCategory,
  getAllInstallationCaseCategories,
  getAllInstallationCases,
  getInstallationCaseCategoryNames,
  InstallationCase,
  InstallationCaseCategory,
  normalizeContentCategoryName,
  updateInstallationCase,
  updateInstallationCaseCategory,
} from '../../src/api/contentApi';
import { uploadImage } from '../../src/api/storageApi';
import { RichHtmlEditor } from '../../components/ui/RichHtmlEditor';

const DEFAULT_INSTALLATION_CASE_CATEGORY = '일반';

const formatDateTimeInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const InstallationCaseManager: React.FC = () => {
  const [items, setItems] = useState<InstallationCase[]>([]);
  const [categories, setCategories] = useState<InstallationCaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InstallationCase | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCategoryOptions = (itemList = items, categoryList = categories) => {
    const names = getInstallationCaseCategoryNames(categoryList, itemList);
    return names.length > 0 ? names : [DEFAULT_INSTALLATION_CASE_CATEGORY];
  };

  const [formData, setFormData] = useState<InstallationCase>({
    category: DEFAULT_INSTALLATION_CASE_CATEGORY,
    title: '',
    summary: '',
    content: '',
    image_url: '',
    display_order: 1,
    is_active: true,
    published_at: formatDateTimeInput(new Date().toISOString()),
  });

  const loadItems = async () => {
    const data = await getAllInstallationCases();
    setItems(data);
    return data;
  };

  const loadCategories = async () => {
    const data = await getAllInstallationCaseCategories();
    setCategories(data);
    return data;
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([loadItems(), loadCategories()]);
      } catch (error) {
        console.error('Failed to load installation case manager data:', error);
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    const categoryOptions = getCategoryOptions();
    setFormData({
      category: categoryOptions[0] || DEFAULT_INSTALLATION_CASE_CATEGORY,
      title: '',
      summary: '',
      content: '',
      image_url: '',
      display_order: items.length + 1,
      is_active: true,
      published_at: formatDateTimeInput(new Date().toISOString()),
    });
    setShowModal(true);
  };

  const openEditModal = (item: InstallationCase) => {
    const categoryOptions = getCategoryOptions();
    setEditingItem(item);
    setFormData({
      ...item,
      category: normalizeContentCategoryName(item.category) || categoryOptions[0] || DEFAULT_INSTALLATION_CASE_CATEGORY,
      content: item.content || '',
      summary: item.summary || '',
      image_url: item.image_url || '',
      published_at: formatDateTimeInput(item.published_at),
    });
    setShowModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategoryId(null);
    setEditingCategoryName('');
    setNewCategoryName('');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, 'installation-cases');
      setFormData((prev) => ({ ...prev, image_url: imageUrl }));
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        category: normalizeContentCategoryName(formData.category) || DEFAULT_INSTALLATION_CASE_CATEGORY,
        published_at: formData.published_at || null,
      };

      if (editingItem?.id) {
        await updateInstallationCase(editingItem.id, payload);
      } else {
        await addInstallationCase(payload as Omit<InstallationCase, 'id' | 'created_at' | 'updated_at'>);
      }

      const refreshedItems = await loadItems();
      setItems(refreshedItems);
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save installation case:', error);
      alert('설치사례 저장에 실패했습니다. 카테고리 컬럼과 SQL 테이블 생성 여부를 확인해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 설치사례를 삭제하시겠습니까?')) return;

    try {
      await deleteInstallationCase(id);
      await loadItems();
    } catch (error) {
      console.error('Failed to delete installation case:', error);
      alert('설치사례 삭제에 실패했습니다.');
    }
  };

  const toggleActive = async (item: InstallationCase) => {
    if (!item.id) return;

    try {
      await updateInstallationCase(item.id, { is_active: !item.is_active });
      await loadItems();
    } catch (error) {
      console.error('Failed to toggle installation case visibility:', error);
    }
  };

  const handleAddCategory = async () => {
    const categoryName = normalizeContentCategoryName(newCategoryName);
    if (!categoryName) return;

    setCategoryLoading(true);
    try {
      await addInstallationCaseCategory({
        name: categoryName,
        display_order: categories.length + 1,
        is_active: true,
      });
      setNewCategoryName('');
      await loadCategories();
    } catch (error) {
      console.error('Failed to add installation case category:', error);
      alert('카테고리 추가에 실패했습니다. SQL 파일을 먼저 실행해주세요.');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    const nextName = normalizeContentCategoryName(editingCategoryName);
    if (!nextName) return;

    const currentCategory = categories.find((category) => category.id === id);
    if (!currentCategory) return;

    const previousName = normalizeContentCategoryName(currentCategory.name);

    setCategoryLoading(true);
    try {
      await updateInstallationCaseCategory(id, { name: nextName });

      const affectedItems = items.filter(
        (item) => normalizeContentCategoryName(item.category) === previousName
      );

      await Promise.all(
        affectedItems
          .filter((item) => item.id)
          .map((item) => updateInstallationCase(item.id!, { category: nextName }))
      );

      setEditingCategoryId(null);
      setEditingCategoryName('');
      await Promise.all([loadCategories(), loadItems()]);
    } catch (error) {
      console.error('Failed to update installation case category:', error);
      alert('카테고리 수정에 실패했습니다.');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const targetCategory = categories.find((category) => category.id === id);
    if (!targetCategory) return;

    const normalizedName = normalizeContentCategoryName(targetCategory.name);
    const usedCount = items.filter(
      (item) => normalizeContentCategoryName(item.category) === normalizedName
    ).length;

    if (usedCount > 0) {
      alert(`이 카테고리를 사용 중인 설치사례가 ${usedCount}개 있습니다. 먼저 게시물의 카테고리를 변경해주세요.`);
      return;
    }

    if (!confirm(`'${normalizedName}' 카테고리를 삭제하시겠습니까?`)) return;

    setCategoryLoading(true);
    try {
      await deleteInstallationCaseCategory(id);
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete installation case category:', error);
      alert('카테고리 삭제에 실패했습니다.');
    } finally {
      setCategoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#39B54A]" size={40} />
      </div>
    );
  }

  const categoryOptions = getCategoryOptions();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Images size={24} className="text-[#39B54A]" />
            설치사례 관리
          </h1>
          <p className="mt-1 text-sm text-slate-500">설치사례 목록 페이지에 노출할 게시물과 카테고리를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 font-bold text-slate-700 transition-all hover:bg-slate-50"
          >
            <Tag size={18} />
            카테고리 관리
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-[#39B54A] px-5 py-2.5 font-bold text-white shadow-lg shadow-[#39B54A]/20 transition-all hover:bg-[#2F9A3F]"
          >
            <Plus size={18} />
            설치사례 추가
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-20 text-center">
          <Images size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium text-slate-500">등록된 설치사례가 없습니다.</p>
          <p className="mt-1 text-sm text-slate-400">설치사례 추가 버튼으로 첫 게시물을 등록해보세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex gap-5 rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-28 w-44 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <Images size={28} className="text-slate-300" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-500">순서 {item.display_order}</span>
                  <span className="rounded-md bg-[#39B54A]/10 px-2 py-0.5 text-[#39B54A]">
                    {normalizeContentCategoryName(item.category) || DEFAULT_INSTALLATION_CASE_CATEGORY}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 ${
                      item.is_active ? 'bg-[#39B54A]/10 text-[#39B54A]' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {item.is_active ? '노출중' : '숨김'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.summary || '요약 없음'}</p>
                <p className="mt-3 text-xs text-slate-400">
                  게시일 {item.published_at ? new Date(item.published_at).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>

              <div className="flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => toggleActive(item)}
                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-[#39B54A]"
                  title={item.is_active ? '숨기기' : '노출하기'}
                >
                  {item.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                  onClick={() => openEditModal(item)}
                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-[#39B54A]/5 hover:text-[#39B54A]"
                  title="수정"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                  title="삭제"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center py-4">
            <div className="flex w-full max-w-3xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900">{editingItem ? '설치사례 수정' : '새 설치사례 등록'}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto p-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">카테고리</label>
                    <select
                      value={normalizeContentCategoryName(formData.category) || categoryOptions[0] || DEFAULT_INSTALLATION_CASE_CATEGORY}
                      onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">노출 순서</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.display_order}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          display_order: parseInt(event.target.value, 10) || 1,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">제목</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
                      placeholder="설치사례 제목"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">게시일</label>
                    <input
                      type="datetime-local"
                      value={String(formData.published_at || '')}
                      onChange={(event) => setFormData((prev) => ({ ...prev, published_at: event.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 ml-1 block text-sm font-bold text-slate-700">대표 이미지</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  {formData.image_url ? (
                    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <img
                        src={formData.image_url}
                        alt="설치사례 이미지"
                        className="h-48 w-full rounded-lg object-cover"
                        decoding="async"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                        className="absolute right-6 top-6 rounded-full bg-black/70 p-2 text-white transition-all hover:bg-black"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-[#39B54A]"
                    >
                      {uploading ? (
                        <Loader2 className="animate-spin text-[#39B54A]" size={22} />
                      ) : (
                        <>
                          <Upload size={22} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-500">이미지 업로드</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">본문</label>
                  <RichHtmlEditor
                    initialValue={formData.content || ''}
                    onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                    placeholder="상세 내용과 본문 이미지를 입력하세요."
                    imageFolder="installation-cases"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(event) => setFormData((prev) => ({ ...prev, is_active: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-[#39B54A] focus:ring-[#39B54A]"
                  />
                  <span className="text-sm font-medium text-slate-700">페이지에 노출하기</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-lg border border-slate-200 px-6 py-4 font-bold text-slate-600 transition-all hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] rounded-lg bg-[#39B54A] px-6 py-4 font-bold text-white shadow-lg shadow-[#39B54A]/20 transition-all hover:bg-[#2F9A3F] disabled:bg-slate-300"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={18} />
                        저장 중...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Save size={18} />
                        {editingItem ? '수정 사항 저장' : '설치사례 등록'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Tag size={20} className="text-[#39B54A]" />
                설치사례 카테고리 관리
              </h2>
              <button
                onClick={closeCategoryModal}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="새 카테고리명 입력"
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-[#39B54A]/10 focus:border-[#39B54A] outline-none transition-all font-medium text-sm"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleAddCategory();
                    }
                  }}
                />
                <button
                  onClick={() => void handleAddCategory()}
                  disabled={categoryLoading || !newCategoryName.trim()}
                  className="px-4 py-3 bg-[#39B54A] text-white rounded-lg font-bold hover:bg-[#2F9A3F] transition-all disabled:bg-slate-300 flex items-center gap-1 text-sm"
                >
                  {categoryLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  추가
                </button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <Tag size={32} className="mx-auto mb-3 text-slate-300" />
                    <p>등록된 카테고리가 없습니다.</p>
                    <p className="text-xs mt-1">위에서 카테고리를 추가해주세요.</p>
                    <p className="text-xs mt-3 text-slate-300">설치사례 카테고리 SQL을 먼저 실행해야 합니다.</p>
                  </div>
                ) : (
                  categories
                    .filter((category) => category.is_active !== false)
                    .map((category, index) => {
                      const usedCount = items.filter(
                        (item) =>
                          normalizeContentCategoryName(item.category) === normalizeContentCategoryName(category.name)
                      ).length;

                      return (
                        <div
                          key={category.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-white transition-all group"
                        >
                          <span className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                            {index + 1}
                          </span>

                          {editingCategoryId === category.id ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(event) => setEditingCategoryName(event.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-[#39B54A] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#39B54A]/20"
                                autoFocus
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    void handleUpdateCategory(category.id!);
                                  }
                                  if (event.key === 'Escape') {
                                    setEditingCategoryId(null);
                                    setEditingCategoryName('');
                                  }
                                }}
                              />
                              <button
                                onClick={() => void handleUpdateCategory(category.id!)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategoryId(null);
                                  setEditingCategoryName('');
                                }}
                                className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-all"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <span className="block truncate font-medium text-slate-800 text-sm">
                                  {normalizeContentCategoryName(category.name)}
                                </span>
                                <span className="text-xs text-slate-400">사용 중 설치사례 {usedCount}건</span>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingCategoryId(category.id!);
                                    setEditingCategoryName(normalizeContentCategoryName(category.name));
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-[#39B54A] hover:bg-[#39B54A]/5 rounded-lg transition-all"
                                  title="수정"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => void handleDeleteCategory(category.id!)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="삭제"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                )}
              </div>

              <p className="text-xs text-slate-400 text-center pt-2">
                카테고리명을 수정하면 해당 카테고리의 설치사례도 자동으로 업데이트됩니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
