/*
  # إنشاء جدول تفاصيل الطلبات

  1. جداول جديدة
    - `order_items`
      - `id` (uuid, مفتاح أساسي)
      - `order_id` (uuid, معرف الطلب)
      - `product_id` (uuid, معرف المنتج)
      - `product_name` (text, اسم المنتج)
      - `quantity` (integer, الكمية)
      - `unit_price` (numeric, سعر الوحدة)
      - `total_price` (numeric, السعر الإجمالي)
      - `notes` (text, ملاحظات على المنتج)
      - `created_at` (timestamptz, وقت الإنشاء)

  2. الأمان
    - تفعيل RLS على جدول `order_items`
    - سياسات للقراءة والكتابة للجميع
*/

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  quantity integer DEFAULT 1,
  unit_price numeric(10,2) DEFAULT 0,
  total_price numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for order_items"
  ON order_items
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert for order_items"
  ON order_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for order_items"
  ON order_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete for order_items"
  ON order_items
  FOR DELETE
  USING (true);