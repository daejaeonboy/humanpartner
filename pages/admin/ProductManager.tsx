import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Save, Loader2, Upload, Image as ImageIcon, Grid3X3, Bold, Italic, Underline } from 'lucide-react';
import { getProducts, addProduct, updateProduct, deleteProduct, Product } from '../../src/api/productApi';
import { getSections, getProductSections, setProductSections, Section } from '../../src/api/sectionApi';
import { getAllNavMenuItems, NavMenuItem } from '../../src/api/cmsApi';
import { uploadImage } from '../../src/api/storageApi';

// 간단한 에디터 컴포넌트
const SimpleEditor = ({ initialValue, onChange }: { initialValue: string, onChange: (val: string) => void }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (contentRef.current && initialValue && contentRef.current.innerHTML !== initialValue) {
            contentRef.current.innerHTML = initialValue;
        }
    }, [initialValue]);

    const handleInput = () => {
        if (contentRef.current) onChange(contentRef.current.innerHTML);
    };

    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        handleInput();
        contentRef.current?.focus();
    };

    const handleImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setUploading(true);
                try {
                    const url = await uploadImage(file, 'description-images');
                    execCmd('insertImage', url);
                } catch (error) {
                    alert('이미지 업로드 실패');
                } finally {
                    setUploading(false);
                }
            }
        };
        input.click();
    };

    return (
        <div className="border border-slate-300 rounded-lg overflow-hidden flex flex-col h-72">
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1 items-center">
                <button type="button" onClick={() => execCmd('bold')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700"><Bold size={18} /></button>
                <button type="button" onClick={() => execCmd('italic')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700"><Italic size={18} /></button>
                <button type="button" onClick={() => execCmd('underline')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700"><Underline size={18} /></button>
                <div className="w-px h-6 bg-slate-300 mx-1"></div>
                <button type="button" onClick={handleImage} disabled={uploading} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-1">
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                    <span className="text-xs font-medium">이미지</span>
                </button>
            </div>
            <div ref={contentRef} className="flex-1 p-4 overflow-y-auto outline-none prose prose-sm max-w-none bg-white" contentEditable onInput={handleInput} />
        </div>
    );
};

export const ProductManager = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [menuItems, setMenuItems] = useState<NavMenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '', category: '', price: 0, description: '', short_description: '', image_url: '', stock: 99999, discount_rate: 0,
        product_type: 'basic' as any,
        basic_components: [] as any[], additional_components: [] as any[],
        place_components: [] as any[], food_components: [] as any[],
    });

    const [viewMode, setViewMode] = useState<'products' | 'options'>('products');
    const [viewTab, setViewTab] = useState<'essential' | 'additional' | 'place' | 'food'>('additional');
    const [selectedParentCategoryFilter, setSelectedParentCategoryFilter] = useState<string | null>(null);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

    // UI 토글 상태
    const [useAdditional, setUseAdditional] = useState(false);
    const [usePlace, setUsePlace] = useState(false);
    const [useFood, setUseFood] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [p, s, m] = await Promise.all([getProducts(), getSections(), getAllNavMenuItems()]);
            setProducts(p); setSections(s); setMenuItems(m);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const resetForm = () => {
        setFormData({
            name: '', category: '', price: 0, description: '', short_description: '', image_url: '', stock: 99999, discount_rate: 0,
            product_type: 'basic',
            basic_components: [], additional_components: [], place_components: [], food_components: [],
        });
        setEditingProduct(null); setSelectedSections([]);
        setUseAdditional(false); setUsePlace(false); setUseFood(false);
        setSelectedParentCategory('');
        setShowForm(false);
    };

    const [selectedParentCategory, setSelectedParentCategory] = useState('');

    const handleEdit = async (product: Product) => {
        setEditingProduct(product);
        setFormData({
            ...formData,
            name: product.name, category: product.category, price: product.price,
            description: product.description || '', short_description: product.short_description || '',
            image_url: product.image_url || '',
            stock: product.stock, discount_rate: product.discount_rate || 0,
            product_type: product.product_type || 'basic',
            basic_components: product.basic_components || [],
            additional_components: product.additional_components || [],
            place_components: product.place_components || [],
            food_components: product.food_components || [],
        });
        setUseAdditional((product.additional_components || []).length > 0);
        setUsePlace((product.place_components || []).length > 0);
        setUseFood((product.food_components || []).length > 0);

        // Derive Parent Category from the product's category (which is a Child Name)
        // Find the menu item that matches key=product.category
        // It should have a 'category' field pointing to its parent.
        // Since 'menuItems' might not be fully loaded if we came straight here, ensuring we look it up.
        // We can assume menuItems is updated since we loadData on mount.

        const childItem = menuItems.find(i => i.name === product.category);
        if (childItem && childItem.category) {
            setSelectedParentCategory(childItem.category);
        } else {
            // Fallback or Top Level Item
            setSelectedParentCategory('');
        }

        const s = await getProductSections(product.id!);
        setSelectedSections(s);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const clean = (arr: any[]) => (arr || []).filter(i => i.name).map(({ _category, ...rest }) => rest);
            const data = {
                ...formData,
                basic_components: clean(formData.basic_components),
                additional_components: clean(formData.additional_components),
                place_components: clean(formData.place_components),
                food_components: clean(formData.food_components),
            };

            let id;
            if (editingProduct) {
                await updateProduct(editingProduct.id!, data);
                id = editingProduct.id!;
            } else {
                const res = await addProduct(data);
                id = res.id!;
            }
            await setProductSections(id, selectedSections);
            await loadData(); resetForm();
            alert('저장되었습니다.');
        } catch (error: any) {
            alert(`저장 실패: ${error.message}`);
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await deleteProduct(id);
            await loadData();
        } catch (error) {
            console.error('Failed to delete product:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const toggleSection = (sectionId: string) => {
        setSelectedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadImage(file);
            setFormData({ ...formData, image_url: url });
        } catch (error) { alert('업로드 실패'); } finally { setUploading(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#FF5B60]" size={40} /></div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* 상단 탭: 패키지 관리 vs 공통 옵션 관리 */}
            <div className="flex border-b mb-6">
                <button onClick={() => setViewMode('products')} className={`px-6 py-3 font-bold transition-all ${viewMode === 'products' ? 'border-b-2 border-[#FF5B60] text-[#FF5B60]' : 'text-slate-400'}`}>패키지 상품 관리</button>
                <button onClick={() => setViewMode('options')} className={`px-6 py-3 font-bold transition-all ${viewMode === 'options' ? 'border-b-2 border-[#FF5B60] text-[#FF5B60]' : 'text-slate-400'}`}>공통 옵션 관리</button>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{viewMode === 'products' ? '패키지 목록' : '품목 목록'}</h2>
                <button
                    onClick={() => {
                        const type = viewMode === 'products' ? 'basic' : viewTab;
                        setFormData({ ...formData, product_type: type });
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 bg-[#FF5B60] text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all font-medium"
                >
                    <Plus size={20} /> {viewMode === 'products' ? '새 패키지 추가' : '새 옵션 품목 추가'}
                </button>
            </div>

            {/* 패키지 상품 관리 - 계층형 카테고리 필터 */}
            {viewMode === 'products' && (() => {
                const packageProducts = products.filter(p => p.product_type === 'basic' || !p.product_type);

                // 상품에 있는 카테고리(중분류) 목록
                const productCategories = new Set(packageProducts.map(p => p.category).filter(Boolean) as string[]);

                // 대분류 목록: 상품이 있는 중분류의 상위 카테고리
                const parentMenus = menuItems
                    .filter(m => !m.category) // 대분류는 category가 null
                    .filter(parent => {
                        // 해당 대분류의 중분류 중 상품이 있는 것이 있는지 확인
                        const children = menuItems.filter(child => child.category === parent.name);
                        return children.some(child => productCategories.has(child.name));
                    })
                    .sort((a, b) => a.display_order - b.display_order);

                // 선택된 대분류의 중분류 (상품이 있는 것만)
                const childMenus = selectedParentCategoryFilter
                    ? menuItems
                        .filter(m => m.category === selectedParentCategoryFilter)
                        .filter(child => productCategories.has(child.name))
                        .sort((a, b) => a.display_order - b.display_order)
                    : [];

                if (parentMenus.length === 0) return null;

                return (
                    <div className="space-y-3 mb-6">
                        {/* 대분류 탭 (1차 메뉴) */}
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                            <button
                                onClick={() => {
                                    setSelectedParentCategoryFilter(null);
                                    setSelectedCategoryFilter(null);
                                }}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedParentCategoryFilter === null
                                    ? 'bg-white text-[#FF5B60] shadow-sm'
                                    : 'text-slate-500'
                                    }`}
                            >
                                전체 ({packageProducts.length})
                            </button>
                            {parentMenus.map(parent => {
                                const children = menuItems.filter(c => c.category === parent.name);
                                const count = packageProducts.filter(p => children.some(c => c.name === p.category)).length;
                                return (
                                    <button
                                        key={parent.id}
                                        onClick={() => {
                                            setSelectedParentCategoryFilter(parent.name);
                                            setSelectedCategoryFilter(null);
                                        }}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedParentCategoryFilter === parent.name
                                            ? 'bg-white text-[#FF5B60] shadow-sm'
                                            : 'text-slate-500'
                                            }`}
                                    >
                                        {parent.name} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* 중분류 탭 (2차 메뉴) - 대분류 선택 시만 표시 */}
                        {selectedParentCategoryFilter && childMenus.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategoryFilter(null)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedCategoryFilter === null
                                        ? 'bg-[#FF5B60] text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    전체 ({packageProducts.filter(p => childMenus.some(c => c.name === p.category)).length})
                                </button>
                                {childMenus.map(child => {
                                    const count = packageProducts.filter(p => p.category === child.name).length;
                                    return (
                                        <button
                                            key={child.id}
                                            onClick={() => setSelectedCategoryFilter(child.name)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedCategoryFilter === child.name
                                                ? 'bg-[#FF5B60] text-white shadow-sm'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {child.name} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })()}

            {viewMode === 'options' && (
                <div className="space-y-4 mb-6">
                    {/* 상품 타입 탭 */}
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                        {['additional', 'place', 'food'].map(t => (
                            <button
                                key={t}
                                onClick={() => {
                                    setViewTab(t as any);
                                    setSelectedCategoryFilter(null); // 탭 변경 시 카테고리 필터 초기화
                                }}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewTab === t ? 'bg-white text-[#FF5B60] shadow-sm' : 'text-slate-500'}`}
                            >
                                {t === 'additional' ? '기본/추가 상품' : t === 'place' ? '장소' : '음식'}
                            </button>
                        ))}
                    </div>

                    {/* 카테고리 필터 탭 */}
                    {(() => {
                        const filteredProducts = products.filter(p => {
                            if (viewTab === 'additional') return p.product_type === 'essential' || p.product_type === 'additional';
                            return p.product_type === viewTab;
                        });
                        const categories = Array.from(new Set(filteredProducts.map(p => p.category).filter(Boolean) as string[])).sort();

                        if (categories.length === 0) return null;

                        return (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategoryFilter(null)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedCategoryFilter === null
                                        ? 'bg-[#FF5B60] text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    전체 ({filteredProducts.length})
                                </button>
                                {categories.map(cat => {
                                    const count = filteredProducts.filter(p => p.category === cat).length;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategoryFilter(cat)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedCategoryFilter === cat
                                                ? 'bg-[#FF5B60] text-white shadow-sm'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {cat} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* 메인 폼 모달 */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1000px] max-h-[90vh] flex flex-col">
                        <div className="flex justify-between p-4 border-b bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-lg">{editingProduct ? '상품 수정' : '새 상품 등록'} <span className="text-sm font-normal text-slate-400">({formData.product_type})</span></h3>
                            <button onClick={resetForm} className="text-slate-400 hover:text-red-500"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* 기본 정보 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div><label className="block text-sm font-bold text-slate-700 mb-1">상품명 *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60] outline-none" /></div>
                                    <div><label className="block text-sm font-bold text-slate-700 mb-1">간단 소개 <span className="text-slate-400 font-normal text-xs">(상품명 아래 표시)</span></label><textarea value={formData.short_description} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} placeholder="예: 전시회와 박람회에 필요한 모든 것을 한번에!" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5B60] outline-none resize-none h-16" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">1차 메뉴 (대분류)</label>
                                            <select
                                                value={selectedParentCategory}
                                                onChange={(e) => {
                                                    setSelectedParentCategory(e.target.value);
                                                    setFormData({ ...formData, category: '' });
                                                }}
                                                className="w-full px-4 py-2 border rounded-lg outline-none bg-slate-50 focus:bg-white transition-colors"
                                            >
                                                <option value="">대분류 선택</option>
                                                {menuItems.filter(i => !i.category).sort((a, b) => a.display_order - b.display_order).map(parent => (
                                                    <option key={parent.id} value={parent.name}>{parent.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">2차 메뉴 (중분류) *</label>
                                            <select
                                                required
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg outline-none"
                                                disabled={!selectedParentCategory}
                                            >
                                                <option value="">
                                                    {!selectedParentCategory ? '대분류를 먼저 선택하세요' : '중분류 선택'}
                                                </option>
                                                {selectedParentCategory && menuItems
                                                    .filter(i => i.category === selectedParentCategory)
                                                    .sort((a, b) => a.display_order - b.display_order)
                                                    .map(child => (
                                                        <option key={child.id} value={child.name}>{child.name}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-bold text-slate-700 mb-1">가격 (원) *</label><input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                                        <div><label className="block text-sm font-bold text-slate-700 mb-1">할인율 (%)</label><input type="number" value={formData.discount_rate} onChange={(e) => setFormData({ ...formData, discount_rate: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-700">대표 이미지</label>
                                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all overflow-hidden relative border-slate-300">
                                        {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" /> : <div className="text-center text-slate-400"><Upload size={40} className="mx-auto mb-2" /><span className="text-sm">클릭하여 업로드</span></div>}
                                        {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin text-[#FF5B60]" /></div>}
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                                    <input type="url" placeholder="또는 이미지 URL 입력" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-4 py-2 text-sm border rounded-lg outline-none" />
                                </div>
                            </div>

                            {/* 노출 섹션 */}
                            <div><label className="block text-sm font-bold text-slate-700 mb-2">노출 섹션 (메인페이지)</label>
                                <div className="flex flex-wrap gap-2">
                                    {sections.map(s => <button key={s.id} type="button" onClick={() => toggleSection(s.id!)} className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${selectedSections.includes(s.id!) ? 'bg-[#FF5B60] text-white border-[#FF5B60]' : 'bg-white text-slate-500 hover:border-slate-400'}`}>{s.name}</button>)}
                                </div>
                            </div>

                            {/* 상세 설명 */}
                            <div><label className="block text-sm font-bold text-slate-700 mb-2">상세 설명</label><SimpleEditor initialValue={formData.description} onChange={(v) => setFormData({ ...formData, description: v })} /></div>

                            {/* 패키지 구성 (패키지 상품일 때만 노출) */}
                            {formData.product_type === 'basic' && (
                                <div className="space-y-6 pt-8 border-t">
                                    <h4 className="font-bold text-lg flex items-center gap-2"><Grid3X3 size={22} className="text-[#FF5B60]" /> 패키지 구성 세부 설정</h4>

                                    {/* 기본 구성품 */}
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="font-bold text-slate-800 underline decoration-blue-200 underline-offset-4">기본 필수 구성품 (가격 포함)</span>
                                            <button type="button" onClick={() => setFormData({ ...formData, basic_components: [...formData.basic_components, { name: '', quantity: 1 }] })} className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all font-bold">+ 항목 추가</button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.basic_components.map((item, idx) => (
                                                <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-lg border shadow-sm">
                                                    <select value={item.name} onChange={(e) => {
                                                        const val = e.target.value; const matched = products.find(p => p.name === val);
                                                        const n = [...formData.basic_components]; n[idx].name = val;
                                                        setFormData({ ...formData, basic_components: n });
                                                    }} className="flex-1 text-sm border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400">
                                                        <option value="">옵션 선택 (등록된 품목)</option>
                                                        {products.filter(p => p.product_type === 'essential' || p.product_type === 'additional').map(p => <option key={p.id} value={p.name}>{p.name} ({p.price.toLocaleString()}원)</option>)}
                                                    </select>
                                                    <input type="number" min="1" value={item.quantity} onChange={(e) => {
                                                        const n = [...formData.basic_components]; n[idx].quantity = Number(e.target.value);
                                                        setFormData({ ...formData, basic_components: n });
                                                    }} className="w-20 text-sm border-slate-200 rounded-md" />
                                                    <button type="button" onClick={() => setFormData({ ...formData, basic_components: formData.basic_components.filter((_, i) => i !== idx) })} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 음식/장소/추가 옵션 (옵션 활성화 여부만 선택) */}
                                    {[
                                        { id: 'food', label: '음식(케이터링) 옵션 활성화', state: useFood, setState: setUseFood, key: 'food_components', desc: '고객이 공통 음식 메뉴에서 선택할 수 있도록 합니다.' },
                                        { id: 'place', label: '장소(공간) 옵션 활성화', state: usePlace, setState: setUsePlace, key: 'place_components', desc: '고객이 공통 장소 목록에서 선택할 수 있도록 합니다.' },
                                        { id: 'additional', label: '추가 물품 옵션 활성화', state: useAdditional, setState: setUseAdditional, key: 'additional_components', desc: '고객이 공통 추가 물품 목록에서 선택할 수 있도록 합니다.' }
                                    ].map(opt => (
                                        <div key={opt.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id={`toggle-${opt.id}`}
                                                        checked={opt.state}
                                                        onChange={(e) => {
                                                            opt.setState(e.target.checked);
                                                            if (e.target.checked) {
                                                                // Enable: Add a dummy item to signify enabled state
                                                                setFormData({ ...formData, [opt.key]: [{ name: '__ALL__', price: 0 }] });
                                                            } else {
                                                                // Disable: Empty array
                                                                setFormData({ ...formData, [opt.key]: [] });
                                                            }
                                                        }}
                                                        className="w-5 h-5 accent-[#FF5B60] cursor-pointer"
                                                    />
                                                    <label htmlFor={`toggle-${opt.id}`} className="font-bold text-slate-800 cursor-pointer text-lg">{opt.label}</label>
                                                </div>
                                                <p className="text-sm text-slate-500 pl-8">{opt.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </form>

                        <div className="p-4 border-t bg-slate-50 flex gap-4 rounded-b-xl">
                            <button type="button" onClick={resetForm} className="flex-1 py-3 border border-slate-300 rounded-xl bg-white hover:bg-slate-100 font-bold transition-all">취소</button>
                            <button type="submit" onClick={(e) => { e.preventDefault(); handleSubmit(e); }} disabled={saving} className="flex-1 py-3 bg-[#FF5B60] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 disabled:bg-slate-300 shadow-lg font-bold transition-all">
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                <span>{editingProduct ? '수정사항 저장' : '등록하기'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 상품 리스트 테이블 */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-8 border border-slate-100">
                <table className="w-full">
                    <thead className="bg-[#FF5B60] text-white">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-bold uppercase tracking-wider">상품 정보</th>
                            <th className="text-left px-6 py-4 text-sm font-bold uppercase tracking-wider">메뉴(카테고리)</th>
                            <th className="text-right px-6 py-4 text-sm font-bold uppercase tracking-wider">가격</th>
                            <th className="text-center px-6 py-4 text-sm font-bold uppercase tracking-wider">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products
                            .filter(p => {
                                // 상품 타입 필터
                                let typeMatch = false;
                                if (viewMode === 'products') {
                                    typeMatch = p.product_type === 'basic' || !p.product_type;
                                } else if (viewTab === 'additional') {
                                    typeMatch = p.product_type === 'essential' || p.product_type === 'additional';
                                } else {
                                    typeMatch = p.product_type === viewTab;
                                }

                                if (!typeMatch) return false;

                                // 패키지 상품 관리: 대분류/중분류 필터
                                if (viewMode === 'products') {
                                    if (selectedCategoryFilter) {
                                        // 중분류가 선택된 경우
                                        return p.category === selectedCategoryFilter;
                                    } else if (selectedParentCategoryFilter) {
                                        // 대분류만 선택된 경우: 해당 대분류의 모든 중분류 상품 표시
                                        const childCategories = menuItems
                                            .filter(m => m.category === selectedParentCategoryFilter)
                                            .map(m => m.name);
                                        return childCategories.includes(p.category || '');
                                    }
                                    return true;
                                }

                                // 공통 옵션 관리: 중분류 필터
                                if (viewMode === 'options' && selectedCategoryFilter) {
                                    return p.category === selectedCategoryFilter;
                                }

                                return true;
                            })
                            .map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {p.image_url ? <img src={p.image_url} className="w-12 h-12 object-cover rounded-xl shadow-sm" /> : <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300"><ImageIcon size={20} /></div>}
                                            <div className="font-bold text-slate-800">{p.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{p.category}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">{p.price.toLocaleString()}원</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Pencil size={18} /></button>
                                            <button onClick={() => handleDelete(p.id!)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
