import React, { useState, useEffect } from 'react';
import { Search, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Container } from '../ui/Container';
import { NAV_LINKS, TOP_LINKS } from '../../constants';
import { getActiveSections, Section } from '../../src/api/sectionApi';
import { getAllNavMenuItems, NavMenuItem } from '../../src/api/cmsApi';
import { useAuth } from '../../src/context/AuthContext';
import { FullMenu } from './FullMenu';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [navItems, setNavItems] = useState<Section[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<NavMenuItem[]>([]);
  const [loadingNav, setLoadingNav] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);

  // ... (useEffect remains same) ...

  useEffect(() => {
    const loadNavItems = async () => {
      try {
        const [items, menuData] = await Promise.all([
          getActiveSections(),
          getAllNavMenuItems()
        ]);
        setNavItems(items);
        setAllMenuItems(menuData);
      } catch (error) {
        console.error('Failed to load sections:', error);
        setNavItems([]);
      } finally {
        setLoadingNav(false);
      }
    };
    loadNavItems();
  }, []);

  return (
    <header className="w-full bg-white border-b border-gray-200">
      {/* Top Utility Links - Hidden on Mobile */}
      <div className="hidden md:block bg-slate-50 border-b border-gray-100 py-[0.8rem]">
        <Container>
          <div className="flex justify-end gap-6 text-[13px] text-gray-500 items-center">
            {user ? (
              // Logged In View
              <>
                <span className="font-bold text-gray-700">{user.displayName || user.email}님 안녕하세요</span>
                <Link to="/mypage" className="hover:text-blue-600 transition-colors">마이페이지</Link>
                <button onClick={logout} className="hover:text-red-600 transition-colors">로그아웃</button>
                <Link to="/cs" className="hover:text-blue-600 transition-colors font-medium">고객센터</Link>
              </>
            ) : (
              // Logged Out View
              <>
                <Link to="/login" className="hover:text-blue-600 transition-colors">로그인</Link>
                <Link to="/signup" className="hover:text-blue-600 transition-colors">회원가입</Link>
                <Link to="/cs" className="hover:text-blue-600 transition-colors font-medium">고객센터</Link>
              </>
            )}
          </div>
        </Container>
      </div>

      {/* Main Header Area */}
      <div className="py-3 md:py-4 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <Container>
          <div className="flex items-center justify-between gap-4 md:gap-8">
            {/* Logo */}
            <a href="/" className="flex-shrink-0">
              <img src="/logo.png" alt="행사어때" className="h-4 md:h-6 object-contain" />
            </a>

            {/* Search Bar - Mobile optimized */}
            <div className="flex-grow max-w-sm md:max-w-md">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="무엇을 도와드릴까요?"
                  className="w-full pl-4 pr-10 py-2 md:py-2.5 rounded-full bg-slate-100 border-none focus:ring-2 focus:ring-[#FF5B60]/20 focus:bg-white transition-all text-sm text-gray-700 placeholder-gray-400 font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      if (target.value.trim()) {
                        window.location.href = `/search?q=${encodeURIComponent(target.value)}`;
                      }
                    }
                  }}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF5B60] transition-colors"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector('input');
                    if (input && input.value.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(input.value)}`;
                    }
                  }}
                >
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* Mobile Menu Icon (Visible only on mobile) */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setShowMobileMenu(true)}>
              <Menu size={24} />
            </button>
          </div>
        </Container>
      </div>

      {/* Mobile Full Menu Overlay */}
      {showMobileMenu && (
        <FullMenu variant="mobile" onClose={() => setShowMobileMenu(false)} />
      )}

      {/* Navigation - Secondary on mobile/scrollable */}
      <div className="border-t border-gray-100 shadow-sm md:shadow-none relative">
        <Container>
          <div className="relative">
            {/* Horizontal Scroll Area */}
            <nav className="flex items-center gap-6 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth snap-x">
              {/* All Menu Button (Desktop) */}
              {/* All Menu Button (Desktop) - Hover Trigger */}
              <div
                className="hidden md:block"
                onMouseEnter={() => setShowDesktopMenu(true)}
                onMouseLeave={() => setShowDesktopMenu(false)}
              >
                <button
                  className={`flex items-center gap-2 whitespace-nowrap text-sm font-semibold px-1 py-3 border-b-2 transition-all ${showDesktopMenu ? 'text-[#FF5B60] border-[#FF5B60]' : 'text-[#FF5B60] border-transparent hover:border-[#FF5B60]'}`}
                >
                  <Menu size={18} /> 전체메뉴
                </button>
              </div>



              {navItems.map((item) => {
                const linkUrl = `/products?sectionId=${item.id}&title=${encodeURIComponent(item.name)}`;
                const isCurrent = location.search.includes(`sectionId=${item.id}`);

                return (
                  <Link
                    key={item.id}
                    to={linkUrl}
                    className={`whitespace-nowrap text-[13px] md:text-sm font-semibold transition-all px-1 py-3 border-b-2 ${isCurrent
                      ? 'text-[#FF5B60] border-[#FF5B60]'
                      : 'text-slate-500 border-transparent hover:text-[#FF5B60] hover:border-gray-200'
                      }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Gradient Mask to indicate more content - Visible on mobile only */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
          </div>
        </Container>

        {/* Desktop Mega Menu Dropdown - Persisted in DOM for smooth transition */}
        <div
          className={`
                absolute top-full left-0 w-full z-50 transition-all duration-300 ease-in-out origin-top block
                ${showDesktopMenu ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'}
            `}
          onMouseEnter={() => setShowDesktopMenu(true)}
          onMouseLeave={() => setShowDesktopMenu(false)}
        >
          <FullMenu variant="desktop" items={allMenuItems} onClose={() => setShowDesktopMenu(false)} />
        </div>
      </div>
    </header>
  );
};