/*
  # تحديث جدول المنتجات لدعم المحلات المتعددة

  ## التغييرات
  
  1. إنشاء جدول ربط بين المنتجات والمحلات (product_stores)
    - `id` (uuid, primary key) - معرف فريد
    - `product_id` (uuid, reference) - معرف المنتج
    - `store_id` (uuid, reference) - معرف المحل
    - `created_at` (timestamptz) - تاريخ الإضافة

  2. تحديث جدول المنتجات
    - إضافة `category_id` (uuid) - معرف الفئة من جدول categories
    - إضافة `unit_id` (uuid) - معرف الوحدة من جدول units
    - إضافة `type_id` (uuid) - معرف النوع من جدول categories (meal_type)
    - إضافة `notes` (text) - ملاحظات عن المنتج
    - حذف `restaurant_id` لاستخدام جدول الربط بدلاً منه

  3. سياسات الأمان (RLS)
    - تفعيل RLS على جدول product_stores
    - سياسات للقراءة والإضافة والتعديل والحذف
*/

-- إضافة الأعمدة الجديدة لجدول المنتجات
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'unit_id'
  ) THEN
    ALTER TABLE products ADD COLUMN unit_id uuid REFERENCES units(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'type_id'
  ) THEN
    ALTER TABLE products ADD COLUMN type_id uuid REFERENCES categories(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'notes'
  ) THEN
    ALTER TABLE products ADD COLUMN notes text;
  END IF;
END $$;

-- إنشاء جدول الربط بين المنتجات والمحلات
CREATE TABLE IF NOT EXISTS product_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, store_id)
);

-- تفعيل RLS على جدول product_stores
ALTER TABLE product_stores ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول product_stores
CREATE POLICY "Anyone can view product stores"
  ON product_stores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert product stores"
  ON product_stores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update product stores"
  ON product_stores
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete product stores"
  ON product_stores
  FOR DELETE
  TO authenticated
  USING (true);

-- إضافة سياسات جديدة للمنتجات للإضافة والتعديل والحذف
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Admins can insert products'
  ) THEN
    CREATE POLICY "Admins can insert products"
      ON products
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Admins can update products'
  ) THEN
    CREATE POLICY "Admins can update products"
      ON products
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Admins can delete products'
  ) THEN
    CREATE POLICY "Admins can delete products"
      ON products
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON products(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_type_id ON products(type_id);
CREATE INDEX IF NOT EXISTS idx_product_stores_product_id ON product_stores(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stores_store_id ON product_stores(store_id);
