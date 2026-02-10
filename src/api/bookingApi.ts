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
    selected_options?: { name: string; quantity: number; price: number }[];
    basic_components?: { name: string; quantity: number; model_name?: string }[];
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

// 모든 예약 조회 (Admin용) - 사용자 정보 포함
export const getBookings = async (): Promise<Booking[]> => {
    // First get bookings with products
    const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
            *,
            products (
                name,
                image_url
            )
        `)
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

        return bookings.map(b => ({
            ...b,
            user_profiles: profileMap.get(b.user_id) || null
        }));
    }

    return bookings;
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
        .select(`
            *,
            products (
                name,
                image_url
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
        .neq('status', 'cancelled')
        .lte('start_date', endDate)
        .gte('end_date', startDate);

    if (error) throw error;
    return (data?.length || 0) === 0;
};
