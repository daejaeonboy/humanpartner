import React from 'react';
import { Container } from '../ui/Container';
import { ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';



export function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-white border-t border-gray-200 pt-0 pb-20 md:pb-8 text-sm text-gray-600">
            {/* TOP LAYER: Links (Full width border) */}
            <div className="w-full border-b border-gray-200 py-6 mb-8">
                <Container>
                    <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 text-[13px] md:text-sm font-semibold text-gray-600">
                        <Link to="/" className="hover:text-black transition-colors whitespace-nowrap flex items-center h-full">홈</Link>
                        <span className="w-px h-3.5 bg-gray-200 hidden md:block"></span>
                        <Link to="/cs" className="hover:text-[#FF5B60] font-bold text-[#FF5B60] transition-colors whitespace-nowrap flex items-center h-full">고객센터</Link>
                        <span className="w-px h-3.5 bg-gray-200 hidden md:block"></span>
                        <Link to="/company" className="cursor-pointer hover:text-black transition-colors whitespace-nowrap flex items-center h-full">회사소개</Link>
                        <span className="w-px h-3.5 bg-gray-200 hidden md:block"></span>
                        <Link to="/terms" className="cursor-pointer hover:text-black transition-colors whitespace-nowrap flex items-center h-full">이용약관</Link>
                        <span className="w-px h-3.5 bg-gray-200 hidden md:block"></span>
                        <Link to="/privacy" className="cursor-pointer hover:text-black font-bold text-gray-800 transition-colors whitespace-nowrap flex items-center h-full">개인정보처리방침</Link>
                    </div>
                </Container>
            </div>

            <Container>
                {/* BOTTOM LAYER: 3 Columns on PC */}
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-10">
                    
                    {/* LEFT: CS & Bank (Horizontal on Tablet/PC) */}
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 shrink-0">
                        {/* C/S CENTER */}
                        <div className="w-full sm:w-auto">
                            <h3 className="font-bold text-gray-800 mb-2 text-[13px] tracking-wide">C/S CENTER</h3>
                            <div className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">1800-1985</div>
                            <div className="text-gray-500 text-xs leading-relaxed">
                                <p>평일 09:00~18:00 (점심 12:00~13:00)</p>
                                <p>주말 및 공휴일 휴무</p>
                            </div>
                        </div>

                        {/* BANK ACCOUNT */}
                        <div className="flex items-start pt-6 sm:pt-0 border-t sm:border-t-0 border-gray-100 relative sm:pl-10">
                            {/* Vertical Divider for Tablet/PC */}
                            <div className="hidden sm:block absolute left-0 top-1 w-px h-[80px] bg-gray-100"></div>
                            
                            <div>
                                <h3 className="font-bold text-gray-800 mb-2 text-[13px] tracking-wide">입금계좌</h3>
                                <div className="text-gray-800 font-bold text-sm mb-1 tracking-tight">
                                    <span className="text-[#FF5B60]">하나은행</span> 734-910239-17507
                                </div>
                                <div className="text-gray-500 text-[11px]">
                                    예금주 : micepartner (이기섭)
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Company Text */}
                    <div className="flex-1 lg:pl-10 pt-6 lg:pt-0 border-t lg:border-t-0 border-gray-100 w-full relative">
                        {/* Vertical Divider for PC */}
                        <div className="hidden lg:block absolute left-0 top-1 w-px h-[80px] bg-gray-100"></div>
                        
                        <div className="text-[11px] md:text-[13px] leading-6 md:leading-7 text-gray-500">
                            <p>
                                법인명(상호) : micepartner <span className="mx-2 text-gray-300">|</span> 대표자(성명) : 이기섭 <span className="mx-2 text-gray-300">|</span> 사업자 등록번호 : 305-30-85537
                            </p>
                            <p>
                                통신판매업 신고 : 2025-대전대덕-0526 &nbsp; <span className="underline cursor-pointer hover:text-gray-800 transition-colors">[사업자정보확인]</span>
                            </p>
                            <p>
                                전화 : 010-4074-6967 <span className="mx-2 text-gray-300">|</span> 주소 : 대전광역시 대덕구 대화로106번길 66 펜타플렉스 705호 34365
                            </p>
                            <p>
                                개인정보보호책임자 : 이기섭(hm_solution@naver.com)
                            </p>
                            <p className="mt-5 text-[11px] text-gray-400 font-medium">
                                Copyright © 2024 micepartner. All rights reserved.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Floating Action Buttons */}
                <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[60] flex flex-col gap-2">
                    {/* KakaoTalk Channel Button */}
                    <a
                        href="http://pf.kakao.com/_iRxghX/chat"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:scale-110 transition-all overflow-hidden"
                        aria-label="카카오톡 채널 상담"
                        title="카카오톡 상담"
                    >
                        <img src="/kakao.png" alt="카카오톡 채널" className="w-10 h-10 md:w-12 md:h-12" />
                    </a>

                    {/* Scroll to Top Button */}
                    <button
                        onClick={scrollToTop}
                        className="w-10 h-10 md:w-12 md:h-12 bg-black text-white hover:bg-gray-800 transition-all flex items-center justify-center"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp size={18} />
                    </button>
                </div>

            </Container>
        </footer>
    );
}
