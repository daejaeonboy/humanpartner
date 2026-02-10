import React, { useState } from 'react';
import { Container } from '../components/ui/Container';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../src/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthErrorMessage } from '../src/utils/authErrors';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
            navigate('/');
        } catch (error: any) {
            console.error('Login failed', error);
            const message = getAuthErrorMessage(error.code);
            alert('로그인에 실패했습니다: ' + message);
            setLoading(false);
        }
    };

    return (
        <div className="py-20 bg-gray-50 min-h-screen flex items-center justify-center">
            <Container>
                <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
                        <p className="text-gray-500 text-sm mt-2">휴먼파트너 서비스 이용을 위해 로그인해주세요.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                placeholder="example@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                placeholder="비밀번호를 입력하세요"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white py-4 rounded-lg font-bold transition-all mt-6 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF5B60] hover:bg-[#e54a4f]'}`}
                        >
                            {loading ? '로그인 중...' : '로그인하기'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        계정이 없으신가요? <Link to="/signup" className="text-[#FF5B60] font-bold hover:underline">회원가입</Link>
                    </div>
                </div>
            </Container>
        </div>
    );
};

