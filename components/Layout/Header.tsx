import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Container } from "../ui/Container";
import { NAV_LINKS, TOP_LINKS } from "../../constants";
import { useAuth } from "../../src/context/AuthContext";
import { usePublicContent } from "../../src/context/PublicContentContext";
import { FullMenu } from "./FullMenu";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  Notification,
} from "../../src/api/notificationApi";

const BellIcon = ({ className }: { className?: string }) => (
  <img src="/notifications.svg" alt="알림" className={className} decoding="async" />
);

const MenuIcon = ({ className }: { className?: string }) => (
  <img src="/menu.svg" alt="메뉴" className={className} decoding="async" />
);

const ProfileIcon = ({ className }: { className?: string }) => (
  <img src="/person.svg" alt="프로필" className={className} decoding="async" />
);

const NotificationDropdown = ({
  notifications,
  unreadCount,
  loading,
  onOpen,
  onMarkAllRead,
  onNotificationClick,
}: {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onOpen: () => void;
  onMarkAllRead: () => void;
  onNotificationClick: (n: Notification) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);

    if (next) {
      onOpen();
    }
  };

  return (
    <div className="relative z-50">
      <button
        className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-slate-500 transition-colors rounded-full hover:bg-slate-100 ${isOpen ? "text-[#39B54A] bg-green-50" : ""}`}
        onClick={toggleOpen}
      >
        <BellIcon className="w-6 h-6 md:w-7 md:h-7 opacity-80" />
        {/* Badge - Only show if unreadCount > 0 */}
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#39B54A] rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between p-3 border-b border-gray-50 bg-gray-50/50">
              <span className="font-bold text-gray-900 text-sm">알림</span>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs text-gray-400 hover:text-[#39B54A]"
                >
                  모두 읽음
                </button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="py-8 flex items-center justify-center text-gray-400 text-xs">
                  <Search className="w-4 h-4 mr-2" />
                  불러오는 중...
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {notifications.map((noti) => (
                    <button
                      key={noti.id}
                      onClick={() => {
                        onNotificationClick(noti);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex gap-3 ${!noti.is_read ? "bg-green-50/40" : ""}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!noti.is_read ? "bg-[#39B54A]" : "bg-gray-200"}`}
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
  const { navMenuItems } = usePublicContent();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  // Removed showNotifications state as it is now inside NotificationDropdown
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        const count = await getUnreadCount(user.uid);
        setUnreadCount(count);
      };
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, location.pathname]);

  const loadNotificationList = async () => {
    if (!user) return;

    setLoadingNotifications(true);
    try {
      const data = await getNotifications(user.uid);
      setNotifications(data);
      setUnreadCount(data.filter((notification) => !notification.is_read).length);
    } finally {
      setLoadingNotifications(false);
    }
  };

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

  const secondaryNavItems = [
    { to: '/alliance', label: 'MICE 회원사', active: location.pathname === '/alliance' },
    { to: '/cases', label: '설치사례', active: location.pathname === '/cases' },
    { to: '/notices', label: '공지사항', active: location.pathname === '/notices' },
    { to: '/cs', label: '고객센터', active: location.pathname === '/cs' },
  ];

  return (
    <header className="w-full bg-white">
      <div className="bg-white">
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
                  <Link
                    to="/mypage"
                    className="hover:text-gray-900 transition-colors"
                  >
                    마이페이지
                  </Link>
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
                  src="/Miceday_Logo.png"
                  alt="행사어때"
                  className="h-[24px] md:h-[28px] object-contain"
                  decoding="async"
                />
                <span className="text-[0.8rem] text-gray-400 font-medium mt-0.5 whitespace-nowrap hidden sm:block tracking-[1px]">
                  | 대전 MICE 행사 통합운영 플랫폼
                </span>
              </a>

              <div className="hidden md:block flex-1" />

              {/* Right Aligned Area: Search + Actions */}
              <div className="flex items-center gap-1 md:gap-2 justify-end">
                {/* Search Bar (Responsive for both Mobile and Desktop) */}
                <div className="flex flex-1 md:flex-none relative group max-w-[200px] sm:max-w-[250px] md:max-w-none md:w-[320px]">
                  <input
                    type="text"
                    placeholder="무엇을 도와드릴까요?"
                    className="w-full h-[38px] md:h-[42px] pl-4 md:pl-6 pr-10 md:pr-12 rounded-full bg-slate-100/60 border border-transparent focus:border-slate-200 focus:ring-2 focus:ring-[#39B54A]/10 focus:bg-white transition-all text-[13px] md:text-[14px] text-slate-600 placeholder-slate-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const target = e.target as HTMLInputElement;
                        if (target.value.trim())
                          window.location.href = `/search?q=${encodeURIComponent(target.value)}`;
                      }
                    }}
                  />
                  <Search className="absolute right-3.5 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 md:w-4.5 md:h-4.5" />
                </div>

                {/* Actions (Both Mobile & Desktop) */}
                <div className="flex items-center gap-0 md:gap-0.5 relative z-50">
                  <Link
                    to={user ? "/mypage" : "/login"}
                    className="hidden md:flex w-10 h-10 md:w-11 md:h-11 items-center justify-center text-slate-500 transition-colors rounded-full hover:bg-slate-100"
                  >
                    <ProfileIcon className="w-6 h-6 md:w-7 md:h-7 opacity-80" />
                  </Link>
                  <div className="relative z-[60]">
                    <NotificationDropdown
                      notifications={notifications}
                      unreadCount={unreadCount}
                      loading={loadingNotifications}
                      onOpen={loadNotificationList}
                      onMarkAllRead={handleMarkAllRead}
                      onNotificationClick={handleNotificationClick}
                    />
                  </div>
                  {/* Mobile Menu Toggle Button */}
                  <button
                    className="md:hidden w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full"
                    onClick={() => setShowMobileMenu(true)}
                  >
                    <MenuIcon className="w-6 h-6 opacity-80" />
                  </button>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Premium GNB - Centered and Generous Spacing */}
        <div className="border-t border-b border-gray-100 relative bg-white z-40">
          <Container>
            <div className="relative flex justify-start w-full">
              <nav className="flex items-stretch justify-between sm:justify-start sm:gap-0 md:gap-0 w-full md:w-auto overflow-x-auto no-scrollbar scroll-smooth snap-x md:-ml-4 px-0">
                <div
                  className="hidden md:flex self-stretch"
                  onMouseEnter={() => setShowDesktopMenu(true)}
                  onMouseLeave={() => setShowDesktopMenu(false)}
                >
                  <button
                    onClick={() => navigate("/products")}
                    className={`group relative z-10 flex h-full items-center gap-2 whitespace-nowrap px-4 py-4 text-[15px] font-medium transition-all after:pointer-events-none after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[4px] after:content-[''] ${showDesktopMenu ? "text-[#39B54A] after:bg-[#39B54A]" : "text-slate-600 after:bg-transparent hover:text-[#39B54A] hover:after:bg-[#39B54A]"}`}
                  >
                    <MenuIcon className={`w-[24px] h-[24px] transition-colors ${showDesktopMenu ? "filter-green" : "opacity-70 group-hover:filter-green"}`} /> 전체 서비스
                  </button>
                </div>

                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative z-10 inline-flex self-stretch items-center whitespace-nowrap px-0.5 py-4 text-[14px] font-medium transition-all min-[357px]:text-[15px] min-[375px]:px-2 sm:px-4 after:pointer-events-none after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[4px] after:content-[''] ${
                      item.active
                        ? 'text-[#39B54A] after:bg-[#39B54A]'
                        : 'text-slate-600 after:bg-transparent hover:text-[#39B54A] hover:after:bg-[#39B54A]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
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
              items={navMenuItems}
              onClose={() => setShowDesktopMenu(false)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Full Menu Overlay */}
      {showMobileMenu && (
        <FullMenu
          variant="mobile"
          items={navMenuItems}
          onClose={() => setShowMobileMenu(false)}
        />
      )}
    </header>
  );
};
