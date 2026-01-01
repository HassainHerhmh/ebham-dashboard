/*
  # إنشاء جدول المفضلة

  1. الجدول الجديد
    - `favorites`
      - `id` (uuid, مفتاح أساسي) - معرف فريد للمفضلة
      - `customer_id` (uuid, مرجع) - معرف العميل
      - `restaurant_id` (uuid, مرجع) - معرف المطعم
      - `created_at` (timestamptz) - تاريخ الإضافة

  2. الأمان
    - تفعيل RLS على جدول `favorites`
    - سياسة للعملاء لعرض وإدارة مفضلاتهم
*/

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, restaurant_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own favorites"
  ON favorites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = favorites.customer_id AND c.id = (
        SELECT id FROM customers WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Customers can insert own favorites"
  ON favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = favorites.customer_id AND c.id = (
        SELECT id FROM customers WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Customers can delete own favorites"
  ON favorites
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = favorites.customer_id AND c.id = (
        SELECT id FROM customers WHERE id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_favorites_customer_id ON favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_favorites_restaurant_id ON favorites(restaurant_id);
