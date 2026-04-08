import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from './ui/Container';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { NavMenuItem, TabMenuItem } from '../src/api/cmsApi';
import { Product, getBasicProductsByCategories } from '../src/api/productApi';
import { usePublicContent } from '../src/context/PublicContentContext';
import { getResponsiveImageProps } from '../src/utils/responsiveImage';

const stripHtml = (value?: string) => {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const PROMO_PRODUCT_LIMIT = 6;

const getLinkCategoryParam = (link?: string | null) => {
  if (!link) return '';

  const [, rawQuery = ''] = link.split('?');
  const params = new URLSearchParams(rawQuery);
  return params.get('category') || '';
};

const matchCategoriesFromCandidate = (candidate: string, navItems: NavMenuItem[]) => {
  if (!candidate) {
    return null;
  }

  const parentItems = navItems.filter((item) => !item.category);
  const childItems = navItems.filter((item) => item.category);

  const matchedParent = parentItems.find((item) => item.name === candidate);
  if (matchedParent) {
    return [
      matchedParent.name,
      ...childItems
        .filter((item) => item.category === matchedParent.name)
        .map((item) => item.name),
    ];
  }

  const matchedChild = childItems.find((item) => item.name === candidate);
  if (matchedChild) {
    return [matchedChild.name];
  }

  return null;
};

const resolveTabCategories = (tab: TabMenuItem, navItems: NavMenuItem[]) => {
  const candidates = [getLinkCategoryParam(tab.link), tab.name].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = matchCategoriesFromCandidate(candidate, navItems);
    if (resolved) {
      return resolved;
    }
  }

  return candidates[0] ? [candidates[0]] : [];
};

const buildProductLink = (product: Product) => {
  if (product.id) {
    return `/products/${product.id}`;
  }

  if (product.product_code) {
    return `/p/${product.product_code}`;
  }

  return '/products';
};

export const PromoSection: React.FC = () => {
  const { loading: loadingPublicContent, navMenuItems, tabMenuItems: tabs } = usePublicContent();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (tabs.length > 0 && (!activeTabId || !tabs.some((tab) => tab.id === activeTabId))) {
      setActiveTabId(tabs[0].id || null);
    }
  }, [activeTabId, tabs]);

  useEffect(() => {
    if (!activeTabId) return;

    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) return;

    const categories = resolveTabCategories(activeTab, navMenuItems);

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        if (categories.length === 0) {
          setProducts([]);
          return;
        }

        const productData = await getBasicProductsByCategories(categories);
        setProducts(productData.slice(0, PROMO_PRODUCT_LIMIT));
      } catch (error) {
        console.error('Failed to load promo products:', error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [activeTabId, navMenuItems, tabs]);

  const sliderRef = React.useRef<HTMLDivElement>(null);

  const scrollPrev = () => {
    if (!sliderRef.current) return;

    const scrollAmount = sliderRef.current.clientWidth / 2;
    sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollNext = () => {
    if (!sliderRef.current) return;

    const scrollAmount = sliderRef.current.clientWidth / 2;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (loadingPublicContent) {
    return (
      <div className="pb-16 bg-white flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#39B54A]" size={32} />
      </div>
    );
  }

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="pb-16 bg-white">
      <Container>
        <div className="flex w-full mb-10 bg-gray-100/80 p-1.5 rounded-lg overflow-hidden relative border border-gray-200">
          <div className="absolute inset-1.5 z-0 pointer-events-none">
            {tabs.length > 0 && (
              <div
                className="h-full transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
                style={{
                  width: `${100 / tabs.length}%`,
                  transform: `translateX(${tabs.findIndex((tab) => tab.id === activeTabId) * 100}%)`,
                }}
              >
                <div className="h-full bg-[#39B54A] rounded-lg shadow-lg shadow-[#39B54A]/20 mx-0.5" />
              </div>
            )}
          </div>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id || null)}
              className={`flex-1 py-3 md:py-4 text-center text-[13px] md:text-[15px] font-bold transition-colors duration-300 relative z-10 ${
                activeTabId === tab.id
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {loadingProducts ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#39B54A]" size={32} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            연결된 최신 상품이 없습니다.
            <br />
            <span className="text-sm">선택한 카테고리에 노출 가능한 상품을 먼저 등록해 주세요.</span>
          </div>
        ) : (
          <div className="relative group/slider">
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-[calc(50%-8px)] -translate-y-1/2 -translate-x-3 md:-translate-x-4 z-10 w-12 h-12 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full shadow-xl flex items-center justify-center text-slate-500 hover:bg-white hover:border-slate-400 hover:text-[#39B54A] hover:scale-105 transition-all opacity-0 group-hover/slider:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={scrollNext}
              className="absolute right-0 top-[calc(50%-8px)] -translate-y-1/2 translate-x-3 md:translate-x-4 z-10 w-12 h-12 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full shadow-xl flex items-center justify-center text-slate-500 hover:bg-white hover:border-slate-400 hover:text-[#39B54A] hover:scale-105 transition-all opacity-0 group-hover/slider:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>

            <div
              ref={sliderRef}
              className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {products.map((product, index) => {
                const title = product.name;
                const subtitle = product.short_description?.trim()
                  || stripHtml(product.description)
                  || '행사 운영에 필요한 구성과 장비를 확인해보세요.';
                const imageUrl = product.image_url;
                const imageProps = getResponsiveImageProps(imageUrl, {
                  widths: [480, 640, 960, 1280],
                  sizes: '(max-width: 768px) 290px, 48vw',
                  quality: 84,
                  resize: 'cover',
                });
                const buttonText = '상품 보기';
                const linkTo = buildProductLink(product);
                const isExternal = linkTo.startsWith('http');

                const bannerContent = (
                  <>
                    <div className="absolute inset-0 overflow-hidden">
                      <img
                        {...imageProps}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        loading={index < 2 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        decoding="async"
                        aria-hidden="true"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/18 to-transparent"></div>
                    </div>

                    <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end text-white z-10 pointer-events-none">
                      <h3 className="text-xl md:text-2xl font-bold whitespace-pre-line mb-1.5 text-white tracking-[-0.03em] leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                        {title}
                      </h3>
                      <p className="text-[13px] md:text-sm opacity-95 mb-4 text-slate-100 font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]">
                        {subtitle}
                      </p>

                      <div className="self-start flex items-center gap-1.5 px-4 py-2 bg-[#39B54A] text-white text-[12px] font-black rounded-lg shadow-lg shadow-[#39B54A]/20 hover:bg-[#2F9A3F] transition-all transform group-hover:scale-105 active:scale-95 pointer-events-auto group/btn">
                        {buttonText}
                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </>
                );

                const linkWrapperClass = 'relative aspect-[16/20] md:aspect-[16/10] w-[290px] md:w-[calc(50%-0.6rem)] group overflow-hidden block rounded-lg cursor-pointer snap-start flex-shrink-0 bg-slate-100 shadow-sm border border-slate-100';

                if (isExternal) {
                  return (
                    <a
                      key={product.id || product.product_code || `${title}-${index}`}
                      href={linkTo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkWrapperClass}
                    >
                      {bannerContent}
                    </a>
                  );
                }

                return (
                  <Link
                    key={product.id || product.product_code || `${title}-${index}`}
                    to={linkTo}
                    className={linkWrapperClass}
                  >
                    {bannerContent}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};
