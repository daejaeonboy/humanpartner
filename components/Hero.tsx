import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from './ui/Container';
import { getHeroBanners, Banner } from '../src/api/cmsApi';

export const Hero: React.FC = () => {
  const [slides, setSlides] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load banners from DB
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const banners = await getHeroBanners();
        setSlides(banners);
      } catch (error) {
        console.error('Failed to load banners:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBanners();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (loading) {
    return (
      <section className="relative w-full h-[500px] md:h-[800px] bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={40} />
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative w-full h-[500px] md:h-[800px] bg-slate-900 flex items-center justify-center">
        <p className="text-white/50">배너가 없습니다. Admin에서 배너를 추가해주세요.</p>
      </section>
    );
  }

  return (
    <section className="relative w-full h-[500px] md:h-[800px] bg-slate-900 overflow-hidden group">
      {/* Slides */}
      {slides.map((slide, index) => {
        const linkHref = slide.target_product_code ? `/p/${slide.target_product_code}` : slide.link || '/';
        const isExternal = linkHref.startsWith('http');

        const SlideContent = (
          <>
            {/* Background Image */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-[7000ms] group-hover/slide:scale-105"
              style={{ backgroundImage: `url(${slide.image_url})` }}
            >
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>

            {/* Content */}
            <Container className="relative h-full flex flex-col justify-center text-white z-20">
              <div className={`max-w-2xl space-y-4 md:space-y-6 transition-all duration-1000 delay-300 transform
                 ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}
              `}>
                <h1 className="text-3xl md:text-6xl font-light leading-tight tracking-tight text-white">
                  <span className="block opacity-90 mb-2 text-lg md:text-2xl font-medium text-white">{slide.brand_text || '행사어때'}</span>
                  {slide.title}
                </h1>
                <p className="text-lg md:text-2xl font-extralight text-slate-300">
                  {slide.subtitle}
                </p>

                <div
                  className="mt-8 px-10 py-3.5 bg-[#FF5B60] text-white text-sm font-semibold hover:bg-[#e54a4f] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20 inline-flex items-center gap-2 group/btn"
                >
                  {slide.button_text || '상세보기'}
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </div>
            </Container>
          </>
        );

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out
              ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}
            `}
          >
            {isExternal ? (
              <a
                href={linkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full relative group/slide cursor-pointer"
              >
                {SlideContent}
              </a>
            ) : (
              <Link
                to={linkHref}
                className="block w-full h-full relative group/slide cursor-pointer"
              >
                {SlideContent}
              </Link>
            )}
          </div>
        );
      })}

      {/* Navigation Arrows - Hidden on mobile, show on hover desktop */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full bg-white/5 backdrop-blur-md hidden md:flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 border border-white/10"
        aria-label="Previous slide"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full bg-white/5 backdrop-blur-md hidden md:flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 border border-white/10"
        aria-label="Next slide"
      >
        <ChevronRight size={28} />
      </button>

      {/* Dots Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 
              ${index === currentSlide ? 'w-8 bg-white' : 'bg-white/50 hover:bg-white/80'}
            `}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};