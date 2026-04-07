CREATE INDEX IF NOT EXISTS notifications_user_unread_created_at_idx
ON notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS product_sections_section_product_idx
ON product_sections (section_id, product_id);

CREATE INDEX IF NOT EXISTS product_sections_product_section_idx
ON product_sections (product_id, section_id);

CREATE INDEX IF NOT EXISTS products_type_created_idx
ON products (product_type, created_at DESC);

CREATE INDEX IF NOT EXISTS products_category_type_created_idx
ON products (category, product_type, created_at DESC);

CREATE INDEX IF NOT EXISTS user_profiles_created_idx
ON user_profiles (created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_user_created_idx
ON bookings (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_status_created_idx
ON bookings (status, created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_product_status_dates_idx
ON bookings (product_id, status, start_date, end_date);
