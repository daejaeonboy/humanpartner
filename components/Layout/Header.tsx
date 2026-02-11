import React, { useState, useEffect } from 'react';
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
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 76C17.7909 76 16 74.2091 16 72C16 69.7909 17.7909 68 20 68H24V40C24 34.4667 25.6667 29.5667 29 25.3C32.3333 20.9667 36.6667 18.1333 42 16.8V14C42 12.3333 42.5667 10.9333 43.7 9.8C44.9 8.6 46.3333 8 48 8C49.6667 8 51.0667 8.6 52.2 9.8C53.4 10.9333 54 12.3333 54 14V16.8C59.3333 18.1333 63.6667 20.9667 67 25.3C70.3333 29.5667 72 34.4667 72 40V68H76C78.2091 68 80 69.7909 80 72C80 74.2091 78.2091 76 76 76H20ZM48 88C45.8 88 43.9 87.2333 42.3 85.7C40.7667 84.1 40 82.2 40 80H56C56 82.2 55.2 84.1 53.6 85.7C52.0667 87.2333 50.2 88 48 88ZM32 68H64V40C64 35.6 62.4333 31.8333 59.3 28.7C56.1667 25.5667 52.4 24 48 24C43.6 24 39.8333 25.5667 36.7 28.7C33.5667 31.8333 32 35.6 32 40V68Z" fill="currentColor"/>
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8" y="16" width="80" height="8" rx="4" fill="currentColor"/>
    <rect x="8" y="44" width="80" height="8" rx="4" fill="currentColor"/>
    <rect x="8" y="72" width="80" height="8" rx="4" fill="currentColor"/>
  </svg>
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
            className={`p-1.5 md:p-2 text-slate-600 transition-colors rounded-full hover:bg-slate-100 ${isOpen ? 'text-[#FF5B60] bg-red-50' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
         >
            <BellIcon className="w-5 h-5 md:w-6 md:h-6" />
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
          <div className="flex items-center justify-between gap-2 md:gap-8">
            {/* Logo */}
            <a href="/" className="flex-shrink-0">
              <img src="/logo.png" alt="행사어때" className="h-[18px] md:h-6 object-contain" />
              {/* Mobile logo slightly bigger than h-4 for better visibility if needed, or stick to h-4 (16px) */}
            </a>

            {/* Search Bar - Mobile optimized */}
            <div className="flex-1 min-w-0 max-w-sm md:max-w-md">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="무엇을 도와드릴까요?"
                  className="w-full pl-3 pr-8 py-2 md:py-2.5 rounded-full bg-slate-100 border-none focus:ring-2 focus:ring-[#FF5B60]/20 focus:bg-white transition-all text-xs md:text-sm text-gray-700 placeholder-gray-400 font-medium"
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF5B60] transition-colors"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector('input');
                    if (input && input.value.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(input.value)}`;
                    }
                  }}
                >
                  <Search size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
               {/* Desktop Notification */}
               <NotificationDropdown 
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAllRead={handleMarkAllRead}
                  onNotificationClick={handleNotificationClick}
               />
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1 md:hidden">
              {/* Notification Icon */}
              <NotificationDropdown 
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAllRead={handleMarkAllRead}
                  onNotificationClick={handleNotificationClick}
              />

              {/* Menu Icon */}
              <button className="p-1 text-slate-600" onClick={() => setShowMobileMenu(true)}>
                <MenuIcon className="w-6 h-6" />
              </button>
            </div>
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