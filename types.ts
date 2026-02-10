export interface ProductItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  category: string;
  price: number;
  discountRate?: number;
  reviewCount?: number;
  rating?: number;
}

export interface PromoItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  imageUrl: string;
  theme: 'dark' | 'light';
}

export interface IconMenuItem {
  id: string;
  label: string; // Ideally this would correspond to an icon name
  color: string;
}
