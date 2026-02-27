import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from './ui/Container';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { getTabMenuItems, getPromoBannersByTab, TabMenuItem, Banner } from '../src/api/cmsApi';

export const PromoSection: React.FC = () => {
  const [tabs, setTabs] = useState<TabMenuItem[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(false);

  // Load tabs on mount
  useEffect(() => {
    const loadTabs = async () => {
      try {
        const tabData = await getTabMenuItems();
        setTabs(tabData);
        if (tabData.length > 0 && tabData[0].id) {
          setActiveTabId(tabData[0].id);
        }
      } catch (error) {
        console.error('Failed to load tabs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTabs();
  }, []);

  // Load banners when active tab changes
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

  // Scroll Buttons logic
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const scrollPrev = () => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth / 2; // Scroll by one item (approx)
      sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth / 2;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="pb-16 bg-white flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#FF5B60]" size={32} />
      </div>
    );
  }

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="pb-16 bg-white">
      <Container>
        {/* Tabs */}
        <div className="flex w-full mb-8 bg-gray-100 rounded-xl overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id || null)}
              className={`flex-1 py-4 md:py-4 text-center text-[14px] md:text-base font-[650] transition-colors relative
                ${activeTabId === tab.id
                  ? 'bg-[#FF5B60] text-white'
                  : 'text-gray-600 hover:text-[#FF5B60] hover:bg-gray-200'
                }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Banners Slider */}
        {loadingBanners ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#FF5B60]" size={32} />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            이 탭에 연결된 프로모션 배너가 없습니다.
            <br />
            <span className="text-sm">Admin → CMS 관리에서 배너를 추가하고 탭을 연결해주세요.</span>
          </div>
        ) : (
          <div className="relative group/slider">
            {/* Left Button */}
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-[calc(50%-8px)] -translate-y-1/2 -translate-x-3 md:-translate-x-4 z-10 w-12 h-12 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full shadow-xl flex items-center justify-center text-slate-500 hover:bg-white hover:border-slate-400 hover:text-[#FF5B60] hover:scale-105 transition-all opacity-0 group-hover/slider:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Right Button */}
            <button
              onClick={scrollNext}
              className="absolute right-0 top-[calc(50%-8px)] -translate-y-1/2 translate-x-3 md:translate-x-4 z-10 w-12 h-12 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full shadow-xl flex items-center justify-center text-slate-500 hover:bg-white hover:border-slate-400 hover:text-[#FF5B60] hover:scale-105 transition-all opacity-0 group-hover/slider:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>

            <div
              ref={sliderRef}
              className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {banners.map((item) => {
                const linkTo = item.target_product_code ? `/p/${item.target_product_code}` : item.link || '/';
                const isExternal = linkTo.startsWith('http');

                const BannerContent = (
                  <div className="flex flex-col h-full bg-white">
                    {/* Image Box */}
                    <div className="relative aspect-[16/9] md:aspect-[16/10] overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                        style={{ backgroundImage: `url(${item.image_url})` }}
                      >
                        {/* Subtle Light Overlay for images */}
                        <div className="absolute inset-0 bg-black/5"></div>
                      </div>
                      
                      <div className="absolute top-4 left-4 px-2 py-1 bg-[#FF5B60] text-white text-[9px] font-black uppercase tracking-widest rounded shadow-lg z-20">
                        Promotion
                      </div>
                    </div>

                    {/* Text Area - Separated from image for better clarity */}
                    <div className="flex-1 p-5 md:p-6 flex flex-col justify-between border-t border-slate-50">
                      <div>
                        <h3 className="text-[17px] md:text-xl font-bold text-slate-900 mb-1.5 tracking-tight leading-snug line-clamp-1 group-hover:text-[#FF5B60] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[12px] md:text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">
                          {item.subtitle}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-[11px] md:text-xs font-black text-[#FF5B60] uppercase tracking-tighter">
                          VIEW PROJECT
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#FF5B60] group-hover:text-white transition-all shadow-sm">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                );

                const linkWrapperClass = "relative aspect-[16/10] w-[290px] md:w-[calc(50%-0.6rem)] group overflow-hidden block rounded-3xl cursor-pointer snap-start flex-shrink-0 bg-slate-200 shadow-xl shadow-slate-200/20 border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-[#FF5B60]/10";

                const BannerElement = isExternal ? (
                  <a
                    key={item.id}
                    href={linkTo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkWrapperClass}
                  >
                    {BannerContent}
                  </a>
                ) : (
                  <Link
                    key={item.id}
                    to={linkTo}
                    className={linkWrapperClass}
                  >
                    {BannerContent}
                  </Link>
                );
                
                return BannerElement;
              })}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};
