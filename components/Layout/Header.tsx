import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Container } from "../ui/Container";
import { NAV_LINKS, TOP_LINKS } from "../../constants";
import { getActiveSections, Section } from "../../src/api/sectionApi";
import { getAllNavMenuItems, NavMenuItem } from "../../src/api/cmsApi";
import { useAuth } from "../../src/context/AuthContext";
import { FullMenu } from "./FullMenu";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  Notification,
} from "../../src/api/notificationApi";

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
  onNotificationClick,
}: {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onNotificationClick: (n: Notification) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50">
      <button
        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-slate-600 transition-colors rounded-xl md:rounded-full hover:bg-slate-100 ${isOpen ? "text-[#FF5B60] bg-red-50" : ""}`}
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
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between p-3 border-b border-gray-50 bg-gray-50/50">
              <span className="font-bold text-gray-900 text-sm">알림</span>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs text-gray-400 hover:text-[#FF5B60]"
                >
                  모두 읽음
                </button>
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
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex gap-3 ${!noti.is_read ? "bg-red-50/10" : ""}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!noti.is_read ? "bg-[#FF5B60]" : "bg-gray-200"}`}
                      />
                      <div>
                        <p
                          className={`text-sm ${!noti.is_read ? "font-bold text-gray-900" : "text-gray-600"}`}
                        >
                          {noti.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {noti.message}
                        </p>
                        <p className="text-[10px] text-gray-300 mt-1">
                          {new Date(noti.created_at).toLocaleDateString()}
                        </p>
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
      const currentScrollY =
        window.pageYOffset || document.documentElement.scrollTop;
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      const fetchNotis = async () => {
        const data = await getNotifications(user.uid);
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === noti.id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (noti.link_url) {
      window.location.href = noti.link_url;
    }
  };

  const handleMarkAllRead = async () => {
    if (user) {
      await markAllAsRead(user.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const loadNavItems = async () => {
      try {
        const [items, menuData] = await Promise.all([
          getActiveSections(),
          getAllNavMenuItems(),
        ]);
        setNavItems(items);
        setAllMenuItems(menuData);
      } catch (error) {
        console.error("Failed to load sections:", error);
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
      <div
        className={`
        fixed top-0 left-0 w-full z-40 transition-all duration-300 ease-in-out bg-white border-b border-gray-200
        ${isVisible ? "translate-y-0 shadow-sm" : "-translate-y-full shadow-none"}
      `}
      >
        {/* Top Utility Links - Premium Subtle Style */}
        <div className="hidden md:block bg-[#F8F9FA] border-b border-gray-100 py-2">
          <Container>
            <div className="flex justify-end gap-5 text-[12px] text-gray-500 font-medium items-center">
              {user ? (
                <>
                  <span className="text-gray-900">
                    {user.displayName || user.email}님 안녕하세요
                  </span>
                  <div className="w-px h-3 bg-gray-300 mx-1" />
                  <button
                    onClick={logout}
                    className="hover:text-gray-900 transition-colors"
                  >
                    로그아웃
                  </button>
                  <Link
                    to="/cs"
                    className="hover:text-gray-900 transition-colors"
                  >
                    고객센터
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hover:text-gray-900 transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/signup"
                    className="hover:text-gray-900 transition-colors"
                  >
                    회원가입
                  </Link>
                  <Link
                    to="/cs"
                    className="hover:text-gray-900 transition-colors"
                  >
                    고객센터
                  </Link>
                </>
              )}
            </div>
          </Container>
        </div>

        {/* Main Header Area */}
        <div className="py-3 md:py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 relative z-50">
          <Container>
            <div className="flex items-center justify-between gap-4 md:gap-8">
              {/* Logo and Subtitle */}
              <a
                href="/"
                className="flex-shrink-0 flex items-center gap-1.5 md:gap-2"
              >
                <img
                  src="/logo.png"
                  alt="행사어때"
                  className="h-[22px] md:h-6 object-contain"
                />
                <span className="text-[0.8rem] text-gray-400 font-medium mt-0.5 whitespace-nowrap hidden sm:block tracking-[1px]">
                  | 대전형 MICE 행사 통합운영 플랫폼
                </span>
              </a>

              <div className="hidden md:block flex-1" />

              {/* Right Aligned Area: Search + Actions */}
              <div className="flex items-center gap-1 md:gap-6 justify-end">
                {/* Search Bar (Responsive for both Mobile and Desktop) */}
                <div className="flex flex-1 md:flex-none relative group max-w-[200px] sm:max-w-[250px] md:max-w-none md:w-[280px]">
                  <input
                    type="text"
                    placeholder="무엇을 도와드릴까요?"
                    className="w-full h-[44px] md:h-auto pl-4 md:pl-5 pr-10 md:pr-12 py-0 md:py-2.5 rounded-xl bg-[#F1F5F9] border border-slate-200 focus:border-[#FF5B60] focus:ring-1 focus:ring-[#FF5B60] focus:bg-white transition-all text-[14px] md:text-sm text-slate-700 placeholder-slate-400 text-ellipsis overflow-hidden whitespace-nowrap"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const target = e.target as HTMLInputElement;
                        if (target.value.trim())
                          window.location.href = `/search?q=${encodeURIComponent(target.value)}`;
                      }
                    }}
                  />
                  <Search className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                </div>

                {/* Actions (Both Mobile & Desktop) */}
                <div className="flex items-center gap-0 relative z-50">
                  <Link
                    to={user ? "/mypage" : "/login"}
                    className="hidden md:flex w-10 h-10 md:w-12 md:h-12 items-center justify-center text-gray-800 transition-colors rounded-full hover:bg-gray-100"
                  >
                    <ProfileIcon className="w-6 h-6 md:w-7 md:h-7" />
                  </Link>
                  <div className="relative z-[60]">
                    <NotificationDropdown
                      notifications={notifications}
                      unreadCount={unreadCount}
                      onMarkAllRead={handleMarkAllRead}
                      onNotificationClick={handleNotificationClick}
                    />
                  </div>
                  {/* Mobile Menu Toggle Button */}
                  <button
                    className="md:hidden w-10 h-10 flex items-center justify-center text-gray-800 hover:bg-gray-100 rounded-full"
                    onClick={() => setShowMobileMenu(true)}
                  >
                    <MenuIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Premium GNB - Centered and Generous Spacing */}
        <div className="border-t border-b border-gray-100 relative bg-white shadow-sm z-40">
          <Container>
            <div className="relative flex justify-start w-full">
              <nav className="flex items-center justify-between sm:justify-start sm:gap-6 md:gap-2 w-full md:w-auto overflow-x-auto no-scrollbar scroll-smooth snap-x md:-ml-4 px-0">
                <div
                  className="hidden md:block"
                  onMouseEnter={() => setShowDesktopMenu(true)}
                  onMouseLeave={() => setShowDesktopMenu(false)}
                >
                  <button
                    className={`flex items-center gap-2 whitespace-nowrap text-[15px] font-[550] px-4 py-4 border-b-2 transition-all ${showDesktopMenu ? "text-[#FF5B60] border-[#FF5B60]" : "text-gray-900 border-transparent hover:text-[#FF5B60] hover:border-[#FF5B60]"}`}
                  >
                    <MenuIcon className="w-[18px] h-[18px]" /> 전체 서비스
                  </button>
                </div>

                <Link
                  to="/alliance"
                  className={`whitespace-nowrap text-[14px] min-[357px]:text-[15px] font-[550] transition-all px-0.5 min-[375px]:px-2 sm:px-4 py-4 border-b-2 ${location.pathname === '/alliance'
                    ? 'text-[#FF5B60] border-[#FF5B60]'
                    : 'text-gray-900 border-transparent hover:text-[#FF5B60] hover:border-[#FF5B60]'
                    }`}
                >
                  MICE 회원사
                </Link>
              </nav>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
            </div>
          </Container>

          {/* Desktop Mega Menu Dropdown */}
          <div
            className={`
              absolute top-full left-0 w-full z-50 transition-all duration-300 ease-in-out origin-top block
              ${showDesktopMenu ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 invisible pointer-events-none"}
            `}
            onMouseEnter={() => setShowDesktopMenu(true)}
            onMouseLeave={() => setShowDesktopMenu(false)}
          >
            <FullMenu
              variant="desktop"
              items={allMenuItems}
              onClose={() => setShowDesktopMenu(false)}
            />
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
