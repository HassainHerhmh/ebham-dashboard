/*
  # إنشاء جدول المتاجر

  1. الجدول الجديد
    - `stores`
      - `id` (uuid, مفتاح أساسي) - معرف فريد للمتجر
      - `name` (text) - اسم المتجر بالعربية
      - `name_en` (text) - اسم المتجر بالإنجليزية
      - `description` (text) - وصف المتجر
      - `phone` (text) - رقم الهاتف
      - `email` (text) - البريد الإلكتروني
      - `logo_url` (text) - رابط الشعار
      - `cover_image_url` (text) - رابط صورة الغلاف
      - `address` (text) - العنوان
      - `latitude` (numeric) - خط العرض
      - `longitude` (numeric) - خط الطول
      - `category` (text) - فئة المتجر
      - `rating` (numeric) - التقييم
      - `total_reviews` (integer) - عدد التقييمات
      - `is_open` (boolean) - حالة الفتح
      - `is_active` (boolean) - حالة النشاط
      - `opening_time` (time) - وقت الفتح
      - `closing_time` (time) - وقت الإغلاق
      - `delivery_time` (text) - وقت التوصيل
      - `minimum_order` (numeric) - الحد الأدنى للطلب
      - `delivery_fee` (numeric) - رسوم التوصيل
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث

  2. الأمان
    - تفعيل RLS على جدول `stores`
    - سياسة للعرض العام للمتاجر النشطة
*/

CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  description text,
  phone text NOT NULL,
  email text,
  logo_url text,
  cover_image_url text,
  address text NOT NULL,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  category text,
  rating numeric(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0,
  is_open boolean DEFAULT true,
  is_active boolean DEFAULT true,
  opening_time time,
  closing_time time,
  delivery_time text DEFAULT '30-45 دقيقة',
  minimum_order numeric(10,2) DEFAULT 0,
  delivery_fee numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active stores"
  ON stores
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND is_open = true);

CREATE POLICY "Authenticated can view all stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active) WHERE is_active = true;
