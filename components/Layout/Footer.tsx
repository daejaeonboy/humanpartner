import React from 'react';
import { Container } from '../ui/Container';
import { ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';



export function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-white border-t border-gray-200 pt-10 pb-8 text-sm text-gray-600">
            <Container>
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">

                    {/* C/S CENTER */}
                    <div>
                        <h3 className="font-bold text-gray-800 mb-3 text-base">C/S CENTER</h3>
                        <div className="text-3xl font-bold text-gray-900 mb-2">1800-1985</div>
                        <div className="text-gray-500 text-xs leading-relaxed">
                            <p>월~금요일 09:00~18:00 점심 12:00~13:00</p>
                            <p>토요일, 일요일, 공휴일 휴무</p>
                        </div>
                    </div>

                    {/* BANK ACCOUNT */}
                    <div>
                        <h3 className="font-bold text-gray-800 mb-3 text-base">계좌번호</h3>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#FF5B60] font-bold text-2xl">하나은행</span>
                        </div>
                        <div className="text-gray-600 text-sm">
                            <p className="font-medium">하나은행 734-910239-17507</p>
                            <p>예금주명 micepartner(이기섭)</p>
                        </div>
                    </div>

                    {/* COMPANY INFO */}
                    <div className="flex-1 md:pl-10">
                        <div className="flex gap-4 mb-4 text-xs font-medium text-gray-500">
                            <Link to="/" className="hover:text-black">홈</Link>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <Link to="/cs" className="hover:text-black font-bold text-[#FF5B60]">고객센터</Link>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <Link to="/company" className="cursor-pointer hover:text-black">회사소개</Link>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <Link to="/terms" className="cursor-pointer hover:text-black">이용약관</Link>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <Link to="/privacy" className="cursor-pointer hover:text-black font-bold text-gray-700">개인정보처리방침</Link>
                        </div>

                        <div className="text-xs leading-5 text-gray-500">
                            <p>
                                법인명(상호) : micepartner &nbsp;|&nbsp; 대표자(성명) : 이기섭 &nbsp;|&nbsp; 사업자 등록번호 안내 : [305-30-85537]
                            </p>
                            <p>
                                통신판매업 신고 : 2025-대전대덕-0526 &nbsp; <span className="underline cursor-pointer">[사업자정보확인]</span>
                            </p>
                            <p>
                                전화 : 010-4074-6967 &nbsp;|&nbsp; 주소 : 대전광역시 대덕구 대화로106번길 66 펜타플렉스 705호 34365
                            </p>
                            <p>
                                개인정보보호책임자 : 이기섭(hm_solution@naver.com) &nbsp;|&nbsp; Contact for more information.
                            </p>
                            <p className="mt-2 text-gray-400">
                                Copyright © 2024micepartner 렌탈 . All rights reserved.
                            </p>
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

                </div>
            </Container>
        </footer>
    );
}
