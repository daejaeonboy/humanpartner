import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, ToggleLeft, ToggleRight, List } from 'lucide-react';
import { getAllGnbMenuItems, addGnbMenuItem, updateGnbMenuItem, deleteGnbMenuItem, GnbMenuItem } from '../../src/api/cmsApi';

export const GnbManager = () => {
    const [items, setItems] = useState<GnbMenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<GnbMenuItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        link: '',
        display_order: 0,
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getAllGnbMenuItems();
            setItems(data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item?: GnbMenuItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                link: item.link,
                display_order: item.display_order,
                is_active: item.is_active
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                link: '/',
                display_order: items.length + 1,
                is_active: true
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingItem?.id) {
                await updateGnbMenuItem(editingItem.id, formData);
            } else {
                await addGnbMenuItem(formData);
            }
            await loadData();
            closeModal();
        } catch (error) {
            console.error('Failed to save:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: GnbMenuItem) => {
        if (!confirm(`'${item.name}' 메뉴를 삭제하시겠습니까?`)) return;

        try {
            await deleteGnbMenuItem(item.id!);
            loadData();
        } catch (e) {
            alert('삭제 실패');
        }
    };

    const toggleActive = async (item: GnbMenuItem) => {
        try {
            await updateGnbMenuItem(item.id!, { is_active: !item.is_active });
            setItems(items.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
        } catch (e) {
            console.error('Failed to toggle active:', e);
        }
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-[#FF5B60]" /></div>;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">상단 GNB 관리</h2>
                    <p className="text-slate-500 text-sm mt-1">상단바(Header)에 표시되는 메인 네비게이션 메뉴를 관리합니다.</p>
                </div>
                <button onClick={() => openModal()} className="bg-[#FF5B60] text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition flex items-center gap-2">
                    <Plus size={18} /> GNB 메뉴 추가
                </button>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                    <List size={18} className="text-[#FF5B60]" />
                    <h3 className="font-bold">GNB 항목 목록</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                            등록된 GNB 메뉴가 없습니다.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 text-left w-20">순서</th>
                                    <th className="py-3 px-4 text-left">메뉴명</th>
                                    <th className="py-3 px-4 text-left">이동 링크</th>
                                    <th className="py-3 px-4 text-center w-24">상태</th>
                                    <th className="py-3 px-4 text-center w-28">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4 text-slate-500 font-medium">{item.display_order}</td>
                                        <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>
                                        <td className="py-3 px-4 text-slate-500 truncate max-w-[300px]">{item.link}</td>
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => toggleActive(item)} className="align-middle">
                                                {item.is_active
                                                    ? <ToggleRight size={28} className="text-green-500 hover:text-green-600 transition-colors" />
                                                    : <ToggleLeft size={28} className="text-slate-300 hover:text-slate-400 transition-colors" />
                                                }
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 flex justify-center gap-2">
                                            <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(item)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-5 border-b">
                            <h3 className="font-bold text-lg">{editingItem ? 'GNB 메뉴 수정' : 'GNB 메뉴 추가'}</h3>
                            <button onClick={closeModal}><X size={24} className="text-slate-400 hover:text-slate-600 transition-colors" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1.5">메뉴명 (표시할 텍스트)</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF5B60] outline-none transition-all" placeholder="예: 회사소개" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1.5">이동 링크 (페이지 경로)</label>
                                <input required type="text" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF5B60] outline-none transition-all text-sm" placeholder="예: /company 또는 /product-list?sectionId=..." />
                                <p className="text-xs text-slate-400 mt-1.5">클릭 시 이동할 주소를 입력해주세요.</p>
                            </div>

                            <div className="flex justify-between gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-800 mb-1.5">표시 순서</label>
                                    <input required type="number" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none transition-all" />
                                </div>
                                <div className="flex items-center pt-7">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 accent-[#FF5B60] cursor-pointer" />
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800 transition-colors">노출 활성화</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">취소</button>
                                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#FF5B60] text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 min-w-[100px]">
                                    {saving ? '저장 중...' : '저장하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
