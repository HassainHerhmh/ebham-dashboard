/*
  # إنشاء جدول الإعلانات

  1. الجدول الجديد
    - `ads`
      - `id` (uuid, مفتاح أساسي) - معرف فريد للإعلان
      - `title` (text) - عنوان الإعلان
      - `description` (text) - وصف الإعلان
      - `image_url` (text) - رابط صورة الإعلان
      - `link_url` (text) - رابط الإعلان
      - `type` (text) - نوع الإعلان (banner, popup, slider)
      - `target` (text) - الجمهور المستهدف
      - `position` (integer) - موضع الإعلان
      - `start_date` (timestamptz) - تاريخ البداية
      - `end_date` (timestamptz) - تاريخ النهاية
      - `clicks` (integer) - عدد النقرات
      - `impressions` (integer) - عدد المشاهدات
      - `is_active` (boolean) - حالة النشاط
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث

  2. الأمان
    - تفعيل RLS على جدول `ads`
    - سياسة للعرض العام للإعلانات النشطة
*/

CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text,
  type text NOT NULL CHECK (type IN ('banner', 'popup', 'slider', 'card')),
  target text DEFAULT 'all' CHECK (target IN ('all', 'customers', 'captains', 'restaurants')),
  position integer DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active ads"
  ON ads
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND start_date <= now() 
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE INDEX IF NOT EXISTS idx_ads_type ON ads(type);
CREATE INDEX IF NOT EXISTS idx_ads_is_active ON ads(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ads_dates ON ads(start_date, end_date);
