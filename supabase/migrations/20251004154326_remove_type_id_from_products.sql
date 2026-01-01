/*
  # حذف عمود النوع من جدول المنتجات

  1. التعديلات
    - حذف عمود `type_id` من جدول `products`
    - حذف القيود المرتبطة بالعمود

  2. الملاحظات
    - سيتم حذف العمود بشكل آمن دون التأثير على البيانات الأخرى
*/

-- حذف عمود type_id من جدول products
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'type_id'
  ) THEN
    ALTER TABLE products DROP COLUMN type_id;
  END IF;
END $$;
