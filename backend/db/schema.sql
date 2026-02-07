-- Raffle Campaign Database Schema
-- PostgreSQL / Neon Database

-- جدول المسجلين
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    coupon_code VARCHAR(20) NOT NULL UNIQUE,
    ip_address VARCHAR(100),
    device_fingerprint VARCHAR(500),
    coupon_status VARCHAR(20) DEFAULT 'new' CHECK (coupon_status IN ('new', 'used', 'expired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT '2026-03-29 23:59:59'
);

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_location TEXT,
    items JSONB NOT NULL,
    coupon_code VARCHAR(20),
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_before_discount DECIMAL(10, 2) NOT NULL,
    total_after_discount DECIMAL(10, 2) NOT NULL,
    delivery_type VARCHAR(20) CHECK (delivery_type IN ('delivery', 'pickup')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_code) REFERENCES registrations(coupon_code)
);

-- جدول المؤهلين للسحب
CREATE TABLE IF NOT EXISTS raffle_entries (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- جدول مستخدمي الإدارة
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);
CREATE INDEX IF NOT EXISTS idx_registrations_coupon ON registrations(coupon_code);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(coupon_status);
CREATE INDEX IF NOT EXISTS idx_orders_coupon ON orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_registration ON raffle_entries(registration_id);

-- إدراج مستخدم إداري افتراضي (username: admin, password: admin123)
-- يجب تغيير كلمة المرور بعد الإعداد!
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '$2b$10$rKvVLKZ9f9YxH.Vf6F8YUO8mYJ3xZ3J1xKvNxZ0xZ1xZ2xZ3xZ4xZ')
ON CONFLICT (username) DO NOTHING;
