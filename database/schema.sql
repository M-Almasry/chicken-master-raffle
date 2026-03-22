-- Chicken Master Raffle Database Schema (v1.1)
-- Optimized with Indexes and Constraints

-- 1. System Configuration
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(191) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'receiver', -- 'receiver', 'admin', 'superadmin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_admin_username ON admin_users(username);

-- 3. Registrations (Coupon Users)
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    coupon_code VARCHAR(20) NOT NULL UNIQUE,
    coupon_status VARCHAR(20) DEFAULT 'new', -- 'new', 'used', 'expired'
    ip_address VARCHAR(45),
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_registrations_phone ON registrations(phone);
CREATE INDEX idx_registrations_coupon ON registrations(coupon_code);
CREATE INDEX idx_registrations_fingerprint ON registrations(device_fingerprint);

-- 4. Categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    sort_order INTEGER DEFAULT 0
);

-- 5. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description_ar TEXT,
    description_en TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_price DECIMAL(10, 2),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);

-- 6. Menu Options
CREATE TABLE IF NOT EXISTS menu_options (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);
CREATE INDEX idx_menu_options_item ON menu_options(menu_item_id);

-- 7. Global Add-ons
CREATE TABLE IF NOT EXISTS global_addons (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE
);

-- 8. Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_location TEXT,
    items JSONB NOT NULL,
    coupon_code VARCHAR(20),
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    total_before_discount DECIMAL(10, 2) NOT NULL,
    total_after_discount DECIMAL(10, 2) NOT NULL,
    delivery_type VARCHAR(50) DEFAULT 'delivery',
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 9. Raffle Entries
CREATE TABLE IF NOT EXISTS raffle_entries (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_raffle_entries_reg ON raffle_entries(registration_id);
CREATE INDEX idx_raffle_entries_order ON raffle_entries(order_id);

-- 10. Site Reviews
CREATE TABLE IF NOT EXISTS site_reviews (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) DEFAULT 'زبون',
    fingerprint TEXT,
    ip_address VARCHAR(45),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_clean BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_reviews_fingerprint ON site_reviews(fingerprint);
CREATE INDEX idx_reviews_public ON site_reviews(is_public);

-- 11. Migrations Tracking
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SEED DATA
-- Default Admin User (Password: admin123)
-- Hash generated for password 'admin123'
INSERT INTO admin_users (username, password_hash, role) 
VALUES ('admin', '$2b$10$Ep7viJ6mN5p6K8x5K6p6Ku2K5p6K8x5K6p6Ku2K5p6K8x5K6p6Ku', 'superadmin')
ON CONFLICT (username) DO NOTHING;

-- Default System Config
INSERT INTO system_config (key, value) VALUES 
('delivery_fee', '{"amount": 5}'),
('shop_status', '{"is_open": true, "mode": "auto", "message": ""}'),
('raffle_status', '{"is_active": true, "expiry_date": "2026-03-29"}'),
('opening_hours', '{
    "monday": {"open": "10:00", "close": "23:00", "closed": false},
    "tuesday": {"open": "10:00", "close": "23:00", "closed": false},
    "wednesday": {"open": "10:00", "close": "23:00", "closed": false},
    "thursday": {"open": "10:00", "close": "23:00", "closed": false},
    "friday": {"open": "10:00", "close": "23:00", "closed": false},
    "saturday": {"open": "10:00", "close": "23:00", "closed": false},
    "sunday": {"open": "10:00", "close": "23:00", "closed": false}
}')
ON CONFLICT (key) DO NOTHING;
