/*
  # إنشاء جدول المنتجات

  1. الجدول الجديد
    - `products`
      - `id` (uuid, مفتاح أساسي) - معرف فريد للمنتج
      - `restaurant_id` (uuid, مرجع) - معرف المطعم
      - `name` (text) - اسم المنتج بالعربية
      - `name_en` (text) - اسم المنتج بالإنجليزية
      - `description` (text) - وصف المنتج بالعربية
      - `description_en` (text) - وصف المنتج بالإنجليزية
      - `category` (text) - الفئة
      - `price` (numeric) - السعر
      - `image_url` (text) - رابط الصورة
      - `is_available` (boolean) - حالة التوفر
      - `preparation_time` (integer) - وقت التحضير بالدقائق
      - `calories` (integer) - السعرات الحرارية
      - `is_popular` (boolean) - منتج شائع
      - `discount_percentage` (numeric) - نسبة الخصم
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث

  2. الأمان
    - تفعيل RLS على جدول `products`
    - سياسة للعرض العام للمنتجات المتاحة
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_en text,
  description text,
  description_en text,
  category text NOT NULL DEFAULT 'عام',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text,
  is_available boolean DEFAULT true,
  preparation_time integer DEFAULT 15,
  calories integer,
  is_popular boolean DEFAULT false,
  discount_percentage numeric(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view available products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

CREATE POLICY "Authenticated can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_popular ON products(is_popular) WHERE is_popular = true;
