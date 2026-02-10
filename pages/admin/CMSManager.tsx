import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Edit2, Trash2, X, Save, Loader2, Eye, EyeOff,
    Grid3X3, Menu, Image as ImageIcon, Upload, GripVertical, MessageSquare
} from 'lucide-react';
import {
    getAllQuickMenuItems, addQuickMenuItem, updateQuickMenuItem, deleteQuickMenuItem, QuickMenuItem,
    getAllTabMenuItems, addTabMenuItem, updateTabMenuItem, deleteTabMenuItem, TabMenuItem,
    getAllNavMenuItems, addNavMenuItem, updateNavMenuItem, deleteNavMenuItem, NavMenuItem,
    getAllBanners, addBanner, updateBanner, deleteBanner, Banner,
    getAllPopups, addPopup, updatePopup, deletePopup, Popup
} from '../../src/api/cmsApi';
import { getProducts, Product } from '../../src/api/productApi';
import { uploadImage } from '../../src/api/storageApi';

type TabType = 'quickmenu' | 'tabmenu' | 'banners' | 'popups';

export const CMSManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('quickmenu');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Data states
    const [quickMenuItems, setQuickMenuItems] = useState<QuickMenuItem[]>([]);
    const [tabMenuItems, setTabMenuItems] = useState<TabMenuItem[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [popups, setPopups] = useState<Popup[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Form states
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch individually to handle errors gracefully (e.g. if popups table doesn't exist yet)
            const quickMenuPromise = getAllQuickMenuItems().catch(e => { console.error("CMS Load Error (QuickMenu):", e); return []; });
            const tabMenuPromise = getAllTabMenuItems().catch(e => { console.error("CMS Load Error (TabMenu):", e); return []; });
            const bannerPromise = getAllBanners().catch(e => { console.error("CMS Load Error (Banners):", e); return []; });
            const popupPromise = getAllPopups().catch(e => { console.error("CMS Load Error (Popups):", e); return []; });
            const productsPromise = getProducts().catch(e => { console.error("CMS Load Error (Products):", e); return []; });

            const [quickMenu, tabMenu, bannerData, popupData, productsData] = await Promise.all([
                quickMenuPromise,
                tabMenuPromise,
                bannerPromise,
                popupPromise,
                productsPromise
            ]);

            setQuickMenuItems(quickMenu);
            setTabMenuItems(tabMenu);
            setBanners(bannerData);
            setPopups(popupData);
            setProducts(productsData);
        } catch (error) {
            console.error('Failed to load CMS data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingItem(null);
        if (activeTab === 'quickmenu') {
            setFormData({ name: '', link: '/', display_order: quickMenuItems.length + 1, is_active: true });
        } else if (activeTab === 'tabmenu') {
            setFormData({ name: '', link: '/', display_order: tabMenuItems.length + 1, is_active: true });
        } else if (activeTab === 'banners') {
            setFormData({ title: '', subtitle: '', image_url: '', link: '/', button_text: '바로가기', banner_type: 'hero', display_order: banners.length + 1, is_active: true, target_product_code: '' });
        } else if (activeTab === 'popups') {
            setFormData({ title: '', image_url: '', link: '/', start_date: '', end_date: '', display_order: popups.length + 1, is_active: true });
        }
        setShowModal(true);
    };

    const openEditModal = (item: any) => {
        setEditingItem(item);
        setFormData({ ...item });
        setShowModal(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드할 수 있습니다.');
            return;
        }
        setUploading(true);
        try {
            const imageUrl = await uploadImage(file);
            setFormData({ ...formData, image_url: imageUrl });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (activeTab === 'quickmenu') {
                if (editingItem) {
                    await updateQuickMenuItem(editingItem.id, formData);
                } else {
                    await addQuickMenuItem(formData);
                }
            } else if (activeTab === 'tabmenu') {
                if (editingItem) {
                    await updateTabMenuItem(editingItem.id, formData);
                } else {
                    await addTabMenuItem(formData);
                }
            } else if (activeTab === 'banners') {
                if (editingItem) {
                    await updateBanner(editingItem.id, formData);
                } else {
                    await addBanner(formData);
                }
            } else if (activeTab === 'popups') {
                // Handle empty dates as null
                const popupData = {
                    ...formData,
                    start_date: formData.start_date || null,
                    end_date: formData.end_date || null
                };

                if (editingItem) {
                    await updatePopup(editingItem.id, popupData);
                } else {
                    await addPopup(popupData);
                }
            }
            await loadData();
            setShowModal(false);
        } catch (error: any) {
            console.error('Save failed:', error);
            // Show detailed error message
            alert(`저장에 실패했습니다.\n\n오류 내용: ${error.message || JSON.stringify(error)}\n\n(Tip: 만약 'relation "popups" does not exist' 오류라면 데이터베이스에 테이블이 없는 것입니다. SQL 실행이 필요합니다.)`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            if (activeTab === 'quickmenu') {
                await deleteQuickMenuItem(id);
            } else if (activeTab === 'tabmenu') {
                await deleteTabMenuItem(id);
            } else if (activeTab === 'banners') {
                await deleteBanner(id);
            } else if (activeTab === 'popups') {
                await deletePopup(id);
            }
            await loadData();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const toggleActive = async (item: any) => {
        try {
            if (activeTab === 'quickmenu') {
                await updateQuickMenuItem(item.id, { is_active: !item.is_active });
            } else if (activeTab === 'tabmenu') {
                await updateTabMenuItem(item.id, { is_active: !item.is_active });
            } else if (activeTab === 'banners') {
                await updateBanner(item.id, { is_active: !item.is_active });
            } else if (activeTab === 'popups') {
                await updatePopup(item.id, { is_active: !item.is_active });
            }
            await loadData();
        } catch (error) {
            console.error('Toggle failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#FF5B60]" size={40} />
            </div>
        );
    }

    const tabs = [
        { id: 'quickmenu' as TabType, label: '아이콘 메뉴', icon: Grid3X3, count: quickMenuItems.length },
        { id: 'tabmenu' as TabType, label: '탭 메뉴', icon: Menu, count: tabMenuItems.length },
        { id: 'banners' as TabType, label: '배너', icon: ImageIcon, count: banners.length },
        { id: 'popups' as TabType, label: '팝업', icon: MessageSquare, count: popups.length },
    ];

    const currentItems = activeTab === 'quickmenu' ? quickMenuItems
        : activeTab === 'tabmenu' ? tabMenuItems
            : activeTab === 'banners' ? banners
                : popups;

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">CMS 관리</h1>
                    <p className="text-sm text-slate-500 mt-1">메인 페이지 UI 요소들을 관리합니다</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-[#FF5B60] text-white px-4 py-2 rounded-lg hover:bg-[#FF5B60] transition-colors"
                >
                    <Plus size={20} />
                    추가
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id
                            ? 'text-[#FF5B60] border-[#FF5B60]'
                            : 'text-slate-500 border-transparent hover:text-slate-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Items List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {currentItems.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        등록된 항목이 없습니다. 항목을 추가해주세요.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {currentItems.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                                <GripVertical size={20} className="text-slate-300 cursor-grab" />

                                {(activeTab === 'banners' || activeTab === 'popups') && item.image_url && (
                                    <img src={item.image_url} alt={item.title} className="w-20 h-12 object-cover rounded" />
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-800 truncate">
                                            {item.name || item.title}
                                        </span>
                                        {activeTab === 'banners' && (
                                            <span className={`text-xs px-2 py-0.5 rounded border ${item.banner_type === 'hero'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                }`}>
                                                {item.banner_type === 'hero' ? '메인 슬라이드' : '프로모션'}
                                            </span>
                                        )}
                                        {!item.is_active && (
                                            <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded">비활성</span>
                                        )}

                                        {activeTab === 'popups' && (
                                            <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                                                {item.start_date && item.end_date ? `${item.start_date} ~ ${item.end_date}` : '상시 노출'}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-slate-400">{item.link}</span>
                                </div>

                                <span className="text-xs text-slate-400">순서: {item.display_order}</span>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => toggleActive(item)}
                                        className={`p-2 rounded-lg transition-colors ${item.is_active ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'
                                            }`}
                                        title={item.is_active ? '비활성화' : '활성화'}
                                    >
                                        {item.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="수정"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingItem ? '수정' : '추가'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* QuickMenu Form */}
                            {activeTab === 'quickmenu' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">아이콘 이미지 (선택)</label>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={formData.image_url || ''}
                                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                                placeholder="이미지 URL 입력 또는 업로드"
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60] text-sm"
                                            />
                                            <input
                                                type="file"
                                                id="quickmenu-file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <div className="flex gap-2">
                                                <label
                                                    htmlFor="quickmenu-file"
                                                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium"
                                                >
                                                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                                                    이미지 업로드
                                                </label>
                                                {formData.image_url && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, image_url: '' })}
                                                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                    >
                                                        삭제
                                                    </button>
                                                )}
                                            </div>
                                            {formData.image_url && (
                                                <div className="relative w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                                                    <img src={formData.image_url} alt="Icon Preview" className="w-full h-full object-contain" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">링크</label>
                                        <input
                                            type="text"
                                            value={formData.link || ''}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            placeholder="/products?category=hotel"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">클릭 시 이동할 경로를 입력하세요.</p>
                                    </div>
                                </>
                            )}

                            {/* TabMenu Form */}
                            {activeTab === 'tabmenu' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">링크</label>
                                        <input
                                            type="text"
                                            value={formData.link || ''}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            placeholder="/products?category=notebook"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Banner Form */}
                            {activeTab === 'banners' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">배너 위치</label>
                                        <select
                                            value={formData.banner_type || 'hero'}
                                            onChange={(e) => setFormData({ ...formData, banner_type: e.target.value, tab_id: e.target.value === 'hero' ? null : formData.tab_id })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                        >
                                            <option value="hero">메인 슬라이드 (상단 전체 배너)</option>
                                            <option value="promo">프로모션 (탭 메뉴 하단)</option>
                                        </select>
                                    </div>

                                    {/* Tab selector - only show when banner_type is promo */}
                                    {formData.banner_type === 'promo' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">연결할 탭 메뉴</label>
                                            <select
                                                value={formData.tab_id || ''}
                                                onChange={(e) => setFormData({ ...formData, tab_id: e.target.value || null })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                                required
                                            >
                                                <option value="">탭을 선택하세요</option>
                                                {tabMenuItems.map((tab) => (
                                                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-slate-500 mt-1">선택한 탭을 클릭하면 이 배너가 표시됩니다.</p>
                                        </div>
                                    )}

                                    {/* Brand text - only show when banner_type is hero */}
                                    {formData.banner_type === 'hero' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">브랜드 텍스트</label>
                                            <input
                                                type="text"
                                                value={formData.brand_text || ''}
                                                onChange={(e) => setFormData({ ...formData, brand_text: e.target.value })}
                                                placeholder="행사어때"
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">제목 위에 표시되는 작은 텍스트 (비우면 기본값 사용)</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">제목</label>
                                        <input
                                            type="text"
                                            value={formData.title || ''}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">부제목</label>
                                        <input
                                            type="text"
                                            value={formData.subtitle || ''}
                                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">배너 이미지</label>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        {formData.image_url ? (
                                            <div className="relative">
                                                <img src={formData.image_url} alt="Banner" className="w-full h-32 object-cover rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, image_url: '' })}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-[#FF5B60] transition-colors"
                                            >
                                                {uploading ? (
                                                    <Loader2 className="animate-spin text-[#FF5B60]" size={20} />
                                                ) : (
                                                    <>
                                                        <Upload className="text-slate-400" size={20} />
                                                        <span className="text-sm text-slate-500">이미지 업로드</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">버튼 텍스트</label>
                                        <input
                                            type="text"
                                            value={formData.button_text || ''}
                                            onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">링크</label>
                                        <input
                                            type="text"
                                            value={formData.link || ''}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">연결할 상품 (선택)</label>
                                        <div className="space-y-2">
                                            <select
                                                value={formData.target_product_code || ''}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, target_product_code: e.target.value });
                                                }}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            >
                                                <option value="">상품 선택 없음</option>
                                                {products.map((product) => (
                                                    <option key={product.id} value={product.product_code || product.id}>
                                                        {product.name} ({product.product_code || 'No Code'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            선택 시 해당 상품의 상세 페이지로 자동 연결됩니다.
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Popup Form */}
                            {activeTab === 'popups' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">제목 (관리용)</label>
                                        <input
                                            type="text"
                                            value={formData.title || ''}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">팝업 이미지</label>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        {formData.image_url ? (
                                            <div className="relative">
                                                <img src={formData.image_url} alt="Popup" className="w-full h-auto object-contain rounded-lg max-h-[200px]" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, image_url: '' })}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-[#FF5B60] transition-colors"
                                            >
                                                {uploading ? (
                                                    <Loader2 className="animate-spin text-[#FF5B60]" size={20} />
                                                ) : (
                                                    <>
                                                        <Upload className="text-slate-400" size={20} />
                                                        <span className="text-sm text-slate-500">이미지 업로드</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">링크 (선택)</label>
                                        <input
                                            type="text"
                                            value={formData.link || ''}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            placeholder="https:// or /products"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">게시 시작일</label>
                                            <input
                                                type="date"
                                                value={formData.start_date || ''}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">게시 종료일</label>
                                            <input
                                                type="date"
                                                value={formData.end_date || ''}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">연결할 상품 (선택)</label>
                                        <div className="space-y-2">
                                            <select
                                                value={formData.target_product_code || ''}
                                                onChange={(e) => {
                                                    // If a product is selected, automatically set the link
                                                    const selectedProduct = products.find(p => (p.product_code === e.target.value || p.id === e.target.value));
                                                    setFormData({
                                                        ...formData,
                                                        target_product_code: e.target.value,
                                                        link: selectedProduct ? `/p/${selectedProduct.product_code || selectedProduct.id}` : formData.link
                                                    });
                                                }}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                            >
                                                <option value="">상품 선택 없음</option>
                                                {products.map((product) => (
                                                    <option key={product.id} value={product.product_code || product.id}>
                                                        {product.name} ({product.product_code || 'No Code'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            선택 시 해당 상품의 상세 페이지로 링크가 자동 설정됩니다.
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Common fields */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">표시 순서</label>
                                <input
                                    type="number"
                                    value={formData.display_order || 1}
                                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                                    min="1"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60]"
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#FF5B60] text-white rounded-lg hover:bg-[#FF5B60] disabled:bg-slate-400"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    저장
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CMSManager;
