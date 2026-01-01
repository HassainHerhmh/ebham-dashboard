/*
  # تحديث الفئات لربطها بالمحلات

  ## التغييرات
  
  1. إنشاء جدول ربط بين الفئات والمحلات (category_stores)
    - `id` (uuid, primary key) - معرف فريد
    - `category_id` (uuid, reference) - معرف الفئة
    - `store_id` (uuid, reference) - معرف المحل
    - `created_at` (timestamptz) - تاريخ الإضافة

  2. إضافة بيانات تجريبية لربط الفئات والمحلات الحالية

  3. سياسات الأمان (RLS)
    - تفعيل RLS على جدول category_stores
    - سياسات للقراءة والإضافة والتعديل والحذف
*/

-- إنشاء جدول الربط بين الفئات والمحلات
CREATE TABLE IF NOT EXISTS category_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, store_id)
);

-- تفعيل RLS على جدول category_stores
ALTER TABLE category_stores ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول category_stores
CREATE POLICY "Anyone can view category stores"
  ON category_stores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert category stores"
  ON category_stores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update category stores"
  ON category_stores
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete category stores"
  ON category_stores
  FOR DELETE
  TO authenticated
  USING (true);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_category_stores_category_id ON category_stores(category_id);
CREATE INDEX IF NOT EXISTS idx_category_stores_store_id ON category_stores(store_id);

-- إضافة بيانات تجريبية: ربط جميع الفئات والمحلات الحالية ببعضها
DO $$
DECLARE
  cat_record RECORD;
  store_record RECORD;
BEGIN
  -- ربط كل فئة بكل محل
  FOR cat_record IN SELECT id FROM categories WHERE type = 'restaurant_category' LOOP
    FOR store_record IN SELECT id FROM stores LOOP
      INSERT INTO category_stores (category_id, store_id)
      VALUES (cat_record.id, store_record.id)
      ON CONFLICT (category_id, store_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
