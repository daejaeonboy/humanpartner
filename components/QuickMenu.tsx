import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from './ui/Container';
import {
  getNavMenuItems,
  getQuickMenuItems,
  NavMenuItem,
  QuickMenuItem,
} from '../src/api/cmsApi';
import {
  Hotel,
  Zap,
  Ticket,
  Gift,
  Globe,
  ShoppingBag,
  Utensils,
  Car,
  LayoutGrid,
  Key,
  Monitor,
  Laptop,
  Printer,
  Phone,
  Camera,
  Plus,
  Loader2,
} from 'lucide-react';

const getIcon = (iconName: string, colorClass: string = 'text-slate-500') => {
  const iconMap: Record<string, React.ReactNode> = {
    Building: <Hotel className={colorClass} />,
    Hotel: <Hotel className={colorClass} />,
    Zap: <Zap className={colorClass} />,
    Ticket: <Ticket className={colorClass} />,
    Gift: <Gift className={colorClass} />,
    Globe: <Globe className={colorClass} />,
    ShoppingBag: <ShoppingBag className={colorClass} />,
    Utensils: <Utensils className={colorClass} />,
    Car: <Car className={colorClass} />,
    LayoutGrid: <LayoutGrid className={colorClass} />,
    Key: <Key className={colorClass} />,
    Monitor: <Monitor className={colorClass} />,
    Laptop: <Laptop className={colorClass} />,
    Printer: <Printer className={colorClass} />,
    Phone: <Phone className={colorClass} />,
    Camera: <Camera className={colorClass} />,
  };

  return iconMap[iconName] || <Plus className={colorClass} />;
};

const iconColors = [
  'text-[#39B54A]',
  'text-orange-500',
  'text-green-600',
  'text-blue-500',
  'text-indigo-500',
  'text-purple-500',
  'text-yellow-600',
  'text-[#39B54A]',
  'text-gray-500',
  'text-pink-500',
  'text-cyan-500',
  'text-emerald-500',
];

const MENU_KEYWORD_ALIASES: Record<string, string[]> = {
  '관공서': ['관공서', '행정', '공공기관', '공공'],
  '행정': ['관공서', '행정', '공공기관', '공공'],
  '공공기관': ['관공서', '행정', '공공기관', '공공'],
  '공공': ['관공서', '행정', '공공기관', '공공'],
  '전시': ['전시', '박람회', '전시박람회'],
  '박람회': ['전시', '박람회', '전시박람회'],
  '전시박람회': ['전시', '박람회', '전시박람회'],
  '공연': ['공연', '축제', '공연축제'],
  '축제': ['공연', '축제', '공연축제'],
  '공연축제': ['공연', '축제', '공연축제'],
  '장소대여': ['장소대여', '대관', '공간대여', '공간대관'],
  '대관': ['장소대여', '대관', '공간대여', '공간대관'],
  '공간대여': ['장소대여', '대관', '공간대여', '공간대관'],
  '컨퍼런스': ['컨퍼런스', '컨벤션'],
  '컨벤션': ['컨퍼런스', '컨벤션'],
  '플리마켓': ['플리마켓', '마켓'],
  '마켓': ['플리마켓', '마켓'],
  '사무실': ['사무실', '오피스'],
};

const normalizeMenuText = (value?: string | null) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u3131-\u318e\uac00-\ud7a3]/gi, '');

const splitMenuTokens = (value?: string | null) =>
  (value || '')
    .split(/[\/,&|·ㆍ\-\s]+/)
    .map(token => token.trim())
    .filter(Boolean);

const buildKeywordSet = (value?: string | null) => {
  const normalizedValue = normalizeMenuText(value);
  const keywords = new Set<string>();

  if (normalizedValue) {
    keywords.add(normalizedValue);
  }

  splitMenuTokens(value).forEach(token => {
    const normalizedToken = normalizeMenuText(token);

    if (!normalizedToken) {
      return;
    }

    keywords.add(normalizedToken);

    (MENU_KEYWORD_ALIASES[normalizedToken] || []).forEach(alias => {
      const normalizedAlias = normalizeMenuText(alias);
      if (normalizedAlias) {
        keywords.add(normalizedAlias);
      }
    });
  });

  (MENU_KEYWORD_ALIASES[normalizedValue] || []).forEach(alias => {
    const normalizedAlias = normalizeMenuText(alias);
    if (normalizedAlias) {
      keywords.add(normalizedAlias);
    }
  });

  return keywords;
};

const getLinkCandidates = (item: QuickMenuItem) => {
  const candidates = [item.name, item.category];

  if (item.link) {
    const [, rawQuery = ''] = item.link.split('?');
    const params = new URLSearchParams(rawQuery);
    candidates.push(params.get('category') || undefined);
    candidates.push(params.get('title') || undefined);
  }

  return candidates.filter((value): value is string => Boolean(value?.trim()));
};

