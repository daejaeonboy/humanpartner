import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, GripVertical, Eye, EyeOff, X, Save, Loader2,
    ArrowUp, ArrowDown, List
} from 'lucide-react';
import {
    getSections, addSection, updateSection, deleteSection, Section,
    getProductsBySection, reorderSectionProducts
} from '../../src/api/sectionApi';

export const SectionManager: React.FC = () => {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [formData, setFormData] = useState({ name: '', display_order: 0, is_active: true, layout_mode: 'grid-4' });
    const [saving, setSaving] = useState(false);

    // Product Ordering State
    const [orderingSection, setOrderingSection] = useState<Section | null>(null);
    const [sectionProducts, setSectionProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const loadSections = async () => {
        try {
            const data = await getSections();
            setSections(data);
        } catch (error) {
            console.error('Failed to load sections:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSections();
    }, []);

    const openAddModal = () => {
        setEditingSection(null);
        setFormData({
            name: '',
            display_order: sections.length + 1,
            is_active: true,
            layout_mode: 'grid-4'
        });
        setShowModal(true);
    };

    const openEditModal = async (section: Section) => {
        setEditingSection(section);
        setFormData({
            name: section.name,
            display_order: section.display_order,
            is_active: section.is_active,
            layout_mode: section.layout_mode || 'grid-4'
        });
        setShowModal(true);
    };

    const openOrderModal = async (section: Section) => {
        setOrderingSection(section);
        setLoadingProducts(true);
        try {
            const products = await getProductsBySection(section.id!);
            setSectionProducts(products);
        } catch (error) {
            console.error(error);
            alert('상품 목록을 불러오는데 실패했습니다.');
            setOrderingSection(null);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === sectionProducts.length - 1) return;

        const newProducts = [...sectionProducts];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]];
        setSectionProducts(newProducts);
    };

    const saveOrder = async () => {
        if (!orderingSection) return;
        setSaving(true);
        try {
            const ids = sectionProducts.map(p => p.id);
            await reorderSectionProducts(orderingSection.id!, ids);
            await loadSections(); // Reload to refresh any derived data if needed
            setOrderingSection(null);
        } catch (error) {
            console.error('Failed to save order:', error);
            alert('순서 저장에 실패했습니다. (DB 스키마를 확인해주세요)');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setSaving(true);
        try {
            if (editingSection) {
                await updateSection(editingSection.id!, formData);
            } else {
                await addSection(formData);
            }

            await loadSections();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to save section:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 섹션을 삭제하시겠습니까? 해당 섹션에 연결된 상품들은 연결이 해제됩니다.')) return;

        try {
            await deleteSection(id);
            await loadSections();
        } catch (error) {
            console.error('Failed to delete section:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const toggleActive = async (section: Section) => {
        try {
            await updateSection(section.id!, { is_active: !section.is_active });
            await loadSections();
        } catch (error) {
            console.error('Failed to toggle section:', error);
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
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">섹션 관리</h1>
                    <p className="text-sm text-slate-500 mt-1">메인 페이지에 표시될 섹션을 관리합니다</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-[#FF5B60] text-white px-4 py-2 rounded-lg hover:bg-[#FF5B60] transition-colors"
                >
                    <Plus size={20} />
                    섹션 추가
                </button>
            </div>

            {/* Section List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {sections.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        등록된 섹션이 없습니다. 섹션을 추가해주세요.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {sections.map((section) => (
                            <div
                                key={section.id}
                                className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${!section.is_active ? 'opacity-50' : ''
                                    }`}
                            >
                                <GripVertical size={20} className="text-slate-300 cursor-grab" />

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-800">{section.name}</span>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                            순서: {section.display_order}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openOrderModal(section)}
                                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                                        title="상품 순서 변경"
                                    >
                                        <List size={18} />
                                        <span className="text-xs font-medium">상품순서</span>
                                    </button>
                                    <button
                                        onClick={() => toggleActive(section)}
                                        className={`p-2 rounded-lg transition-colors ${section.is_active
                                            ? 'text-green-600 hover:bg-green-50'
                                            : 'text-slate-400 hover:bg-slate-100'
                                            }`}
                                        title={section.is_active ? '비활성화' : '활성화'}
                                    >
                                        {section.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(section)}
                                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="수정"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(section.id!)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="삭제"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingSection ? '섹션 수정' : '섹션 추가'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    섹션 이름
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="예: 추천 상품"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5B60]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    표시 순서
                                </label>
                                <input
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                    min="1"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5B60]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    레이아웃 설정 (한 줄 당 상품 수)
                                </label>
                                <select
                                    value={formData.layout_mode || 'grid-4'}
                                    onChange={(e) => setFormData({ ...formData, layout_mode: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5B60]"
                                >
                                    <option value="grid-4">4개 (기본)</option>
                                    <option value="grid-2">2개 (크게 - 강조형)</option>
                                    <option value="grid-3">3개 (보통)</option>
                                    <option value="grid-5">5개 (작게)</option>
                                </select>
                            </div>



                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-[#FF5B60] rounded focus:ring-[#FF5B60]"
                                />
                                <label htmlFor="is_active" className="text-sm text-slate-700">
                                    메인 페이지에 표시
                                </label>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#FF5B60] text-white rounded-lg hover:bg-[#FF5B60] transition-colors disabled:bg-slate-400"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            저장 중...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            저장
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Product Ordering Modal */}
            {orderingSection && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    상품 순서 변경
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {orderingSection.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setOrderingSection(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                            {loadingProducts ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin text-[#FF5B60]" size={30} />
                                </div>
                            ) : sectionProducts.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    이 섹션에 등록된 상품이 없습니다.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sectionProducts.map((product, idx) => (
                                        <div key={product.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm">
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => handleMoveProduct(idx, 'up')}
                                                    disabled={idx === 0}
                                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#FF5B60] disabled:opacity-30"
                                                >
                                                    <ArrowUp size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveProduct(idx, 'down')}
                                                    disabled={idx === sectionProducts.length - 1}
                                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#FF5B60] disabled:opacity-30"
                                                >
                                                    <ArrowDown size={16} />
                                                </button>
                                            </div>
                                            <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                                                <img src={product.image_url || 'https://via.placeholder.com/50'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-slate-800 truncate">{product.name}</h4>
                                                <p className="text-xs text-slate-500 truncate">{product.category}</p>
                                            </div>
                                            <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                                                {idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-200 flex gap-2">
                            <button
                                onClick={() => setOrderingSection(null)}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={saveOrder}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#FF5B60] text-white rounded-lg hover:bg-[#FF5B60] transition-colors disabled:bg-slate-400"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                순서 저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default SectionManager;
