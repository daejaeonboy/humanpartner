import { ProductItem, PromoItem, IconMenuItem } from './types';

export const NAV_LINKS = [
  "전체메뉴", "베스트", "해외여행", "항공", "호텔", "공공기관", "사무실", "테마"
];

export const TOP_LINKS = ["로그인", "회원가입", "고객센터"];

// Hero Slider Data
export const HERO_SLIDES: PromoItem[] = [
  {
    id: 'h1',
    title: "설 연휴 특별한 가격\nDCC 호텔",
    subtitle: "1/28(수)까지",
    date: "1/28(수)까지",
    imageUrl: "https://picsum.photos/seed/hero_building_night/1920/800",
    theme: 'dark'
  },
  {
    id: 'h2',
    title: "봄 맞이 여행 특가\n얼리버드 할인",
    subtitle: "3/31(월)까지",
    date: "3/31(월)까지",
    imageUrl: "https://picsum.photos/seed/spring_travel/1920/800",
    theme: 'light'
  },
  {
    id: 'h3',
    title: "신학기 노트북\n최대 30% 할인",
    subtitle: "재고 소진 시까지",
    date: "상시 진행",
    imageUrl: "https://picsum.photos/seed/notebook_desk/1920/800",
    theme: 'dark'
  }
];

export const QUICK_ICONS: IconMenuItem[] = [
  { id: '1', label: '호텔', color: 'bg-red-100' },
  { id: '2', label: '퍼즐', color: 'bg-orange-100' },
  { id: '3', label: '티켓', color: 'bg-green-100' },
  { id: '4', label: '추천', color: 'bg-blue-100' },
  { id: '5', label: '투어', color: 'bg-indigo-100' },
  { id: '6', label: '쇼핑', color: 'bg-purple-100' },
  { id: '7', label: '음식', color: 'bg-yellow-100' },
  { id: '8', label: '교통', color: 'bg-teal-100' },
  { id: '9', label: '기타', color: 'bg-gray-100' },
  { id: '10', label: '보안', color: 'bg-pink-100' },
];

export const PROMO_TABS = ["호텔", "PC", "노트북", "사무기기", "복합기"];

export const PROMO_ITEMS: PromoItem[] = [
  {
    id: 'p1',
    title: "설 연휴 특별한 가격\nDCC 호텔",
    subtitle: "1/28(수)까지",
    date: "1/28(수)까지",
    imageUrl: "https://picsum.photos/seed/lake_sunset/800/400",
    theme: 'light'
  },
  {
    id: 'p2',
    title: "설 연휴 특별한 가격\nDCC 호텔",
    subtitle: "1/28(수)까지",
    date: "1/28(수)까지",
    imageUrl: "https://picsum.photos/seed/modern_building_glass/800/400",
    theme: 'dark' // Actually looks blue in the design, handled in component
  }
];

export const CATEGORY_FILTERS = ["노트북", "노트북", "노트북", "노트북", "노트북", "노트북"];

export const PRODUCT_LIST: ProductItem[] = [
  {
    id: '1',
    title: "대전컨벤션센터",
    subtitle: "대전컨벤션센터",
    imageUrl: "https://picsum.photos/seed/convention_center/400/500",
    category: "노트북",
    price: 150000,
    discountRate: 30,
    reviewCount: 1024,
    rating: 4.9
  },
  {
    id: '2',
    title: "대전신세계 Art&Science",
    subtitle: "대전신세계 Art&Science",
    imageUrl: "https://picsum.photos/seed/art_science_tower/400/500",
    category: "노트북",
    price: 250000,
    discountRate: 10,
    reviewCount: 150,
    rating: 4.7
  },
  {
    id: '3',
    title: "대전 엑스포 아쿠아리움",
    subtitle: "대전 엑스포 아쿠아리움",
    imageUrl: "https://picsum.photos/seed/aquarium_nature/400/500",
    category: "노트북",
    price: 75000,
    reviewCount: 22,
    rating: 4.3
  },
  {
    id: '4',
    title: "신세계 넥스페리움",
    subtitle: "신세계 넥스페리움",
    imageUrl: "https://picsum.photos/seed/park_sunset/400/500",
    category: "노트북",
    price: 180000,
    discountRate: 15,
    reviewCount: 89,
    rating: 4.6
  },
  {
    id: '5',
    title: "호텔 오노마 대전",
    subtitle: "호텔 오노마 대전 오토그래프 컬렉션",
    imageUrl: "https://picsum.photos/seed/hotel_night_bridge/400/500",
    category: "노트북",
    price: 320000,
    discountRate: 25,
    reviewCount: 320,
    rating: 4.8
  },
  {
    id: '6',
    title: "대전 예술의 전당",
    subtitle: "대전 예술의 전당",
    imageUrl: "https://picsum.photos/seed/art_center/400/500",
    category: "노트북",
    price: 130000,
    reviewCount: 45,
    rating: 4.2
  },
];