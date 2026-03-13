import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { Home, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export const NotFound: React.FC = () => {
    return (
        <div className="min-h-[70vh] flex items-center justify-center py-20 px-4">
            <Helmet>
                <title>페이지를 찾을 수 없습니다 - 행사어때</title>
            </Helmet>
            
            <Container>
                <div className="max-w-md mx-auto text-center">
                    {/* Error Symbol */}
                    <div className="mb-8 relative inline-block">
                        <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center animate-pulse">
                            <span className="text-4xl font-black text-[#FF5B60]">404</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center border border-red-100">
                            <div className="w-6 h-6 bg-[#FF5B60] rounded-full animate-bounce"></div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                        원하시는 페이지를<br />찾을 수 없습니다.
                    </h1>
                    
                    <p className="text-slate-500 mb-10 leading-relaxed break-keep">
                        입력하신 주소가 정확한지 다시 한번 확인해 주세요.<br />
                        페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link 
                            to="/" 
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#FF5B60] text-white font-bold rounded-2xl shadow-lg shadow-[#FF5B60]/20 hover:bg-[#e04a4f] transition-all transform hover:-translate-y-1"
                        >
                            <Home size={18} />
                            홈으로 돌아가기
                        </Link>
                        <button 
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all transition-all transform hover:-translate-y-1"
                        >
                            <ArrowLeft size={18} />
                            이전 페이지로
                        </button>
                    </div>

                    <div className="mt-16 pt-8 border-t border-slate-100">
                        <p className="text-xs text-slate-400">
                            도움이 필요하신가요? <Link to="/cs" className="text-[#FF5B60] underline font-medium">고객센터</Link>로 문의해 주세요.
                        </p>
                    </div>
                </div>
            </Container>
        </div>
    );
};
