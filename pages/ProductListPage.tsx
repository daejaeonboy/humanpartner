import React, { useState, useEffect } from 'react';
import { Container } from '../components/ui/Container';
import { Star, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, Product } from '../src/api/productApi';
import { getProductsBySection } from '../src/api/sectionApi';
import { getAllNavMenuItems } from '../src/api/cmsApi';

export const ProductListPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const urlCategory = searchParams.get('category');
    const sectionId = searchParams.get('sectionId');
    const urlTitle = searchParams.get('title');

    const [activeCategory, setActiveCategory] = useState("전체");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayedCategories, setDisplayedCategories] = useState<string[]>(['전체']);

    // Grouping State
    const [parentToChildMap, setParentToChildMap] = useState<Record<string, string[]>>({});
    const [childToParentMap, setChildToParentMap] = useState<Record<string, string>>({});
    const [currentGroup, setCurrentGroup] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const [productData, navItems] = await Promise.all([
                    sectionId ? getProductsBySection(sectionId) : getProducts(),
                    getAllNavMenuItems()
                ]);

                // Filter basic products
                const basicProducts = productData.filter(p =>
                    p.product_type === 'basic' ||
                    (!p.product_type && !p.category.includes('추가') && !p.category.includes('장소') && !p.category.includes('음식'))
                );
                setProducts(basicProducts);

                // Build Category Maps
                const pMap: Record<string, string[]> = {};
                const cMap: Record<string, string> = {};

                navItems.forEach(item => {
                    if (item.category && item.name) {
                        // item.category is Parent, item.name is Child
                        if (!pMap[item.category]) pMap[item.category] = [];
                        pMap[item.category].push(item.name);
                        cMap[item.name] = item.category;
                    }
                });

                setParentToChildMap(pMap);
                setChildToParentMap(cMap);

                // Extract unique categories from actual products for fallback
                const uniqueCategories = ['전체', ...new Set(basicProducts.map(p => p.category))];

                // Determine Group & Active Category
                let targetGroup: string | null = null;
                let targetActive = "전체";
                let targetDisplayed = uniqueCategories;

                if (urlCategory) {
                    if (pMap[urlCategory]) {
                        // Helper: User clicked a Parent Category (e.g., from Main Page Tab)
                        targetGroup = urlCategory;
                        targetActive = "전체";

                        // Display siblings (children of this parent)
                        const children = pMap[urlCategory];
                        targetDisplayed = ['전체', ...children];

                    } else if (cMap[urlCategory]) {
                        // Helper: User clicked a Child Category (e.g., from Mega Menu)
                        const parent = cMap[urlCategory];
                        targetGroup = parent;
                        targetActive = urlCategory;

                        // Display siblings (children of the parent)
                        const siblings = pMap[parent];
                        targetDisplayed = ['전체', ...siblings];

                    } else {
                        // Fallback: Standalone category
                        targetActive = urlCategory;
                        targetDisplayed = uniqueCategories;

                        // Check if comma separated (legacy)
                        if (urlCategory.includes(',')) {
                            const selected = urlCategory.split(',');
                            targetDisplayed = ['전체', ...selected];
                        }
                    }
                }

                setCurrentGroup(targetGroup);
                setActiveCategory(targetActive);
                setDisplayedCategories(targetDisplayed);

            } catch (error) {
                console.error("Error getting products: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [urlCategory, sectionId]);

    // Enhanced Filter Logic
    const filteredProducts = products.filter(p => {
        // 1. If Active is "전체"
        if (activeCategory === "전체") {
            // If we are in a group context, "전체" means "Any product belonging to this group's children"
            if (currentGroup && parentToChildMap[currentGroup]) {
                return parentToChildMap[currentGroup].includes(p.category);
            }
            // Otherwise, it means EVERYTHING
            return true;
        }

        // 2. Direct Match
        if (p.category === activeCategory) return true;

        // 3. Comma-separated list Match
        if (activeCategory.includes(',')) {
            return activeCategory.split(',').includes(p.category);
        }

        return false;
    });

    return (
        <div className="pt-8 pb-12 bg-white">
            <Container>
                <div className="mb-6">
                    {/* Title Logic: Use Current Group Name if available, otherwise URL Title or Active Category */}
                    <h1 className="text-3xl font-bold text-gray-900">
                        {currentGroup || urlTitle || (activeCategory !== '전체' ? activeCategory : "모든 상품")}
                    </h1>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {displayedCategories.map((cat, idx) => (
                        <button
                            key={`${cat}-${idx}`}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm transition-all border ${activeCategory === cat
                                ? 'bg-[#FF5B60] text-white border-[#FF5B60]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-[#FF5B60]" size={40} />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="py-20 text-center text-gray-500">
                        등록된 상품이 없습니다. <Link to="/admin/products" className="text-[#FF5B60] underline">Admin에서 상품 추가</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <Link to={`/products/${product.id}`} key={product.id} className="group cursor-pointer">
                                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 mb-4 rounded-lg">
                                    <img
                                        src={product.image_url || 'https://picsum.photos/seed/product/400/500'}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                    {product.stock === 0 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-white font-bold">품절</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>

                                    <div className="flex flex-col">
                                        {product.discount_rate && product.discount_rate > 0 && (
                                            <span className="text-red-600 font-bold text-sm block">
                                                {product.discount_rate}%
                                            </span>
                                        )}
                                        <span className="font-bold text-lg">
                                            {product.price?.toLocaleString()}원/일
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold text-black">{product.rating || 0}</span>
                                        <span>({product.review_count?.toLocaleString() || 0})</span>
                                    </div>

                                    {product.stock !== undefined && product.stock > 0 && product.stock <= 3 && (
                                        <span className="text-xs text-orange-500">재고 {product.stock}개 남음</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
};
