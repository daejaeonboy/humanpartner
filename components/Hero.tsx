import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from './ui/Container';
import { usePublicContent } from '../src/context/PublicContentContext';
import { getResponsiveImageProps } from '../src/utils/responsiveImage';

const getCircularDistance = (from: number, to: number, total: number) => {
  if (total <= 1) {
    return 0;
  }

  const directDistance = Math.abs(from - to);
  return Math.min(directDistance, total - directDistance);
};

export const Hero: React.FC = () => {
  const { heroBanners: slides, loading } = usePublicContent();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isDesktopLoopBoundary =
    !isMobile && slides.length > 1 && (currentSlide === slides.length || currentSlide === -1);

  // Handle window resize for responsive rendering
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Extend slides for infinite loop visual (PC only)
  const extendedSlides = slides.length > 1 
    ? [slides[slides.length - 1], ...slides, slides[0]] 
    : slides;

  // Auto-slide effect
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const nextSlide = () => {
    if (slides.length <= 1 || !isTransitioning || isDesktopLoopBoundary) return;
    setCurrentSlide((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (slides.length <= 1 || !isTransitioning || isDesktopLoopBoundary) return;
    setCurrentSlide((prev) => prev - 1);
  };

  // Handle infinite loop jump (For PC Flex Slider)
  useEffect(() => {
    if (slides.length <= 1 || isMobile) return;

    let timer: NodeJS.Timeout;

    if (currentSlide === slides.length) {
      // At Clone First -> Jump to Real First
      timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(0);
      }, 700);
    } else if (currentSlide === -1) {
      // At Clone Last -> Jump to Real Last
      timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(slides.length - 1);
      }, 700);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentSlide, slides.length, isMobile]);

  useEffect(() => {
    if (slides.length <= 1 || isMobile) return;

    if (currentSlide > slides.length) {
      setIsTransitioning(false);
      setCurrentSlide(0);
      return;
    }

    if (currentSlide < -1) {
      setIsTransitioning(false);
      setCurrentSlide(slides.length - 1);
    }
  }, [currentSlide, slides.length, isMobile]);

  // Re-enable transition after jump
  useEffect(() => {
    if (!isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (loading) {
    return (
      <section
        className={`relative w-full bg-slate-900 flex items-center justify-center ${
          isMobile ? 'aspect-[4/3] min-h-[320px]' : 'h-[500px] md:h-[600px]'
        }`}
      >
        <Loader2 className="animate-spin text-white" size={40} />
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section
        className={`relative w-full bg-slate-900 flex items-center justify-center ${
          isMobile ? 'aspect-[4/3] min-h-[320px]' : 'h-[500px] md:h-[600px]'
        }`}
      >
        <p className="text-white/50">배너가 없습니다. Admin에서 배너를 추가해주세요.</p>
      </section>
    );
  }

  // --- Mobile View: Original Fade Slider ---
  if (isMobile) {
    const normalizedIndex = ((currentSlide % slides.length) + slides.length) % slides.length;
    
    return (
      <section
        className="relative w-full aspect-[4/3] bg-slate-900 overflow-hidden group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {slides.map((slide, index) => {
          const linkHref = slide.target_product_code ? `/p/${slide.target_product_code}` : slide.link || '/';
          const isExternal = linkHref.startsWith('http');
          const isActive = index === normalizedIndex;
          const shouldLoadImage =
            slides.length <= 2 || getCircularDistance(index, normalizedIndex, slides.length) <= 1;
          const imageProps = getResponsiveImageProps(slide.image_url, {
            widths: [640, 828, 1080, 1280],
            sizes: '100vw',
            quality: 84,
            resize: 'cover',
          });

          const SlideContent = (
            <>
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                {shouldLoadImage ? (
                  <img
                    {...imageProps}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[7000ms]"
                    decoding="async"
                    loading={isActive ? 'eager' : 'lazy'}
                    fetchPriority={isActive ? 'high' : 'auto'}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
              </div>

              <Container className="relative h-full flex flex-col justify-end pt-20 pb-10 text-white z-20">
                <div className="max-w-4xl">
                  <h1 className={`text-[22px] sm:text-[24px] font-semibold leading-[1.2] tracking-tight text-white mb-2 transition-all duration-1000 delay-300 transform drop-shadow-2xl
                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  `}>
                    {slide.title}
                  </h1>
                  <p className={`text-[0.95rem] sm:text-base font-normal text-white/80 leading-relaxed break-keep max-w-xl transition-all duration-1000 delay-500 transform drop-shadow-lg
                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  `}>
                    {slide.subtitle}
                  </p>
                  <div className={`mt-5 transition-all duration-1000 delay-700 transform
                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  `}>
                    <div className="inline-flex items-center gap-2 px-5 h-[38px] rounded-lg bg-[#39B54A] text-white font-semibold text-sm transition-all shadow-md shadow-[#39B54A]/20">
                      자세히 보기 <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Container>
            </>
          );

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out
                ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}
              `}
            >
              {isExternal ? (
                <a href={linkHref} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group/slide cursor-pointer">
                  {SlideContent}
                </a>
              ) : (
                <Link to={linkHref} className="block w-full h-full relative group/slide cursor-pointer">
                  {SlideContent}
                </Link>
              )}
            </div>
          );
        })}

        {/* Indicators for Mobile - Left Aligned Dots at the Top */}
        <div className="absolute top-6 left-0 w-full z-30">
          <Container>
            <div className="flex gap-2.5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="group py-2"
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div className={`w-2 h-2 transition-all duration-500 rounded-full
                    ${index === normalizedIndex ? 'bg-[#39B54A] scale-125' : 'bg-white/40 hover:bg-white/60'}
                  `} />
                </button>
              ))}
            </div>
          </Container>
        </div>
      </section>
    );
  }

  // --- Desktop View: New Centered Slide Slider ---
  return (
    <section
      className="relative w-full bg-white overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full h-[450px] lg:h-[550px]">
        <div 
          className={`flex h-full ${isTransitioning ? 'transition-transform duration-700 ease-out' : 'transition-none'}`}
          style={{
            transform: `translateX(calc(50% - (var(--slide-width) / 2) - (${currentSlide + (slides.length > 1 ? 1 : 0)} * (var(--slide-width) + var(--slide-gap)))))`,
            '--slide-width': 'min(1200px, 85vw)',
            '--slide-gap': '20px',
          } as any}
        >
          {extendedSlides.map((slide, index) => {
            const linkHref = slide.target_product_code ? `/p/${slide.target_product_code}` : slide.link || '/';
            const isExternal = linkHref.startsWith('http');
            const isActive = slides.length > 1 ? (index === currentSlide + 1) : (index === currentSlide);
            const logicalIndex = slides.length > 1 ? (index - 1 + slides.length) % slides.length : index;
            const normalizedIndex = ((currentSlide % slides.length) + slides.length) % slides.length;
            const shouldLoadImage =
              slides.length <= 2 || getCircularDistance(logicalIndex, normalizedIndex, slides.length) <= 1;
            const imageProps = getResponsiveImageProps(slide.image_url, {
              widths: [960, 1280, 1600, 1920],
              sizes: '(max-width: 1024px) 85vw, 1200px',
              quality: 86,
              resize: 'cover',
            });

            const SlideWrapper = ({ children }: { children: React.ReactNode }) => (
              isExternal ? (
                <a href={linkHref} target="_blank" rel="noopener noreferrer" className="block w-full h-full">{children}</a>
              ) : (
                <Link to={linkHref} className="block w-full h-full">{children}</Link>
              )
            );

            return (
              <div
                key={`${slide.id}-${index}`}
                className={`flex-shrink-0 h-full transition-all duration-700 ease-out rounded-lg overflow-hidden relative
                  ${isActive ? 'opacity-100' : 'opacity-100'}
                `}
                style={{
                  width: 'var(--slide-width)',
                  marginRight: 'var(--slide-gap)',
                }}
              >
                <SlideWrapper>
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    {shouldLoadImage ? (
                      <img
                        {...imageProps}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[7000ms] hover:scale-105"
                        decoding="async"
                        loading={isActive ? 'eager' : 'lazy'}
                        fetchPriority={isActive ? 'high' : 'auto'}
                        aria-hidden="true"
                      />
                    ) : null}
                    {(slide.title || slide.subtitle) && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    )}
                  </div>

                  {isActive && (slide.title || slide.subtitle) && (
                    <div className="absolute inset-0 p-16 flex flex-col justify-end text-white z-20">
                      <div className="max-w-4xl">
                        {slide.title && (
                          <h2 className="text-3xl lg:text-4xl mb-4 font-bold transition-all duration-700 transform opacity-100 translate-y-0">
                            {slide.title}
                          </h2>
                        )}
                        {slide.subtitle && (
                          <p className="text-lg opacity-90 mb-8 max-w-2xl transition-all duration-700 delay-100 transform opacity-100 translate-y-0">
                            {slide.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </SlideWrapper>
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows (Desktop Only) */}
        <button
          onClick={prevSlide}
          disabled={isDesktopLoopBoundary}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-800 hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          disabled={isDesktopLoopBoundary}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-800 hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Indicators (Desktop) */}
      <div className="mt-8 flex justify-center gap-2">
        {slides.map((_, index) => {
          let normalizedIndex = currentSlide % slides.length;
          if (normalizedIndex < 0) normalizedIndex += slides.length;
          
          return (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 transition-all duration-300 rounded-lg
                ${index === normalizedIndex ? 'w-8 bg-[#39B54A]' : 'w-2 bg-slate-200 hover:bg-slate-300'}
              `}
              aria-label={`Go to slide ${index + 1}`}
            />
          );
        })}
      </div>
    </section>
  );
};
