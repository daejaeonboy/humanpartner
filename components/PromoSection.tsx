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
        <div className="flex w-full mb-10 bg-slate-50 p-1.5 rounded-2xl overflow-hidden border border-slate-200/60 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id || null)}
              className={`flex-1 py-3 md:py-4 text-center text-[13px] md:text-[15px] font-bold transition-all duration-300 rounded-xl
                ${activeTabId === tab.id
                  ? 'bg-white text-[#FF5B60] shadow-md border border-slate-100'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
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
                      {/* Premium Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    </div>

                    {/* Text Content */}
                    <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-end text-white z-10">
                      {/* Premium Tag */}
                      <div className="self-start mb-3 px-2 py-0.5 bg-[#FF5B60]/10 backdrop-blur-md border border-[#FF5B60]/30 rounded text-[9px] md:text-[10px] font-black text-[#FF5B60] uppercase tracking-widest transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        Promotion
                      </div>

                      <h3 className="text-xl md:text-2xl font-bold whitespace-pre-line mb-1.5 text-white tracking-tight leading-[1.2] transform transition-transform duration-500 group-hover:-translate-y-1">
                        {item.title}
                      </h3>
                      <p className="text-[12px] md:text-sm font-medium text-slate-200/90 mb-5 max-w-[90%] transform transition-transform duration-500 delay-75 group-hover:-translate-y-1 opacity-90">
                        {item.subtitle}
                      </p>

                      <div className="self-start flex items-center gap-2 pr-4 pl-5 py-2.5 bg-white text-gray-900 text-[11px] md:text-xs font-black rounded-xl shadow-xl hover:bg-slate-50 transition-all transform group-hover:scale-105 active:scale-95">
                        {item.button_text || '자세히 보기'}
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                          <ChevronRight size={14} className="text-[#FF5B60]" />
                        </div>
                      </div>
                    </div>
                  </>
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
