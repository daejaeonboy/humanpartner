import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { auth } from '../../src/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createUserProfile } from '../../src/api/userApi';
import { getAuthErrorMessage } from '../../src/utils/authErrors';

export const AdminSignup: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            setFormData({ ...formData, phone: formatPhoneNumber(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (formData.password.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        setLoading(true);
        try {
            // 1. Firebase Auth 회원가입
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await updateProfile(userCredential.user, {
                displayName: formData.name
            });

            // 2. Supabase에 프로필 저장 (관리자 요청 - 승인 대기)
            await createUserProfile({
                firebase_uid: userCredential.user.uid,
                email: formData.email,
                name: formData.name,
                phone: formData.phone,
                company_name: '행사어때', // 관리자용 기본값
                agreed_terms: true,
                agreed_privacy: true,
                agreed_marketing: false
            });

            // 로그아웃 (승인 후 로그인 필요)
            await auth.signOut();

            alert('회원가입이 완료되었습니다.\n관리자 승인 후 로그인할 수 있습니다.');
            navigate('/admin/login');
        } catch (error: any) {
            console.error('Sign up failed', error);
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
                    <h1 className="text-2xl font-bold text-gray-900">관리자 회원가입</h1>
                    <p className="text-gray-500 mt-2">행사어때 관리 시스템</p>
                </div>

                {/* Signup Form */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                이름 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                placeholder="홍길동"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                이메일 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                placeholder="admin@micepartner.co.kr"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                전화번호 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                placeholder="010-1234-5678"
                                maxLength={13}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호 <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all pr-10"
                                        placeholder="8자 이상"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호 확인 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                    placeholder="비밀번호 확인"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <p className="text-xs text-gray-500 text-center">
                                회원가입 시 관리자 승인 후 로그인이 가능합니다.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#FF5B60] text-white rounded-lg font-semibold hover:bg-[#002d66] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    가입 중...
                                </>
                            ) : (
                                '회원가입'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-600">
                            이미 계정이 있으신가요?{' '}
                            <Link to="/admin/login" className="text-[#FF5B60] font-semibold hover:underline">
                                로그인
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
