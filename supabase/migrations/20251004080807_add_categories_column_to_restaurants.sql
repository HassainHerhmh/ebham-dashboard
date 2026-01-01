/*
  # إضافة عمود الفئات إلى جدول المطاعم

  1. التعديلات
    - إضافة عمود `categories` (text[], مصفوفة نصية) إلى جدول `restaurants`
    - القيمة الافتراضية: مصفوفة فارغة
    - هذا العمود سيخزن الفئات المتعددة للمطعم (مطاعم عربية، وجبات سريعة، إلخ)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'categories'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN categories text[] DEFAULT '{}';
  END IF;
END $$;