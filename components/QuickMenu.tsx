import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from './ui/Container';
import { getQuickMenuItems, QuickMenuItem } from '../src/api/cmsApi';
import {
  Hotel, Zap, Ticket, Gift, Globe, ShoppingBag, Utensils, Car,
  LayoutGrid, Key, Monitor, Laptop, Printer, Phone, Camera, Plus, Loader2, ChevronsLeft, ChevronsRight, MoveHorizontal
} from 'lucide-react';

// Dynamic icon mapping based on icon name stored in DB
const getIcon = (iconName: string, colorClass: string = 'text-slate-500') => {
  const iconMap: Record<string, React.ReactNode> = {
    'Building': <Hotel className={colorClass} />,
    'Hotel': <Hotel className={colorClass} />,
    'Zap': <Zap className={colorClass} />,
    'Ticket': <Ticket className={colorClass} />,
    'Gift': <Gift className={colorClass} />,
    'Globe': <Globe className={colorClass} />,
    'ShoppingBag': <ShoppingBag className={colorClass} />,
    'Utensils': <Utensils className={colorClass} />,
    'Car': <Car className={colorClass} />,
    'LayoutGrid': <LayoutGrid className={colorClass} />,
    'Key': <Key className={colorClass} />,
    'Monitor': <Monitor className={colorClass} />,
    'Laptop': <Laptop className={colorClass} />,
    'Printer': <Printer className={colorClass} />,
    'Phone': <Phone className={colorClass} />,
    'Camera': <Camera className={colorClass} />,
  };
  return iconMap[iconName] || <Plus className={colorClass} />;
};

// Color palette for icons
const iconColors = [
  'text-rose-500', 'text-orange-500', 'text-green-600', 'text-blue-500',
  'text-indigo-500', 'text-purple-500', 'text-yellow-600', 'text-[#FF5B60]',
  'text-gray-500', 'text-pink-500', 'text-cyan-500', 'text-emerald-500'
];

export const QuickMenu: React.FC = () => {
  const [items, setItems] = useState<QuickMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
        if (scrollRef.current.scrollLeft > 20) {
            setShowScrollHint(false);
        } else {
            setShowScrollHint(true);
        }
    }
  };

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await getQuickMenuItems();
        setItems(data);
      } catch (error) {
        console.error('Failed to load quick menu items:', error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  if (loading) {
    return (
      <div className="py-8 md:py-16 bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF5B60]" size={32} />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="py-8 md:py-16 bg-white overflow-hidden">
      <Container>
        <div className="relative">
            {/* Horizontal Scroll for mobile, Flex for desktop */}
            <div 
               ref={scrollRef}
               onScroll={handleScroll}
               className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth gap-3 px-4 -mx-4 md:mx-0 md:px-0 md:gap-4 md:justify-between items-start pb-4 md:pb-0"
            >
          {items.map((item, index) => {
            // 카테고리가 있으면 해당 카테고리 필터링 링크 생성, 없으면 기존 링크 사용
            // title 파라미터도 함께 추가하여 페이지 제목 설정
            let linkUrl = item.link;

            if (item.category) {
              linkUrl = `/products?category=${encodeURIComponent(item.category)}&title=${encodeURIComponent(item.name)}`;
            } else if (item.link && !item.link.includes('title=')) {
              // 기존 링크에 title이 없으면 추가
              const hasQuestionMark = item.link.includes('?');
              linkUrl = `${item.link}${hasQuestionMark ? '&' : '?'}title=${encodeURIComponent(item.name)}`;
            }

            return (
              <Link
                key={item.id}
                to={linkUrl}
                className="group flex flex-col items-center gap-2 flex-shrink-0 w-16 md:w-auto md:flex-1 min-w-0 snap-center"
              >
                <div className="w-12 h-12 md:h-16 lg:w-20 lg:h-20 rounded-2xl bg-slate-50 flex items-center justify-center bg-opacity-10 group-hover:bg-opacity-25 transition-all duration-300 group-hover:-translate-y-1">
                  <div className="scale-90 md:scale-110 lg:scale-125">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-0 md:p-4" />
                    ) : (
                      getIcon(item.icon, iconColors[index % iconColors.length])
                    )}
                  </div>
                </div>
                <span className="text-[11px] md:text-xs lg:text-sm text-slate-600 font-bold tracking-tight opacity-90 truncate w-full text-center px-1">
                  {item.name}
                </span>
              </Link>
            )
          })}
            </div>

            {/* Scroll Hint - Combined: Animated Sides + Static Center */}
            <div 
               className={`md:hidden flex justify-center items-center gap-8 py-2 transition-opacity duration-500 ${showScrollHint ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden py-0'}`}
            >
               <ChevronsLeft className="animate-move-left text-[#FF5B60]" size={24} />
               <MoveHorizontal className="text-slate-900 animate-swipe-hint" size={24} strokeWidth={1.5} />
               <ChevronsRight className="animate-move-right text-[#FF5B60]" size={24} />
            </div>
        </div>
      </Container>
    </div>
  );
};