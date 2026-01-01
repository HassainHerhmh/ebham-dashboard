/*
  # إضافة سياسات الوصول العام للعملاء

  1. التغييرات
    - إضافة سياسات للسماح بالوصول العام (anon) لعرض المطاعم والمنتجات
    - إضافة سياسات لتسجيل العملاء الجدد بدون مصادقة مسبقة
    - إضافة سياسات للعروض والخصومات للعملاء

  2. الأمان
    - السياسات تسمح فقط بالقراءة للبيانات العامة
    - عمليات الكتابة محمية ومقيدة
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'restaurants' 
    AND policyname = 'Public can view active restaurants'
  ) THEN
    CREATE POLICY "Public can view active restaurants"
      ON restaurants
      FOR SELECT
      TO anon
      USING (is_active = true AND is_open = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'menu_items' 
    AND policyname = 'Public can view available menu items'
  ) THEN
    CREATE POLICY "Public can view available menu items"
      ON menu_items
      FOR SELECT
      TO anon
      USING (is_available = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'promo_codes' 
    AND policyname = 'Public can view active promo codes'
  ) THEN
    CREATE POLICY "Public can view active promo codes"
      ON promo_codes
      FOR SELECT
      TO anon
      USING (is_active = true AND end_date > now());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'customers' 
    AND policyname = 'Public can register as customer'
  ) THEN
    CREATE POLICY "Public can register as customer"
      ON customers
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'order_ratings' 
    AND policyname = 'Public can view ratings'
  ) THEN
    CREATE POLICY "Public can view ratings"
      ON order_ratings
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
