/*
  # إنشاء جدول الكباتن

  1. جداول جديدة
    - `captains`
      - `id` (uuid, مفتاح أساسي)
      - `name` (text, اسم الكابتن)
      - `email` (text, البريد الإلكتروني)
      - `phone` (text, رقم الهاتف)
      - `vehicle_type` (text, نوع المركبة)
      - `vehicle_number` (text, رقم المركبة)
      - `profile_image` (text, صورة الملف الشخصي)
      - `status` (text, حالة الكابتن)
      - `is_active` (boolean, حالة التفعيل)
      - `rating` (numeric, التقييم)
      - `total_deliveries` (integer, عدد التوصيلات)
      - `current_lat` (numeric, خط العرض الحالي)
      - `current_lng` (numeric, خط الطول الحالي)
      - `created_at` (timestamptz, وقت الإنشاء)
      - `updated_at` (timestamptz, وقت التحديث)

  2. الأمان
    - تفعيل RLS على جدول `captains`
    - سياسات للقراءة والكتابة للجميع
*/

CREATE TABLE IF NOT EXISTS captains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text NOT NULL,
  vehicle_type text,
  vehicle_number text,
  profile_image text,
  status text DEFAULT 'offline',
  is_active boolean DEFAULT true,
  rating numeric(2,1) DEFAULT 5.0,
  total_deliveries integer DEFAULT 0,
  current_lat numeric(10,6),
  current_lng numeric(10,6),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE captains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for captains"
  ON captains
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert for captains"
  ON captains
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for captains"
  ON captains
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete for captains"
  ON captains
  FOR DELETE
  USING (true);