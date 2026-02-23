import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, X, Save, Loader2, Tag, ChevronRight, ChevronDown, FolderTree
} from 'lucide-react';
import {
    getCategories, addCategory, updateCategory, deleteCategory, Category, CategoryTree, buildCategoryTree
} from '../../src/api/categoryApi';

const LEVEL_LABELS: { [key: number]: string } = {
    1: '대분류',
    2: '중분류',
    3: '소분류'
};

const LEVEL_COLORS: { [key: number]: string } = {
    1: 'bg-blue-100 text-blue-700 border-blue-200',
    2: 'bg-green-100 text-green-700 border-green-200',
    3: 'bg-purple-100 text-purple-700 border-purple-200'
};

export const CategoryManager: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        display_order: 0,
        parent_id: null as string | null,
        level: 1
    });
    const [saving, setSaving] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
            setCategoryTree(buildCategoryTree(data));
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const openAddModal = (parentId: string | null = null, level: number = 1) => {
        setEditingCategory(null);
        setFormData({
            name: '',
            display_order: categories.filter(c => c.parent_id === parentId).length + 1,
            parent_id: parentId,
            level: level
        });
        setShowModal(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            display_order: category.display_order,
            parent_id: category.parent_id || null,
            level: category.level || 1
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setSaving(true);
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id!, {
                    name: formData.name,
                    display_order: formData.display_order
                });
            } else {
                await addCategory({
                    name: formData.name,
                    display_order: formData.display_order,
                    parent_id: formData.parent_id,
                    level: formData.level
                });
            }
            await loadCategories();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to save category:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 카테고리를 삭제하시겠습니까?\n하위 카테고리가 있으면 삭제할 수 없습니다.')) return;

        try {
            await deleteCategory(id);
            await loadCategories();
        } catch (error: any) {
            console.error('Failed to delete category:', error);
            alert(error.message || '삭제에 실패했습니다.');
        }
    };

    // 부모 카테고리 이름 가져오기
    const getParentName = (parentId: string | null): string => {
        if (!parentId) return '없음 (최상위)';
        const parent = categories.find(c => c.id === parentId);
        return parent?.name || '알 수 없음';
    };

    // 트리 노드 렌더링
    const renderTreeNode = (node: CategoryTree, depth: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id!);
        const level = node.level || 1;
        const canAddChild = level < 3;

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-2 p-3 hover:bg-slate-50 transition-colors border-b border-slate-100`}
                    style={{ paddingLeft: `${depth * 24 + 16}px` }}
                >
                    {/* Expand/Collapse Button */}
                    <button
                        onClick={() => toggleNode(node.id!)}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${hasChildren ? 'text-slate-600' : 'text-transparent pointer-events-none'}`}
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {/* Level Badge */}
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${LEVEL_COLORS[level]}`}>
                        {LEVEL_LABELS[level]}
                    </span>

                    {/* Name */}
                    <span className="flex-1 font-medium text-slate-800">{node.name}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        {canAddChild && (
                            <button
                                onClick={() => openAddModal(node.id!, level + 1)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title={`${LEVEL_LABELS[level + 1]} 추가`}
                            >
                                <Plus size={16} />
                            </button>
                        )}
                        <button
                            onClick={() => openEditModal(node)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="수정"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => handleDelete(node.id!)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div>
                        {node.children!.map(child => renderTreeNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
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
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FolderTree size={24} />
                        카테고리 관리
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        3단계 카테고리 구조 (대분류 → 중분류 → 소분류)
                    </p>
                </div>
                <button
                    onClick={() => openAddModal(null, 1)}
                    className="flex items-center gap-2 bg-[#FF5B60] text-white px-4 py-2 rounded-lg hover:bg-[#002a5c] transition-colors"
                >
                    <Plus size={20} />
                    대분류 추가
                </button>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mb-4 text-sm">
                {[1, 2, 3].map(level => (
                    <span key={level} className={`px-3 py-1 rounded border ${LEVEL_COLORS[level]}`}>
                        {LEVEL_LABELS[level]}
                    </span>
                ))}
            </div>

            {/* Category Tree */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {categoryTree.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <FolderTree size={48} className="mx-auto mb-4 opacity-50" />
                        <p>등록된 카테고리가 없습니다.</p>
                        <p className="text-sm mt-1">대분류 추가 버튼을 클릭하여 시작하세요.</p>
                    </div>
                ) : (
                    <div>
                        {categoryTree.map(node => renderTreeNode(node))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingCategory ? '카테고리 수정' : `${LEVEL_LABELS[formData.level]} 추가`}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Parent Info (Read-only) */}
                            {formData.parent_id && (
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <span className="text-sm text-slate-500">상위 카테고리: </span>
                                    <span className="font-medium text-slate-700">{getParentName(formData.parent_id)}</span>
                                </div>
                            )}

                            {/* Level Badge */}
                            <div>
                                <span className={`inline-block px-3 py-1 text-sm font-medium rounded border ${LEVEL_COLORS[formData.level]}`}>
                                    {LEVEL_LABELS[formData.level]}
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    카테고리 이름
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={`예: ${formData.level === 1 ? 'IT 장비' : formData.level === 2 ? '노트북' : '맥북 프로'}`}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5B60]"
                                    required
                                    autoFocus
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001E45]"
                                />
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
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#001E45] text-white rounded-lg hover:bg-[#002a5c] transition-colors disabled:bg-slate-400"
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
        </div>
    );
};

export default CategoryManager;
