import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Edit2, Trash2, X, Save, Loader2, Eye, EyeOff,
    Grid3X3, Menu, Image as ImageIcon, Upload, GripVertical, MessageSquare, Tag, Check
} from 'lucide-react';
import {
    getAllQuickMenuItems, addQuickMenuItem, updateQuickMenuItem, deleteQuickMenuItem, QuickMenuItem,
    getAllTabMenuItems, addTabMenuItem, updateTabMenuItem, deleteTabMenuItem, TabMenuItem,
    getAllNavMenuItems, addNavMenuItem, updateNavMenuItem, deleteNavMenuItem, NavMenuItem,
    getAllBanners, addBanner, updateBanner, deleteBanner, Banner,
    getAllPopups, addPopup, updatePopup, deletePopup, Popup,
    getAllianceMembers, getAllAllianceMembers, addAllianceMember, updateAllianceMember, deleteAllianceMember,
    getAllAllianceCategories, addAllianceCategory, updateAllianceCategory, deleteAllianceCategory,
    AllianceMember, AllianceCategory, DEFAULT_ALLIANCE_CATEGORY_NAMES, normalizeAllianceCategoryName, getAllianceCategoryNames
} from '../../src/api/cmsApi';
import { getBasicProducts, Product } from '../../src/api/productApi';
import { uploadImage } from '../../src/api/storageApi';
import { RichHtmlEditor } from '../../components/ui/RichHtmlEditor';

type TabType = 'quickmenu' | 'tabmenu' | 'banners' | 'popups' | 'alliance';

type TabMenuCategoryOption = {
    value: string;
    label: string;
    link: string;
};

const appendTitleParam = (link: string, title: string) => {
    if (!link || link.includes('title=')) {
        return link;
    }

    const separator = link.includes('?') ? '&' : '?';
    return `${link}${separator}title=${encodeURIComponent(title)}`;
};

const buildParentRoute = (parent: NavMenuItem, navItems: NavMenuItem[]) => {
    const hasChildren = navItems.some((item) => item.category === parent.name);

    if (!hasChildren && parent.link && parent.link !== '#') {
        return appendTitleParam(parent.link, parent.name);
    }

    return `/products?category=${encodeURIComponent(parent.name)}&title=${encodeURIComponent(parent.name)}`;
};

const buildTabMenuCategoryOptions = (navItems: NavMenuItem[]): TabMenuCategoryOption[] =>
    navItems
        .filter((item) => !item.category)
        .sort((a, b) => a.display_order - b.display_order)
        .filter((parent) => {
            const hasChildren = navItems.some((item) => item.category === parent.name);
            return hasChildren || Boolean(parent.link?.startsWith('/products'));
        })
        .map((parent) => ({
            value: parent.id || parent.name,
            label: parent.name,
            link: buildParentRoute(parent, navItems),
        }));

const normalizeTabMenuLink = (link?: string | null) => {
    if (!link) return '';

    const [path, rawQuery = ''] = link.split('?');
    const params = new URLSearchParams(rawQuery);
    params.delete('title');
    const nextQuery = params.toString();

    return nextQuery ? `${path}?${nextQuery}` : path;
};

const resolveTabMenuCategoryKey = (
    item: Partial<TabMenuItem>,
    options: TabMenuCategoryOption[],
) => {
    const normalizedLink = normalizeTabMenuLink(item.link);
    const byLink = options.find((option) => normalizeTabMenuLink(option.link) === normalizedLink);

    if (byLink) {
        return byLink.value;
    }

    const byName = options.find((option) => option.label === item.name);
    return byName?.value || '';
};

