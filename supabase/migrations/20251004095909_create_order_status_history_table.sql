/*
  # إنشاء جدول سجل حالات الطلبات

  1. الجدول الجديد
    - `order_status_history`
      - `id` (uuid, مفتاح أساسي) - معرف فريد للسجل
      - `order_id` (uuid, مرجع) - معرف الطلب
      - `old_status` (text) - الحالة القديمة
      - `new_status` (text) - الحالة الجديدة
      - `changed_by` (uuid) - من قام بالتغيير
      - `change_reason` (text) - سبب التغيير
      - `notes` (text) - ملاحظات
      - `created_at` (timestamptz) - تاريخ التغيير

  2. الأمان
    - تفعيل RLS على جدول `order_status_history`
    - سياسة لعرض سجلات الطلبات للمعنيين
*/

CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid,
  change_reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view order status history"
  ON order_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_status_history.order_id
      AND (
        o.customer_id = auth.uid() 
        OR o.captain_id = auth.uid()
        OR EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.is_active = true)
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);
