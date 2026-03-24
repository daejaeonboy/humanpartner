import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from './ui/Container';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Banner, getPromoBannersByTab, getTabMenuItems, TabMenuItem } from '../src/api/cmsApi';
import { getProducts, Product } from '../src/api/productApi';

const stripHtml = (value?: string) => {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const buildProductLookup = (products: Product[]) => {
  return products.reduce<Record<string, Product>>((acc, product) => {
    if (product.id) {
      acc[product.id] = product;
    }

    if (product.product_code) {
      acc[product.product_code] = product;
    }

    return acc;
  }, {});
};

export const PromoSection: React.FC = () => {
  const [tabs, setTabs] = useState<TabMenuItem[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [productLookup, setProductLookup] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const resolvedPromoBanners = banners.filter((item) => Boolean(item.target_product_code));

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [tabData, productData] = await Promise.all([
          getTabMenuItems(),
          getProducts()
        ]);

        setTabs(tabData);
        setProductLookup(buildProductLookup(productData));

        if (tabData.length > 0 && tabData[0].id) {
          setActiveTabId(tabData[0].id);
        }
      } catch (error) {
        console.error('Failed to load promo section data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!activeTabId) return;

    const loadBanners = async () => {
      setLoadingBanners(true);
      try {
        const bannerData = await getPromoBannersByTab(activeTabId);
        setBanners(bannerData);
      } catch (error) {
        console.error('Failed to load banners:', error);
        setBanners([]);
      } finally {
        setLoadingBanners(false);
      }
    };

    loadBanners();
  }, [activeTabId]);

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

  if (loading) {
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
        <div className="flex w-full mb-10 bg-gray-100/80 p-1.5 rounded-2xl overflow-hidden relative border border-gray-200">
          <div className="absolute inset-1.5 z-0 pointer-events-none">
            {tabs.length > 0 && (
              <div
                className="h-full transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
                style={{
                  width: `${100 / tabs.length}%`,
                  transform: `translateX(${tabs.findIndex((tab) => tab.id === activeTabId) * 100}%)`,
                }}
              >
                <div className="h-full bg-[#39B54A] rounded-xl shadow-lg shadow-[#39B54A]/20 mx-0.5" />
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

        {loadingBanners ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#39B54A]" size={32} />
          </div>
        ) : resolvedPromoBanners.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            연결된 프로모션 카드가 없습니다.
            <br />
            <span className="text-sm">관리자 CMS에서 탭과 상품을 연결해 주세요.</span>
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
              {resolvedPromoBanners.map((item) => {
                const linkedProduct = item.target_product_code
                  ? productLookup[item.target_product_code]
                  : undefined;
                const title = linkedProduct?.name || item.title;
                const subtitle = linkedProduct?.short_description?.trim()
                  || stripHtml(linkedProduct?.description)
                  || item.subtitle;
                const imageUrl = linkedProduct?.image_url || item.image_url;
                const buttonText = item.button_text || (linkedProduct ? '상품 보기' : '바로가기');
                const linkTo = linkedProduct?.id
                  ? `/products/${linkedProduct.id}`
                  : item.target_product_code
                    ? `/p/${item.target_product_code}`
                    : item.link || '/';
                const isExternal = linkTo.startsWith('http');

                const bannerContent = (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    </div>

                    <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end text-white z-10 pointer-events-none">
                      <h3 className="text-xl md:text-2xl font-bold whitespace-pre-line mb-1.5 text-white tracking-[-0.03em] leading-tight">
                        {title}
                      </h3>
                      <p className="text-[13px] md:text-sm opacity-90 mb-4 text-slate-100 font-medium">
                        {subtitle}
                      </p>

                      <div className="self-start flex items-center gap-1.5 px-4 py-2 bg-[#39B54A] text-white text-[12px] font-black rounded-lg shadow-lg shadow-[#39B54A]/20 hover:bg-[#2F9A3F] transition-all transform group-hover:scale-105 active:scale-95 pointer-events-auto group/btn">
                        {buttonText}
                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </>
                );

                const linkWrapperClass = 'relative aspect-[16/20] md:aspect-[16/10] w-[290px] md:w-[calc(50%-0.6rem)] group overflow-hidden block rounded-2xl cursor-pointer snap-start flex-shrink-0 bg-slate-100 shadow-sm border border-slate-100';

                if (isExternal) {
                  return (
                    <a
                      key={item.id}
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
                    key={item.id}
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
