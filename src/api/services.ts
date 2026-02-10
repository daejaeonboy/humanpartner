import client from './client';
import { Product, Booking } from '../../server/src/types'; // Sharing types with backend if possible, or redefine

// Redefining types if direct import is problematic in this setup, 
// but perfectly we should share types in a monorepo structure.
// For now, let's assume we use the types we defined in frontend/types.ts or similar, 
// but to match backend strictly:

export interface APIProduct {
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

export interface APIBookingRequest {
    productId: string;
    userId: string; // mocking user ID for now
    startDate: string;
    endDate: string;
    totalPrice: number;
}

export const getProducts = async (): Promise<APIProduct[]> => {
    const response = await client.get<APIProduct[]>('/products');
    return response.data;
};

export const getProductById = async (id: string): Promise<APIProduct> => {
    const response = await client.get<APIProduct>(`/products/${id}`);
    return response.data;
};

export const createBooking = async (bookingData: APIBookingRequest): Promise<Booking> => {
    const response = await client.post<Booking>('/bookings', bookingData);
    return response.data;
};
