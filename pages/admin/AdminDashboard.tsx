import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Package, CalendarCheck, LayoutDashboard, ArrowLeft, Layers, Tag, Settings, Users, LogOut, User, Menu, HelpCircle } from 'lucide-react';
import { useAuth } from '../../src/context/AuthContext';

export const AdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userProfile, logout } = useAuth();
    const isRoot = location.pathname === '/admin';

    const handleLogout = async () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            await logout();
            navigate('/admin/login');
        }
    };

    const navItems = [
        { path: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
        { path: '/admin/cms', label: 'CMS 관리', icon: Settings },
        { path: '/admin/sections', label: '섹션 관리', icon: Layers },
        // Category management removed as per request
        { path: '/admin/products', label: '상품 관리', icon: Package },
        { path: '/admin/bookings', label: '예약 확인', icon: CalendarCheck },
        { path: '/admin/users', label: '회원 관리', icon: Users },
        { path: '/admin/menus', label: '전체 메뉴 관리', icon: Menu },
        { path: '/admin/faqs', label: 'FAQ 관리', icon: HelpCircle },
    ];

    const isActive = (path: string, exact?: boolean) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Admin Header */}
            <header className="bg-gradient-to-r from-[#FF5B60] to-[#FF7A7E] text-white py-4 px-6 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        <span className="text-sm">홈으로</span>
                    </Link>
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-semibold text-sm border border-white/30">
                            {userProfile?.name?.charAt(0) || <User size={16} />}
                        </div>
                        <div className="text-sm">
                            <div className="font-medium">{userProfile?.name || '관리자'}</div>
                            <div className="text-white/60 text-xs">{userProfile?.email}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm transition-colors border border-white/20"
                    >
                        <LogOut size={16} />
                        <span>로그아웃</span>
                    </button>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-64px)]">
                    <nav className="p-4">
                        <ul className="space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.path, item.exact);
                                return (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active
                                                ? 'bg-[#FF5B60] text-white shadow-md'
                                                : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            <Icon size={20} />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {isRoot ? (
                        <div className="space-y-8">
                            {/* Welcome Section */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold mb-2 text-gray-900">안녕하세요, {userProfile?.name || '관리자'}님! 👋</h2>
                                <p className="text-gray-500">행사어때 관리자 대시보드에 오신 것을 환영합니다.</p>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Link
                                    to="/admin/cms"
                                    className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#FF5B60]/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gradient-to-br from-[#FF5B60]/10 to-[#FF5B60]/5 rounded-xl group-hover:from-[#FF5B60] group-hover:to-[#FF8A8E] transition-all duration-300">
                                            <Settings className="text-[#FF5B60] group-hover:text-white transition-colors" size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#FF5B60] transition-colors">CMS 관리</h3>
                                            <p className="text-slate-500 text-sm">아이콘, 탭, 배너 편집</p>
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    to="/admin/sections"
                                    className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#FF5B60]/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gradient-to-br from-[#FF5B60]/10 to-[#FF5B60]/5 rounded-xl group-hover:from-[#FF5B60] group-hover:to-[#FF8A8E] transition-all duration-300">
                                            <Layers className="text-[#FF5B60] group-hover:text-white transition-colors" size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#FF5B60] transition-colors">섹션 관리</h3>
                                            <p className="text-slate-500 text-sm">메인 페이지 섹션 편집</p>
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    to="/admin/products"
                                    className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#FF5B60]/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gradient-to-br from-[#FF5B60]/10 to-[#FF5B60]/5 rounded-xl group-hover:from-[#FF5B60] group-hover:to-[#FF8A8E] transition-all duration-300">
                                            <Package className="text-[#FF5B60] group-hover:text-white transition-colors" size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#FF5B60] transition-colors">상품 관리</h3>
                                            <p className="text-slate-500 text-sm">상품 추가, 수정, 삭제</p>
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    to="/admin/bookings"
                                    className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#FF5B60]/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gradient-to-br from-[#FF5B60]/10 to-[#FF5B60]/5 rounded-xl group-hover:from-[#FF5B60] group-hover:to-[#FF8A8E] transition-all duration-300">
                                            <CalendarCheck className="text-[#FF5B60] group-hover:text-white transition-colors" size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#FF5B60] transition-colors">예약 확인</h3>
                                            <p className="text-slate-500 text-sm">고객 예약 목록 확인</p>
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    to="/admin/users"
                                    className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#FF5B60]/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gradient-to-br from-[#FF5B60]/10 to-[#FF5B60]/5 rounded-xl group-hover:from-[#FF5B60] group-hover:to-[#FF8A8E] transition-all duration-300">
                                            <Users className="text-[#FF5B60] group-hover:text-white transition-colors" size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#FF5B60] transition-colors">회원 관리</h3>
                                            <p className="text-slate-500 text-sm">가입 회원 목록 관리</p>
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    to="/admin/menus"
                                    className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#FF5B60]/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gradient-to-br from-[#FF5B60]/10 to-[#FF5B60]/5 rounded-xl group-hover:from-[#FF5B60] group-hover:to-[#FF8A8E] transition-all duration-300">
                                            <Menu className="text-[#FF5B60] group-hover:text-white transition-colors" size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#FF5B60] transition-colors">전체 메뉴 관리</h3>
                                            <p className="text-slate-500 text-sm">네비게이션 메뉴 설정</p>
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    to="/admin/faqs"
                                    className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#FF5B60]/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gradient-to-br from-[#FF5B60]/10 to-[#FF5B60]/5 rounded-xl group-hover:from-[#FF5B60] group-hover:to-[#FF8A8E] transition-all duration-300">
                                            <HelpCircle className="text-[#FF5B60] group-hover:text-white transition-colors" size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#FF5B60] transition-colors">FAQ 관리</h3>
                                            <p className="text-slate-500 text-sm">고객센터 자주 묻는 질문 편집</p>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </main>
            </div>
        </div>
    );
};
