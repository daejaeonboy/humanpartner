import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface AdminRouteProps {
    children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { user, userProfile, loading, isAdmin } = useAuth();
    const location = useLocation();

    // Still loading auth state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-[#FF5B60] mx-auto" size={48} />
                    <p className="mt-4 text-slate-600">인증 확인 중...</p>
                </div>
            </div>
        );
    }

    // Not logged in - redirect to login
    if (!user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Logged in but no profile yet (might be first login before profile creation)
    // Or user is not admin
    if (!userProfile || !isAdmin) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">접근 권한 없음</h1>
                    <p className="text-slate-600 mb-6">
                        관리자 페이지에 접근할 권한이 없습니다.<br />
                        관리자 권한이 필요한 경우 시스템 관리자에게 문의하세요.
                    </p>
                    <div className="space-y-3">
                        <a
                            href="/"
                            className="block w-full py-3 bg-[#FF5B60] text-white rounded-lg font-medium hover:bg-[#002d66] transition-colors"
                        >
                            홈으로 돌아가기
                        </a>
                        <button
                            onClick={() => window.history.back()}
                            className="block w-full py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        >
                            이전 페이지로
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // User is authenticated and is admin
    return <>{children}</>;
};
