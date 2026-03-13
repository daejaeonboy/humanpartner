import React, { useState, useEffect } from 'react';
import { Loader2, MessageSquare, Send, Trash2, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';
import { getAllInquiries, answerInquiry, deleteInquiry, Inquiry } from '../../src/api/inquiryApi';

export const InquiryManager: React.FC = () => {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');

    const loadInquiries = async () => {
        try {
            const data = await getAllInquiries();
            setInquiries(data);
        } catch (error) {
            console.error('Failed to load inquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInquiries();
    }, []);

    const handleAnswer = async (id: string) => {
        if (!answerText.trim()) return;
        setSaving(true);
        try {
            await answerInquiry(id, answerText.trim());
            setAnswerText('');
            setExpandedId(null);
            await loadInquiries();
        } catch (error) {
            console.error('Failed to answer inquiry:', error);
            alert('답변 저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 문의를 삭제하시겠습니까?')) return;
        try {
            await deleteInquiry(id);
            await loadInquiries();
        } catch (error) {
            console.error('Failed to delete inquiry:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const filteredInquiries = inquiries.filter(i => {
        if (filter === 'all') return true;
        return i.status === filter;
    });

    const pendingCount = inquiries.filter(i => i.status === 'pending').length;
    const answeredCount = inquiries.filter(i => i.status === 'answered').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#FF5B60]" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare size={24} className="text-[#FF5B60]" />
                    1:1 문의 관리
                </h1>
                <p className="text-sm text-slate-500 mt-1">고객 문의를 확인하고 답변을 작성합니다.</p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <button onClick={() => setFilter('all')} className={`p-4 rounded-2xl border transition-all ${filter === 'all' ? 'bg-[#FF5B60] text-white border-[#FF5B60] shadow-lg shadow-[#FF5B60]/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <div className={`text-2xl font-extrabold ${filter === 'all' ? 'text-white' : 'text-slate-900'}`}>{inquiries.length}</div>
                    <div className={`text-xs font-bold ${filter === 'all' ? 'text-white/80' : 'text-slate-500'}`}>전체 문의</div>
                </button>
                <button onClick={() => setFilter('pending')} className={`p-4 rounded-2xl border transition-all ${filter === 'pending' ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <div className={`text-2xl font-extrabold ${filter === 'pending' ? 'text-white' : 'text-orange-500'}`}>{pendingCount}</div>
                    <div className={`text-xs font-bold ${filter === 'pending' ? 'text-white/80' : 'text-slate-500'}`}>답변 대기</div>
                </button>
                <button onClick={() => setFilter('answered')} className={`p-4 rounded-2xl border transition-all ${filter === 'answered' ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <div className={`text-2xl font-extrabold ${filter === 'answered' ? 'text-white' : 'text-green-500'}`}>{answeredCount}</div>
                    <div className={`text-xs font-bold ${filter === 'answered' ? 'text-white/80' : 'text-slate-500'}`}>답변 완료</div>
                </button>
            </div>

            {/* Inquiry List */}
            {filteredInquiries.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                    <MessageSquare size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium text-lg">
                        {filter === 'all' ? '등록된 문의가 없습니다.' : filter === 'pending' ? '대기 중인 문의가 없습니다.' : '답변 완료된 문의가 없습니다.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredInquiries.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            {/* Header */}
                            <div
                                className="p-5 cursor-pointer flex items-center gap-4"
                                onClick={() => {
                                    if (expandedId === item.id) {
                                        setExpandedId(null);
                                    } else {
                                        setExpandedId(item.id || null);
                                        if (item.answer) setAnswerText(item.answer);
                                        else setAnswerText('');
                                    }
                                }}
                            >
                                {item.status === 'answered' ? (
                                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                                ) : (
                                    <Clock size={20} className="text-orange-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${item.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {item.status === 'answered' ? '답변완료' : '답변대기'}
                                        </span>
                                        <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-md">
                                            {item.category || '서비스 이용'}
                                        </span>
                                        <span className="text-xs text-slate-400">{formatDate(item.created_at!)}</span>
                                        <span className="text-xs text-slate-400">|</span>
                                        <span className="text-xs text-slate-500 font-medium">{item.user_name || '미상'}</span>
                                        {item.company_name && <span className="text-xs text-slate-400">({item.company_name})</span>}
                                    </div>
                                    <h3 className="font-bold text-slate-800 truncate">{item.title}</h3>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id!); }}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    {expandedId === item.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedId === item.id && (
                                <div className="px-5 pb-5 space-y-4 animate-fadeIn">
                                    {/* Customer Info */}
                                    <div className="flex gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                                        <span>이름: <strong>{item.user_name || '-'}</strong></span>
                                        <span>이메일: <strong>{item.user_email || '-'}</strong></span>
                                        <span>회사: <strong>{item.company_name || '-'}</strong></span>
                                    </div>

                                    {/* Question */}
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <span className="text-xs font-bold text-slate-500 mb-2 block">📩 문의 내용</span>
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                                    </div>

                                    {/* Answer Form */}
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <span className="text-xs font-bold text-blue-600 mb-2 block">✏️ 답변 작성</span>
                                        <textarea
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                            placeholder="답변을 작성해주세요..."
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm resize-none"
                                        />
                                        <div className="flex justify-end mt-3">
                                            <button
                                                onClick={() => handleAnswer(item.id!)}
                                                disabled={saving || !answerText.trim()}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:bg-slate-300 shadow-lg shadow-blue-600/20"
                                            >
                                                {saving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                                {item.status === 'answered' ? '답변 수정' : '답변 등록'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
