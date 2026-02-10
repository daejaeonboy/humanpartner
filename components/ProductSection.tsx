import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from './ui/Container';
import { ProductItem } from '../types';

interface ProductSectionProps {
  title: string;
  categories: string[];
  products: ProductItem[];
  variant?: 'gray' | 'white';
  layoutMode?: string; // Additional prop
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  categories,
  products,
  variant = 'white',
  layoutMode = 'grid-4' // Default
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  useEffect(() => {
    if (categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);

  const filteredProducts = activeCategory === '전체'
    ? products
    : products.filter(product => product.category === activeCategory);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Layout configurations
  let cardWidthClass = 'w-[180px] md:w-[280px]';
  let aspectRatioClass = 'aspect-[4/5]';

  switch (layoutMode) {
    case 'grid-5':
      cardWidthClass = 'w-[140px] md:w-[200px]';
      aspectRatioClass = 'aspect-[3/5]';
      break;
    case 'grid-3':
      cardWidthClass = 'w-[220px] md:w-[380px]';
      aspectRatioClass = 'aspect-[3/4]';
      break;
    case 'grid-2':
      cardWidthClass = 'w-[300px] md:w-[580px]';
      aspectRatioClass = 'aspect-[16/10]';
      break;
    case 'grid-4':
    default:
      cardWidthClass = 'w-[180px] md:w-[280px]';
      aspectRatioClass = 'aspect-[4/5]';
      break;
  }

  return (
    <div className={`py-12 md:py-20 ${variant === 'gray' ? 'bg-slate-50' : 'bg-white'}`}>
      <Container>
        {/* Header */}
        <div className="flex justify-between items-end mb-3 md:mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
          </div>
          <button className="text-sm font-semibold text-slate-400 hover:text-[#FF5B60] transition-colors hidden md:block">전체보기</button>
        </div>

        {/* Filter Pills */}
        <div className="flex overflow-x-auto no-scrollbar gap-2.5 mb-6 md:mb-8 whitespace-nowrap">
          {categories.map((cat, idx) => (
            <button
              key={`${cat}-${idx}`}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-[13px] md:text-sm font-semibold transition-all border min-w-[80px] flex-shrink-0 text-center
                ${activeCategory === cat
                  ? 'bg-[#FF5B60] text-white border-[#FF5B60]'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-[#FF5B60] hover:text-[#FF5B60]'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-slate-900 hover:border-slate-900 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-slate-900 hover:border-slate-900 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={28} />
          </button>

          {/* Scrollable List */}
          <div
            ref={scrollContainerRef}
            className="flex gap-5 overflow-x-auto no-scrollbar pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className={`flex-none ${cardWidthClass} group/card cursor-pointer block`}
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className={`relative ${aspectRatioClass} overflow-hidden rounded-2xl bg-slate-100 mb-4 shadow-sm border border-slate-100`}>
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                  />
                  {/* Premium Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <button className="w-full py-2 bg-white text-slate-900 text-xs font-bold rounded-lg shadow-xl translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500">
                      상품보기
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm md:text-base text-slate-800 truncate group-hover/card:text-[#FF5B60] transition-colors">{product.title}</h3>

                  <div className="flex items-center gap-2">
                    {product.discountRate && (
                      <span className="text-rose-500 font-extrabold text-base md:text-lg">{product.discountRate}%</span>
                    )}
                    <span className="font-extrabold text-base md:text-lg text-slate-900">
                      {product.price?.toLocaleString()}<span className="text-xs font-medium ml-0.5">원</span>
                    </span>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container >
    </div >
  );
};
