/*
  # إنشاء جدول المشرفين

  1. الجدول الجديد
    - `admins`
      - `id` (uuid, مفتاح أساسي) - معرف فريد للمشرف
      - `user_id` (uuid, مرجع) - مرجع للمستخدم في جدول users
      - `username` (text, فريد) - اسم المستخدم للدخول
      - `password_hash` (text) - كلمة المرور المشفرة
      - `role` (text) - الدور (super_admin, admin, moderator)
      - `permissions` (jsonb) - صلاحيات مخصصة
      - `last_login` (timestamptz) - آخر تسجيل دخول
      - `is_active` (boolean) - حالة النشاط
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث

  2. الأمان
    - تفعيل RLS على جدول `admins`
    - سياسة للمشرفين فقط للوصول للبيانات
    - منع الوصول العام تماماً
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions jsonb DEFAULT '{}',
  last_login timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authenticated admins can view admins"
  ON admins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
