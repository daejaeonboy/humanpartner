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
              className={`flex-1 py-4 text-center text-sm font-medium transition-colors relative
                ${activeTabId === tab.id
                  ? 'bg-[#FF5B60] text-white'
                  : 'text-gray-600 hover:text-[#FF5B60] hover:bg-gray-200'
                }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Banners Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((item) => {
              const linkTo = item.target_product_code ? `/p/${item.target_product_code}` : item.link || '/';
              const isExternal = linkTo.startsWith('http');

              const BannerContent = (
                <>
                  {/* Background */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.image_url})` }}
                  >
                    <div className="absolute inset-0 bg-black/40"></div>
                  </div>

                  {/* Navigation Arrows (Mock functionality) */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft size={18} />
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={18} />
                  </div>

                  {/* Text Content */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-center text-white">
                    <h3 className="text-2xl font-light whitespace-pre-line mb-2 text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm opacity-90 mb-6 text-white/90">{item.subtitle}</p>

                    <div className="self-start px-6 py-2 bg-white text-gray-900 text-xs font-bold hover:bg-gray-100 transition-colors rounded-lg">
                      {item.button_text || '바로가기'}
                    </div>
                  </div>
                </>
              );

              return isExternal ? (
                <a
                  key={item.id}
                  href={linkTo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative h-64 md:h-80 group overflow-hidden block rounded-2xl cursor-pointer"
                >
                  {BannerContent}
                </a>
              ) : (
                <Link
                  key={item.id}
                  to={linkTo}
                  className="relative h-64 md:h-80 group overflow-hidden block rounded-2xl cursor-pointer"
                >
                  {BannerContent}
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};
