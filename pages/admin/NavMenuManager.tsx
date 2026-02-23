import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, GripVertical, X, Save, ToggleLeft, ToggleRight, Menu as MenuIcon, ChevronRight, Folder, FileText } from 'lucide-react';
import { getAllNavMenuItems, addNavMenuItem, updateNavMenuItem, deleteNavMenuItem, NavMenuItem } from '../../src/api/cmsApi';

export const NavMenuManager = () => {
    const [items, setItems] = useState<NavMenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Selection State
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'parent' | 'child'>('parent');
    const [editingItem, setEditingItem] = useState<NavMenuItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        link: '',
        category: '', // Used as Parent Name
        display_order: 0,
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const navData = await getAllNavMenuItems();
            setItems(navData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Derived Lists
    const parentItems = items.filter(i => !i.category).sort((a, b) => a.display_order - b.display_order);

    // Check for Orphan Groups (categories that exist in children but have no matching Parent Item)
    const activeParentNames = parentItems.map(p => p.name);
    const orphanItems = items.filter(i => i.category && !activeParentNames.includes(i.category));
    const orphanCategories = [...new Set(orphanItems.map(i => i.category!))];

    // Unified Groups List for UI
    const allGroups = [
        ...parentItems.map(p => ({ type: 'real', ...p })),
        ...orphanCategories.map(cat => ({
            type: 'implicit',
            id: `implicit-${cat}`,
            name: cat,
            display_order: 9999,
            is_active: true, // Implicit groups are effectively active if they have children
            category: null
        } as any)) // Cast to match shape roughly or handle in render
    ];

    const selectedGroup = allGroups.find(g => g.id === selectedParentId);

    // Child items belong to the selected parent by name matching
    const childItems = selectedGroup
        ? items.filter(i => i.category === selectedGroup.name).sort((a, b) => a.display_order - b.display_order)
        : [];

    // Use 'selectedGroup' instead of 'selectedParent' for the rest of the component
    // We need to alias it or update references. Let's alias it to minimize diffs, 
    // but we need to be careful about 'selectedParent' usage in Modal logic.
    const selectedParent = selectedGroup;

    const openModal = (type: 'parent' | 'child', item?: NavMenuItem) => {
        setModalType(type);
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                link: item.link,
                category: item.category || '',
                display_order: item.display_order,
                is_active: item.is_active
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                link: type === 'parent' ? '#' : '/products',
                category: type === 'child' && selectedParent ? selectedParent.name : '',
                display_order: type === 'parent' ? parentItems.length : childItems.length,
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
            // Validate: If changing parent name, we might warn user? 
            // Ideally we should update children's category field too if parent name changes. 
            // For now, simplify: assume parent name change breaks link (or handle it).

            let finalData = { ...formData };

            if (editingItem?.id) {
                // If Parent Name Changed, update children
                if (modalType === 'parent' && editingItem.name !== formData.name) {
                    // Find children with old name
                    const children = items.filter(i => i.category === editingItem.name);
                    await Promise.all(children.map(c => updateNavMenuItem(c.id!, { category: formData.name })));
                }

                await updateNavMenuItem(editingItem.id, finalData);
            } else {
                await addNavMenuItem(finalData);
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

    const handleDelete = async (item: NavMenuItem | any) => {
        if (!confirm('정말 삭제하시겠습니까? 하위 메뉴가 있다면 함께 연결이 끊길 수 있습니다.')) return;

        try {
            if (item.id && String(item.id).startsWith('implicit-')) {
                // Deleting an implicit group = Delete ALL children of this category
                const categoryName = item.name;
                const children = items.filter(i => i.category === categoryName);
                await Promise.all(children.map(c => deleteNavMenuItem(c.id!)));
            } else {
                // Normal Item Delete
                await deleteNavMenuItem(item.id!);
            }

            loadData();
            if (selectedParentId === item.id) setSelectedParentId(null);
        } catch (e) {
            alert('삭제 실패');
        }
    };

    const toggleActive = async (item: NavMenuItem) => {
        try {
            const updated = await updateNavMenuItem(item.id!, { is_active: !item.is_active });
            setItems(items.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
        } catch (e) {
            console.error('Failed to toggle active:', e);
        }
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">전체 메뉴 관리</h2>
                    <p className="text-slate-500 text-sm mt-1">웹사이트 전체 메뉴(사이트맵) 구조를 관리합니다.</p>
                </div>
            </div>

            <div className="flex gap-6 flex-1 h-full overflow-hidden">
                {/* Left: Parent Groups (Depth 1) */}
                <div className="w-1/3 bg-white rounded-xl shadow-md flex flex-col border border-slate-200">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center rounded-t-xl">
                        <h3 className="font-bold flex items-center gap-2"><Folder size={18} className="text-[#FF5B60]" /> 1차 메뉴 (그룹)</h3>
                        <button onClick={() => openModal('parent')} className="text-xs bg-[#FF5B60] text-white px-2 py-1.5 rounded hover:bg-slate-800 transition flex items-center gap-1"><Plus size={14} /> 그룹 추가</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {allGroups.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedParentId(p.id!)}
                                className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all border ${selectedParentId === p.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {p.type === 'real' ? (
                                        <span className="text-xs font-bold w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-slate-500">{p.display_order}</span>
                                    ) : (
                                        <span className="text-[10px] font-bold px-1 py-0.5 bg-red-50 text-red-400 rounded border border-red-100">자동</span>
                                    )}
                                    <span className={`font-medium ${selectedParentId === p.id ? 'text-[#FF5B60]' : 'text-slate-700'}`}>{p.name}</span>
                                    {p.type === 'real' && !p.is_active && <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">숨김</span>}
                                </div>
                                <div className="flex items-center gap-1">
                                    {p.type === 'real' ? (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); toggleActive(p as NavMenuItem); }} className="p-1.5 text-slate-400 hover:text-green-600 rounded">
                                                {p.is_active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); openModal('parent', p as NavMenuItem); }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                                        </>
                                    ) : (
                                        <span className="text-[10px] text-red-300 mr-2">유령항목</span>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                    <ChevronRight size={16} className={`transition-transform ${selectedParentId === p.id ? 'text-blue-500 translate-x-1' : 'text-slate-300'}`} />
                                </div>
                            </div>
                        ))}
                        {allGroups.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">등록된 1차 메뉴가 없습니다.</div>}
                    </div>
                </div>

                {/* Right: Child Items (Depth 2) */}
                <div className="flex-1 bg-white rounded-xl shadow-md flex flex-col border border-slate-200">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center rounded-t-xl">
                        <h3 className="font-bold flex items-center gap-2">
                            <FileText size={18} className="text-[#FF5B60]" />
                            2차 메뉴 (하위 항목)
                            {selectedParent && <span className="text-slate-400 font-normal text-sm ml-2">- {selectedParent.name}</span>}
                        </h3>
                        <button
                            onClick={() => selectedParent ? openModal('child') : alert('좌측에서 1차 메뉴(그룹)를 먼저 선택해주세요.')}
                            disabled={!selectedParent}
                            className="text-xs bg-[#FF5B60] text-white px-2 py-1.5 rounded hover:bg-slate-800 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} /> 메뉴 추가
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {!selectedParent ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <MenuIcon size={48} className="mb-4 opacity-20" />
                                <p>좌측에서 관리할 1차 메뉴 그룹을 선택해주세요.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(selectedParent as any).type === 'implicit' && (
                                    <div className="bg-red-50 text-red-800 p-3 rounded mb-4 text-sm flex items-center gap-2 border border-red-100">
                                        <span>⚠️ 이 그룹은 실제 그룹(1차 메뉴)이 존재하지 않지만, DB에 남아있는 메뉴 항목들로 인해 표시되었습니다. <br />삭제하려면 좌측 휴지통 아이콘을 눌러주세요 (이 그룹의 모든 항목이 삭제됩니다).</span>
                                    </div>
                                )}
                                {childItems.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                                        이 그룹에 등록된 하위 메뉴가 없습니다.
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="py-2 px-3 text-left w-16">순서</th>
                                                <th className="py-2 px-3 text-left">메뉴명</th>
                                                <th className="py-2 px-3 text-left">이동 링크</th>
                                                <th className="py-2 px-3 text-center w-20">상태</th>
                                                <th className="py-2 px-3 text-center w-24">관리</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {childItems.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="py-2 px-3 text-slate-500">{item.display_order}</td>
                                                    <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                                                    <td className="py-2 px-3 text-slate-500 truncate max-w-[200px]">{item.link}</td>
                                                    <td className="py-2 px-3 text-center">
                                                        <button onClick={() => toggleActive(item)} className="align-middle">
                                                            {item.is_active
                                                                ? <ToggleRight size={24} className="text-green-500" />
                                                                : <ToggleLeft size={24} className="text-slate-300" />
                                                            }
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-3 flex justify-center gap-1">
                                                        <button onClick={() => openModal('child', item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                                                        <button onClick={() => handleDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold text-lg">{modalType === 'parent' ? '1차 메뉴 그룹' : '2차 하위 메뉴'} {editingItem ? '수정' : '추가'}</h3>
                            <button onClick={closeModal}><X size={24} className="text-slate-400 hover:text-black" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">메뉴명 *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60] outline-none" placeholder="메뉴 이름 입력" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">이동 링크</label>
                                <div className="flex gap-2">
                                    <input type="text" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60] outline-none text-sm" placeholder="예: /products" />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{modalType === 'parent' ? '그룹명으로만 사용하려면 # 을 입력하세요.' : '클릭 시 이동할 주소입니다.'}</p>
                            </div>

                            <div className="flex justify-between gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">표시 순서</label>
                                    <input type="number" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg outline-none" />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 accent-[#FF5B60]" />
                                        <span className="text-sm font-medium">노출 활성화</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg hover:bg-slate-50">취소</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#FF5B60] text-white rounded-lg hover:bg-slate-800 disabled:opacity-50">
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
