/*
  # إنشاء جدول الطلبات

  1. جداول جديدة
    - `orders`
      - `id` (uuid, مفتاح أساسي)
      - `order_number` (text, رقم الطلب)
      - `customer_id` (uuid, معرف العميل)
      - `restaurant_id` (uuid, معرف المطعم)
      - `captain_id` (uuid, معرف الكابتن - اختياري)
      - `status` (text, حالة الطلب)
      - `total_amount` (numeric, المبلغ الإجمالي)
      - `delivery_fee` (numeric, رسوم التوصيل)
      - `discount` (numeric, الخصم)
      - `final_amount` (numeric, المبلغ النهائي)
      - `payment_method` (text, طريقة الدفع)
      - `payment_status` (text, حالة الدفع)
      - `delivery_address` (text, عنوان التوصيل)
      - `delivery_lat` (numeric, خط العرض)
      - `delivery_lng` (numeric, خط الطول)
      - `customer_notes` (text, ملاحظات العميل)
      - `created_at` (timestamptz, وقت الإنشاء)
      - `updated_at` (timestamptz, وقت التحديث)
      - `delivered_at` (timestamptz, وقت التسليم)

  2. الأمان
    - تفعيل RLS على جدول `orders`
    - سياسات للقراءة والكتابة للجميع مؤقتاً
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid,
  restaurant_id uuid REFERENCES restaurants(id),
  captain_id uuid,
  status text DEFAULT 'pending',
  total_amount numeric(10,2) DEFAULT 0,
  delivery_fee numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  final_amount numeric(10,2) DEFAULT 0,
  payment_method text DEFAULT 'cash',
  payment_status text DEFAULT 'pending',
  delivery_address text NOT NULL,
  delivery_lat numeric(10,6),
  delivery_lng numeric(10,6),
  customer_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  delivered_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for orders"
  ON orders
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert for orders"
  ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for orders"
  ON orders
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete for orders"
  ON orders
  FOR DELETE
  USING (true);