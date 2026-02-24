import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container } from '../components/ui/Container';
import { Search, MapPin, Phone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { getAllianceMembers, AllianceMember } from '../src/api/cmsApi';

// Internal Navigation Tabs
const TABS = ["회원사 소개", "가입안내 및 혜택", "회원사 공지사항", "회원사 소식"];

export const AlliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("회원사 소개");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 2 cols x 4 rows

  const [members, setMembers] = useState<AllianceMember[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getAllianceMembers();
        setMembers(data);
      } catch (error) {
        console.error('Failed to load alliance members:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Filter Logic (Simple Name Search)
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalItems = filteredMembers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1; // At least 1 page

  // Adjust page if search reduces total pages
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>대전·충청 MICE 얼라이언스 - 회원사 소개</title>
        <meta name="description" content="대전·충청 MICE 얼라이언스(DCMA) 회원사 소개 및 안내입니다." />
      </Helmet>

      <div className="bg-white min-h-screen pb-20">



        <Container>
          {/* Main Title Area */}
          <div className="py-10 md:py-16 text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{activeTab}</h2>
            <p className="text-gray-500 whitespace-pre-line text-[14px] md:text-[15px] leading-relaxed break-keep">
              대전·충청 MICE 얼라이언스(Daejeon Chungcheong MICE Alliance, DCMA)는 대전과 충청지역 MICE 산업 협력 네트워크 구축과{'\n'}
              MICE 산업 경쟁력 강화를 위해 2010년 지자체 최초로 출범한 민·관 협력체입니다.
            </p>
          </div>

          {/* Search Box Background Frame */}
          <div className="bg-[#f7f8f9] py-6 md:py-8 px-4 md:px-6 flex justify-start items-center mb-10 rounded-sm">
            <div className="flex w-full max-w-2xl bg-white border border-gray-200 shadow-sm">
              {/* Category Dropdown (Dummy for UI accuracy) */}
              <div className="w-[80px] md:w-[150px] border-r border-gray-200 px-3 md:px-4 py-3 text-sm text-gray-600 flex justify-between items-center bg-white cursor-pointer shrink-0">
                전체
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Input */}
              <input
                type="text"
                placeholder="얼라이언스명을 입력해주세요."
                className="flex-1 min-w-0 px-3 md:px-4 py-3 text-sm outline-none bg-transparent"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on search
                }}
              />
              {/* Search Button */}
              <button className="bg-[#222] text-white px-5 md:px-8 py-3 text-sm font-medium hover:bg-black transition-colors shrink-0">
                검색
              </button>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex justify-between items-end pb-4 border-b border-gray-900 mb-8">
            <p className="text-sm">
              <span className="text-gray-500">전체</span> <span className="font-bold text-gray-900">{totalItems}건</span>
              <span className="mx-3 text-gray-300">|</span>
              <span className="text-gray-500">현재페이지</span> <span className="font-bold text-gray-900">{currentPage}/{totalPages}</span>
            </p>
          </div>

          {/* Grid Layout (4 rows, 2 cols = 8 per page) */}
          {loading ? (
            <div className="py-24 text-center mb-16">
              <p className="text-gray-500">데이터를 불러오는 중입니다...</p>
            </div>
          ) : currentItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-16">
              {currentItems.map((member) => (
                <div key={member.id} className="flex flex-col sm:flex-row border border-gray-200 hover:border-gray-400 transition-colors bg-white rounded-xl overflow-hidden min-h-[200px] sm:h-[200px]">
                  {/* Left: Logo Area (Light Gray Box) */}
                  <div className="w-full sm:w-[200px] bg-[#f5f5f5] flex items-center justify-center p-6 flex-shrink-0">
                    {member.logo_url && (
                      <img src={member.logo_url} alt={member.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                    )}
                  </div>

                  {/* Right: Info Area */}
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    {/* Tags */}
                    <div className="flex gap-2 mb-3">
                      <span className={`text-[13px] font-bold px-3 py-1 rounded border
                        ${member.category1 === 'MICE 시설분과' ? 'text-[#e69b00] bg-[#fff9ea] border-[#ffe099]' :
                          member.category1 === 'MICE 기획 · 운영분과' || member.category1 === 'MICE 기획분과' ? 'text-[#3b5bdb] bg-[#edf2ff] border-[#bac8ff]' :
                            member.category1 === 'MICE 지원분과' ? 'text-[#0ca678] bg-[#e6fcf5] border-[#63e6be]' :
                              'text-gray-600 bg-gray-100 border-gray-300'}`}
                      >
                        {member.category1 === 'MICE 기획분과' ? 'MICE 기획 · 운영분과' : member.category1}
                      </span>
                      <span className="text-[13px] text-gray-500 bg-white px-3 py-1 rounded border border-gray-200">
                        {member.category2}
                      </span>
                    </div>

                    {/* Name */}
                    {/* truncate를 제거하고 줄바꿈이 자연스럽게 일어나도록 변경 */}
                    <h3 className="text-[17px] font-bold text-gray-900 mb-3 break-keep">{member.name}</h3>

                    {/* Address & Phone */}
                    <div className="space-y-1.5 mt-auto">
                      <div className="flex items-start gap-1.5">
                        <MapPin size={13} className="text-gray-400 mt-[2px] flex-shrink-0" />
                        <p className="text-[12px] text-gray-500 break-keep">{member.address}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-gray-400 flex-shrink-0" />
                        <p className="text-[12px] text-gray-500">{member.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-b border-gray-200 mb-16">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 font-sans">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                // Simplistic logic to show around current page, or first 10 pages for now.
                let pageNum = i + 1;
                // Shift pages if we are deep in pagination (basic)
                if (totalPages > 10 && currentPage > 5) {
                  pageNum = currentPage - 5 + i;
                  if (pageNum > totalPages) return null;
                }

                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center border text-[13px] transition-colors
                      ${currentPage === pageNum
                        ? "border-[#222] bg-[#222] text-white font-bold"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          )}

        </Container>
      </div>
    </>
  );
};
