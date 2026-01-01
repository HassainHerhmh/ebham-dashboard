/*
  # إنشاء جدول العملاء

  1. جداول جديدة
    - `customers`
      - `id` (uuid, مفتاح أساسي)
      - `name` (text, اسم العميل)
      - `email` (text, البريد الإلكتروني)
      - `phone` (text, رقم الهاتف)
      - `address` (text, العنوان)
      - `city` (text, المدينة)
      - `profile_image` (text, صورة الملف الشخصي)
      - `is_active` (boolean, حالة التفعيل)
      - `total_orders` (integer, عدد الطلبات)
      - `total_spent` (numeric, إجمالي المصروفات)
      - `created_at` (timestamptz, وقت الإنشاء)
      - `updated_at` (timestamptz, وقت التحديث)

  2. الأمان
    - تفعيل RLS على جدول `customers`
    - سياسات للقراءة والكتابة للجميع
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text NOT NULL,
  address text,
  city text,
  profile_image text,
  is_active boolean DEFAULT true,
  total_orders integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for customers"
  ON customers
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert for customers"
  ON customers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for customers"
  ON customers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete for customers"
  ON customers
  FOR DELETE
  USING (true);