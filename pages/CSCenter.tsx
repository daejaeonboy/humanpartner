import React, { useState, useEffect } from 'react';
import { Container } from '../components/ui/Container';
import { Phone, MessageCircle, ChevronDown, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { getFAQs, FAQ } from '../src/api/faqApi';

const CATEGORIES = ['자주 묻는 질문', '공통', '이용문의', '예약/결제', '취소/환불', '상품문의', '기타'];

export const CSCenter: React.FC = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('자주 묻는 질문');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getFAQs();
                setFaqs(data);
            } catch (error) {
                console.error('Failed to load FAQs:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const toggleAccordion = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const filteredFAQ = faqs.filter(item => {
        if (activeCategory === '자주 묻는 질문') return true;
        return item.category === activeCategory;
    });

    return (
        <div className="pb-20 pt-10 bg-white min-h-screen">
            <Helmet>
                <title>고객센터 | 행사어때</title>
                <meta name="description" content="행사어때 고객센터입니다. 자주 묻는 질문부터 실시간 상담까지 도와드립니다." />
            </Helmet>

            <Container>
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">고객센터</h1>
                    <p className="text-slate-500 font-medium">어려움이나 궁금한 점이 있으신가요?</p>
                </div>

                {/* CS Info Card */}
                <div className="bg-slate-50 rounded-3xl p-6 md:p-10 mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400">
                            <Phone size={24} className="md:w-8 md:h-8" />
                        </div>
                        <div>
                            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">1800-1985</div>
                            <div className="text-xs md:text-sm text-slate-500 font-medium space-y-0.5">
                                <p>고객행복센터(전화): <br className="md:hidden" />오전 9시 ~ 오후 6시 운영</p>
                                <p>채팅 상담 문의: 24시간 운영</p>
                            </div>
                        </div>
                    </div>

                    <a
                        href="https://pf.kakao.com/_iRxghX/chat"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full md:w-auto px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 font-bold text-slate-700 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <MessageCircle size={20} className="text-slate-400" />
                        채팅 상담
                    </a>
                </div>

                {/* FAQ Section */}
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">자주 묻는 질문</h2>

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-8 -mx-4 px-4 md:mx-0 md:px-0">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`
                                    whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-bold transition-all
                                    ${activeCategory === cat
                                        ? 'bg-[#FF5B60] text-white shadow-md shadow-[#FF5B60]/20'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* FAQ List (Accordion) */}
                    <div className="border-t border-slate-100">
                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="animate-spin text-[#FF5B60]" size={40} />
                            </div>
                        ) : filteredFAQ.length > 0 ? (
                            filteredFAQ.map(item => (
                                <div key={item.id} className="border-b border-slate-100">
                                    <button
                                        onClick={() => toggleAccordion(item.id!)}
                                        className="w-full py-5 flex items-center gap-3 text-left hover:bg-slate-50/50 transition-colors px-2"
                                    >
                                        <span className="text-[#FF5B60] font-bold text-lg">Q</span>
                                        <span className="flex-1 font-bold text-slate-800 text-[15px] md:text-base leading-snug">
                                            {item.question}
                                        </span>
                                        <span className={`text-slate-300 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={20} />
                                        </span>
                                    </button>

                                    {expandedId === item.id && (
                                        <div className="px-10 pb-6 pt-1 animate-fadeIn">
                                            <div className="bg-slate-50 p-5 rounded-2xl text-slate-600 text-sm md:text-[15px] leading-relaxed font-medium whitespace-pre-wrap">
                                                {item.answer}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center text-slate-400 font-medium">
                                해당 카테고리에 등록된 질문이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );
};

