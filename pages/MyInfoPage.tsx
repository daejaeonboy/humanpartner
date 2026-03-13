import React, { useState, useEffect } from 'react';
import { Container } from '../components/ui/Container';
import { User, Settings, Loader2, Save, Eye, EyeOff, Mail, Lock, Building2, Phone, MapPin, UserCircle } from 'lucide-react';
import { useAuth } from '../src/context/AuthContext';
import { Link } from 'react-router-dom';
import { updateUserProfile, updateFirebaseEmail, updateFirebasePassword } from '../src/api/userApi';

export const MyInfoPage: React.FC = () => {
    const { user, userProfile, refreshProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        company_name: '',
        department: '',
        position: '',
        address: '',
        manager_name: '',
    });

    const [emailForm, setEmailForm] = useState({ email: '' });
    const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
    const [emailSaving, setEmailSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                phone: userProfile.phone || '',
                company_name: userProfile.company_name || '',
                department: userProfile.department || '',
                position: userProfile.position || '',
                address: userProfile.address || '',
                manager_name: userProfile.manager_name || '',
            });
            setEmailForm({ email: userProfile.email || '' });
        }
    }, [userProfile]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.id) return;
        setSaving(true);
        try {
            await updateUserProfile(userProfile.id, formData);
            await refreshProfile();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('프로필 저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangeEmail = async () => {
        if (!user || !emailForm.email.trim()) return;
        if (emailForm.email === userProfile?.email) {
            alert('현재와 동일한 이메일입니다.');
            return;
        }
        setEmailSaving(true);
        try {
            await updateFirebaseEmail(user.uid, emailForm.email);
            if (userProfile?.id) {
                await updateUserProfile(userProfile.id, { email: emailForm.email });
            }
            await refreshProfile();
            alert('이메일이 변경되었습니다.');
        } catch (error: any) {
            alert(error.message || '이메일 변경에 실패했습니다.');
        } finally {
            setEmailSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user) return;
        if (passwordForm.password.length < 6) {
            alert('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        if (passwordForm.password !== passwordForm.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        setPasswordSaving(true);
        try {
            await updateFirebasePassword(user.uid, passwordForm.password);
            setPasswordForm({ password: '', confirmPassword: '' });
            alert('비밀번호가 변경되었습니다.');
        } catch (error: any) {
            alert(error.message || '비밀번호 변경에 실패했습니다.');
        } finally {
            setPasswordSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="py-20 text-center">
                <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
                <Link to="/login" className="text-[#FF5B60] underline">로그인하기</Link>
            </div>
        );
    }

    const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:ring-4 focus:ring-[#FF5B60]/10 focus:border-[#FF5B60] outline-none transition-all font-medium text-sm";

    return (
        <div className="py-12 bg-gray-50 min-h-screen">
            <Container>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="md:w-1/4">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                            <div className="w-20 h-20 bg-[#B3C1D4] rounded-full mx-auto mb-4 flex items-center justify-center">
                                <User size={32} className="text-[#FF5B60]" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">{userProfile?.name || '고객'} 님</h2>
                            <p className="text-sm text-gray-500 mb-6">{userProfile?.email || user.email}</p>
                            <div className="text-left space-y-1 border-t border-gray-100 pt-4">
                                <Link to="/mypage" className="text-sm text-gray-500 block w-full text-left py-2 px-2 rounded hover:bg-gray-50 hover:text-black">
                                    예약 내역
                                </Link>
                                <Link to="/mypage/info" className="text-sm font-bold text-[#FF5B60] block w-full text-left py-2 px-2 rounded hover:bg-[#FF5B60]/5">
                                    내 정보 관리
                                </Link>
                                <Link to="/mypage/inquiry" className="text-sm text-gray-500 block w-full text-left py-2 px-2 rounded hover:bg-gray-50 hover:text-black">
                                    1:1 문의 내역
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:w-3/4 space-y-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Settings size={24} /> 내 정보 관리
                        </h1>

                        {/* Profile Form */}
                        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                                <UserCircle size={20} className="text-[#FF5B60]" />
                                기본 정보
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">이름 *</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1 flex items-center gap-1"><Phone size={12} /> 전화번호 *</label>
                                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1 flex items-center gap-1"><Building2 size={12} /> 회사명</label>
                                    <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">담당자명</label>
                                    <input type="text" value={formData.manager_name} onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })} className={inputClass} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">부서</label>
                                    <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">직급</label>
                                    <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className={inputClass} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1 flex items-center gap-1"><MapPin size={12} /> 주소</label>
                                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputClass} />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm
                                        ${saved ? 'bg-green-500 text-white' : 'bg-[#FF5B60] text-white hover:bg-[#e54a4f] shadow-lg shadow-[#FF5B60]/20'}
                                        disabled:bg-gray-300 disabled:shadow-none`}
                                >
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : saved ? '✓ 저장 완료' : <><Save size={18} /> 정보 저장</>}
                                </button>
                            </div>
                        </form>

                        {/* Email Change */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                                <Mail size={20} className="text-[#FF5B60]" />
                                이메일 변경
                            </h3>
                            <div className="flex gap-3">
                                <input
                                    type="email"
                                    value={emailForm.email}
                                    onChange={(e) => setEmailForm({ email: e.target.value })}
                                    className={`${inputClass} flex-1`}
                                />
                                <button
                                    onClick={handleChangeEmail}
                                    disabled={emailSaving}
                                    className="px-5 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all disabled:bg-gray-300 flex-shrink-0"
                                >
                                    {emailSaving ? <Loader2 className="animate-spin" size={18} /> : '변경'}
                                </button>
                            </div>
                        </div>

                        {/* Password Change */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                                <Lock size={20} className="text-[#FF5B60]" />
                                비밀번호 변경
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordForm.password}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                                        placeholder="새 비밀번호 (6자 이상)"
                                        className={inputClass}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    placeholder="비밀번호 확인"
                                    className={inputClass}
                                />
                            </div>
                            <button
                                onClick={handleChangePassword}
                                disabled={passwordSaving || !passwordForm.password}
                                className="px-5 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all disabled:bg-gray-300"
                            >
                                {passwordSaving ? <Loader2 className="animate-spin" size={18} /> : '비밀번호 변경'}
                            </button>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
};
