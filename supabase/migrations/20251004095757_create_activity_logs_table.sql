/*
  # إنشاء جدول سجل النشاطات

  1. الجدول الجديد
    - `activity_logs`
      - `id` (uuid, مفتاح أساسي) - معرف فريد للسجل
      - `user_id` (uuid) - معرف المستخدم
      - `user_type` (text) - نوع المستخدم (admin, captain, customer)
      - `action` (text) - الإجراء المنفذ
      - `description` (text) - وصف الإجراء
      - `ip_address` (text) - عنوان IP
      - `metadata` (jsonb) - بيانات إضافية
      - `created_at` (timestamptz) - تاريخ الإنشاء

  2. الأمان
    - تفعيل RLS على جدول `activity_logs`
    - سياسة للمشرفين فقط لعرض السجلات
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_type text CHECK (user_type IN ('admin', 'captain', 'customer', 'system')),
  action text NOT NULL,
  description text,
  ip_address text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
