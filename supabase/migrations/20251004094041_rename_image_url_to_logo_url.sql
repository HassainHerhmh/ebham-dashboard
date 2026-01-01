/*
  # تحديث اسم عمود الصورة من image_url إلى logo_url

  1. التغييرات
    - إعادة تسمية عمود image_url إلى logo_url في جدول restaurants
    - هذا لتوحيد التسمية مع كود التطبيق

  2. ملاحظات
    - التغيير آمن ولا يؤثر على البيانات الموجودة
    - سيتم الاحتفاظ بجميع الصور المرفوعة سابقاً
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE restaurants RENAME COLUMN image_url TO logo_url;
  END IF;
END $$;