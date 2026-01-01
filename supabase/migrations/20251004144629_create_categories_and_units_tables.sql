/*
  # إنشاء جداول الفئات والوحدات

  1. الجداول الجديدة
    - `categories`
      - `id` (uuid, مفتاح أساسي) - معرف فريد للفئة
      - `name` (text) - اسم الفئة بالعربية
      - `name_en` (text) - اسم الفئة بالإنجليزية
      - `icon` (text) - أيقونة الفئة
      - `type` (text) - نوع الفئة (meal_type للوجبات)
      - `is_active` (boolean) - حالة النشاط
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث

    - `units`
      - `id` (uuid, مفتاح أساسي) - معرف فريد للوحدة
      - `name` (text) - اسم الوحدة بالعربية
      - `name_en` (text) - اسم الوحدة بالإنجليزية
      - `is_active` (boolean) - حالة النشاط
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - سياسات للعرض العام
    - سياسات للمشرفين للتعديل
*/

-- جدول الفئات (أنواع الوجبات والتصنيفات)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  icon text,
  type text DEFAULT 'meal_type' CHECK (type IN ('meal_type', 'cuisine_type', 'restaurant_category')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول الوحدات
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- سياسات categories
CREATE POLICY "Public can view active categories"
  ON categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );

-- سياسات units
CREATE POLICY "Public can view active units"
  ON units
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage units"
  ON units
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_units_is_active ON units(is_active);

-- إدراج بيانات افتراضية للفئات (أنواع الوجبات)
INSERT INTO categories (name, name_en, icon, type) VALUES
('فطور', 'Breakfast', '🍳', 'meal_type'),
('غداء', 'Lunch', '🍽️', 'meal_type'),
('عشاء', 'Dinner', '🌙', 'meal_type'),
('وجبات خفيفة', 'Snacks', '🍿', 'meal_type'),
('مشروبات', 'Beverages', '☕', 'meal_type'),
('حلويات', 'Desserts', '🍰', 'meal_type')
ON CONFLICT DO NOTHING;

-- إدراج بيانات افتراضية للوحدات
INSERT INTO units (name, name_en) VALUES
('حبة', 'Piece'),
('علبة', 'Box'),
('كرتون', 'Carton'),
('كيلو', 'Kilogram'),
('جرام', 'Gram'),
('لتر', 'Liter'),
('زجاجة', 'Bottle'),
('كوب', 'Cup'),
('طبق', 'Plate'),
('وجبة', 'Meal')
ON CONFLICT DO NOTHING;
