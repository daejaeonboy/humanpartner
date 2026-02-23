export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    description: string;
    imageUrl: string;
    stock: number;
    discountRate?: number;
    reviewCount?: number;
    rating?: number;
}

export interface Booking {
    id: string;
    productId: string;
    userId: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'cancelled';
}
