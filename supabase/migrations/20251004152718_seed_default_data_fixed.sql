/*
  # إضافة بيانات تجريبية افتراضية

  ## البيانات المضافة
  
  1. محلات تجريبية (Stores)
  2. فئات تجريبية (Categories)
  3. ربط الفئات بالمحلات
  4. وحدات تجريبية (Units)
  5. أنواع وجبات تجريبية
*/

-- إضافة محلات تجريبية إذا لم تكن موجودة
INSERT INTO stores (name, name_en, address, phone, is_active)
SELECT * FROM (VALUES 
  ('محل الطعام السريع', 'Fast Food Store', 'شارع الملك فهد', '0501234567', true),
  ('محل المشويات', 'Grill Store', 'شارع الأمير سلطان', '0509876543', true),
  ('محل المعجنات', 'Bakery Store', 'حي الربيع', '0507654321', true)
) AS new_stores (name, name_en, address, phone, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM stores WHERE name = new_stores.name
);

-- إضافة فئات مطاعم تجريبية
DO $$
DECLARE
  store_record RECORD;
  cat_id uuid;
BEGIN
  -- فئة مطاعم سريعة
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'مطاعم سريعة' AND type = 'restaurant_category') THEN
    INSERT INTO categories (name, name_en, icon, type, is_active)
    VALUES ('مطاعم سريعة', 'Fast Food', '🍔', 'restaurant_category', true)
    RETURNING id INTO cat_id;
    
    FOR store_record IN SELECT id FROM stores LOOP
      INSERT INTO category_stores (category_id, store_id)
      VALUES (cat_id, store_record.id)
      ON CONFLICT (category_id, store_id) DO NOTHING;
    END LOOP;
  END IF;

  -- فئة مشويات
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'مشويات' AND type = 'restaurant_category') THEN
    INSERT INTO categories (name, name_en, icon, type, is_active)
    VALUES ('مشويات', 'Grills', '🍖', 'restaurant_category', true)
    RETURNING id INTO cat_id;
    
    FOR store_record IN SELECT id FROM stores LOOP
      INSERT INTO category_stores (category_id, store_id)
      VALUES (cat_id, store_record.id)
      ON CONFLICT (category_id, store_id) DO NOTHING;
    END LOOP;
  END IF;

  -- فئة معجنات
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'معجنات' AND type = 'restaurant_category') THEN
    INSERT INTO categories (name, name_en, icon, type, is_active)
    VALUES ('معجنات', 'Bakery', '🥐', 'restaurant_category', true)
    RETURNING id INTO cat_id;
    
    FOR store_record IN SELECT id FROM stores LOOP
      INSERT INTO category_stores (category_id, store_id)
      VALUES (cat_id, store_record.id)
      ON CONFLICT (category_id, store_id) DO NOTHING;
    END LOOP;
  END IF;

  -- فئة حلويات
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'حلويات' AND type = 'restaurant_category') THEN
    INSERT INTO categories (name, name_en, icon, type, is_active)
    VALUES ('حلويات', 'Desserts', '🍰', 'restaurant_category', true)
    RETURNING id INTO cat_id;
    
    FOR store_record IN SELECT id FROM stores LOOP
      INSERT INTO category_stores (category_id, store_id)
      VALUES (cat_id, store_record.id)
      ON CONFLICT (category_id, store_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- إضافة أنواع وجبات
INSERT INTO categories (name, name_en, icon, type, is_active)
SELECT * FROM (VALUES 
  ('فطور', 'Breakfast', '🌅', 'meal_type', true),
  ('غداء', 'Lunch', '☀️', 'meal_type', true),
  ('عشاء', 'Dinner', '🌙', 'meal_type', true)
) AS new_types (name, name_en, icon, type, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM categories 
  WHERE name = new_types.name AND type = 'meal_type'
);

-- إضافة وحدات قياس
INSERT INTO units (name, name_en, is_active)
SELECT * FROM (VALUES 
  ('حبة', 'Piece', true),
  ('علبة', 'Box', true),
  ('كرتون', 'Carton', true),
  ('كيلو', 'Kilogram', true),
  ('لتر', 'Liter', true)
) AS new_units (name, name_en, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM units WHERE name = new_units.name
);

-- إضافة مطاعم تجريبية
DO $$
BEGIN
  -- مطعم الذواقة
  IF NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'مطعم الذواقة') THEN
    INSERT INTO restaurants (name, categories, delivery_time, address, phone, logo_url, is_open, is_active, rating)
    VALUES (
      'مطعم الذواقة',
      ARRAY['مطاعم سريعة', 'مشويات'],
      '30 دقيقة',
      'شارع الملك فهد، الرياض',
      '0501234567',
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
      true,
      true,
      4.5
    );
  END IF;

  -- مطعم السلطان
  IF NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'مطعم السلطان') THEN
    INSERT INTO restaurants (name, categories, delivery_time, address, phone, logo_url, is_open, is_active, rating)
    VALUES (
      'مطعم السلطان',
      ARRAY['مشويات'],
      '25 دقيقة',
      'شارع العليا، الرياض',
      '0509876543',
      'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg',
      true,
      true,
      4.7
    );
  END IF;

  -- مطعم الأصالة
  IF NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'مطعم الأصالة') THEN
    INSERT INTO restaurants (name, categories, delivery_time, address, phone, logo_url, is_open, is_active, rating)
    VALUES (
      'مطعم الأصالة',
      ARRAY['معجنات', 'حلويات'],
      '20 دقيقة',
      'حي الربيع، الرياض',
      '0507654321',
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      true,
      true,
      4.3
    );
  END IF;
END $$;
