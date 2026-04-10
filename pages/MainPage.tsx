import React, { useState, useEffect } from 'react';
import { Hero } from '../components/Hero';
import { Seo } from '../components/seo/Seo';
import { QuickMenu } from '../components/QuickMenu';
import { PromoSection } from '../components/PromoSection';
import { ProductSection } from '../components/ProductSection';
import { getBasicProducts, Product } from '../src/api/productApi';
import { getProductsForSections, Section } from '../src/api/sectionApi';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PopupManager } from '../components/Layout/PopupManager';
import { usePublicContent } from '../src/context/PublicContentContext';
import { DEFAULT_OG_IMAGE, ORGANIZATION, ORGANIZATION_LOGO, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '../src/seo';

interface SectionWithProducts {
    section: Section;
    products: any[];
}

const scheduleNonCriticalTask = (callback: () => void) => {
    if (typeof window === 'undefined') {
        callback();
        return () => undefined;
    }

    const idleWindow = window as Window & {
        requestIdleCallback?: (callback: (deadline?: unknown) => void, options?: { timeout: number }) => number;
        cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === 'function') {
        const idleId = idleWindow.requestIdleCallback(() => callback(), { timeout: 1200 });
        return () => {
            if (typeof idleWindow.cancelIdleCallback === 'function') {
                idleWindow.cancelIdleCallback(idleId);
            }
        };
    }

    const timeoutId = window.setTimeout(callback, 250);
    return () => window.clearTimeout(timeoutId);
};

export const MainPage: React.FC = () => {
    const { activeSections, loading: publicContentLoading } = usePublicContent();
    const [sectionsWithProducts, setSectionsWithProducts] = useState<SectionWithProducts[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (publicContentLoading) {
            return;
        }

        let cancelled = false;
        setLoading(true);

        const fetchData = async () => {
            try {
                if (activeSections.length > 0) {
                    const sectionProductsMap = await getProductsForSections(
                        activeSections.map((section) => section.id!).filter(Boolean),
                    );

                    const sectionsData: SectionWithProducts[] = activeSections.map((section) => ({
                        section,
                        products: sectionProductsMap[section.id!] || [],
                    }));

                    if (!cancelled) {
                        setSectionsWithProducts(sectionsData);
                        setAllProducts([]);
                    }
                } else {
                    const products = await getBasicProducts();
                    if (!cancelled) {
                        setAllProducts(products);
                        setSectionsWithProducts([]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        const cancelScheduledTask = scheduleNonCriticalTask(() => {
            void fetchData();
        });

        return () => {
            cancelled = true;
            cancelScheduledTask();
        };
    }, [activeSections, publicContentLoading]);

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

    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        alternateName: ORGANIZATION.legalName,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        legalName: ORGANIZATION.legalName,
        alternateName: [SITE_NAME],
        url: SITE_URL,
        logo: ORGANIZATION_LOGO,
        email: ORGANIZATION.email,
        telephone: ORGANIZATION.officePhone,
        founder: ORGANIZATION.representative,
        address: {
            '@type': 'PostalAddress',
            streetAddress: ORGANIZATION.address.streetAddress,
            postalCode: ORGANIZATION.address.postalCode,
            addressLocality: ORGANIZATION.address.addressLocality,
            addressCountry: ORGANIZATION.address.addressCountry,
        },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: ORGANIZATION.phone,
            contactType: 'customer service',
            areaServed: 'KR',
            availableLanguage: ['ko'],
        },
    };

    return (
        <main>
            <Seo
                title={SITE_TITLE}
                description={SITE_DESCRIPTION}
                canonical="/"
                image={DEFAULT_OG_IMAGE}
                jsonLd={[websiteSchema, organizationSchema]}
            />
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
                                sectionId={section.id}
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
