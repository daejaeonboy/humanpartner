import React, { useState, useEffect } from 'react';
import { Container } from '../components/ui/Container';
import { Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Seo } from '../components/seo/Seo';
import { getBasicProducts, getBasicProductsByCategories, Product } from '../src/api/productApi';
import { getProductsBySection } from '../src/api/sectionApi';
import { usePublicContent } from '../src/context/PublicContentContext';
import { getResponsiveImageProps } from '../src/utils/responsiveImage';

export const ProductListPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { loading: loadingPublicContent, navMenuItems } = usePublicContent();
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
            if (loadingPublicContent) {
                return;
            }

            setLoading(true);
            try {
                const pMap: Record<string, string[]> = {};
                const cMap: Record<string, string> = {};

                navMenuItems.forEach(item => {
                    if (item.category && item.name) {
                        if (!pMap[item.category]) pMap[item.category] = [];
                        pMap[item.category].push(item.name);
                        cMap[item.name] = item.category;
                    }
                });

                setParentToChildMap(pMap);
                setChildToParentMap(cMap);

                let fetchCategories: string[] = [];

                if (urlCategory) {
                    if (pMap[urlCategory]) {
                        fetchCategories = [urlCategory, ...pMap[urlCategory]];
                    } else if (cMap[urlCategory]) {
                        fetchCategories = [urlCategory];
                    } else if (urlCategory.includes(',')) {
                        fetchCategories = urlCategory.split(',');
                    } else {
                        fetchCategories = [urlCategory];
                    }
                }

                const productData = sectionId
                    ? await getProductsBySection(sectionId)
                    : fetchCategories.length > 0
                        ? await getBasicProductsByCategories(fetchCategories)
                        : await getBasicProducts();

                setProducts(productData);

                // Extract unique categories from actual products for fallback
                const uniqueCategories = ['전체', ...new Set(productData.map(p => p.category).filter(Boolean) as string[])];

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
    }, [loadingPublicContent, navMenuItems, urlCategory, sectionId]);

    // Enhanced Filter Logic
    const filteredProducts = products.filter(p => {
        const productCategory = p.category || '';

        // 1. If Active is "전체"
        if (activeCategory === "전체") {
            // If we are in a group context, "전체" means "Any product belonging to this group's children"
            if (currentGroup && parentToChildMap[currentGroup]) {
                return [currentGroup, ...parentToChildMap[currentGroup]].includes(productCategory);
            }
            // Otherwise, it means EVERYTHING
            return true;
        }

        // 2. Direct Match
        if (productCategory === activeCategory) return true;

        // 3. Comma-separated list Match
        if (activeCategory.includes(',')) {
            return activeCategory.split(',').includes(productCategory);
        }

        return false;
    });

    const pageTitle = currentGroup || urlTitle || (activeCategory !== '전체' ? activeCategory : '전체 상품');
    const canonicalParams = new URLSearchParams();
    if (urlCategory) canonicalParams.set('category', urlCategory);
    const canonicalPath = canonicalParams.toString() ? `/products?${canonicalParams.toString()}` : '/products';
    const pageDescription = currentGroup || activeCategory !== '전체'
        ? `행사어때에서 ${pageTitle} 관련 행사 상품과 서비스를 확인해보세요. 대전 MICE 행사 운영에 필요한 장비와 구성을 한 곳에서 비교할 수 있습니다.`
        : '행사어때의 전체 상품 목록입니다. 대전 MICE 행사 운영에 필요한 장비와 서비스를 한 곳에서 비교하고 상담할 수 있습니다.';

    return (
        <div className="pt-12 md:pt-16 pb-16 md:pb-24 bg-white">
            <Seo
                title={`${pageTitle} | 행사어때`}
                description={pageDescription}
                canonical={canonicalPath}
            />
            <Container>
                <div className="mb-6 md:mb-8">
                    {/* Title Logic: Use Current Group Name if available, otherwise URL Title or Active Category */}
                    <h1 className="text-[24px] md:text-3xl font-bold text-slate-900 tracking-[-0.02em]">
                        {pageTitle}
                    </h1>
                </div>

                {/* Category Filter */}
                <div className="mb-8 md:mb-10 -mx-1 px-1 overflow-x-auto md:overflow-visible scrollbar-hide">
                    <div className="inline-flex min-w-full gap-3 md:flex md:min-w-0 md:flex-wrap md:gap-4">
                    {displayedCategories.map((cat, idx) => (
                        <button
                            key={`${cat}-${idx}`}
                            onClick={() => setActiveCategory(cat)}
                            className={`h-[40px] min-w-[96px] shrink-0 px-4 rounded-xl text-[14px] md:text-[15px] font-semibold transition-all border
                                ${activeCategory === cat
                                    ? 'bg-[#39B54A] text-white border-[#39B54A] shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#39B54A] hover:text-[#39B54A]'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-[#39B54A]" size={40} />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="py-20 text-center text-gray-500">
                        등록된 상품이 없습니다. <Link to="/admin/products" className="text-[#39B54A] underline">Admin에서 상품 추가</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-y-8 md:grid-cols-2 md:gap-8 2xl:grid-cols-3">
                        {filteredProducts.map((product) => (
                            (() => {
                                const imageProps = getResponsiveImageProps(
                                    product.image_url || 'https://picsum.photos/seed/product/400/500',
                                    {
                                        widths: [480, 640, 960, 1280],
                                        sizes: '(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw',
                                        quality: 82,
                                        resize: 'cover',
                                    },
                                );

                                return (
                                <Link to={`/products/${product.id}`} key={product.id} className="group cursor-pointer">
                                    <div className="relative aspect-video overflow-hidden bg-gray-100 mb-4 rounded-xl shadow-sm">
                                        <img
                                            {...imageProps}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                    {product.stock === 0 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-white font-bold">품절</span>
                                        </div>
                                    )}
                                    </div>

                                    <div className="space-y-1.5 px-1">
                                        <h3 className="text-[16px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#39B54A] transition-colors">{product.name}</h3>

                                        <div className="flex items-center gap-2">
                                            {product.discount_rate && product.discount_rate > 0 && (
                                                <span className="text-[#39B54A] font-bold text-[18px]">
                                                    {product.discount_rate}%
                                                </span>
                                            )}
                                            <span className="font-medium text-[18px] text-slate-900">
                                                {product.price?.toLocaleString()}원
                                            </span>
                                        </div>

                                        {product.stock !== undefined && product.stock > 0 && product.stock <= 3 && (
                                            <span className="text-xs text-orange-500">재고 {product.stock}개 남음</span>
                                        )}
                                    </div>
                                </Link>
                                );
                            })()
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
};
