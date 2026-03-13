import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, X, Save, Loader2, HelpCircle, Tag, Check
} from 'lucide-react';
import { getFAQs, addFAQ, updateFAQ, deleteFAQ, FAQ, getFAQCategories, addFAQCategory, updateFAQCategory, deleteFAQCategory, FAQCategory } from '../../src/api/faqApi';

const DEFAULT_CATEGORIES = ['자주 묻는 질문', '공통', '이용문의', '예약/결제', '취소/환불', '상품문의', '기타'];

export const FAQManager: React.FC = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [formData, setFormData] = useState({
        category: '공통',
        question: '',
        answer: '',
        display_order: 1
    });
    const [saving, setSaving] = useState(false);

    // Category Management State
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [dbCategories, setDbCategories] = useState<FAQCategory[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [categoryLoading, setCategoryLoading] = useState(false);

    const loadCategories = async () => {
        try {
            const data = await getFAQCategories();
            if (data.length > 0) {
                setDbCategories(data);
                setCategories(data.map(c => c.name));
            } else {
                setCategories(DEFAULT_CATEGORIES);
                setDbCategories([]);
            }
        } catch (error) {
            console.error('Failed to load categories, using defaults:', error);
            setCategories(DEFAULT_CATEGORIES);
        }
    };

    const loadFAQs = async () => {
        try {
            const data = await getFAQs();
            setFaqs(data);
        } catch (error) {
            console.error('Failed to load FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        Promise.all([loadFAQs(), loadCategories()]);
    }, []);

    const openAddModal = () => {
        setEditingFaq(null);
        setFormData({
            category: categories[0] || '공통',
            question: '',
            answer: '',
            display_order: faqs.length + 1
        });
        setShowModal(true);
    };

    const openEditModal = (faq: FAQ) => {
        setEditingFaq(faq);
        setFormData({
            category: faq.category,
            question: faq.question,
            answer: faq.answer,
            display_order: faq.display_order
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingFaq?.id) {
                await updateFAQ(editingFaq.id, formData);
            } else {
                await addFAQ(formData);
            }
            await loadFAQs();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to save FAQ:', error);
            alert('저장에 실패했습니다. 보안 정책(RLS) 설정을 확인해주세요.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 FAQ를 삭제하시겠습니까?')) return;
        try {
            await deleteFAQ(id);
            await loadFAQs();
        } catch (error) {
            console.error('Failed to delete FAQ:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // Category CRUD handlers
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setCategoryLoading(true);
        try {
            await addFAQCategory({
                name: newCategoryName.trim(),
                display_order: dbCategories.length + 1
            });
            setNewCategoryName('');
            await loadCategories();
        } catch (error) {
            console.error('Failed to add category:', error);
            alert('카테고리 추가에 실패했습니다. 테이블이 생성되었는지 확인해주세요.');
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleUpdateCategory = async (id: string) => {
        if (!editingCategoryName.trim()) return;
        setCategoryLoading(true);
        try {
            const oldCat = dbCategories.find(c => c.id === id);
            await updateFAQCategory(id, { name: editingCategoryName.trim() });

            // Also update faqs that used the old category name
            if (oldCat) {
                const affectedFaqs = faqs.filter(f => f.category === oldCat.name);
                for (const faq of affectedFaqs) {
                    await updateFAQ(faq.id!, { category: editingCategoryName.trim() });
                }
            }

            setEditingCategoryId(null);
            setEditingCategoryName('');
            await Promise.all([loadCategories(), loadFAQs()]);
        } catch (error) {
            console.error('Failed to update category:', error);
            alert('카테고리 수정에 실패했습니다.');
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        const cat = dbCategories.find(c => c.id === id);
        const usedCount = faqs.filter(f => f.category === cat?.name).length;
        if (usedCount > 0) {
            alert(`이 카테고리를 사용 중인 FAQ가 ${usedCount}개 있습니다. 먼저 해당 FAQ의 카테고리를 변경해주세요.`);
            return;
        }
        if (!confirm(`'${cat?.name}' 카테고리를 삭제하시겠습니까?`)) return;
        setCategoryLoading(true);
        try {
            await deleteFAQCategory(id);
            await loadCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            alert('카테고리 삭제에 실패했습니다.');
        } finally {
            setCategoryLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#FF5B60]" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <HelpCircle size={24} className="text-[#FF5B60]" />
                        고객센터 FAQ 관리
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">고객센터 페이지에 표시될 자주 묻는 질문을 관리합니다.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="flex items-center gap-2 bg-white text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all border border-slate-200 font-bold"
                    >
                        <Tag size={18} />
                        카테고리 관리
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-[#FF5B60] text-white px-5 py-2.5 rounded-xl hover:bg-[#e54a4f] transition-all shadow-lg shadow-[#FF5B60]/20 font-bold"
                    >
                        <Plus size={20} />
                        FAQ 추가
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {faqs.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                        <HelpCircle size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 font-medium text-lg">등록된 FAQ가 없습니다.</p>
                        <p className="text-slate-400 text-sm mt-1 flex flex-col items-center">
                            FAQ 추가 버튼을 눌러 첫 번째 질문을 등록해보세요.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {faqs.map((faq) => (
                            <div
                                key={faq.id}
                                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-wider">
                                                ID: {faq.display_order}
                                            </span>
                                            <span className="px-2 py-0.5 bg-[#FF5B60]/10 text-[#FF5B60] text-[10px] font-bold rounded-md">
                                                {faq.category}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg mb-2">Q. {faq.question}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap pl-6 border-l-2 border-slate-100 italic">
                                            A. {faq.answer}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(faq)}
                                            className="p-2 text-slate-400 hover:text-[#FF5B60] hover:bg-[#FF5B60]/5 rounded-lg transition-all"
                                            title="수정"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(faq.id!)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="삭제"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FAQ Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingFaq ? 'FAQ 수정' : '새 FAQ 등록'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700 ml-1">카테고리</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-[#FF5B60]/10 focus:border-[#FF5B60] outline-none transition-all font-medium"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700 ml-1">노출 순서</label>
                                    <input
                                        type="number"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-[#FF5B60]/10 focus:border-[#FF5B60] outline-none transition-all font-medium"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-slate-700 ml-1">질문 (Question)</label>
                                <input
                                    type="text"
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    placeholder="질문을 입력해주세요"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-[#FF5B60]/10 focus:border-[#FF5B60] outline-none transition-all font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-slate-700 ml-1">답변 (Answer)</label>
                                <textarea
                                    value={formData.answer}
                                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                    placeholder="상세 답변 내용을 입력해주세요"
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-[#FF5B60]/10 focus:border-[#FF5B60] outline-none transition-all font-medium resize-none"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-[#FF5B60] text-white rounded-2xl font-bold hover:bg-[#e54a4f] shadow-lg shadow-[#FF5B60]/20 transition-all disabled:bg-slate-300 disabled:shadow-none active:scale-[0.98]"
                                >
                                    {saving ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            {editingFaq ? '수정 사항 저장' : 'FAQ 등록하기'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Management Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Tag size={20} className="text-[#FF5B60]" />
                                FAQ 카테고리 관리
                            </h2>
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Add New Category */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="새 카테고리명 입력"
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-[#FF5B60]/10 focus:border-[#FF5B60] outline-none transition-all font-medium text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                />
                                <button
                                    onClick={handleAddCategory}
                                    disabled={categoryLoading || !newCategoryName.trim()}
                                    className="px-4 py-3 bg-[#FF5B60] text-white rounded-xl font-bold hover:bg-[#e54a4f] transition-all disabled:bg-slate-300 flex items-center gap-1 text-sm"
                                >
                                    {categoryLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                    추가
                                </button>
                            </div>

                            {/* Category List */}
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {dbCategories.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        <Tag size={32} className="mx-auto mb-3 text-slate-300" />
                                        <p>등록된 카테고리가 없습니다.</p>
                                        <p className="text-xs mt-1">위에서 카테고리를 추가해주세요.</p>
                                        <p className="text-xs mt-3 text-slate-300">Supabase에서 SQL을 실행해야 합니다.</p>
                                    </div>
                                ) : (
                                    dbCategories.map((cat, idx) => {
                                        const usedCount = faqs.filter(f => f.category === cat.name).length;
                                        return (
                                            <div
                                                key={cat.id}
                                                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-all group"
                                            >
                                                <span className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {idx + 1}
                                                </span>

                                                {editingCategoryId === cat.id ? (
                                                    <div className="flex-1 flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={editingCategoryName}
                                                            onChange={(e) => setEditingCategoryName(e.target.value)}
                                                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#FF5B60] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5B60]/20"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleUpdateCategory(cat.id!);
                                                                if (e.key === 'Escape') setEditingCategoryId(null);
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateCategory(cat.id!)}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingCategoryId(null)}
                                                            className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-all"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="flex-1 font-medium text-slate-800 text-sm">{cat.name}</span>
                                                        <span className="text-xs text-slate-400">{usedCount}건</span>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingCategoryId(cat.id!);
                                                                    setEditingCategoryName(cat.name);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-[#FF5B60] hover:bg-[#FF5B60]/5 rounded-lg transition-all"
                                                                title="수정"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCategory(cat.id!)}
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
                                카테고리명을 수정하면 해당 카테고리의 FAQ도 자동으로 업데이트됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
