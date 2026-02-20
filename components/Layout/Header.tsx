import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Container } from '../ui/Container';
import { NAV_LINKS, TOP_LINKS } from '../../constants';
import { getActiveSections, Section } from '../../src/api/sectionApi';
import { getAllNavMenuItems, NavMenuItem } from '../../src/api/cmsApi';
import { useAuth } from '../../src/context/AuthContext';
import { FullMenu } from './FullMenu';
import { getNotifications, markAsRead, markAllAsRead, Notification } from '../../src/api/notificationApi';

const BellIcon = ({ className }: { className?: string }) => (
  <img src="/notifications.svg" alt="알림" className={className} />
);

const MenuIcon = ({ className }: { className?: string }) => (
  <img src="/menu.svg" alt="메뉴" className={className} />
);

const ProfileIcon = ({ className }: { className?: string }) => (
  <img src="/person.svg" alt="프로필" className={className} />
);

const NotificationDropdown = ({
  notifications,
  unreadCount,
  onMarkAllRead,
  onNotificationClick
}: {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onNotificationClick: (n: Notification) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-slate-600 transition-colors rounded-xl md:rounded-full hover:bg-slate-100 ${isOpen ? 'text-[#FF5B60] bg-red-50' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon className="w-6 h-6 md:w-7 md:h-7" />
        {/* Badge - Only show if unreadCount > 0 */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#FF5B60] rounded-full ring-1 ring-white"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between p-3 border-b border-gray-50 bg-gray-50/50">
              <span className="font-bold text-gray-900 text-sm">알림</span>
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} className="text-xs text-gray-400 hover:text-[#FF5B60]">모두 읽음</button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {notifications.map((noti) => (
                    <button
                      key={noti.id}
                      onClick={() => {
                        onNotificationClick(noti);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex gap-3 ${!noti.is_read ? 'bg-red-50/10' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!noti.is_read ? 'bg-[#FF5B60]' : 'bg-gray-200'}`} />
                      <div>
                        <p className={`text-sm ${!noti.is_read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{noti.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{noti.message}</p>
                        <p className="text-[10px] text-gray-300 mt-1">{new Date(noti.created_at).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs">
                  새로운 알림이 없습니다.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [navItems, setNavItems] = useState<Section[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<NavMenuItem[]>([]);
  const [loadingNav, setLoadingNav] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  // Removed showNotifications state as it is now inside NotificationDropdown
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  // Smart Sticky Header Logic
  // Smart Sticky Header Logic
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
      const diff = currentScrollY - lastScrollYRef.current;

      // 1. Top Zone Logic - Always show
      if (currentScrollY < 120) {
        setIsVisible(true);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      // 2. Scroll Direction Logic
      if (diff < -2) {
        // Scrolling UP - Instant Reveal
        setIsVisible(true);
        lastScrollYRef.current = currentScrollY;
      } else if (diff > 40) {
        // Scrolling DOWN - Hide after threshold
        setIsVisible(false);
        lastScrollYRef.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      const fetchNotis = async () => {
        const data = await getNotifications(user.uid);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      };
      fetchNotis();
      // Optional: Set up real-time subscription here
      const interval = setInterval(fetchNotis, 30000); // Polling every 30s as simple fallback
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, location.pathname]); // Re-fetch on navigation

  const handleNotificationClick = async (noti: Notification) => {
    if (!noti.is_read) {
      await markAsRead(noti.id);
      setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (noti.link_url) {
      window.location.href = noti.link_url;
    }
  };

  const handleMarkAllRead = async () => {
    if (user) {
      await markAllAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

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
    <header className="w-full bg-white">
      {/* Spacer for Fixed Header (Prevents content jump) */}
      <div className="h-[112px] md:h-[175px]"></div>

      {/* Smart Reveal Header Container - SWITCHED TO FIXED */}
      <div className={`
        fixed top-0 left-0 w-full z-40 transition-all duration-300 ease-in-out bg-white border-b border-gray-200
        ${isVisible ? 'translate-y-0 shadow-sm' : '-translate-y-full shadow-none'}
      `}>
        {/* Top Utility Links - Hidden on Mobile */}
        <div className="hidden md:block bg-slate-50 border-b border-gray-100 py-[0.8rem]">
          <Container>
            <div className="flex justify-end gap-6 text-[13px] text-gray-500 items-center">
              {user ? (
                // Logged In View
                <>
                  <span className="font-bold text-gray-700">{user.displayName || user.email}님 안녕하세요</span>
                  <Link to="/mypage" className="hover:text-[#FF5B60] transition-colors">마이페이지</Link>
                  <button onClick={logout} className="hover:text-[#FF5B60] transition-colors">로그아웃</button>
                  <Link to="/cs" className="hover:text-[#FF5B60] transition-colors font-medium">고객센터</Link>
                </>
              ) : (
                // Logged Out View
                <>
                  <Link to="/login" className="hover:text-[#FF5B60] transition-colors">로그인</Link>
                  <Link to="/signup" className="hover:text-[#FF5B60] transition-colors">회원가입</Link>
                  <Link to="/cs" className="hover:text-[#FF5B60] transition-colors font-medium">고객센터</Link>
                </>
              )}
            </div>
          </Container>
        </div>

        {/* Main Header Area */}
        <div className="py-3 md:py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <Container>
            <div className="flex items-center justify-between gap-1 md:gap-8">
              {/* Logo */}
              <a href="/" className="flex-shrink-0">
                <img src="/logo.png" alt="행사어때" className="h-[17px] md:h-6 object-contain" />
              </a>

              {/* Desktop Spacer */}
              <div className="hidden md:block flex-1" />

              {/* Search Bar */}
              <div className="flex-1 md:flex-none min-w-0 max-w-sm md:w-[380px] ml-1 md:ml-0">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="무엇을 도와드릴까요?"
                    className="w-full pl-5 pr-14 py-2.5 md:py-3 rounded-full bg-slate-100 border-none focus:ring-2 focus:ring-[#FF5B60]/20 focus:bg-white transition-all text-[12px] md:text-sm text-gray-700 placeholder-gray-400 font-normal"
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
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF5B60] transition-colors"
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input');
                      if (input && input.value.trim()) {
                        window.location.href = `/search?q=${encodeURIComponent(input.value)}`;
                      }
                    }}
                  >
                    <Search size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-0.5 md:gap-1">
                <Link
                  to={user ? "/mypage" : "/login"}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-slate-600 transition-colors rounded-xl md:rounded-full hover:bg-slate-100 hover:text-[#FF5B60]"
                  title={user ? "마이페이지" : "로그인"}
                >
                  <ProfileIcon className="w-6 h-6 md:w-7 md:h-7" />
                </Link>
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAllRead={handleMarkAllRead}
                  onNotificationClick={handleNotificationClick}
                />
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center md:hidden gap-0.5">
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAllRead={handleMarkAllRead}
                  onNotificationClick={handleNotificationClick}
                />
                <button
                  className="w-10 h-10 flex items-center justify-center text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                  onClick={() => setShowMobileMenu(true)}
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </Container>
        </div>

        {/* Global Navigation - Also sticky and reveals with header */}
        <div className="border-t border-gray-100 relative bg-white">
          <Container>
            <div className="relative">
              <nav className="flex items-center gap-6 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth snap-x">
                <div
                  className="hidden md:block"
                  onMouseEnter={() => setShowDesktopMenu(true)}
                  onMouseLeave={() => setShowDesktopMenu(false)}
                >
                  <button
                    className={`flex items-center gap-2 whitespace-nowrap text-sm font-medium px-1 py-3 border-b-2 transition-all ${showDesktopMenu ? 'text-[#FF5B60] border-[#FF5B60]' : 'text-[#FF5B60] border-transparent hover:border-[#FF5B60]'}`}
                  >
                    <MenuIcon className="w-[18px] h-[18px]" /> 전체메뉴
                  </button>
                </div>

                {navItems.map((item) => {
                  const linkUrl = `/products?sectionId=${item.id}&title=${encodeURIComponent(item.name)}`;
                  const isCurrent = location.search.includes(`sectionId=${item.id}`);

                  return (
                    <Link
                      key={item.id}
                      to={linkUrl}
                      className={`whitespace-nowrap text-[13px] md:text-sm font-medium transition-all px-1 py-3 border-b-2 ${isCurrent
                        ? 'text-[#FF5B60] border-[#FF5B60]'
                        : 'text-slate-500 border-transparent hover:text-[#FF5B60] hover:border-gray-200'
                        }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
            </div>
          </Container>

          {/* Desktop Mega Menu Dropdown */}
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
      </div>

      {/* Mobile Full Menu Overlay */}
      {showMobileMenu && (
        <FullMenu variant="mobile" onClose={() => setShowMobileMenu(false)} />
      )}
    </header>
  );
};