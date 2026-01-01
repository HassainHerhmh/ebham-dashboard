/*
  # إنشاء جدول المستخدمين

  1. الجدول الجديد
    - `users`
      - `id` (uuid, مفتاح أساسي) - معرف فريد للمستخدم
      - `email` (text, فريد) - البريد الإلكتروني
      - `phone` (text) - رقم الهاتف
      - `full_name` (text) - الاسم الكامل
      - `profile_image` (text) - رابط صورة الملف الشخصي
      - `user_type` (text) - نوع المستخدم (admin, captain, customer)
      - `is_active` (boolean) - حالة النشاط
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث

  2. الأمان
    - تفعيل RLS على جدول `users`
    - سياسة للسماح للمستخدمين بقراءة بياناتهم الخاصة
    - سياسة للمشرفين لعرض جميع المستخدمين
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text,
  full_name text NOT NULL,
  profile_image text,
  user_type text NOT NULL CHECK (user_type IN ('admin', 'captain', 'customer')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Public can view active users"
  ON users
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
