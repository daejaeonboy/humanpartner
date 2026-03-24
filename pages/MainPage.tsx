import React, { useState, useEffect } from 'react';
import { Hero } from '../components/Hero';
import { Helmet } from 'react-helmet-async';
import { QuickMenu } from '../components/QuickMenu';
import { PromoSection } from '../components/PromoSection';
import { ProductSection } from '../components/ProductSection';
import { getProducts, Product } from '../src/api/productApi';
import { getActiveSections, getProductsBySection, Section } from '../src/api/sectionApi';
import { getAllNavMenuItems, NavMenuItem } from '../src/api/cmsApi';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PopupManager } from '../components/Layout/PopupManager';

interface SectionWithProducts {
    section: Section;
    products: any[];
}

export const MainPage: React.FC = () => {
    const [sectionsWithProducts, setSectionsWithProducts] = useState<SectionWithProducts[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch sections, all products, and nav menu items in parallel
                const [sections, products, navItems] = await Promise.all([
                    getActiveSections(),
                    getProducts(),
                    getAllNavMenuItems()
                ]);

                setAllProducts(products);

                // Build Category Map (Child Name -> Parent Name)
                const map: Record<string, string> = {};
                navItems.forEach(item => {
                    // Check if item is a child (has a category field pointing to parent)
                    if (item.category && item.name) {
                        map[item.name] = item.category;
                    }
                });
                setCategoryMap(map);

                // Fetch products for each section
                const sectionsData: SectionWithProducts[] = await Promise.all(
                    sections.map(async (section) => {
                        const sectionProducts = await getProductsBySection(section.id!);
                        return {
                            section,
                            products: sectionProducts
                        };
                    })
                );

                setSectionsWithProducts(sectionsData);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper to resolve category name (Child -> Parent if linked)
    const resolveCategory = (childCategory: string) => {
        return categoryMap[childCategory] || childCategory;
    };

    // Helper to format products for ProductSection
    const formatProducts = (products: any[]) => {
        return products.map(p => ({
            id: p.id || '',
            title: p.name,
            subtitle: p.name,
            imageUrl: p.image_url || 'https://picsum.photos/seed/product/400/500',
            category: p.category, // Use raw category
            price: p.price,
            discountRate: p.discount_rate,
            reviewCount: p.review_count,
            rating: p.rating,
        }));
    };

    // Get unique categories from all products (using raw category)
    const getCategories = (products: any[]) => {
        const cats = products.map(p => p.category).filter(Boolean);
        return ['전체', ...Array.from(new Set(cats))];
    };

    // Get unique categories for a section (using raw category)
    const getSectionCategories = (section: Section, products: any[]) => {
        if (section.categories && section.categories.length > 0) {
            // Map configured child categories
            const cats = section.categories.map(c => c.name);
            return ['전체', ...Array.from(new Set(cats))];
        }
        return getCategories(products);
    };

    return (
        <main>
            <Helmet>
                <title>행사어때 | 마이스파트너 - 종합 행사 통합 플랫폼</title>
                <meta name="description" content="행사어때는 음향, 조명, 영상 등 최신 행사 장비 렌탈부터 전문가의 공간 연출까지 제안하는 종합 MICE 플랫폼입니다." />
                <link rel="canonical" href="https://micepartner.co.kr/" />
            </Helmet>
            <PopupManager />
            <Hero />
            <QuickMenu />
            <PromoSection />

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-[#39B54A]" size={40} />
                </div>
            ) : sectionsWithProducts.length > 0 ? (
                <>
                    {sectionsWithProducts.map(({ section, products }) => {
                        if (products.length === 0) return null;
                        const formattedProducts = formatProducts(products);
                        return (
                            <ProductSection
                                key={section.id}
                                title={section.name}
                                categories={getSectionCategories(section, products)}
                                products={formattedProducts}
                                layoutMode="grid-2"
                            />
                        );
                    })}
                </>
            ) : allProducts.length > 0 ? (
                // Fallback: if no sections exist but products do, show all products
                <ProductSection
                    title="전체 상품"
                    categories={getCategories(allProducts)}
                    products={formatProducts(allProducts)}
                    layoutMode="grid-2"
                />
            ) : (
                <div className="text-center py-20 text-slate-400">
                    등록된 상품이 없습니다. <Link to="/admin/products" className="text-[#39B54A] underline">Admin에서 상품을 추가</Link>해주세요.
                </div>
            )}
        </main>
    );
};
