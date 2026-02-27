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
        <div className="flex w-full mb-10 bg-gray-100/80 p-1.5 rounded-2xl overflow-hidden relative border border-gray-200">
          {/* Sliding Indicator Container - Matches inner padded area for perfect alignment */}
          <div className="absolute inset-1.5 z-0 pointer-events-none">
            {tabs.length > 0 && (
              <div 
                className="h-full transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
                style={{ 
                  width: `${100 / tabs.length}%`,
                  transform: `translateX(${tabs.findIndex(t => t.id === activeTabId) * 100}%)`,
                }}
              >
                <div className="h-full bg-[#FF5B60] rounded-xl shadow-lg shadow-[#FF5B60]/20 mx-0.5" />
              </div>
            )}
          </div>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id || null)}
              className={`flex-1 py-3 md:py-4 text-center text-[13px] md:text-[15px] font-bold transition-colors duration-300 relative z-10
                ${activeTabId === tab.id
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-900'
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
                  <>
                    {/* Background */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                      style={{ backgroundImage: `url(${item.image_url})` }}
                    >
                      {/* Refined Gradient Overlay for better depth without stuffiness */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    </div>

                    {/* Text Content */}
                    <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end text-white z-10 pointer-events-none">
                      <h3 className="text-xl md:text-2xl font-bold whitespace-pre-line mb-1.5 text-white tracking-[-0.03em] leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-[13px] md:text-sm opacity-90 mb-4 text-slate-100 font-medium">
                        {item.subtitle}
                      </p>

                      <div className="self-start flex items-center gap-1.5 px-4 py-2 bg-[#FF5B60] text-white text-[12px] font-black rounded-lg shadow-lg shadow-[#FF5B60]/20 hover:bg-[#e54a4f] transition-all transform group-hover:scale-105 active:scale-95 pointer-events-auto group/btn">
                        {item.button_text || '바로가기'}
                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </>
                );

                const linkWrapperClass = "relative aspect-[16/20] md:aspect-[16/10] w-[290px] md:w-[calc(50%-0.6rem)] group overflow-hidden block rounded-2xl cursor-pointer snap-start flex-shrink-0 bg-slate-100 shadow-sm border border-slate-100";

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
