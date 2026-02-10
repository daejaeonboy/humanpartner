import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { auth } from '../../src/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getUserProfileByFirebaseUid } from '../../src/api/userApi';
import { getAuthErrorMessage } from '../../src/utils/authErrors';

export const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname || '/admin';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Firebase 로그인
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // 2. 프로필 및 관리자 권한 확인
            const profile = await getUserProfileByFirebaseUid(userCredential.user.uid);

            if (!profile) {
                await auth.signOut();
                setError('등록되지 않은 계정입니다.');
                setLoading(false);
                return;
            }

            // 관리자는 승인 여부와 관계없이 로그인 가능
            if (!profile.is_admin) {
                // 일반 사용자는 승인 필요
                if (!profile.is_approved) {
                    await auth.signOut();
                    setError('아직 관리자 승인이 완료되지 않았습니다. 승인 후 다시 시도해주세요.');
                    setLoading(false);
                    return;
                }
                // 일반 사용자는 관리자 페이지 접근 불가
                await auth.signOut();
                setError('관리자 권한이 없는 계정입니다.');
                setLoading(false);
                return;
            }

            // 3. 관리자 페이지로 이동
            navigate(from, { replace: true });
        } catch (error: any) {
            console.error('Admin login failed:', error);
            setError(getAuthErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF5B60] rounded-2xl mb-4">
                        <Shield className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
                    <p className="text-gray-500 mt-2">행사어때 관리 시스템</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                관리자 이메일
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                placeholder="admin@micepartner.co.kr"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#FF5B60] text-white rounded-lg font-semibold hover:bg-[#002d66] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    로그인 중...
                                </>
                            ) : (
                                '관리자 로그인'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-600">
                            아직 계정이 없으신가요?{' '}
                            <Link to="/admin/signup" className="text-[#FF5B60] font-semibold hover:underline">
                                회원가입
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <a
                        href="/"
                        className="text-sm text-gray-500 hover:text-[#FF5B60] transition-colors"
                    >
                        ← 메인 사이트로 돌아가기
                    </a>
                </div>

                <p className="text-center text-gray-400 text-xs mt-6">
                    © 2025 행사어때. All rights reserved.
                </p>
            </div>
        </div>
    );
};
