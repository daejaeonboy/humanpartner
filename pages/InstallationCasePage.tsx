import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { Container } from '../components/ui/Container';
import {
  getInstallationCaseCategories,
  getInstallationCaseCategoryEntries,
  getInstallationCaseCategoryNames,
  getInstallationCasesPage,
  InstallationCase,
  InstallationCaseCategory,
  ContentCategoryEntry,
} from '../src/api/contentApi';

const PAGE_TITLE = '설치사례';
const ITEMS_PER_PAGE = 8;

const getPageNumbers = (currentPage: number, totalPages: number) => {
  if (totalPages <= 10) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const startPage = Math.max(1, Math.min(currentPage - 4, totalPages - 9));
  return Array.from({ length: 10 }, (_, index) => startPage + index);
};

export const InstallationCasePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState('전체');
  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [items, setItems] = React.useState<InstallationCase[]>([]);
  const [categories, setCategories] = React.useState<InstallationCaseCategory[]>([]);
  const [categoryEntries, setCategoryEntries] = React.useState<ContentCategoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listLoading, setListLoading] = React.useState(true);
  const [totalItems, setTotalItems] = React.useState(0);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [categoryData, entryData] = await Promise.all([
          getInstallationCaseCategories().catch((error) => {
            console.error('Failed to load installation case categories:', error);
            return [];
          }),
          getInstallationCaseCategoryEntries().catch((error) => {
            console.error('Failed to load installation case category entries:', error);
            return [];
          }),
        ]);

        setCategories(categoryData);
        setCategoryEntries(entryData);
      } catch (error) {
        console.error('Failed to initialize installation case categories:', error);
        setCategories([]);
        setCategoryEntries([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchCategories();
  }, []);

  React.useEffect(() => {
    if (loading) return;

    const fetchItems = async () => {
      setListLoading(true);

      try {
        const { data, count } = await getInstallationCasesPage({
          page: currentPage,
          pageSize: ITEMS_PER_PAGE,
          category: selectedCategory === '전체' ? undefined : selectedCategory,
          searchTerm,
        });

        setItems(data);
        setTotalItems(count);
      } catch (error) {
        console.error('Failed to load installation cases:', error);
        setItems([]);
        setTotalItems(0);
      } finally {
        setListLoading(false);
      }
    };

    void fetchItems();
  }, [currentPage, loading, searchTerm, selectedCategory]);

  const categoryTabs = ['전체', ...getInstallationCaseCategoryNames(categories, categoryEntries)];

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  React.useEffect(() => {
    if (selectedCategory !== '전체' && !categoryTabs.includes(selectedCategory)) {
      setSelectedCategory('전체');
    }
  }, [categoryTabs, selectedCategory]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 260, behavior: 'smooth' });
  };

  const hasKeyword = searchTerm.trim().length > 0 || selectedCategory !== '전체';
  const emptyMessage = hasKeyword ? '검색 결과가 없습니다.' : '등록된 설치사례가 없습니다.';

  return (
    <>
      <Seo
        title="설치사례 | 행사어때"
        description="행사어때 설치사례를 확인할 수 있습니다."
        canonical="/cases"
      />

      <div className="bg-white min-h-screen pb-20">
        <Container>
          <div className="py-10 md:py-16 text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{PAGE_TITLE}</h2>
            <p className="text-gray-500 text-[14px] md:text-[15px] leading-relaxed break-keep">
              행사어때에서 진행한 현장 설치 및 운영 사례를 확인하실 수 있습니다.
            </p>
          </div>

          <div className="bg-[#f7f8f9] py-6 md:py-8 px-4 md:px-6 flex justify-start items-center mb-10 rounded-sm">
            <form
              className="flex w-full max-w-2xl bg-white border border-gray-200 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault();
                setCurrentPage(1);
                setSearchTerm(searchInput);
              }}
            >
              <input
                type="text"
                placeholder="설치사례 제목 또는 내용을 입력해주세요."
                className="flex-1 min-w-0 px-3 md:px-4 py-3 text-sm outline-none bg-transparent"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <button
                type="submit"
                className="bg-[#39B54A] text-white px-5 md:px-8 py-3 text-sm font-medium hover:bg-[#2e933c] transition-colors shrink-0"
              >
                검색
              </button>
            </form>
          </div>

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
                  className={`border-b-[3px] px-1 py-3 text-base font-semibold transition-colors md:text-[17px] ${
                    selectedCategory === category
                      ? 'border-[#39B54A] text-[#1f8f36]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading || listLoading ? (
            <div className="py-24 text-center mb-16">
              <p className="text-gray-500">데이터를 불러오는 중입니다...</p>
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 mb-16">
              {items.map((item) => (
                <article key={item.id} className="group">
                  <Link to={`/cases/${item.id}`} className="block">
                    <div className="overflow-hidden rounded-md bg-[#f3f4f6] mb-4">
                      <div className="aspect-[16/10]">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-[#f3f4f6] text-sm text-gray-400">
                            이미지 준비중
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="text-[18px] font-bold text-gray-900 break-keep mb-1 transition-colors group-hover:text-[#1f8f36]">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-gray-400 md:text-[14px]">
                      {item.published_at ? new Date(item.published_at).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-b border-gray-200 mb-16">
              <p className="text-gray-500">{emptyMessage}</p>
            </div>
          )}

          {totalPages > 1 && items.length > 0 && (
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
                const maxVisible = 5;
                
                if (totalPages <= maxVisible) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push('...');
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  for (let i = start; i <= end; i++) {
                    if (i > 1 && i < totalPages) pages.push(i);
                  }
                  if (currentPage < totalPages - 2) pages.push('...');
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
