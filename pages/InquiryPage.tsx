import React, { useState, useEffect } from 'react';
import { Container } from '../components/ui/Container';
import { User, MessageSquare, Clock, Loader2, Plus, X, Send, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../src/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getMyInquiries, addInquiry, Inquiry } from '../src/api/inquiryApi';

export const InquiryPage: React.FC = () => {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '', category: '서비스 이용' });

    const loadInquiries = async () => {
        if (!user) return;
        try {
            const data = await getMyInquiries(user.uid);
            setInquiries(data);
        } catch (error) {
            console.error('Failed to load inquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInquiries();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await addInquiry({
                user_id: user.uid,
                user_name: userProfile?.name || '',
                user_email: userProfile?.email || user.email || '',
                company_name: userProfile?.company_name || '',
                category: formData.category,
                title: formData.title,
                content: formData.content,
            });
            setFormData({ title: '', content: '', category: '서비스 이용' });
            setShowForm(false);
            await loadInquiries();
        } catch (error) {
            console.error('Failed to submit inquiry:', error);
            alert('문의 등록에 실패했습니다. 테이블이 생성되었는지 확인해주세요.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
        const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return `${date} ${time}`;
    };

    if (!user) {
        return (
            <div className="py-20 text-center">
                <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
                <Link to="/login" className="text-[#FF5B60] underline">로그인하기</Link>
            </div>
        );
    }

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
                                <Link to="/mypage/info" className="text-sm text-gray-500 block w-full text-left py-2 px-2 rounded hover:bg-gray-50 hover:text-black">
                                    내 정보 관리
                                </Link>
                                <Link to="/mypage/inquiry" className="text-sm font-bold text-[#FF5B60] block w-full text-left py-2 px-2 rounded hover:bg-[#FF5B60]/5">
                                    1:1 문의 내역
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:w-3/4">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <MessageSquare size={24} /> 1:1 문의 내역
                            </h1>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all font-bold text-sm ${showForm ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                            >
                                {showForm ? <X size={18} /> : <Plus size={18} />}
                                {showForm ? '작성 취소' : '문의하기'}
                            </button>
                        </div>

                        {/* Inquiry Form */}
                        {showForm && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 animate-fadeIn">
                                <h3 className="font-bold text-lg text-gray-900 mb-4">새 문의 작성</h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">문의 분류</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:ring-4 focus:ring-[#FF5B60]/10 focus:border-[#FF5B60] outline-none transition-all font-medium appearance-none"
                                            >
                                                <option value="서비스 이용">서비스 이용</option>
                                                <option value="예약/결제">예약/결제</option>
                                                <option value="취소/환불">취소/환불</option>
                                                <option value="기타">기타</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">제목</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="문의 제목을 입력해주세요"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:ring-4 focus:ring-[#FF5B60]/10 focus:border-[#FF5B60] outline-none transition-all font-medium"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">문의 내용</label>
                                        <textarea
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            placeholder="문의하실 내용을 자세히 적어주세요"
                                            rows={6}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:ring-4 focus:ring-[#FF5B60]/10 focus:border-[#FF5B60] outline-none transition-all font-medium resize-none"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex items-center gap-2 bg-[#FF5B60] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e54a4f] shadow-lg shadow-[#FF5B60]/20 transition-all disabled:bg-gray-300 disabled:shadow-none"
                                        >
                                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                            문의 등록
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Inquiry List */}
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="animate-spin text-[#FF5B60]" size={40} />
                            </div>
                        ) : inquiries.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                                <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 mb-2 font-medium">등록된 문의가 없습니다.</p>
                                <p className="text-gray-400 text-sm">궁금한 점이 있으시면 문의하기 버튼을 눌러주세요.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {inquiries.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${expandedId === item.id ? 'ring-2 ring-gray-900 ring-opacity-5' : 'hover:shadow-md hover:-translate-y-0.5'}`}
                                    >
                                        <button
                                            onClick={() => setExpandedId(expandedId === item.id ? null : (item.id || null))}
                                            className="w-full px-6 py-6 text-left"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    {item.status === 'answered' ? (
                                                        <span className="px-3 py-1 bg-[#FF5B60] text-white text-[10px] uppercase tracking-wider font-extrabold rounded-md shadow-sm">
                                                            답변완료
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] uppercase tracking-wider font-extrabold rounded-md border border-gray-200">
                                                            답변대기
                                                        </span>
                                                    )}
                                                    <span className="text-gray-300 mx-1 font-light text-xs">|</span>
                                                    <span className="text-[12px] font-bold text-gray-700">
                                                        {item.category || '서비스 이용'}
                                                    </span>
                                                </div>
                                                <div className="text-[12px] font-medium text-gray-400">
                                                    {formatDate(item.created_at!)}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start justify-between gap-4">
                                                <h3 className={`text-lg leading-snug flex-1 ${expandedId === item.id ? 'font-black text-gray-900' : 'font-extrabold text-gray-800'}`}>
                                                    {item.title}
                                                </h3>
                                                <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${expandedId === item.id ? 'rotate-180 bg-gray-100' : ''}`}>
                                                    <ChevronDown size={18} className="text-gray-400" />
                                                </div>
                                            </div>
                                        </button>

                                        {expandedId === item.id && (
                                            <div className="px-6 pb-6 animate-fadeIn">
                                                <div className="h-px bg-gray-100 mb-6 w-full" />
                                                
                                                <div className="space-y-8">
                                                    {/* Question Section */}
                                                    <div className="flex gap-4 sm:gap-6">
                                                        <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center font-black text-lg flex-shrink-0 border border-gray-200/50">
                                                            Q
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">나의 문의 내용</span>
                                                                <span className="text-[10px] font-medium text-gray-300">{formatDate(item.created_at!)}</span>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                                                <p className="text-[15px] font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                                    {item.content}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Answer Section */}
                                                    {item.status === 'answered' && item.answer ? (
                                                        <div className="flex gap-4 sm:gap-6">
                                                            <div className="w-10 h-10 rounded-2xl bg-[#FF5B60] text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-lg shadow-[#FF5B60]/20">
                                                                A
                                                            </div>
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs font-black text-[#FF5B60] uppercase tracking-tight">행사어때 답변</span>
                                                                        <CheckCircle size={10} className="text-[#FF5B60]" />
                                                                    </div>
                                                                    <span className="text-[10px] font-medium text-gray-300">{formatDate(item.answered_at!)}</span>
                                                                </div>
                                                                <div className="bg-white rounded-2xl p-5 border-2 border-[#FF5B60]/10 shadow-sm">
                                                                    <p className="text-[15px] font-bold text-gray-800 leading-relaxed whitespace-pre-wrap italic">
                                                                        "{item.answer}"
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-4 sm:gap-6">
                                                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0 border border-amber-100">
                                                                <Clock size={20} className="animate-pulse" />
                                                            </div>
                                                            <div className="flex-1 space-y-2">
                                                                <span className="text-xs font-bold text-amber-600 uppercase tracking-tight">진행 상태</span>
                                                                <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100/50">
                                                                    <p className="text-[14px] font-bold text-amber-700">
                                                                        문의가 접수되었습니다. 담당자가 상세 내용을 검토 중입니다.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );
};