const getMatchScore = (source: string, target: string) => {
  const normalizedSource = normalizeMenuText(source);
  const normalizedTarget = normalizeMenuText(target);

  if (!normalizedSource || !normalizedTarget) {
    return 0;
  }

  if (normalizedSource === normalizedTarget) {
    return 120;
  }

  let score = 0;

  if (
    normalizedSource.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedSource)
  ) {
    score = Math.max(score, 85);
  }

  const sourceKeywords = buildKeywordSet(source);
  const targetKeywords = buildKeywordSet(target);
  let overlap = 0;

  sourceKeywords.forEach(keyword => {
    if (targetKeywords.has(keyword)) {
      overlap += 1;
    }
  });

  if (overlap > 0) {
    score = Math.max(score, 60 + overlap * 15);
  }

  return score;
};

const appendTitleParam = (link: string, title: string) => {
  if (!link || link.includes('title=')) {
    return link;
  }

  const separator = link.includes('?') ? '&' : '?';
  return `${link}${separator}title=${encodeURIComponent(title)}`;
};

const buildParentRoute = (parent: NavMenuItem, hasChildren: boolean) => {
  if (!hasChildren && parent.link && parent.link !== '#') {
    return appendTitleParam(parent.link, parent.name);
  }

  return `/products?category=${encodeURIComponent(parent.name)}&title=${encodeURIComponent(parent.name)}`;
};

type ResolvedMenuMatch =
  | { type: 'parent'; score: number; item: NavMenuItem }
  | { type: 'child'; score: number; item: NavMenuItem; parent?: NavMenuItem };

const resolveQuickMenuLink = (item: QuickMenuItem, navItems: NavMenuItem[]) => {
  const candidates = getLinkCandidates(item);
  const parentItems = navItems.filter(navItem => !navItem.category);
  const childItems = navItems.filter(navItem => navItem.category);
  const parentMap = new Map(parentItems.map(parent => [parent.name, parent]));

  let bestMatch: ResolvedMenuMatch | null = null;

  const updateBestMatch = (nextMatch: ResolvedMenuMatch) => {
    if (!bestMatch || nextMatch.score > bestMatch.score) {
      bestMatch = nextMatch;
    }
  };

  parentItems.forEach(parent => {
    const score = Math.max(
      ...candidates.map(candidate => getMatchScore(candidate, parent.name)),
      0,
    );

    if (score >= 60) {
      updateBestMatch({ type: 'parent', score, item: parent });
    }
  });

  childItems.forEach(child => {
    const parent = parentMap.get(child.category || '');
    const childScore = Math.max(
      ...candidates.map(candidate => getMatchScore(candidate, child.name)),
      0,
    );
    const parentScore = parent
      ? Math.max(
          ...candidates.map(candidate => getMatchScore(candidate, parent.name)),
          0,
        )
      : 0;
    const score = Math.max(childScore, parentScore > 0 ? parentScore - 5 : 0);

    if (score >= 60) {
      updateBestMatch({ type: 'child', score, item: child, parent });
    }
  });

  if (bestMatch?.type === 'child') {
    return `/products?category=${encodeURIComponent(bestMatch.item.name)}&title=${encodeURIComponent(bestMatch.parent?.name || bestMatch.item.name)}`;
  }

  if (bestMatch?.type === 'parent') {
    const hasChildren = childItems.some(child => child.category === bestMatch.item.name);
    return buildParentRoute(bestMatch.item, hasChildren);
  }

  if (item.category) {
    return `/products?category=${encodeURIComponent(item.category)}&title=${encodeURIComponent(item.name)}`;
  }

  if (item.link) {
    return appendTitleParam(item.link, item.name);
  }

  return '/products';
};

export const QuickMenu: React.FC = () => {
  const [items, setItems] = useState<QuickMenuItem[]>([]);
  const [navItems, setNavItems] = useState<NavMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const [quickMenuItems, menuItems] = await Promise.all([
          getQuickMenuItems(),
          getNavMenuItems(),
        ]);

        setItems(quickMenuItems);
        setNavItems(menuItems);
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
        <Loader2 className="animate-spin text-[#39B54A]" size={32} />
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
          <div className="grid grid-cols-5 gap-y-6 gap-x-1 sm:gap-x-2 md:flex md:justify-between items-start pb-4 md:pb-0">
            {items.map((item, index) => {
              const linkUrl = resolveQuickMenuLink(item, navItems);

              return (
                <Link
                  key={item.id}
                  to={linkUrl}
                  className="group flex flex-col items-center gap-3 flex-shrink-0 w-full md:w-auto md:flex-1 min-w-0"
                >
                  <div className="w-12 h-12 md:h-16 lg:w-20 lg:h-20 rounded-2xl bg-slate-50 flex items-center justify-center bg-opacity-10 group-hover:bg-opacity-25 transition-all duration-300 group-hover:-translate-y-1">
                    <div className="scale-90 md:scale-110 lg:scale-125">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-contain p-0 md:p-4"
                        />
                      ) : (
                        getIcon(item.icon, iconColors[index % iconColors.length])
                      )}
                    </div>
                  </div>
                  <span className="text-[13px] md:text-sm lg:text-base text-slate-700 font-semibold tracking-tight truncate w-full text-center px-1">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
};
