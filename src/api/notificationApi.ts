import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  link_url?: string; // Optional link to navigate to (e.g., /mypage)
}

// Fetch unread notifications (or all, with limit)
export const getNotifications = async (userId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data as Notification[];
};

// Create a new notification
export const createNotification = async (
  userId: string, 
  title: string, 
  message: string, 
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  link_url?: string
) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      { user_id: userId, title, message, type, link_url }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }
  return data as Notification;
};

// Mark a single notification as read
export const markAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  return true;
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
  return true;
};

// Get unread count
export const getUnreadCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
  return count || 0;
};
