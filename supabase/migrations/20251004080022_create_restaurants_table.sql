/*
  # إنشاء جدول المطاعم

  1. جداول جديدة
    - `restaurants`
      - `id` (uuid, مفتاح أساسي)
      - `name` (text, اسم المطعم)
      - `categories` (text[], مصفوفة الفئات)
      - `delivery_time` (integer, وقت التوصيل بالدقائق)
      - `phone` (text, رقم الهاتف)
      - `address` (text, العنوان)
      - `image_url` (text, رابط الصورة)
      - `is_open` (boolean, حالة المطعم مفتوح/مغلق)
      - `status` (text, حالة التفعيل)
      - `rating` (numeric, التقييم)
      - `created_at` (timestamptz, وقت الإنشاء)
      - `updated_at` (timestamptz, وقت التحديث)
  
  2. الأمان
    - تفعيل RLS على جدول `restaurants`
    - إضافة سياسة للقراءة للجميع
    - إضافة سياسة للإدراج للمستخدمين المصادق عليهم
*/

CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  categories text[] DEFAULT '{}',
  delivery_time integer DEFAULT 30,
  phone text,
  address text,
  image_url text,
  is_open boolean DEFAULT true,
  status text DEFAULT 'active',
  rating numeric(2,1) DEFAULT 4.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "السماح بقراءة المطاعم للجميع"
  ON restaurants
  FOR SELECT
  USING (true);

CREATE POLICY "السماح بإضافة المطاعم للمستخدمين المصادق عليهم"
  ON restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "السماح بتحديث المطاعم للمستخدمين المصادق عليهم"
  ON restaurants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "السماح بحذف المطاعم للمستخدمين المصادق عليهم"
  ON restaurants
  FOR DELETE
  TO authenticated
  USING (true);