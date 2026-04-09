import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/seo/Seo';
import { Container } from '../components/ui/Container';
import { MapPin, Phone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import {
  getAllianceMemberCategories,
  getAllianceMembersPage,
  getAllianceCategories,
  getAllianceCategoryNames,
  normalizeAllianceCategoryName,
  AllianceMember,
  AllianceCategory,
  AllianceMemberCategoryEntry,
} from '../src/api/cmsApi';

const PAGE_TITLE = '회원사 소개';

const getCategoryBadgeClass = (category: string) => {
  const normalizedCategory = normalizeAllianceCategoryName(category);

  if (normalizedCategory) {
    return 'text-gray-700 bg-gray-50 border-gray-300';
  }

  return 'text-gray-600 bg-gray-50 border-gray-200';
};

export const AlliancePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 2 cols x 4 rows

  const [members, setMembers] = useState<AllianceMember[]>([]);
  const [categories, setCategories] = useState<AllianceCategory[]>([]);
  const [categoryEntries, setCategoryEntries] = useState<AllianceMemberCategoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryEntryData, categoryData] = await Promise.all([
          getAllianceMemberCategories(),
          getAllianceCategories().catch((error) => {
            console.error('Failed to load alliance categories:', error);
            return [];
          }),
        ]);

        setCategoryEntries(categoryEntryData);
        setCategories(categoryData);
      } catch (error) {
        console.error('Failed to load alliance members:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    if (loading) return;

    const fetchMembers = async () => {
      setListLoading(true);
      try {
        const { data, count } = await getAllianceMembersPage({
          page: currentPage,
          pageSize: itemsPerPage,
          category: selectedCategory === '전체' ? undefined : selectedCategory,
          searchTerm,
        });

        setMembers(data);
        setTotalItems(count);
      } catch (error) {
        console.error('Failed to load alliance members:', error);
      } finally {
        setListLoading(false);
      }
    };

    fetchMembers();
  }, [currentPage, itemsPerPage, loading, searchTerm, selectedCategory]);

  const categoryTabs = ['전체', ...getAllianceCategoryNames(categories, categoryEntries)];

  React.useEffect(() => {
    if (selectedCategory !== '전체' && !categoryTabs.includes(selectedCategory)) {
      setSelectedCategory('전체');
    }
  }, [categoryTabs, selectedCategory]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Pagination Logic
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1; // At least 1 page

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <>
      <Seo
        title="대전·충청 MICE 얼라이언스 회원사 소개 | 행사어때"
        description="대전·충청 MICE 얼라이언스(DCMA) 회원사 소개와 안내를 확인할 수 있습니다."
        canonical="/alliance"
      />

      <div className="bg-white min-h-screen pb-20">



        <Container>
          {/* Main Title Area */}
          <div className="py-10 md:py-16 text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{PAGE_TITLE}</h2>
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
              <button className="bg-[#39B54A] text-white px-5 md:px-8 py-3 text-sm font-medium hover:bg-[#2e933c] transition-colors shrink-0">
                검색
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <div className="flex gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
              {categoryTabs.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                  }}
                  aria-pressed={selectedCategory === category}
                  className={`border-b-[3px] px-1 py-3 text-base font-semibold transition-colors md:text-[17px]
                    ${selectedCategory === category
                      ? 'border-[#39B54A] text-[#1f8f36]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout (Mobile 1 col, PC 2 cols) */}
          {loading || listLoading ? (
            <div className="py-24 text-center mb-16">
              <p className="text-gray-500">데이터를 불러오는 중입니다...</p>
            </div>
          ) : members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-16">
              {members.map((member) => (
                <Link
                  key={member.id}
                  to={`/alliance/${member.id}`}
                  className="flex border border-gray-200 hover:border-2 hover:border-[#39B54A]/35 transition-all bg-white rounded-xl overflow-hidden min-h-[130px] md:h-[180px] group"
                  aria-label={`${member.name} 상세 보기`}
                >
                  {/* Left: Logo Area */}
                  <div className="w-[130px] md:w-[200px] bg-slate-50 flex items-center justify-center p-4 md:p-6 flex-shrink-0 group-hover:bg-white transition-colors border-r border-gray-50">
                    {member.logo_url && (
                      <img src={member.logo_url} alt={member.name} className="max-w-full max-h-full object-contain mix-blend-multiply" loading="lazy" decoding="async" />
                    )}
                  </div>

                  {/* Right: Info Area */}
                  <div className="flex-1 p-4 md:p-6 flex flex-col justify-center min-w-0">
                    {/* Category Tag */}
                    <div className="mb-1.5 md:mb-2">
                      <span className={`text-[11px] md:text-[12px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(member.category1)} whitespace-nowrap`}>
                        {normalizeAllianceCategoryName(member.category1)}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="text-[16px] md:text-[18px] font-bold text-slate-900 mb-1.5 md:mb-3 break-keep leading-tight group-hover:text-[#39B54A] transition-colors">
                      {member.name}
                    </h3>

                    {/* Address & Phone */}
                    <div className="space-y-1 md:space-y-1.5">
                      <div className="flex items-start gap-1.5">
                        <MapPin size={11} className="text-slate-400 flex-shrink-0 mt-[3px]" />
                        <p className="text-[12px] md:text-[13px] text-slate-500 break-keep leading-snug">{member.address}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} className="text-slate-400 flex-shrink-0" />
                        <p className="text-[12px] md:text-[13px] text-slate-500">{member.phone}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-b border-gray-200 mb-16">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 font-sans mb-10">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors rounded-sm"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors rounded-sm"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page Numbers with Ellipsis */}
              {(() => {
                const pages = [];
                const maxVisible = 5; // Total max numbers to show at once (excluding arrows)
                
                if (totalPages <= maxVisible) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  // Always show 1
                  pages.push(1);
                  
                  if (currentPage > 3) {
                    pages.push('...');
                  }
                  
                  // Show current and its neighbors
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  
                  for (let i = start; i <= end; i++) {
                    if (i > 1 && i < totalPages) pages.push(i);
                  }
                  
                  if (currentPage < totalPages - 2) {
                    pages.push('...');
                  }
                  
                  // Always show last
                  if (totalPages > 1) pages.push(totalPages);
                }

                return pages.map((page, idx) => (
                  <React.Fragment key={idx}>
                    {page === '...' ? (
                      <span className="px-1 text-gray-400">...</span>
                    ) : (
                      <button
                        onClick={() => handlePageChange(page as number)}
                        className={`w-8 h-8 flex items-center justify-center border text-[13px] transition-colors rounded-sm
                          ${currentPage === page
                            ? "border-[#39B54A] bg-[#39B54A] text-white font-bold"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ));
              })()}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors rounded-sm"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors rounded-sm"
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
