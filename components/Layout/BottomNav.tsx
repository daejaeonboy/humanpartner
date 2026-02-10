import React from 'react';
import { Home, Search, LayoutGrid, User, Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const BottomNav: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { icon: <Home size={22} />, label: '홈', path: '/' },
        { icon: <Search size={22} />, label: '검색', path: '/products' },
        { icon: <LayoutGrid size={22} />, label: '카테고리', path: '/products' },
        { icon: <Heart size={22} />, label: '찜', path: '/mypage' },
        { icon: <User size={22} />, label: 'MY', path: '/mypage' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 z-50 px-2 pb-safe-area">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1 min-w-[64px] transition-all duration-300 ${isActive ? 'text-[#FF5B60] scale-105' : 'text-slate-400'
                                }`}
                        >
                            <div className={`${isActive ? 'animate-pulse' : ''}`}>
                                {item.icon}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
