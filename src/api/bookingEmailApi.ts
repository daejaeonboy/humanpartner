import { supabase } from '../lib/supabase';

export interface BookingEmailSettings {
    id?: string;
    notifications_enabled: boolean;
    updated_by_email?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface BookingEmailRecipient {
    id?: string;
    email: string;
    is_active: boolean;
    updated_by_email?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface BookingEmailLog {
    id?: string;
    booking_id?: string | null;
    product_name?: string | null;
    requester_email?: string | null;
    recipient_emails: string[];
    status: 'sent' | 'failed' | 'skipped';
    error_message?: string | null;
    created_at?: string;
}

const SETTINGS_SELECT = 'id,notifications_enabled,updated_by_email,created_at,updated_at';
const RECIPIENT_SELECT = 'id,email,is_active,updated_by_email,created_at,updated_at';
const LOG_SELECT = 'id,booking_id,product_name,requester_email,recipient_emails,status,error_message,created_at';
const DEFAULT_SETTINGS_ID = 'default';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const getBookingEmailSettings = async (): Promise<BookingEmailSettings> => {
    const { data, error } = await supabase
        .from('booking_email_settings')
        .select(SETTINGS_SELECT)
        .eq('id', DEFAULT_SETTINGS_ID)
        .maybeSingle();

    if (error) throw error;

    return data || {
        id: DEFAULT_SETTINGS_ID,
        notifications_enabled: true,
        updated_by_email: null,
    };
};

export const updateBookingEmailSettings = async (
    updates: Pick<BookingEmailSettings, 'notifications_enabled' | 'updated_by_email'>,
): Promise<BookingEmailSettings> => {
    const payload = {
        id: DEFAULT_SETTINGS_ID,
        notifications_enabled: updates.notifications_enabled,
        updated_by_email: updates.updated_by_email || null,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('booking_email_settings')
        .upsert([payload], { onConflict: 'id' })
        .select(SETTINGS_SELECT)
        .single();

    if (error) throw error;
    return data;
};

export const getBookingEmailRecipients = async (): Promise<BookingEmailRecipient[]> => {
    const { data, error } = await supabase
        .from('booking_email_recipients')
        .select(RECIPIENT_SELECT)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
};

export const addBookingEmailRecipient = async (
    email: string,
    updatedByEmail?: string,
): Promise<BookingEmailRecipient> => {
    const payload = {
        email: normalizeEmail(email),
        is_active: true,
        updated_by_email: updatedByEmail || null,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('booking_email_recipients')
        .insert([payload])
        .select(RECIPIENT_SELECT)
        .single();

    if (error) throw error;
    return data;
};

export const updateBookingEmailRecipient = async (
    id: string,
    updates: Partial<Pick<BookingEmailRecipient, 'email' | 'is_active' | 'updated_by_email'>>,
): Promise<BookingEmailRecipient> => {
    const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (typeof updates.email === 'string') {
        payload.email = normalizeEmail(updates.email);
    }

    if (typeof updates.is_active === 'boolean') {
        payload.is_active = updates.is_active;
    }

    if ('updated_by_email' in updates) {
        payload.updated_by_email = updates.updated_by_email || null;
    }

    const { data, error } = await supabase
        .from('booking_email_recipients')
        .update(payload)
        .eq('id', id)
        .select(RECIPIENT_SELECT)
        .single();

    if (error) throw error;
    return data;
};

export const deleteBookingEmailRecipient = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('booking_email_recipients')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const getBookingEmailLogs = async (limit = 20): Promise<BookingEmailLog[]> => {
    const { data, error } = await supabase
        .from('booking_email_logs')
        .select(LOG_SELECT)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
};
