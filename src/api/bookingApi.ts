import { getProductsByIds, getProductsByNames } from './productApi';
import { supabase } from '../lib/supabase';

export interface Booking {
    id?: string;
    product_id: string;
    user_id: string;
    user_email?: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    created_at?: string;
    selected_options?: {
        name: string;
        quantity: number;
        price: number;
        product_id?: string;
        image_url?: string;
    }[];
    basic_components?: { name: string; quantity: number; model_name?: string; product_id?: string; image_url?: string }[];
    // Joined data
    products?: {
        name: string;
        image_url: string;
    };
    user_profiles?: {
        name: string;
        company_name: string;
        phone: string;
        business_number?: string;
    };
}

const BOOKING_SELECT = `
    id,
    product_id,
    user_id,
    user_email,
    start_date,
    end_date,
    total_price,
    status,
    created_at,
    selected_options,
    basic_components,
    products (
        name,
        image_url
    )
`;

type BookingItemWithImage = {
    name: string;
    product_id?: string;
    image_url?: string;
};

const toUniqueArray = (values: (string | null | undefined)[]) =>
    Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const enrichBookingItemImages = async (bookings: Booking[]): Promise<Booking[]> => {
    const bookingItems = bookings.flatMap((booking) => [
        ...(booking.basic_components || []),
        ...(booking.selected_options || []),
    ]);
    const itemsMissingImages = bookingItems.filter((item) => !item.image_url);

    if (itemsMissingImages.length === 0) {
        return bookings;
    }

    const productIds = toUniqueArray(itemsMissingImages.map((item) => item.product_id));
    const productNames = toUniqueArray(itemsMissingImages.map((item) => item.name));

    if (productIds.length === 0 && productNames.length === 0) {
        return bookings;
    }

    const [productsById, productsByName] = await Promise.all([
        productIds.length > 0 ? getProductsByIds(productIds) : Promise.resolve([]),
        productNames.length > 0 ? getProductsByNames(productNames) : Promise.resolve([]),
    ]);

    const productImageById = new Map(
        productsById.map((product) => [product.id, product.image_url]),
    );
    const productImageByName = new Map(
        [...productsById, ...productsByName].map((product) => [product.name, product.image_url]),
    );

    const mergeImageUrl = <T extends BookingItemWithImage>(items?: T[]) =>
        items?.map((item) => ({
            ...item,
            image_url:
                item.image_url ||
                (item.product_id ? productImageById.get(item.product_id) : undefined) ||
                productImageByName.get(item.name),
        }));

    return bookings.map((booking) => ({
        ...booking,
        basic_components: mergeImageUrl(booking.basic_components),
        selected_options: mergeImageUrl(booking.selected_options),
    }));
};

// 모든 예약 조회 (Admin용) - 사용자 정보 포함
export const getBookings = async (): Promise<Booking[]> => {
    // First get bookings with products
    const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(BOOKING_SELECT)
        .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;

    // Then fetch user profiles for each booking
    const bookings = bookingsData || [];
    const userIds = [...new Set(bookings.map(b => b.user_id).filter(Boolean))];

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('firebase_uid, name, company_name, phone, business_number')
            .in('firebase_uid', userIds);

        const profileMap = new Map(profiles?.map(p => [p.firebase_uid, p]) || []);

        const bookingsWithProfiles = bookings.map(b => ({
            ...b,
            user_profiles: profileMap.get(b.user_id) || null
        }));

        return enrichBookingItemImages(bookingsWithProfiles);
    }

    return enrichBookingItemImages(bookings);
};

export const getBookingsPage = async (
    page: number,
    pageSize: number,
): Promise<{ data: Booking[]; count: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: bookingsData, error: bookingsError, count } = await supabase
        .from('bookings')
        .select(BOOKING_SELECT, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (bookingsError) throw bookingsError;

    const bookings = bookingsData || [];
    const userIds = [...new Set(bookings.map((booking) => booking.user_id).filter(Boolean))];

    if (userIds.length === 0) {
        return {
            data: await enrichBookingItemImages(bookings),
            count: count || 0,
        };
    }

    const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('firebase_uid, name, company_name, phone, business_number')
        .in('firebase_uid', userIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map(profiles?.map((profile) => [profile.firebase_uid, profile]) || []);

    const bookingsWithProfiles = bookings.map((booking) => ({
            ...booking,
            user_profiles: profileMap.get(booking.user_id) || null,
        }));

    return {
        data: await enrichBookingItemImages(bookingsWithProfiles),
        count: count || 0,
    };
};

// 예약 삭제
export const deleteBooking = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// 사용자별 예약 조회
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select(BOOKING_SELECT)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return enrichBookingItemImages(data || []);
};

// 예약 생성
export const createBooking = async (booking: Omit<Booking, 'id' | 'created_at' | 'products'>): Promise<Booking> => {
    const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 예약 상태 변경
export const updateBookingStatus = async (id: string, status: Booking['status']): Promise<Booking> => {
    const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 특정 상품의 예약 가능 여부 확인 (날짜 중복 체크)
export const checkAvailability = async (
    productId: string,
    startDate: string,
    endDate: string
): Promise<boolean> => {
    const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('product_id', productId)
        .eq('status', 'confirmed')
        .lte('start_date', endDate)
        .gte('end_date', startDate);

    if (error) throw error;
    return (data?.length || 0) === 0;
};
