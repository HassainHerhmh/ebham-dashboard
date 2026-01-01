/*
  # تحديث سياسة عرض المطاعم للعملاء

  1. التغييرات
    - حذف السياسة القديمة التي تشترط is_open = true
    - إضافة سياسة جديدة تعرض جميع المطاعم النشطة (is_active = true) بغض النظر عن حالة الفتح/الإغلاق
    - هذا يسمح للعملاء برؤية المطاعم المغلقة مؤقتاً مع توضيح حالتها

  2. الأمان
    - السياسة تسمح بالقراءة فقط (SELECT)
    - للمستخدمين غير المصادق عليهم (anon) فقط
    - تعرض المطاعم النشطة فقط (is_active = true)
*/

DO $$ 
BEGIN
  -- حذف السياسة القديمة إن وجدت
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'restaurants' 
    AND policyname = 'Public can view active restaurants'
  ) THEN
    DROP POLICY "Public can view active restaurants" ON restaurants;
  END IF;

  -- إضافة السياسة الجديدة
  CREATE POLICY "Public can view all active restaurants"
    ON restaurants
    FOR SELECT
    TO anon
    USING (is_active = true);
END $$;