export const CMSManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('quickmenu');
    const [allianceCategoryFilter, setAllianceCategoryFilter] = useState('전체');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showAllianceCategoryModal, setShowAllianceCategoryModal] = useState(false);
    const [allianceCategorySaving, setAllianceCategorySaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Data states
    const [quickMenuItems, setQuickMenuItems] = useState<QuickMenuItem[]>([]);
    const [tabMenuItems, setTabMenuItems] = useState<TabMenuItem[]>([]);
    const [navMenuItems, setNavMenuItems] = useState<NavMenuItem[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [popups, setPopups] = useState<Popup[]>([]);
    const [allianceMembers, setAllianceMembers] = useState<AllianceMember[]>([]);
    const [allianceCategories, setAllianceCategories] = useState<AllianceCategory[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Form states
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [newAllianceCategoryName, setNewAllianceCategoryName] = useState('');
    const [editingAllianceCategoryId, setEditingAllianceCategoryId] = useState<string | null>(null);
    const [editingAllianceCategoryName, setEditingAllianceCategoryName] = useState('');

    useEffect(() => {
        if (activeTab !== 'alliance') {
            setAllianceCategoryFilter('전체');
        }
    }, [activeTab]);

    useEffect(() => {
        void loadActiveTabData(activeTab);
    }, [activeTab]);

    useEffect(() => {
        const currentCategoryTabs = getAllianceCategoryNames(allianceCategories, allianceMembers);
        if (allianceCategoryFilter !== '전체' && !currentCategoryTabs.includes(allianceCategoryFilter)) {
            setAllianceCategoryFilter('전체');
        }
    }, [allianceCategories, allianceMembers, allianceCategoryFilter]);

    const tabMenuCategoryOptions = React.useMemo(
        () => buildTabMenuCategoryOptions(navMenuItems),
        [navMenuItems],
    );

    const getProductRoutingKey = (product: Product) => product.product_code || product.id || '';
    const heroBanners = banners.filter((banner) => banner.banner_type === 'hero');

    const getUploadFolder = (tab: TabType) => {
        if (tab === 'quickmenu') return 'quick-menu';
        if (tab === 'banners') return 'banners';
        if (tab === 'popups') return 'popups';
        if (tab === 'alliance') return 'alliance-logos';
        return 'products';
    };

    const getAllianceCategoryOptions = () => {
        const categories = getAllianceCategoryNames(allianceCategories, allianceMembers);
        return categories.length > 0 ? categories : [...DEFAULT_ALLIANCE_CATEGORY_NAMES];
    };

    const loadActiveTabData = async (tab: TabType, force = false) => {
        if (!force) {
            if (tab === 'quickmenu' && quickMenuItems.length > 0) return;
            if (tab === 'tabmenu' && tabMenuItems.length > 0 && navMenuItems.length > 0) return;
            if (tab === 'banners' && banners.length > 0) return;
            if (tab === 'popups' && popups.length > 0) return;
            if (tab === 'alliance' && allianceMembers.length > 0 && allianceCategories.length > 0) return;
        }

        setLoading(true);
        try {
            if (tab === 'quickmenu') {
                setQuickMenuItems(await getAllQuickMenuItems());
            } else if (tab === 'tabmenu') {
                const [tabMenuData, navMenuData] = await Promise.all([
                    getAllTabMenuItems(),
                    navMenuItems.length > 0 ? Promise.resolve(navMenuItems) : getAllNavMenuItems(),
                ]);
                setTabMenuItems(tabMenuData);
                setNavMenuItems(navMenuData);
            } else if (tab === 'banners') {
                const [bannerData, tabMenuData] = await Promise.all([
                    getAllBanners(),
                    tabMenuItems.length > 0 ? Promise.resolve(tabMenuItems) : getAllTabMenuItems(),
                ]);
                setBanners(bannerData);
                setTabMenuItems(tabMenuData);
            } else if (tab === 'popups') {
                const [popupData, productsData] = await Promise.all([
                    getAllPopups(),
                    products.length > 0 ? Promise.resolve(products) : getBasicProducts(),
                ]);
                setPopups(popupData);
                setProducts(productsData);
            } else if (tab === 'alliance') {
                const [allianceCategoryData, allianceData] = await Promise.all([
                    getAllAllianceCategories(),
                    getAllAllianceMembers(),
                ]);
                setAllianceCategories(allianceCategoryData);
                setAllianceMembers(allianceData);
            }
        } catch (error) {
            console.error('Failed to load CMS data:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshActiveTab = async () => {
        await loadActiveTabData(activeTab, true);
    };

    const openAddModal = () => {
        setEditingItem(null);
        if (activeTab === 'quickmenu') {
            setFormData({ name: '', link: '/', display_order: quickMenuItems.length + 1, is_active: true });
        } else if (activeTab === 'tabmenu') {
            setFormData({ name: '', link: '', selected_menu_key: '', display_order: tabMenuItems.length + 1, is_active: true });
        } else if (activeTab === 'banners') {
            setFormData({ title: '', subtitle: '', image_url: '', link: '/', button_text: '바로가기', brand_text: '', banner_type: 'hero', display_order: heroBanners.length + 1, is_active: true });
        } else if (activeTab === 'popups') {
            setFormData({ title: '', image_url: '', link: '/', start_date: '', end_date: '', display_order: popups.length + 1, is_active: true });
        } else if (activeTab === 'alliance') {
            const categoryOptions = getAllianceCategoryOptions();
            setFormData({
                name: '',
                category1: categoryOptions[0] || 'MICE 시설분과',
                category2: '호텔',
                address: '',
                phone: '',
                logo_url: '',
                content: '',
                display_order: allianceMembers.length + 1,
                is_active: true,
            });
        }
        setShowModal(true);
    };

    const openEditModal = (item: any) => {
        setEditingItem(item);
        if (activeTab === 'tabmenu') {
            setFormData({
                ...item,
                selected_menu_key: resolveTabMenuCategoryKey(item, tabMenuCategoryOptions),
            });
        } else {
            setFormData({ ...item });
        }
        setShowModal(true);
    };

    const applySelectedCategoryToTabMenu = (selectedKey: string) => {
        const selectedOption = tabMenuCategoryOptions.find((option) => option.value === selectedKey);

        setFormData((prev: any) => ({
            ...prev,
            selected_menu_key: selectedKey,
            name: selectedOption ? selectedOption.label : prev.name,
            link: selectedOption ? selectedOption.link : prev.link,
        }));
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
            const imageUrl = await uploadImage(file, getUploadFolder(activeTab));
            if (activeTab === 'alliance') {
                setFormData({ ...formData, logo_url: imageUrl });
            } else {
                setFormData({ ...formData, image_url: imageUrl });
            }
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
                const { selected_menu_key, ...tabMenuPayload } = formData;

                if (!selected_menu_key) {
                    throw new Error('탭 메뉴에 연결할 실제 메뉴 카테고리를 선택해 주세요.');
                }

                if (editingItem) {
                    await updateTabMenuItem(editingItem.id, tabMenuPayload);
                } else {
                    await addTabMenuItem(tabMenuPayload);
                }
            } else if (activeTab === 'banners') {
                const bannerPayload = {
                    ...formData,
                    banner_type: 'hero' as const,
                    tab_id: null,
                    target_product_code: '',
                };

                if (editingItem) {
                    await updateBanner(editingItem.id, bannerPayload);
                } else {
                    await addBanner(bannerPayload);
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
            } else if (activeTab === 'alliance') {
                if (editingItem) {
                    await updateAllianceMember(editingItem.id, formData);
                } else {
                    await addAllianceMember(formData);
                }
            }
            await refreshActiveTab();
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
            } else if (activeTab === 'alliance') {
                await deleteAllianceMember(id);
            }
            await refreshActiveTab();
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
            } else if (activeTab === 'alliance') {
                await updateAllianceMember(item.id, { is_active: !item.is_active });
            }
            await refreshActiveTab();
        } catch (error) {
            console.error('Toggle failed:', error);
        }
    };

    const handleAddAllianceCategory = async () => {
        const rawCategoryName = newAllianceCategoryName.trim();
        if (!rawCategoryName) return;
        if (rawCategoryName === '기타') {
            alert('기타 카테고리는 사용할 수 없습니다.');
            return;
        }

        setAllianceCategorySaving(true);
        try {
            await addAllianceCategory({
                name: rawCategoryName,
                display_order: allianceCategories.length + 1,
                is_active: true,
            });
            setNewAllianceCategoryName('');
            await loadActiveTabData('alliance', true);
        } catch (error: any) {
            console.error('Alliance category add failed:', error);
            alert(`카테고리 추가에 실패했습니다.\n\n오류 내용: ${error.message || JSON.stringify(error)}`);
        } finally {
            setAllianceCategorySaving(false);
        }
    };

    const handleUpdateAllianceCategory = async (id: string) => {
        const rawCategoryName = editingAllianceCategoryName.trim();
        if (!rawCategoryName) return;
        if (rawCategoryName === '기타') {
            alert('기타 카테고리는 사용할 수 없습니다.');
            return;
        }

        const currentCategory = allianceCategories.find((category) => category.id === id);
        if (!currentCategory) return;

        const previousName = normalizeAllianceCategoryName(currentCategory.name);
        const nextName = normalizeAllianceCategoryName(rawCategoryName);

        setAllianceCategorySaving(true);
        try {
            await updateAllianceCategory(id, { name: nextName });

            const affectedMembers = allianceMembers.filter(
                (member) => normalizeAllianceCategoryName(member.category1) === previousName
            );

            await Promise.all(
                affectedMembers
                    .filter((member) => member.id)
                    .map((member) => updateAllianceMember(member.id!, { category1: nextName }))
            );

            setEditingAllianceCategoryId(null);
            setEditingAllianceCategoryName('');
            await loadActiveTabData('alliance', true);
        } catch (error: any) {
            console.error('Alliance category update failed:', error);
            alert(`카테고리 수정에 실패했습니다.\n\n오류 내용: ${error.message || JSON.stringify(error)}`);
        } finally {
            setAllianceCategorySaving(false);
        }
    };

    const handleDeleteAllianceCategory = async (id: string) => {
        const category = allianceCategories.find((item) => item.id === id);
        if (!category) return;

        const normalizedName = normalizeAllianceCategoryName(category.name);
        const usedCount = allianceMembers.filter(
            (member) => normalizeAllianceCategoryName(member.category1) === normalizedName
        ).length;

        if (usedCount > 0) {
            alert(`이 카테고리를 사용 중인 회원사가 ${usedCount}개 있습니다. 먼저 회원사의 분과를 변경해주세요.`);
            return;
        }

        if (!confirm(`'${normalizedName}' 카테고리를 삭제하시겠습니까?`)) return;

        setAllianceCategorySaving(true);
        try {
            await deleteAllianceCategory(id);
            await loadActiveTabData('alliance', true);
        } catch (error: any) {
            console.error('Alliance category delete failed:', error);
            alert(`카테고리 삭제에 실패했습니다.\n\n오류 내용: ${error.message || JSON.stringify(error)}`);
        } finally {
            setAllianceCategorySaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#39B54A]" size={40} />
            </div>
        );
    }

    const tabs = [
        { id: 'quickmenu' as TabType, label: '아이콘 메뉴', icon: Grid3X3, count: quickMenuItems.length },
        { id: 'tabmenu' as TabType, label: '탭 메뉴', icon: Menu, count: tabMenuItems.length },
        { id: 'banners' as TabType, label: '배너', icon: ImageIcon, count: heroBanners.length },
        { id: 'popups' as TabType, label: '팝업', icon: MessageSquare, count: popups.length },
        { id: 'alliance' as TabType, label: 'MICE 회원사', icon: Grid3X3, count: allianceMembers.length },
    ];

    const allianceCategoryTabs = ['전체', ...getAllianceCategoryOptions()];
    const filteredAllianceMembers = allianceMembers.filter((member) =>
        allianceCategoryFilter === '전체' ||
        normalizeAllianceCategoryName(member.category1) === allianceCategoryFilter
    );

    const currentItems = activeTab === 'quickmenu' ? quickMenuItems
        : activeTab === 'tabmenu' ? tabMenuItems
            : activeTab === 'banners' ? heroBanners
                : activeTab === 'popups' ? popups
                    : filteredAllianceMembers;
    const allianceCategoryOptions = getAllianceCategoryOptions();

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
                    className="flex items-center gap-2 bg-[#39B54A] text-white px-4 py-2 rounded-lg hover:bg-[#39B54A] transition-colors"
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
                            ? 'text-[#39B54A] border-[#39B54A]'
                            : 'text-slate-500 border-transparent hover:text-slate-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{tab.count}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'alliance' && (
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {allianceCategoryTabs.map((category) => {
                            const categoryCount = category === '전체'
                                ? allianceMembers.length
                                : allianceMembers.filter((member) => normalizeAllianceCategoryName(member.category1) === category).length;

                            return (
                                <button
                                    key={category}
                                    onClick={() => setAllianceCategoryFilter(category)}
                                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${allianceCategoryFilter === category
                                        ? 'border-[#39B54A] bg-[#EEF9EF] text-[#2F9A3F]'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                        }`}
                                >
                                    {category}
                                    <span className={`rounded-full px-2 py-0.5 text-xs ${allianceCategoryFilter === category
                                        ? 'bg-white/80 text-[#2F9A3F]'
                                        : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {categoryCount}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setShowAllianceCategoryModal(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                        <Tag size={16} />
                        카테고리 관리
                    </button>
                </div>
            )}

            {activeTab === 'banners' && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    메인 중간 프로모 영역은 더 이상 수동 배너를 사용하지 않습니다.
                    탭 메뉴에 연결된 카테고리 기준으로 최신 상품이 자동 노출되며, 이 화면에서는 상단 메인 슬라이드 배너만 관리합니다.
                </div>
            )}

            {/* Items List */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                {currentItems.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        등록된 항목이 없습니다. 항목을 추가해주세요.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {currentItems.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 rounded-lg">
                                <GripVertical size={20} className="text-slate-300 cursor-grab" />

                                {((activeTab === 'banners' || activeTab === 'popups') && item.image_url) && (
                                    <img src={item.image_url} alt={item.title} className="w-20 h-12 object-cover rounded" loading="lazy" decoding="async" />
                                )}
                                {(activeTab === 'alliance' && item.logo_url) && (
                                    <div className="w-20 h-12 bg-gray-100 flex items-center justify-center rounded-lg">
                                        <img src={item.logo_url} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply" loading="lazy" decoding="async" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-800 truncate">
                                            {item.name || item.title}
                                        </span>
                                        {activeTab === 'banners' && (
                                            <span className="text-xs px-2 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">
                                                메인 슬라이드
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
                                        {activeTab === 'alliance' && (
                                            <>
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border
                                                    ${normalizeAllianceCategoryName(item.category1) === 'MICE 시설분과' ? 'text-[#e69b00] bg-[#fff9ea] border-[#ffe099]' :
                                                        normalizeAllianceCategoryName(item.category1) === 'MICE 기획 · 운영분과' ? 'text-[#3b5bdb] bg-[#edf2ff] border-[#bac8ff]' :
                                                            normalizeAllianceCategoryName(item.category1) === 'MICE 지원분과' ? 'text-[#0ca678] bg-[#e6fcf5] border-[#63e6be]' :
                                                                'text-gray-600 bg-gray-100 border-gray-300'}`}
                                                >
                                                    {normalizeAllianceCategoryName(item.category1)}
                                                </span>
                                                <span className="text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                    {item.category2}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        {activeTab === 'alliance' ? item.phone : item.link}
                                    </div>
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
                    <div className="bg-white rounded-lg w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
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
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
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
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A] text-sm"
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
                                                    <img src={formData.image_url} alt="Icon Preview" className="w-full h-full object-contain" decoding="async" />
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
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
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
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">연결할 메뉴 카테고리</label>
                                        <select
                                            value={formData.selected_menu_key || ''}
                                            onChange={(e) => applySelectedCategoryToTabMenu(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                            required
                                        >
                                            <option value="">메뉴 카테고리를 선택하세요</option>
                                            {tabMenuCategoryOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 mt-1">선택한 메뉴 카테고리를 기준으로 탭 이름과 링크가 자동으로 맞춰집니다.</p>
                                        {editingItem && formData.link && !formData.selected_menu_key && (
                                            <p className="text-xs text-amber-600 mt-2">기존 항목은 수동 링크로 저장되어 있어 자동 매핑되지 않았습니다. 메뉴 카테고리를 다시 선택하면 정리됩니다.</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">생성된 링크</label>
                                        <input
                                            type="text"
                                            value={formData.link || ''}
                                            readOnly
                                            className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-500 focus:ring-2 focus:ring-[#39B54A]"
                                            placeholder="메뉴 카테고리를 선택하면 자동 생성됩니다."
                                        />
                                    </div>
                                </>
                            )}

                            {/* Banner Form */}
                            {activeTab === 'banners' && (
                                <>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                        이 영역은 상단 메인 슬라이드 배너 전용입니다. 메인 중간 프로모 영역은 탭 메뉴 기준 최신 상품이 자동으로 노출됩니다.
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">브랜드 텍스트</label>
                                        <input
                                            type="text"
                                            value={formData.brand_text || ''}
                                            onChange={(e) => setFormData({ ...formData, brand_text: e.target.value })}
                                            placeholder="행사어때"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">제목 위에 표시되는 작은 텍스트 (비우면 기본값 사용)</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">제목</label>
                                        <input
                                            type="text"
                                            value={formData.title || ''}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">부제목</label>
                                        <input
                                            type="text"
                                            value={formData.subtitle || ''}
                                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
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
                                                <img src={formData.image_url} alt="Banner" className="w-full h-32 object-cover rounded-lg" decoding="async" />
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
                                                className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-[#39B54A] transition-colors"
                                            >
                                                {uploading ? (
                                                    <Loader2 className="animate-spin text-[#39B54A]" size={20} />
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
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">링크</label>
                                        <input
                                            type="text"
                                            value={formData.link || ''}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                        />
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
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
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
                                                <img src={formData.image_url} alt="Popup" className="w-full h-auto object-contain rounded-lg max-h-[200px]" decoding="async" />
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
                                                className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-[#39B54A] transition-colors"
                                            >
                                                {uploading ? (
                                                    <Loader2 className="animate-spin text-[#39B54A]" size={20} />
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
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
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
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">게시 종료일</label>
                                            <input
                                                type="date"
                                                value={formData.end_date || ''}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
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
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
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

                            {/* Alliance Form */}
                            {activeTab === 'alliance' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">상호명(이름)</label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">1차 카테고리 (분과)</label>
                                            <select
                                                value={formData.category1 || allianceCategoryOptions[0] || 'MICE 시설분과'}
                                                onChange={(e) => setFormData({ ...formData, category1: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                            >
                                                {allianceCategoryOptions.map((category) => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">2차 카테고리 (분류)</label>
                                            <input
                                                type="text"
                                                value={formData.category2 || ''}
                                                onChange={(e) => setFormData({ ...formData, category2: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                                placeholder="예: 호텔, 컨벤션센터 등"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">주소</label>
                                        <input
                                            type="text"
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                            placeholder="주소 입력"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">전화번호</label>
                                        <input
                                            type="text"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
                                            placeholder="042-000-0000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">로고 이미지</label>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        {formData.logo_url ? (
                                            <div className="relative border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-center">
                                                <img src={formData.logo_url} alt="Logo" className="h-20 object-contain mix-blend-multiply" decoding="async" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, logo_url: '' })}
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
                                                className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-[#39B54A] transition-colors"
                                            >
                                                {uploading ? (
                                                    <Loader2 className="animate-spin text-[#39B54A]" size={20} />
                                                ) : (
                                                    <>
                                                        <Upload className="text-slate-400" size={20} />
                                                        <span className="text-sm text-slate-500">이미지 업로드</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        <p className="text-xs text-slate-500 mt-1">배경이 투명하거나 흰색인 로고 이미지를 권장합니다.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">본문 내용</label>
                                        <RichHtmlEditor
                                            initialValue={formData.content || ''}
                                            onChange={(value) => setFormData((prev: any) => ({ ...prev, content: value }))}
                                            placeholder="회원사 상세페이지에 노출할 본문 내용을 입력하세요."
                                            imageFolder="description-images"
                                        />
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
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#39B54A]"
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
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#39B54A] text-white rounded-lg hover:bg-[#39B54A] disabled:bg-slate-400"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    저장
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAllianceCategoryModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                                <Tag size={18} className="text-[#39B54A]" />
                                회원사 카테고리 관리
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAllianceCategoryModal(false);
                                    setEditingAllianceCategoryId(null);
                                    setEditingAllianceCategoryName('');
                                }}
                                className="text-slate-400 transition-colors hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newAllianceCategoryName}
                                    onChange={(e) => setNewAllianceCategoryName(e.target.value)}
                                    placeholder="새 카테고리명 입력"
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#39B54A] focus:ring-2 focus:ring-[#39B54A]/10"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddAllianceCategory();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddAllianceCategory}
                                    disabled={allianceCategorySaving || !newAllianceCategoryName.trim()}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#39B54A] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2F9A3F] disabled:bg-slate-300"
                                >
                                    {allianceCategorySaving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                    추가
                                </button>
                            </div>

                            <div className="max-h-[420px] space-y-2 overflow-y-auto">
                                {allianceCategories.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                                        <Tag size={28} className="mx-auto mb-3 text-slate-300" />
                                        <p>등록된 카테고리가 없습니다.</p>
                                        <p className="mt-1 text-xs">먼저 SQL 파일을 실행한 뒤 카테고리를 추가해주세요.</p>
                                    </div>
                                ) : (
                                    allianceCategories
                                        .filter((category) => category.is_active !== false)
                                        .sort((a, b) => a.display_order - b.display_order)
                                        .map((category, index) => {
                                            const usedCount = allianceMembers.filter(
                                                (member) =>
                                                    normalizeAllianceCategoryName(member.category1) === normalizeAllianceCategoryName(category.name)
                                            ).length;

                                            return (
                                                <div
                                                    key={category.id}
                                                    className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-colors hover:border-slate-200"
                                                >
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                                                        {index + 1}
                                                    </span>

                                                    {editingAllianceCategoryId === category.id ? (
                                                        <div className="flex flex-1 gap-2">
                                                            <input
                                                                type="text"
                                                                value={editingAllianceCategoryName}
                                                                onChange={(e) => setEditingAllianceCategoryName(e.target.value)}
                                                                className="flex-1 rounded-lg border border-[#39B54A] px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[#39B54A]/10"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleUpdateAllianceCategory(category.id!);
                                                                    }
                                                                    if (e.key === 'Escape') {
                                                                        setEditingAllianceCategoryId(null);
                                                                        setEditingAllianceCategoryName('');
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateAllianceCategory(category.id!)}
                                                                className="rounded-lg p-2 text-[#39B54A] transition-colors hover:bg-[#EEF9EF]"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingAllianceCategoryId(null);
                                                                    setEditingAllianceCategoryName('');
                                                                }}
                                                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                                    {normalizeAllianceCategoryName(category.name)}
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-slate-400">
                                                                    사용 중 회원사 {usedCount}개
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingAllianceCategoryId(category.id!);
                                                                        setEditingAllianceCategoryName(normalizeAllianceCategoryName(category.name));
                                                                    }}
                                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[#EEF9EF] hover:text-[#39B54A]"
                                                                    title="수정"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteAllianceCategory(category.id!)}
                                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
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

                            <p className="text-center text-xs text-slate-400">
                                카테고리명을 수정하면 기존 회원사의 1차 카테고리 값도 함께 변경됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CMSManager;
