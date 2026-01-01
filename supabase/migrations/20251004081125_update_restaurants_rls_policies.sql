/*
  # تحديث سياسات RLS لجدول المطاعم

  1. التعديلات
    - حذف السياسات القديمة التي تتطلب المصادقة
    - إضافة سياسات جديدة تسمح بجميع العمليات للجميع
    - هذا مناسب للوحة تحكم إدارية داخلية

  2. ملاحظة
    - السياسات الجديدة تسمح بالقراءة والكتابة للجميع
    - مناسب للاستخدام الداخلي في لوحة التحكم
*/

DROP POLICY IF EXISTS "السماح بقراءة المطاعم للجميع" ON restaurants;
DROP POLICY IF EXISTS "السماح بإضافة المطاعم للمستخدمين المصادق عليهم" ON restaurants;
DROP POLICY IF EXISTS "السماح بتحديث المطاعم للمستخدمين المصادق عليهم" ON restaurants;
DROP POLICY IF EXISTS "السماح بحذف المطاعم للمستخدمين المصادق عليهم" ON restaurants;

CREATE POLICY "السماح بقراءة المطاعم للجميع"
  ON restaurants
  FOR SELECT
  USING (true);

CREATE POLICY "السماح بإضافة المطاعم للجميع"
  ON restaurants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "السماح بتحديث المطاعم للجميع"
  ON restaurants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "السماح بحذف المطاعم للجميع"
  ON restaurants
  FOR DELETE
  USING (true);