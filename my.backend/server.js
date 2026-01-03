import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;
const app = express();

console.log("🔥 SERVER VERSION 2026-01-02 🔥");

/* ======================================================
   🌐 CORS (صحيح بدون مشاكل path-to-regexp)
====================================================== */
app.use(cors({
  origin: "https://ebham-dashboard-gcpu.vercel.app",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* ======================================================
   🧠 Middlewares
====================================================== */
app.use(express.json());

/* ======================================================
   📁 Paths
====================================================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ======================================================
   📂 Static uploads
====================================================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ======================================================
   🖼️ Multer (رفع الصور) ✅ مهم
====================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ======================================================
   🧪 Health Check
====================================================== */
app.get("/", (req, res) => {
  res.json({ success: true, message: "API IS WORKING 🚀" });
});

/* ======================================================
   🗄️ Database (Supabase PostgreSQL)
====================================================== */
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* ======================================================
   🔐 LOGIN
====================================================== */
app.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "❌ البيانات غير مكتملة"
      });
    }

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1 OR phone = $1 LIMIT 1",
      [identifier]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "❌ المستخدم غير موجود"
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "❌ كلمة المرور غير صحيحة"
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions || []
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "❌ Server Error"
    });
  }
});
/* ============================================================================
   الطلبات
============================================================================ */

// 🟢 جلب جميع الطلبات مع اسم الكابتن (PostgreSQL)
app.get("/orders", async (_, res) => {
  try {
    const result = await db.query(`
      SELECT 
        o.id, 
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.latitude,
        o.longitude,
        o.restaurant_name,
        o.restaurant_phone,
        o.order_details,
        o.status,
        (o.total_amount + COALESCE(o.delivery_fee, 0)) AS total_amount,
        o.delivery_fee,
        o.created_at,
        c.name AS captain_name
      FROM orders o
      LEFT JOIN captains c ON o.captain_id = c.id
      ORDER BY o.id DESC
      LIMIT 50
    `);

    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error("❌ خطأ في جلب الطلبات:", err);
    res.status(500).json({ success: false, message: "❌ خطأ في جلب الطلبات" });
  }
});


// 🟢 جلب الكباتن مع الإحصاءات
app.get("/captains/available", async (_, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.vehicle_type,
        c.is_available,
        COUNT(CASE WHEN o.status IN ('pending','delivering') THEN 1 END) AS pending_orders,
        COUNT(CASE WHEN DATE(o.created_at) = CURDATE() AND o.status = 'completed' THEN 1 END) AS completed_today
      FROM captains c
      LEFT JOIN orders o ON c.id = o.captain_id
      GROUP BY c.id
      ORDER BY pending_orders ASC
    `);
    res.json({ success: true, captains: rows });
  } catch (err) {
    console.error("❌ خطأ في جلب الكباتن:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في جلب الكباتن" });
  }
});

// 🟢 تعيين كابتن لطلب (يسمح لأكثر من طلب)
app.put("/orders/:id/assign-captain", async (req, res) => {
  try {
    const { captain_id } = req.body;
    if (!captain_id) {
      return res.status(400).json({ success: false, message: "❌ رقم الكابتن مطلوب" });
    }

    // تعيين الكابتن بدون تعديل حالة التوفر
    await db.query("UPDATE orders SET captain_id=? WHERE id=?", [captain_id, req.params.id]);

    res.json({ success: true, message: "✅ تم إسناد الطلب للكابتن" });
  } catch (err) {
    console.error("❌ خطأ في إسناد الكابتن:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في إسناد الكابتن" });
  }
});

// 🟢 تحديث حالة الطلب
app.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','preparing','ready','delivering','completed','cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: "❌ حالة الطلب غير صحيحة" });
    }

    await db.query("UPDATE orders SET status=? WHERE id=?", [status, req.params.id]);
    res.json({ success: true, message: "✅ تم تحديث الحالة" });
  } catch (err) {
    console.error("❌ خطأ في تحديث الحالة:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في تحديث الحالة" });
  }
});

// 🟢 تفاصيل الطلب مع المنتجات
app.get("/orders/:id/details", async (req, res) => {
  try {
    const orderId = req.params.id;
    const [[order]] = await db.query(`
      SELECT 
        o.id, o.customer_name, o.customer_phone, o.customer_address,
        o.latitude, o.longitude, 
        o.restaurant_name, o.restaurant_phone,
        o.status, o.total_amount, o.delivery_fee, o.created_at
      FROM orders o 
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).json({ success: false, message: "❌ الطلب غير موجود" });
    }

    const [items] = await db.query(`
      SELECT 
        product_name AS name, 
        quantity,
        price,
        discount,
        (price * quantity - IFNULL(discount,0)) AS total,
        notes
      FROM order_items 
      WHERE order_id = ?
    `, [orderId]);

    res.json({ success: true, ...order, products: items });
  } catch (err) {
    console.error("❌ خطأ في جلب تفاصيل الطلب:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في جلب تفاصيل الطلب" });
  }
});
/* ============================================================================
   إدارة المستخدمين
============================================================================ */

/* ============================================================================
   ✅ جلب جميع المستخدمين (مع حماية JSON.parse)
============================================================================ */
app.get("/users", async (_, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, role, permissions, status, image_url FROM users ORDER BY id DESC"
    );

    const users = rows.map((user) => {
      let parsedPermissions = [];
      try {
        parsedPermissions = user.permissions
          ? JSON.parse(user.permissions)
          : [];
      } catch (e) {
        parsedPermissions = [];
      }

      return {
        ...user,
        permissions: parsedPermissions,
      };
    });

    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err.message);
    res.status(500).json({ message: "❌ خطأ في جلب المستخدمين" });
  }
});

/* ============================================================================
   ✅ إضافة مستخدم جديد
============================================================================ */
app.post("/users", upload.single("image"), async (req, res) => {
  try {
    const { name, username, password, role, permissions } = req.body;

    if (!name || !username || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "❌ جميع الحقول مطلوبة" });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^05\d{8}$/;

    let emailValue = null;
    let phoneValue = null;

    if (emailPattern.test(username)) {
      emailValue = username;
    } else if (phonePattern.test(username)) {
      phoneValue = username;
    } else {
      return res.status(400).json({
        success: false,
        message:
          "❌ اسم المستخدم يجب أن يكون بريد إلكتروني أو رقم جوال يبدأ بـ05",
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    await db.query(
      `INSERT INTO users
       (name, email, phone, password, role, permissions, image_url, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [
        name,
        emailValue,
        phoneValue,
        hashed,
        role,
        permissions || "[]", // حفظ الصلاحيات كنص JSON
        image_url,
      ]
    );

    res.json({ success: true, message: "✅ تم إضافة المستخدم بنجاح" });
  } catch (err) {
    console.error("❌ Add user error:", err.message);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في إضافة المستخدم",
    });
  }
});

/* ============================================================================
   ✅ تعديل مستخدم
============================================================================ */
app.put("/users/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, username, password, role, permissions } = req.body;

    const updates = [];
    const params = [];

    if (name) {
      updates.push("name=?");
      params.push(name);
    }

    if (username) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phonePattern = /^05\d{8}$/;

      if (emailPattern.test(username)) {
        updates.push("email=?");
        params.push(username);
        updates.push("phone=NULL");
      } else if (phonePattern.test(username)) {
        updates.push("phone=?");
        params.push(username);
        updates.push("email=NULL");
      } else {
        return res
          .status(400)
          .json({ success: false, message: "❌ اسم المستخدم غير صحيح" });
      }
    }

    if (role) {
      updates.push("role=?");
      params.push(role);
    }

    if (permissions !== undefined) {
      updates.push("permissions=?");
      params.push(permissions || "[]");
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push("password=?");
      params.push(hashed);
    }

    if (req.file) {
      const image_url = `/uploads/${req.file.filename}`;
      updates.push("image_url=?");
      params.push(image_url);
    }

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message: "❌ لا توجد بيانات لتحديثها",
      });
    }

    params.push(req.params.id);
    await db.query(`UPDATE users SET ${updates.join(", ")} WHERE id=?`, params);

    res.json({ success: true, message: "✅ تم تعديل المستخدم بنجاح" });
  } catch (err) {
    console.error("❌ Edit user error:", err.message);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في تعديل المستخدم",
    });
  }
});

/* ============================================================================
   ✅ تعطيل مستخدم
============================================================================ */
app.put("/users/:id/disable", async (req, res) => {
  try {
    await db.query("UPDATE users SET status='inactive' WHERE id=?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "✅ تم تعطيل المستخدم" });
  } catch (err) {
    console.error("❌ Disable user error:", err.message);
    res.status(500).json({ message: "❌ خطأ في تعطيل المستخدم" });
  }
});

/* ============================================================================
   ✅ حذف مستخدم
============================================================================ */
app.delete("/users/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "🗑️ تم حذف المستخدم" });
  } catch (err) {
    console.error("❌ Delete user error:", err.message);
    res.status(500).json({ message: "❌ خطأ في حذف المستخدم" });
  }
});

/* ============================================================================
   الأقسام (صلاحيات المستخدمين)
============================================================================ */
app.get("/sections", async (_, res) => {
  try {
    const [rows] = await db.query(
      "SELECT `key`, label FROM sections ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Sections error:", err.message);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في جلب الأقسام",
    });
  }
});

 //=============================================================
// ======================  المدن + الأحياء ======================
// =============================================================

// جلب المدن مع الأحياء التابعة لها
app.get("/cities", async (_, res) => {
  try {
    const [cities] = await db.query(`
      SELECT id, name, delivery_fee 
      FROM cities 
      ORDER BY id DESC
    `);

    const [neighborhoods] = await db.query(`
      SELECT id, name, city_id
      FROM neighborhoods
      ORDER BY id DESC
    `);

    const result = cities.map((c) => ({
      ...c,
      neighborhoods: neighborhoods.filter((n) => n.city_id === c.id),
    }));

    res.json({ success: true, cities: result });
  } catch (err) {
    console.error("❌ خطأ جلب المدن:", err);
    res.status(500).json({ success: false, message: "خطأ في جلب المدن" });
  }
});

// إضافة مدينة
app.post("/cities", async (req, res) => {
  try {
    const { name, delivery_fee } = req.body;

    if (!name || delivery_fee === undefined)
      return res.json({ success: false, message: "❌ البيانات ناقصة" });

    await db.query(
      "INSERT INTO cities (name, delivery_fee, created_at) VALUES (?,?,NOW())",
      [name, delivery_fee]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ خطأ إضافة مدينة:", err);
  }
});

// حذف مدينة
app.delete("/cities/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM cities WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ خطأ حذف مدينة:", err);
  }
});

// إضافة حي
app.post("/cities/:city_id/neighborhoods", async (req, res) => {
  try {
    const { name, delivery_fee } = req.body;
    const { city_id } = req.params;

    await db.query(
      "INSERT INTO neighborhoods (city_id, name, delivery_fee, created_at) VALUES (?,?,?,NOW())",
      [city_id, name, delivery_fee]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ خطأ إضافة حي:", err);
  }
});

// جلب الأحياء
app.get("/neighborhoods", async (_, res) => {
  try {
    const [rows] = await db.query(`
      SELECT n.id, n.name, n.delivery_fee, n.city_id, c.name AS city_name
      FROM neighborhoods n
      LEFT JOIN cities c ON c.id = n.city_id
      ORDER BY n.id DESC
    `);

    res.json({ success: true, neighborhoods: rows });
  } catch (err) {
    console.error("❌ خطأ جلب الأحياء:", err);
  }
});

// =============================================================
// ======================  العملاء CRUD ==========================
// =============================================================

// 📌 جلب العملاء
app.get("/customers", async (_, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, phone, email, created_at
      FROM customers
      ORDER BY id DESC
    `);

    res.json({ success: true, customers: rows });
  } catch (err) {
    console.error("❌ خطأ جلب العملاء:", err);
    res.status(500).json({ success: false, message: "خطأ في جلب العملاء" });
  }
});

// ➕ إضافة عميل
app.post("/customers", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      return res.json({
        success: false,
        message: "❌ الاسم – الجوال – كلمة المرور مطلوبة",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO customers (name, phone, email, password, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [name, phone, email || null, hashed]
    );

    res.json({ success: true, message: "تم إضافة العميل" });
  } catch (err) {
    console.error("❌ خطأ إضافة عميل:", err);
    res.status(500).json({ success: false, message: "خطأ في إضافة العميل" });
  }
});

// ✏️ تعديل عميل
app.put("/customers/:id", async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    await db.query(
      `UPDATE customers SET name=?, phone=?, email=? WHERE id=?`,
      [name, phone, email, req.params.id]
    );

    res.json({ success: true, message: "تم تعديل العميل" });
  } catch (err) {
    console.error("❌ خطأ تعديل عميل:", err);
    res.status(500).json({ success: false, message: "خطأ في تعديل العميل" });
  }
});

// 🔐 إعادة تعيين كلمة المرور
app.put("/customers/:id/reset-password", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password)
      return res.json({
        success: false,
        message: "❌ كلمة المرور الجديدة مطلوبة",
      });

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      `UPDATE customers SET password=? WHERE id=?`,
      [hashed, req.params.id]
    );

    res.json({
      success: true,
      message: "🔑 تم إعادة تعيين كلمة المرور",
    });
  } catch (err) {
    console.error("❌ خطأ إعادة كلمة المرور:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في إعادة كلمة المرور",
    });
  }
});

// 🗑 حذف عميل (مع حذف العناوين التابعة)
app.delete("/customers/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM customer_addresses WHERE customer_id=?", [
      req.params.id,
    ]);
    await db.query("DELETE FROM customers WHERE id=?", [req.params.id]);

    res.json({ success: true, message: "تم حذف العميل" });
  } catch (err) {
    console.error("❌ خطأ حذف عميل:", err);
    res.status(500).json({ success: false, message: "خطأ في حذف العميل" });
  }
});
// =============================================================
// ===================  عناوين العملاء CRUD =====================
// =============================================================

// جلب العناوين
app.get("/customer-addresses", async (_, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ca.id,
        ca.customer_id,
        c.name AS customer_name,
        ca.province,       -- city_id
        ca.district,       -- neighborhood_id
        ca.location_type,
        ca.address,
        ca.gps_link,
        ca.latitude,
        ca.longitude,
        ca.created_at
      FROM customer_addresses ca
      JOIN customers c ON ca.customer_id = c.id
      ORDER BY ca.id DESC
    `);

    res.json({ success: true, addresses: rows });
  } catch (err) {
    console.error("❌ خطأ جلب العناوين:", err);
  }
});

// إضافة عنوان
app.post("/customer-addresses", async (req, res) => {
  try {
    const {
      customer_id,
      province,
      district,
      location_type,
      address,
      gps_link,
      latitude,
      longitude,
    } = req.body;

    if (!customer_id || !province || !district)
      return res.json({ success: false, message: "❌ البيانات ناقصة" });

    await db.query(
      `
      INSERT INTO customer_addresses 
      (customer_id, province, district, location_type, address, gps_link, latitude, longitude, created_at)
      VALUES (?,?,?,?,?,?,?,?,NOW())
    `,
      [
        customer_id,
        province, // city_id
        district, // neighborhood_id
        location_type,
        address,
        gps_link,
        latitude,
        longitude,
      ]
    );

    res.json({ success: true, message: "تمت إضافة العنوان" });
  } catch (err) {
    console.error("❌ خطأ إضافة عنوان:", err);
  }
});

// تعديل عنوان
app.put("/customer-addresses/:id", async (req, res) => {
  try {
    const {
      province,
      district,
      location_type,
      address,
      gps_link,
      latitude,
      longitude,
    } = req.body;

    await db.query(
      `
      UPDATE customer_addresses 
      SET province=?, district=?, location_type=?, address=?, gps_link=?, latitude=?, longitude=?
      WHERE id=?
    `,
      [
        province,
        district,
        location_type,
        address,
        gps_link,
        latitude,
        longitude,
        req.params.id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ خطأ تعديل عنوان:", err);
  }
});

// حذف عنوان
app.delete("/customer-addresses/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM customer_addresses WHERE id=?", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ خطأ حذف عنوان:", err);
  }
});

/* ============================================================================
   🚗 الكباتن (PostgreSQL)
============================================================================ */

// ✅ جلب جميع الكباتن
app.get("/captains", async (_, res) => {
  try {
    const result = await db.query(`
      SELECT *
      FROM captains
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      captains: result.rows
    });
  } catch (err) {
    console.error("❌ خطأ في جلب الكباتن:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في جلب الكباتن"
    });
  }
});

// ✅ إضافة كابتن جديد
app.post("/captains", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      vehicle_type,
      vehicle_number,
      status
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "❌ الاسم، الجوال، وكلمة المرور مطلوبة"
      });
    }

    await db.query(
      `
      INSERT INTO captains
      (name, email, phone, password, vehicle_type, vehicle_number, status, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      `,
      [
        name,
        email || null,
        phone,
        password,
        vehicle_type || "دراجة",
        vehicle_number || null,
        status || "available"
      ]
    );

    res.json({
      success: true,
      message: "✅ تم إضافة الكابتن بنجاح"
    });
  } catch (err) {
    console.error("❌ خطأ في إضافة الكابتن:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في إضافة الكابتن"
    });
  }
});

// ✅ تعديل بيانات كابتن
app.put("/captains/:id", async (req, res) => {
  try {
    const captainId = req.params.id;
    const {
      name,
      email,
      phone,
      password,
      vehicle_type,
      vehicle_number,
      status
    } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) { fields.push(`name=$${idx++}`); values.push(name); }
    if (email) { fields.push(`email=$${idx++}`); values.push(email); }
    if (phone) { fields.push(`phone=$${idx++}`); values.push(phone); }
    if (password) { fields.push(`password=$${idx++}`); values.push(password); }
    if (vehicle_type) { fields.push(`vehicle_type=$${idx++}`); values.push(vehicle_type); }
    if (vehicle_number) { fields.push(`vehicle_number=$${idx++}`); values.push(vehicle_number); }
    if (status) { fields.push(`status=$${idx++}`); values.push(status); }

    if (!fields.length) {
      return res.status(400).json({
        success: false,
        message: "❌ لا توجد بيانات لتحديثها"
      });
    }

    values.push(captainId);

    const result = await db.query(
      `
      UPDATE captains
      SET ${fields.join(", ")}
      WHERE id=$${idx}
      `,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "❌ الكابتن غير موجود"
      });
    }

    res.json({
      success: true,
      message: "✅ تم تعديل الكابتن بنجاح"
    });
  } catch (err) {
    console.error("❌ خطأ في تعديل الكابتن:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في تعديل الكابتن"
    });
  }
});

// ✅ حذف كابتن
app.delete("/captains/:id", async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM captains WHERE id=$1",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "❌ الكابتن غير موجود"
      });
    }

    res.json({
      success: true,
      message: "🗑 تم حذف الكابتن"
    });
  } catch (err) {
    console.error("❌ خطأ في حذف الكابتن:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في حذف الكابتن"
    });
  }
});

// ✅ تحديث حالة الكابتن
app.put("/captains/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["available", "busy", "offline", "inactive"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "❌ حالة الكابتن غير صحيحة"
      });
    }

    const result = await db.query(
      "UPDATE captains SET status=$1 WHERE id=$2",
      [status, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "❌ الكابتن غير موجود"
      });
    }

    res.json({
      success: true,
      message: "✅ تم تحديث حالة الكابتن"
    });
  } catch (err) {
    console.error("❌ خطأ في تحديث حالة الكابتن:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في تحديث حالة الكابتن"
    });
  }
});


/* ============================================================================
   الوحدات
============================================================================ */
app.get("/units", async (_, res) => {
  const [rows] = await db.query("SELECT * FROM units ORDER BY id DESC");
  res.json(rows);
});
app.post("/units", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "❌ اسم الوحدة مطلوب" });
  await db.query("INSERT INTO units (name) VALUES (?)", [name.trim()]);
  res.json({ success: true });
});

/* ============================================================================
   الفئات
============================================================================ */
app.get("/categories", async (_, res) => {
  const [rows] = await db.query("SELECT * FROM categories ORDER BY id DESC");
  res.json(rows);
});
app.post("/categories", upload.single("image"), async (req, res) => {
  const { name, description, icon_url } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  await db.query(
    "INSERT INTO categories (name, description, icon_url, image_url, created_at) VALUES (?, ?, ?, ?, NOW())",
    [name, description || "", icon_url || "", image_url]
  );
  res.json({ success: true });
});

/* ============================================================================
   ✏️ تعديل فئة
============================================================================ */
app.put("/categories/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description, icon_url } = req.body;
    const { id } = req.params;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // نبني الـ query ديناميكي إذا فيه صورة أو لا
    let sql = "UPDATE categories SET name=?, description=?, icon_url=? ";
    const params = [name, description || "", icon_url || ""];

    if (image_url) {
      sql += ", image_url=? ";
      params.push(image_url);
    }

    sql += "WHERE id=?";
    params.push(id);

    await db.query(sql, params);

    res.json({ success: true, message: "تم تعديل الفئة" });
  } catch (err) {
    console.error("❌ خطأ في تعديل الفئة:", err);
    res.status(500).json({ success: false, message: "❌ خطأ في تعديل الفئة" });
  }
});

/* ============================================================================
   🗑️ حذف فئة
============================================================================ */
app.delete("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM categories WHERE id=?", [id]);

    res.json({ success: true, message: "تم حذف الفئة" });
  } catch (err) {
    console.error("❌ خطأ في حذف الفئة:", err);
    res.status(500).json({ success: false, message: "❌ خطأ في حذف الفئة" });
  }
});

/* ============================================================================
   🟢 جلب جميع المطاعم مع النوع والفئات وأوقات العمل
============================================================================ */
app.get("/restaurants", async (_, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.name, r.type_id, t.name AS type_name, 
             r.address, r.phone, r.delivery_time, r.pricing_plan,
             r.image_url, r.created_at,
             GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS categories,
             GROUP_CONCAT(DISTINCT c.id SEPARATOR ',') AS category_ids
      FROM restaurants r
      LEFT JOIN types t ON r.type_id = t.id
      LEFT JOIN restaurant_categories rc ON r.id = rc.restaurant_id
      LEFT JOIN categories c ON rc.category_id = c.id
      GROUP BY r.id
      ORDER BY r.id DESC
    `);

    for (const row of rows) {
      const [hours] = await db.query(
        "SELECT day, start_time, end_time, closed FROM store_hours WHERE store_id=?",
        [row.id]
      );
      row.schedule = hours;
    }

    res.json({ success: true, restaurants: rows });
  } catch (err) {
    console.error("❌ خطأ في جلب المطاعم:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

/* ============================================================================
   🟢 جلب مطعم واحد بالتفصيل
============================================================================ */
app.get("/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[restaurant]] = await db.query(
      `
      SELECT r.*, t.name AS type_name
      FROM restaurants r
      LEFT JOIN types t ON r.type_id = t.id
      WHERE r.id = ?
      `,
      [id]
    );

    if (!restaurant)
      return res.status(404).json({ success: false, message: "❌ المطعم غير موجود" });

    const [categories] = await db.query(
      `
      SELECT c.id, c.name
      FROM restaurant_categories rc
      JOIN categories c ON rc.category_id = c.id
      WHERE rc.restaurant_id = ?
      `,
      [id]
    );

    const [schedule] = await db.query(
      "SELECT day, start_time, end_time, closed FROM store_hours WHERE store_id=?",
      [id]
    );

    restaurant.categories = categories;
    restaurant.schedule = schedule;

    res.json({ success: true, restaurant });
  } catch (err) {
    console.error("❌ خطأ في جلب بيانات المطعم:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

/* ============================================================================
   🟢 إضافة مطعم جديد مع الفئات والتوقيت
============================================================================ */
app.post("/restaurants", upload.single("image_url"), async (req, res) => {
  try {
    const {
      name,
      type_id,
      address = "",
      phone = "",
      delivery_time = "",
      pricing_plan = "",
      category_ids = [],
      schedule = [],
    } = req.body;

    if (!name || !type_id)
      return res.status(400).json({
        success: false,
        message: "❌ اسم المطعم والنوع مطلوبان",
      });

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      `
      INSERT INTO restaurants 
      (name, type_id, address, phone, delivery_time, pricing_plan, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [name, type_id, address, phone, delivery_time, pricing_plan, image_url]
    );

    const restaurantId = result.insertId;

    // الفئات
    let categories = [];
    try {
      categories = typeof category_ids === "string" ? JSON.parse(category_ids) : category_ids;
    } catch {}
    for (const cid of categories) {
      await db.query(
        "INSERT INTO restaurant_categories (restaurant_id, category_id) VALUES (?, ?)",
        [restaurantId, cid]
      );
    }

    // أوقات العمل
    let scheduleData = [];
    try {
      scheduleData = typeof schedule === "string" ? JSON.parse(schedule) : schedule;
    } catch {}
    for (const day of scheduleData) {
      await db.query(
        "INSERT INTO store_hours (store_id, day, start_time, end_time, closed) VALUES (?, ?, ?, ?, ?)",
        [restaurantId, day.day, day.start || null, day.end || null, day.closed ? 1 : 0]
      );
    }

    res.json({ success: true, message: "✅ تم إضافة المطعم بنجاح" });
  } catch (err) {
    console.error("❌ خطأ في إضافة المطعم:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

/* ============================================================================
   🟢 تعديل مطعم + فئات + أوقات العمل
============================================================================ */
app.put("/restaurants/:id", upload.single("image_url"), async (req, res) => {
  try {
    const id = req.params.id;
    const {
      name,
      type_id,
      address,
      phone,
      delivery_time,
      pricing_plan,
      category_ids = [],
      schedule = [],
    } = req.body;

    const updates = [];
    const params = [];

    if (name) { updates.push("name=?"); params.push(name); }
    if (type_id) { updates.push("type_id=?"); params.push(type_id); }
    if (address) { updates.push("address=?"); params.push(address); }
    if (phone) { updates.push("phone=?"); params.push(phone); }
    if (delivery_time) { updates.push("delivery_time=?"); params.push(delivery_time); }
    if (pricing_plan) { updates.push("pricing_plan=?"); params.push(pricing_plan); }
    if (req.file) {
      updates.push("image_url=?");
      params.push(`/uploads/${req.file.filename}`);
    }

    if (updates.length > 0) {
      params.push(id);
      await db.query(`UPDATE restaurants SET ${updates.join(", ")} WHERE id=?`, params);
    }

    // تحديث الفئات
    await db.query("DELETE FROM restaurant_categories WHERE restaurant_id=?", [id]);
    let cats = [];
    try {
      cats = typeof category_ids === "string" ? JSON.parse(category_ids) : category_ids;
    } catch {}
    for (const cid of cats) {
      await db.query(
        "INSERT INTO restaurant_categories (restaurant_id, category_id) VALUES (?, ?)",
        [id, cid]
      );
    }

    // تحديث التوقيت
    await db.query("DELETE FROM store_hours WHERE store_id=?", [id]);
    let scheduleData = [];
    try {
      scheduleData = typeof schedule === "string" ? JSON.parse(schedule) : schedule;
    } catch {}
    for (const day of scheduleData) {
      await db.query(
        "INSERT INTO store_hours (store_id, day, start_time, end_time, closed) VALUES (?, ?, ?, ?, ?)",
        [id, day.day, day.start || null, day.end || null, day.closed ? 1 : 0]
      );
    }

    res.json({ success: true, message: "✅ تم تعديل المطعم بنجاح" });
  } catch (err) {
    console.error("❌ خطأ في تعديل المطعم:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

/* ============================================================================
   🟢 تعديل أوقات العمل فقط (من المودال داخل React)
============================================================================ */
app.put("/restaurants/schedule/update", async (req, res) => {
  try {
    const { restaurant_id, schedule } = req.body;

    if (!restaurant_id || !schedule)
      return res.status(400).json({ success: false, message: "❌ بيانات غير مكتملة" });

    await db.query("DELETE FROM store_hours WHERE store_id=?", [restaurant_id]);

    for (const day of schedule) {
      await db.query(
        "INSERT INTO store_hours (store_id, day, start_time, end_time, closed) VALUES (?, ?, ?, ?, ?)",
        [
          restaurant_id,
          day.day,
          day.start_time || day.start || null,
          day.end_time || day.end || null,
          day.closed ? 1 : 0,
        ]
      );
    }

    res.json({ success: true, message: "✅ تم تحديث أوقات العمل بنجاح" });
  } catch (err) {
    console.error("❌ خطأ في تحديث أوقات العمل:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

/* ============================================================================
   🟢 حذف مطعم وكل العلاقات المرتبطة به
============================================================================ */
app.delete("/restaurants/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM restaurant_categories WHERE restaurant_id=?", [id]);
    await db.query("DELETE FROM store_hours WHERE store_id=?", [id]);
    await db.query("DELETE FROM restaurants WHERE id=?", [id]);
    res.json({ success: true, message: "🗑 تم حذف المطعم مع أوقات العمل والفئات" });
  } catch (err) {
    console.error("❌ خطأ في الحذف:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});
/* ============================================================================
   🟢 دالة لتصحيح category_ids مهما كان شكلها
============================================================================ */
function parseCategoryIds(raw) {
  try {
    if (!raw) return [];

    // إذا كانت مصفوفة جاهزة
    if (Array.isArray(raw)) return raw.map(Number);

    // إذا كانت JSON
    if (typeof raw === "string" && raw.trim().startsWith("[")) {
      return JSON.parse(raw).map(Number);
    }

    // إذا كانت "5,7,9"
    if (typeof raw === "string" && raw.includes(",")) {
      return raw.split(",").map((x) => Number(x.trim()));
    }

    // إذا كانت قيمة واحدة "5"
    return [Number(raw)];

  } catch (err) {
    console.log("❌ خطأ في parseCategoryIds:", err);
    return [];
  }
}

/* ============================================================================
   🟢 جلب جميع المنتجات — يدعم عدة فئات
============================================================================ */
app.get("/products", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.image_url,
        p.notes,
        p.unit_id,
        u.name AS unit_name,
        p.restaurant_id,
        r.name AS restaurant_name,
        GROUP_CONCAT(c.id) AS category_ids,
        GROUP_CONCAT(c.name SEPARATOR ', ') AS category_names
      FROM products p
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN restaurants r ON p.restaurant_id = r.id
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      GROUP BY p.id
      ORDER BY p.id DESC
    `);

    res.json({ success: true, products: rows });
  } catch (err) {
    console.error("❌ خطأ في جلب المنتجات:", err.message);
    res.status(500).json({ success: false });
  }
});

/* ============================================================================
   🟢 إضافة منتج — يدعم عدة فئات
============================================================================ */
app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      price,
      notes,
      restaurant_id,
      unit_id,
      category_ids
    } = req.body;

    if (!name || !price || !restaurant_id || !unit_id)
      return res.status(400).json({ success: false, message: "❌ جميع الحقول مطلوبة" });

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // إضافة المنتج
    const [result] = await db.query(
      `INSERT INTO products (name, price, notes, restaurant_id, unit_id, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [name, price, notes || "", restaurant_id, unit_id, image_url]
    );

    const productId = result.insertId;

    // إصلاح مصفوفة الفئات
    const cats = parseCategoryIds(category_ids);

    for (const cid of cats) {
      await db.query(
        `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`,
        [productId, cid]
      );
    }

    res.json({ success: true, product_id: productId });

  } catch (err) {
    console.error("❌ خطأ في إضافة المنتج:", err.message);
    res.status(500).json({ success: false });
  }
});

/* ============================================================================
   🟢 تعديل منتج — يدعم عدة فئات
============================================================================ */
app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      price,
      notes,
      restaurant_id,
      unit_id,
      category_ids
    } = req.body;

    const { id } = req.params;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    await db.query(
      `UPDATE products 
       SET name=?, price=?, notes=?, restaurant_id=?, unit_id=?, image_url = IFNULL(?, image_url)
       WHERE id=?`,
      [name, price, notes, restaurant_id, unit_id, image_url, id]
    );

    // احذف الفئات القديمة
    await db.query(`DELETE FROM product_categories WHERE product_id=?`, [id]);

    // الفئات الجديدة بعد التصحيح
    const cats = parseCategoryIds(category_ids);

    for (const cid of cats) {
      await db.query(
        `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`,
        [id, cid]
      );
    }

    res.json({ success: true });

  } catch (err) {
    console.error("❌ خطأ في تعديل المنتج:", err.message);
    res.status(500).json({ success: false });
  }
});

/* ============================================================================
   🟢 حذف منتج — يحذف أيضاً الفئات التابعة
============================================================================ */
app.delete("/products/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM product_categories WHERE product_id=?", [req.params.id]);
    await db.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ خطأ في حذف المنتج:", err.message);
    res.status(500).json({ success: false });
  }
});
// ======================= 📍 المدن ===========================
app.get("/cities", async (_, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id, c.name, c.delivery_fee, COUNT(n.id) AS neighborhoods
      FROM cities c
      LEFT JOIN neighborhoods n ON n.city_id = c.id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    res.json({ success: true, cities: rows });
  } catch (err) {
    console.error("Error cities:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في جلب المدن" });
  }
});

app.post("/cities", async (req, res) => {
  try {
    const { name, delivery_fee } = req.body;
    if (!name || delivery_fee == null || isNaN(delivery_fee)) {
      return res.status(400).json({ success: false, message: "❌ اسم المدينة وسعر التوصيل مطلوبان" });
    }
    await db.query("INSERT INTO cities (name, delivery_fee, created_at) VALUES (?, ?, NOW())",
      [name, delivery_fee]);
    res.json({ success: true, message: "✅ تم إضافة المدينة" });
  } catch (err) {
    console.error("Error add city:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في إضافة المدينة" });
  }
});

app.delete("/cities/:id", async (req, res) => {
  try {
    const cityId = parseInt(req.params.id, 10);
    const [exists] = await db.query("SELECT id FROM cities WHERE id = ?", [cityId]);
    if (!exists.length) {
      return res.status(404).json({ success: false, message: "❌ المدينة غير موجودة" });
    }
    await db.query("DELETE FROM cities WHERE id=?", [cityId]);
    res.json({ success: true, message: "🗑️ تم حذف المدينة" });
  } catch (err) {
    console.error("Error del city:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في حذف المدينة" });
  }
});
/* ============================================================================
   📍 الأحياء
============================================================================ */

// ✅ جلب قائمة الأحياء (بحث أو جميع الأحياء)
app.get("/neighborhoods", async (req, res) => {
  try {
    const search = req.query.search || "";

    let sql = `
      SELECT n.id, n.name AS neighborhood_name, n.delivery_fee,
             c.name AS city_name, n.city_id, n.created_at
      FROM neighborhoods n
      LEFT JOIN cities c ON n.city_id = c.id
    `;
    const params = [];

    if (search.trim()) {
      sql += " WHERE n.name LIKE ?";
      params.push(`%${search}%`);
    }

    sql += " ORDER BY n.id DESC";

    const [rows] = await db.query(sql, params);
    res.json({ success: true, neighborhoods: rows });
  } catch (err) {
    console.error("❌ خطأ في جلب الأحياء:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في جلب الأحياء" });
  }
});

// ✅ إضافة حي جديد
app.post("/cities/:id/neighborhoods", async (req, res) => {
  try {
    const cityId = parseInt(req.params.id, 10);
    const { name, delivery_fee } = req.body;

    if (!name || delivery_fee == null || isNaN(delivery_fee)) {
      return res.status(400).json({
        success: false,
        message: "❌ اسم الحي ورسوم التوصيل مطلوبة"
      });
    }

    const [cityRows] = await db.query("SELECT id FROM cities WHERE id = ?", [cityId]);
    if (!cityRows.length) {
      return res.status(404).json({
        success: false,
        message: `❌ المدينة برقم ${cityId} غير موجودة`
      });
    }

    await db.query(
      "INSERT INTO neighborhoods (city_id, name, delivery_fee, created_at) VALUES (?, ?, ?, NOW())",
      [cityId, name, delivery_fee]
    );

    res.json({ success: true, message: "✅ تم إضافة الحي" });
  } catch (err) {
    console.error("❌ خطأ في إضافة الحي:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ داخلي في السيرفر" });
  }
});

// ✅ تعديل بيانات حي قائم
app.put("/neighborhoods/:id", async (req, res) => {
  try {
    const neighborhoodId = parseInt(req.params.id, 10);
    const { name, delivery_fee, city_id } = req.body;

    if (!name || delivery_fee == null || isNaN(delivery_fee) || !city_id) {
      return res.status(400).json({ success: false, message: "❌ جميع الحقول مطلوبة" });
    }

    const [exists] = await db.query("SELECT id FROM neighborhoods WHERE id=?", [neighborhoodId]);
    if (!exists.length) {
      return res.status(404).json({ success: false, message: "❌ الحي غير موجود" });
    }

    await db.query(
      "UPDATE neighborhoods SET name=?, delivery_fee=?, city_id=? WHERE id=?",
      [name, delivery_fee, city_id, neighborhoodId]
    );

    res.json({ success: true, message: "✅ تم تعديل الحي" });
  } catch (err) {
    console.error("❌ خطأ في تعديل الحي:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في تعديل الحي" });
  }
});

// ✅ حذف حي
app.delete("/neighborhoods/:id", async (req, res) => {
  try {
    const neighborhoodId = parseInt(req.params.id, 10);
    const [exists] = await db.query("SELECT id FROM neighborhoods WHERE id = ?", [neighborhoodId]);
    if (!exists.length) {
      return res.status(404).json({ success: false, message: "❌ الحي غير موجود" });
    }

    await db.query("DELETE FROM neighborhoods WHERE id=?", [neighborhoodId]);
    res.json({ success: true, message: "🗑️ تم حذف الحي" });
  } catch (err) {
    console.error("❌ خطأ في حذف الحي:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في حذف الحي" });
  }
});
// 🟢 API: جلب جميع المتاجر
app.get("/stores", async (req, res) => {
  try {
    const branchName = req.headers["branch-name"];
    const db = await getDBConnection(branchName);

    const [rows] = await db.query(
      "SELECT id, name, cash_on_delivery, created_at FROM stores ORDER BY id DESC"
    );
    res.json({ success: true, stores: rows });
  } catch (err) {
    console.error("❌ خطأ في جلب المتاجر:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

// 🟢 API: إضافة متجر جديد + إنشاء أوقات العمل
app.post("/stores", async (req, res) => {
  try {
    const branchName = req.headers["branch-name"];
    if (!branchName) return res.status(400).json({ success: false, message: "❌ الفرع غير محدد" });

    const { name, cash_on_delivery, schedule } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "❌ اسم المتجر مطلوب" });

    const db = await getDBConnection(branchName);

    const [result] = await db.query(
      "INSERT INTO stores (name, cash_on_delivery, created_at) VALUES (?, ?, NOW())",
      [name, cash_on_delivery ? 1 : 0]
    );

    const storeId = result.insertId;

    const daysOfWeek = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
    const hoursData =
      schedule && Array.isArray(schedule) && schedule.length > 0
        ? schedule
        : daysOfWeek.map(day => ({ day, start: null, end: null, closed: 0 }));

    for (let day of hoursData) {
      await db.query(
        "INSERT INTO store_hours (store_id, day, start_time, end_time, closed) VALUES (?, ?, ?, ?, ?)",
        [storeId, day.day, day.start || null, day.end || null, day.closed ? 1 : 0]
      );
    }

    res.json({ success: true, message: "✅ تم إضافة المتجر وإنشاء أوقات العمل" });
  } catch (err) {
    console.error("❌ خطأ في إضافة المتجر:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

// 🟢 API: جلب بيانات متجر واحد + أوقاته
app.get("/stores/:id", async (req, res) => {
  try {
    const branchName = req.headers["branch-name"];
    const db = await getDBConnection(branchName);

    const [[store]] = await db.query("SELECT * FROM stores WHERE id=?", [req.params.id]);
    if (!store) return res.json({ success: false, message: "المتجر غير موجود" });

    const [hours] = await db.query("SELECT * FROM store_hours WHERE store_id=?", [req.params.id]);

    res.json({ success: true, store, hours });
  } catch (err) {
    console.error("❌ خطأ في جلب بيانات المتجر:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

// 🟢 API: تعديل متجر + تعديل أوقات العمل
app.put("/stores/:id", async (req, res) => {
  try {
    const branchName = req.headers["branch-name"];
    const db = await getDBConnection(branchName);

    const { name, cash_on_delivery, schedule } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "❌ اسم المتجر مطلوب" });

    await db.query("UPDATE stores SET name=?, cash_on_delivery=? WHERE id=?", [
      name,
      cash_on_delivery ? 1 : 0,
      req.params.id
    ]);

    if (Array.isArray(schedule) && schedule.length > 0) {
      for (let dayData of schedule) {
        await db.query(
          "UPDATE store_hours SET start_time=?, end_time=?, closed=? WHERE store_id=? AND day=?",
          [
            dayData.start_time || null,
            dayData.end_time || null,
            dayData.closed ? 1 : 0,
            req.params.id,
            dayData.day
          ]
        );
      }
    }

    res.json({ success: true, message: "✅ تم تعديل المتجر وأوقات العمل" });
  } catch (err) {
    console.error("❌ خطأ في تعديل المتجر:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

// 🟢 API: حذف متجر
app.delete("/stores/:id", async (req, res) => {
  try {
    const branchName = req.headers["branch-name"];
    const db = await getDBConnection(branchName);

    const [exists] = await db.query("SELECT id FROM stores WHERE id=?", [req.params.id]);
    if (!exists.length) {
      return res.status(404).json({ success: false, message: "المتجر غير موجود" });
    }

    await db.query("DELETE FROM stores WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ خطأ في حذف المتجر:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});


/* ============================================================================
   📦 طرق الدفع
============================================================================ */

// ========================
// جلب جميع طرق الدفع (للإدارة)
// ========================
app.get("/payment-methods", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        company,
        account_number,
        owner_name,
        address,
        CAST(is_active AS UNSIGNED) AS is_active,
        sort_order
      FROM payment_methods
      ORDER BY sort_order ASC
    `);

    res.json({ success: true, methods: rows });
  } catch (err) {
    console.error("Get payment methods error:", err);
    res.status(500).json({ success: false });
  }
});

// ========================
// جلب الطرق المفعّلة فقط (للطلبات)
// ========================
app.get("/payment-methods/active", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        company,
        account_number,
        owner_name,
        address
      FROM payment_methods
      WHERE CAST(is_active AS UNSIGNED) = 1
      ORDER BY sort_order ASC
    `);

    res.json({ success: true, methods: rows });
  } catch (err) {
    console.error("Get active payment methods error:", err);
    res.status(500).json({ success: false });
  }
});

// ========================
// إضافة طريقة دفع
// ========================
app.post("/payment-methods", async (req, res) => {
  try {
    const { company, account_number, owner_name, address } = req.body;

    await db.query(
      `INSERT INTO payment_methods
       (company, account_number, owner_name, address, sort_order, is_active)
       VALUES (?, ?, ?, ?, 9999, 1)`,
      [company, account_number, owner_name, address]
    );

    res.json({ success: true, message: "✅ تم إضافة طريقة الدفع" });
  } catch (err) {
    console.error("Add payment method error:", err);
    res.status(500).json({ success: false });
  }
});

// ========================
// تعديل طريقة دفع
// ========================
app.put("/payment-methods/:id", async (req, res) => {
  try {
    const { company, account_number, owner_name, address } = req.body;

    await db.query(
      `UPDATE payment_methods
       SET company=?, account_number=?, owner_name=?, address=?
       WHERE id=?`,
      [company, account_number, owner_name, address, req.params.id]
    );

    res.json({ success: true, message: "✅ تم التعديل" });
  } catch (err) {
    console.error("Update payment method error:", err);
    res.status(500).json({ success: false });
  }
});

// ========================
// حذف طريقة دفع
// ========================
app.delete("/payment-methods/:id", async (req, res) => {
  try {
    await db.query(
      "DELETE FROM payment_methods WHERE id=?",
      [req.params.id]
    );

    res.json({ success: true, message: "🗑️ تم الحذف" });
  } catch (err) {
    console.error("Delete payment method error:", err);
    res.status(500).json({ success: false });
  }
});

// ========================
// تفعيل / تعطيل + سجل تغييرات (✔️ مصحّح)
// ========================
app.patch("/payment-methods/:id/toggle", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const status = is_active === true || is_active === 1 ? 1 : 0;
  const userId = req.user && req.user.id ? req.user.id : null;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "UPDATE payment_methods SET is_active=? WHERE id=?",
      [status, id]
    );

    await conn.query(
      `INSERT INTO payment_method_logs
       (payment_method_id, action, changed_by)
       VALUES (?, ?, ?)`,
      [id, status === 1 ? "activate" : "deactivate", userId]
    );

    await conn.commit();

    res.json({ success: true, message: "تم تحديث الحالة" });
  } catch (err) {
    await conn.rollback();
    console.error("Toggle payment method error:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// ========================
// ترتيب بالسحب
// ========================
app.post("/payment-methods/reorder", async (req, res) => {
  const { orders } = req.body;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    for (const o of orders) {
      await conn.query(
        "UPDATE payment_methods SET sort_order=? WHERE id=?",
        [o.sort_order, o.id]
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Reorder payment methods error:", err);
    res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
});

// ========================
// 📜 سجل التغييرات + فلترة بالأيام
// ========================
app.get("/payment-methods/:id/logs", async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.query;

    const filter = days
      ? `AND l.created_at >= NOW() - INTERVAL ? DAY`
      : "";

    const params = days ? [id, Number(days)] : [id];

    const [rows] = await db.query(
      `
      SELECT 
        l.action,
        l.created_at,
        u.name AS user_name
      FROM payment_method_logs l
      LEFT JOIN users u ON u.id = l.changed_by
      WHERE l.payment_method_id = ?
      ${filter}
      ORDER BY l.created_at DESC
    `,
      params
    );

    res.json({ success: true, logs: rows });
  } catch (err) {
    console.error("Get payment method logs error:", err);
    res.status(500).json({ success: false });
  }
});

// ========================
// 📄 تصدير PDF
// ========================
app.get("/payment-methods/:id/logs/pdf", async (req, res) => {
  try {
    const { id } = req.params;

    const [logs] = await db.query(
      `
      SELECT 
        l.action,
        l.created_at,
        u.name AS user_name
      FROM payment_method_logs l
      LEFT JOIN users u ON u.id = l.changed_by
      WHERE l.payment_method_id=?
      ORDER BY l.created_at DESC
    `,
      [id]
    );

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=payment-method-logs.pdf"
    );

    doc.pipe(res);

    doc.fontSize(16).text("سجل تغييرات طرق الدفع", { align: "center" });
    doc.moveDown();

    logs.forEach((l) => {
      doc.fontSize(12).text(
        `${l.action === "activate" ? "تفعيل" : "تعطيل"} | ${
          l.user_name ?? "النظام"
        } | ${l.created_at}`
      );
    });

    doc.end();
  } catch (err) {
    console.error("Export payment logs PDF error:", err);
    res.status(500).json({ success: false });
  }
});
/*================================================================
/* ============================================================================
   📑 الأنواع (Types)
============================================================================ */
// 🟢 جلب جميع الأنواع
app.get("/types", async (_, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, image_url, sort_order, created_at
      FROM types
      ORDER BY sort_order ASC
    `);
    res.json({ success: true, types: rows });
  } catch (err) {
    console.error("❌ خطأ في جلب الأنواع:", err);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

// ✅ إضافة نوع جديد
app.post("/types", upload.single("image"), async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "❌ اسم النوع مطلوب" });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    await db.query(
      "INSERT INTO types (name, image_url, sort_order, created_at) VALUES (?, ?, ?, NOW())",
      [name, image_url, sort_order || 0]
    );

    res.json({ success: true, message: "✅ تم إضافة النوع بنجاح" });
  } catch (err) {
    console.error("❌ خطأ في إضافة النوع:", err);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

// ✅ تعديل نوع
app.put("/types/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    const updates = [];
    const params = [];

    if (name) { updates.push("name=?"); params.push(name); }
    if (sort_order !== undefined) { updates.push("sort_order=?"); params.push(sort_order); }
    if (req.file) { updates.push("image_url=?"); params.push(`/uploads/${req.file.filename}`); }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: "❌ لا توجد بيانات لتحديثها" });
    }

    params.push(req.params.id);

    await db.query(`UPDATE types SET ${updates.join(", ")} WHERE id=?`, params);

    res.json({ success: true, message: "✅ تم تعديل النوع" });
  } catch (err) {
    console.error("❌ خطأ في تعديل النوع:", err);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});

// ✅ حذف نوع
app.delete("/types/:id", async (req, res) => {
  try {
    const [exists] = await db.query("SELECT id FROM types WHERE id=?", [req.params.id]);
    if (!exists.length) {
      return res.status(404).json({ success: false, message: "❌ النوع غير موجود" });
    }

    await db.query("DELETE FROM types WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "🗑️ تم حذف النوع" });
  } catch (err) {
    console.error("❌ خطأ في حذف النوع:", err);
    res.status(500).json({ success: false, message: "❌ خطأ في السيرفر" });
  }
});
/* ============================================================================
   🟢 الأقسام والمنتجات الخاصة بالمطعم الواحد
============================================================================ */

// 🟢 جلب الأقسام (الفئات) المرتبطة بمطعم محدد
app.get("/restaurants/:id/categories", async (req, res) => {
  try {
    const restaurantId = req.params.id;

    const [rows] = await db.query(`
      SELECT 
        c.id, 
        c.name
      FROM restaurant_categories rc
      JOIN categories c ON rc.category_id = c.id
      WHERE rc.restaurant_id = ?
      ORDER BY c.id ASC
    `, [restaurantId]);

    res.json({ success: true, categories: rows });
  } catch (err) {
    console.error("❌ خطأ في جلب أقسام المطعم:", err.message);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في جلب الأقسام الخاصة بالمطعم",
    });
  }
});

// 🟢 جلب المنتجات المرتبطة بمطعم محدد
app.get("/restaurants/:id/products", async (req, res) => {
  try {
    const restaurantId = req.params.id;

    const [rows] = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.image_url,
        p.notes,
        p.category_id,
        c.name AS category_name,
        p.unit_id,
        u.name AS unit_name,
        p.restaurant_id,
        r.name AS restaurant_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN restaurants r ON p.restaurant_id = r.id
      WHERE p.restaurant_id = ?
      ORDER BY p.id DESC
    `, [restaurantId]);

    res.json({ success: true, products: rows });
  } catch (err) {
    console.error("❌ خطأ في جلب منتجات المطعم:", err.message);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في جلب منتجات المطعم",
    });
  }
});
/* ============================================================================
   🟢 إضافة طلب جديد (نهائي – متوافق مع القاعدة)
============================================================================ */
app.post("/orders", async (req, res) => {
  try {
    const {
      customer_id,
      address_id,
      gps_link,
      restaurant_id,
      products = [],
    } = req.body;

    if (!customer_id || !address_id || !restaurant_id || !products.length) {
      return res.status(400).json({
        success: false,
        message: "❌ البيانات المطلوبة غير مكتملة",
      });
    }

    // ===== العميل =====
    const [[customer]] = await db.query(
      "SELECT name, phone FROM customers WHERE id = ?",
      [customer_id]
    );

    // ===== العنوان + رسوم التوصيل =====
    const [[address]] = await db.query(`
      SELECT 
        ca.address,
        ca.latitude,
        ca.longitude,
        IFNULL(n.delivery_fee, 0) AS delivery_fee
      FROM customer_addresses ca
      LEFT JOIN neighborhoods n ON n.id = ca.neighborhood_id
      WHERE ca.id = ?
    `, [address_id]);

    // ===== المطعم =====
    const [[restaurant]] = await db.query(
      "SELECT name, phone FROM restaurants WHERE id = ?",
      [restaurant_id]
    );

    if (!customer || !address || !restaurant) {
      return res.status(400).json({
        success: false,
        message: "❌ بيانات غير صالحة",
      });
    }

    // ===== حساب المنتجات =====
    let products_total = 0;

    for (const item of products) {
      const [[prod]] = await db.query(
        "SELECT price FROM products WHERE id = ?",
        [item.product_id]
      );

      if (prod) {
        products_total += prod.price * (item.quantity || 1);
      }
    }

    const delivery_fee = Number(address.delivery_fee) || 0;
    const total_amount = products_total + delivery_fee;

    // ===== إدخال الطلب (حسب جدولك الحالي) =====
    const [orderResult] = await db.query(
      `
      INSERT INTO orders (
        customer_name,
        customer_phone,
        customer_address,
        latitude,
        longitude,
        restaurant_name,
        restaurant_phone,
        order_details,
        total_amount,
        delivery_fee,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'pending', NOW())
      `,
      [
        customer.name,
        customer.phone,
        address.address,
        address.latitude,
        address.longitude,
        restaurant.name,
        restaurant.phone,
        gps_link || null,
        total_amount,
        delivery_fee,
      ]
    );

    const orderId = orderResult.insertId;

    // ===== إدخال المنتجات =====
    for (const item of products) {
      const [[prod]] = await db.query(
        "SELECT price FROM products WHERE id = ?",
        [item.product_id]
      );

      if (prod) {
        await db.query(
          `
          INSERT INTO order_items (order_id, product_id, qty, price)
          VALUES (?, ?, ?, ?)
          `,
          [
            orderId,
            item.product_id,
            item.quantity || 1,
            prod.price,
          ]
        );
      }
    }

    res.json({
      success: true,
      message: "✅ تم إضافة الطلب بنجاح",
      order_id: orderId,
    });

  } catch (err) {
    console.error("❌ خطأ إضافة الطلب:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في السيرفر",
    });
  }
});



/* ===================================================================
   🧑‍💼 الوكلاء (Agents)
=================================================================== */

// ✅ جلب جميع الوكلاء
app.get("/agents", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        address,
        is_active,
        created_at
      FROM agents
      ORDER BY id DESC
    `);

    res.json({ success: true, agents: rows });
  } catch (err) {
    console.error("Get agents error:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في جلب الوكلاء"
    });
  }
});

// ✅ جلب وكيل واحد
app.get("/agents/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, address, is_active FROM agents WHERE id=?",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "❌ الوكيل غير موجود"
      });
    }

    res.json({ success: true, agent: rows[0] });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "❌ خطأ في جلب الوكيل"
    });
  }
});

// ✅ إضافة وكيل
app.post("/agents", async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: "❌ الاسم وكلمة المرور مطلوبة"
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO agents 
       (name, email, phone, password, address, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [name, email || null, phone || null, hashed, address || null]
    );

    res.json({
      success: true,
      message: "✅ تم إضافة الوكيل بنجاح"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "❌ خطأ في إضافة الوكيل"
    });
  }
});

// ✅ تعديل وكيل
app.put("/agents/:id", async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    const updates = [];
    const params = [];

    if (name) { updates.push("name=?"); params.push(name); }
    if (email) { updates.push("email=?"); params.push(email); }
    if (phone) { updates.push("phone=?"); params.push(phone); }
    if (address) { updates.push("address=?"); params.push(address); }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push("password=?");
      params.push(hashed);
    }

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message: "❌ لا توجد بيانات للتحديث"
      });
    }

    params.push(req.params.id);

    await db.query(
      `UPDATE agents SET ${updates.join(", ")} WHERE id=?`,
      params
    );

    res.json({
      success: true,
      message: "✅ تم تعديل الوكيل"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "❌ خطأ في تعديل الوكيل"
    });
  }
});

// ✅ تفعيل / تعطيل وكيل
app.patch("/agents/:id/toggle", async (req, res) => {
  try {
    const { is_active } = req.body;

    await db.query(
      "UPDATE agents SET is_active=? WHERE id=?",
      [is_active ? 1 : 0, req.params.id]
    );

    res.json({
      success: true,
      message: "✅ تم تحديث حالة الوكيل"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "❌ خطأ في تغيير الحالة"
    });
  }
});

// ✅ حذف وكيل
app.delete("/agents/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM agents WHERE id=?", [req.params.id]);

    res.json({
      success: true,
      message: "🗑️ تم حذف الوكيل"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "❌ خطأ في حذف الوكيل"
    });
  }
});
/* =====================================================
   👥 Agent Groups (مجموعات الوكلاء)
===================================================== */

// جلب كل المجموعات
app.get("/agent-groups", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM agent_groups ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ get agent groups:", err);
    res.status(500).json({ message: "خطأ في جلب المجموعات" });
  }
});

// إضافة مجموعة جديدة
app.post("/agent-groups", async (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      message: "الاسم والرمز مطلوبان",
    });
  }

  try {
    await db.query(
      "INSERT INTO agent_groups (name, code) VALUES (?, ?)",
      [name, code]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ add agent group:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "الرمز مستخدم مسبقًا",
      });
    }

    res.status(500).json({ message: "خطأ في إضافة المجموعة" });
  }
});

// تعديل مجموعة
app.put("/agent-groups/:id", async (req, res) => {
  const { name, code, status } = req.body;
  const { id } = req.params;

  try {
    await db.query(
      "UPDATE agent_groups SET name=?, code=?, status=? WHERE id=?",
      [name, code, status ?? "active", id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ update agent group:", err);
    res.status(500).json({ message: "خطأ في تعديل المجموعة" });
  }
});

// حذف مجموعة
app.delete("/agent-groups/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      "DELETE FROM agent_groups WHERE id=?",
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ delete agent group:", err);
    res.status(500).json({ message: "خطأ في حذف المجموعة" });
  }
});
/* =========================
   API: Accounts (دليل الحسابات)
========================= */

/* ======================================================
   Accounts API – دليل الحسابات (نسخة مستقرة محاسبياً)
====================================================== */

/* =========================
   بناء شجرة الحسابات
========================= */
function buildTree(items, parentId = null) {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id),
    }));
}

/* =========================
   GET /accounts
========================= */
app.get("/accounts", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.id,
        a.code,
        a.name_ar,
        a.name_en,
        a.parent_id,
        p.name_ar AS parent_name,
        a.account_type,
        a.account_level,
        CASE
          WHEN a.account_type IN ('asset','liability','equity')
            THEN 'الميزانية العمومية'
          ELSE 'أرباح وخسائر'
        END AS financial_statement,
        a.created_at,
        u.name AS created_by
      FROM accounts a
      LEFT JOIN accounts p ON a.parent_id = p.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.is_active = 1
      ORDER BY a.code
    `);

    const list = rows.map(r => ({ ...r }));
    const tree = buildTree(list, null);

    res.json({ tree, list });
  } catch (err) {
    console.error("GET ACCOUNTS ERROR:", err);
    res.status(500).json({
      message: "خطأ في جلب دليل الحسابات",
      error: err.message
    });
  }
});

/* =========================
   GET /accounts/roots
   (الحسابات الرئيسية فقط)
========================= */
app.get("/accounts/roots", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        code,
        name_ar
      FROM accounts
      WHERE
        is_active = 1
        AND parent_id IS NULL
      ORDER BY code
    `);

    res.json({
      success: true,
      accounts: rows
    });
  } catch (err) {
    console.error("GET ROOT ACCOUNTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الحسابات الرئيسية"
    });
  }
});


/* =========================
   جلب أعلى حساب أب (Root)
========================= */
async function getRootAccount(db, accountId) {
  let currentId = accountId;
  let last = null;

  while (currentId) {
    const [[row]] = await db.query(
      `
      SELECT id, parent_id, account_type
      FROM accounts
      WHERE id = ? AND is_active = 1
      `,
      [currentId]
    );

    if (!row) break;

    last = row;
    currentId = row.parent_id;
  }

  return last;
}

/* =========================
   POST /accounts
========================= */
app.post("/accounts", async (req, res) => {
  try {
    const {
      name_ar,
      name_en,
      parent_id,
      account_level, // "رئيسي" | "فرعي" (قادم من الفورم فقط)
      account_type,  // فقط للحسابات الرئيسية
      created_by,
    } = req.body;

    /* =========================
       Validation أساسي
    ========================= */
    if (!name_ar) {
      return res.status(400).json({ message: "اسم الحساب مطلوب" });
    }

    if (!account_level || !["رئيسي", "فرعي"].includes(account_level)) {
      return res.status(400).json({ message: "مستوى الحساب غير صالح" });
    }

    const cleanParentId =
      parent_id !== undefined && parent_id !== null
        ? Number(parent_id)
        : null;

    /* =========================
       فرعي بدون أب ❌
    ========================= */
    if (account_level === "فرعي" && !cleanParentId) {
      return res.status(400).json({
        message: "الحساب الفرعي يجب أن يكون له حساب أب",
      });
    }

    let finalAccountType;
    let finalFinancialStatement;
    let parentCode = null;

    /* =========================
       في حال وجود حساب أب
    ========================= */
    if (cleanParentId) {
      const [[parent]] = await db.query(
        `
        SELECT id, code, account_type, financial_statement
        FROM accounts
        WHERE id = ? AND is_active = 1
        `,
        [cleanParentId]
      );

      if (!parent) {
        return res.status(400).json({ message: "الحساب الأب غير موجود" });
      }

      // ✔️ وراثة النوع والحساب الختامي من الأب
      parentCode = parent.code;
      finalAccountType = parent.account_type;
      finalFinancialStatement = parent.financial_statement;
    }

    /* =========================
       حساب رئيسي (بدون أب)
    ========================= */
    if (!cleanParentId) {
      if (!account_type) {
        return res.status(400).json({
          message: "نوع الحساب مطلوب للحساب الرئيسي",
        });
      }

      finalAccountType = account_type;

      finalFinancialStatement =
        ["asset", "liability", "equity"].includes(account_type)
          ? "الميزانية العمومية"
          : "أرباح وخسائر";
    }

    /* =========================
       توليد رقم الحساب
    ========================= */
    let code;

    if (!cleanParentId) {
      const [[row]] = await db.query(`
        SELECT MAX(CAST(code AS UNSIGNED)) AS maxCode
        FROM accounts
        WHERE parent_id IS NULL
      `);

      code = String((row.maxCode || 0) + 1);
    } else {
      const [[row]] = await db.query(
        `
        SELECT COUNT(*) AS cnt
        FROM accounts
        WHERE parent_id = ?
        `,
        [cleanParentId]
      );

      code = `${parentCode}-${row.cnt + 1}`;
    }

    /* =========================
       INSERT النهائي
    ========================= */
    const [result] = await db.query(
      `
      INSERT INTO accounts (
        code,
        name_ar,
        name_en,
        parent_id,
        account_level,
        account_type,
        financial_statement,
        created_by,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        code,
        name_ar,
        name_en || null,
        cleanParentId,
        account_level,              // ✅ من الفورم فقط
        finalAccountType,
        finalFinancialStatement,
        created_by || null,
      ]
    );

    res.json({
      success: true,
      message: "تم إضافة الحساب بنجاح",
      id: result.insertId,
    });

  } catch (err) {
    console.error("CREATE ACCOUNT ERROR:", err.sqlMessage || err);
    res.status(500).json({
      message: "خطأ في إضافة الحساب",
      error: err.sqlMessage || err.message,
    });
  }
});

/* =========================
   GET /accounts/main-for-banks
   كل الحسابات الرئيسية فقط
========================= */
app.get("/accounts/main-for-banks", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        code,
        name_ar,
        parent_id
      FROM accounts
      WHERE
        is_active = 1
        AND account_level = 'رئيسي'
      ORDER BY code
    `);

    res.json({
      success: true,
      accounts: rows
    });
  } catch (err) {
    console.error("GET MAIN ACCOUNTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الحسابات الرئيسية"
    });
  }
});


/* =========================
   Currencies API
========================= */

// جلب العملات
app.get("/currencies", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM currencies
      WHERE is_active = 1
      ORDER BY is_local DESC, id ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET CURRENCIES ERROR:", err);
    res.status(500).json({ message: "خطأ في جلب العملات" });
  }
});

// إضافة عملة
app.post("/currencies", async (req, res) => {
  try {
    const {
      name_ar,
      name_en,
      code,
      symbol,
      exchange_rate,
      min_rate,
      max_rate,
      is_local
    } = req.body;

    if (!name_ar || !name_en || !code) {
      return res.status(400).json({ message: "الحقول الأساسية مطلوبة" });
    }

    // في حال عملة محلية → السعر = 1
    const rate = is_local ? 1 : exchange_rate;

    await db.query(
      `
      INSERT INTO currencies
      (name_ar, name_en, code, symbol, exchange_rate, min_rate, max_rate, is_local)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name_ar,
        name_en,
        code.toUpperCase(),
        symbol || null,
        rate,
        min_rate || null,
        max_rate || null,
        is_local ? 1 : 0
      ]
    );

    res.json({ success: true, message: "تمت إضافة العملة" });
  } catch (err) {
    console.error("ADD CURRENCY ERROR:", err);
    res.status(500).json({ message: "خطأ في إضافة العملة" });
  }
});

// تعديل عملة
app.put("/currencies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name_ar,
      name_en,
      symbol,
      exchange_rate,
      min_rate,
      max_rate,
      is_local
    } = req.body;

    const rate = is_local ? 1 : exchange_rate;

    await db.query(
      `
      UPDATE currencies
      SET
        name_ar = ?,
        name_en = ?,
        symbol = ?,
        exchange_rate = ?,
        min_rate = ?,
        max_rate = ?,
        is_local = ?
      WHERE id = ?
      `,
      [
        name_ar,
        name_en,
        symbol || null,
        rate,
        min_rate || null,
        max_rate || null,
        is_local ? 1 : 0,
        id
      ]
    );

    res.json({ success: true, message: "تم التحديث" });
  } catch (err) {
    console.error("UPDATE CURRENCY ERROR:", err);
    res.status(500).json({ message: "خطأ في التحديث" });
  }
});

// حذف (تعطيل)
app.delete("/currencies/:id", async (req, res) => {
  try {
    await db.query(
      `UPDATE currencies SET is_active = 0 WHERE id = ?`,
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE CURRENCY ERROR:", err);
    res.status(500).json({ message: "خطأ في الحذف" });
  }
});

/* =====================================================
   📘 Account Groups (مجموعات الحسابات)
===================================================== */

// 🟢 جلب جميع مجموعات الحسابات + بحث + اسم المستخدم
app.get("/account-groups", async (req, res) => {
  try {
    const search = req.query.search || "";

    let sql = `
      SELECT 
        ag.id,
        ag.code,
        ag.name_ar,
        ag.name_en,
        ag.created_at,
        u.name AS user_name
      FROM account_groups ag
      LEFT JOIN users u ON u.id = ag.created_by
    `;
    const params = [];

    if (search.trim()) {
      sql += `
        WHERE ag.name_ar LIKE ?
           OR ag.name_en LIKE ?
           OR ag.code LIKE ?
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY ag.code ASC";

    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      groups: rows,
    });
  } catch (err) {
    console.error("❌ Get account groups error:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب مجموعات الحسابات",
    });
  }
});

// 🟢 جلب مجموعة حساب واحدة
app.get("/account-groups/:id", async (req, res) => {
  try {
    const [[row]] = await db.query(
      `
      SELECT 
        ag.*,
        u.name AS user_name
      FROM account_groups ag
      LEFT JOIN users u ON u.id = ag.created_by
      WHERE ag.id = ?
      `,
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "مجموعة الحساب غير موجودة",
      });
    }

    res.json({
      success: true,
      group: row,
    });
  } catch (err) {
    console.error("❌ Get account group error:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب مجموعة الحساب",
    });
  }
});

// ➕ إضافة مجموعة حساب (مع المستخدم)
app.post("/account-groups", async (req, res) => {
  try {
    const { name_ar, name_en, code } = req.body;

    if (!name_ar || !code) {
      return res.status(400).json({
        success: false,
        message: "الاسم والرقم مطلوبان",
      });
    }

    // ⚠️ مؤقتًا: لو ما عندك JWT Middleware
    const createdBy = req.user?.id || 1;

    await db.query(
      `
      INSERT INTO account_groups
      (code, name_ar, name_en, created_by, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [code, name_ar, name_en || null, createdBy]
    );

    res.json({
      success: true,
      message: "✅ تم إضافة مجموعة الحساب بنجاح",
    });
  } catch (err) {
    console.error("❌ Add account group error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "❌ رقم المجموعة مستخدم مسبقاً",
      });
    }

    res.status(500).json({
      success: false,
      message: "خطأ في إضافة مجموعة الحساب",
    });
  }
});

// ✏️ تعديل مجموعة حساب
app.put("/account-groups/:id", async (req, res) => {
  try {
    const { name_ar, name_en, code } = req.body;

    if (!name_ar || !code) {
      return res.status(400).json({
        success: false,
        message: "الاسم والرقم مطلوبان",
      });
    }

    await db.query(
      `
      UPDATE account_groups
      SET
        name_ar = ?,
        name_en = ?,
        code = ?
      WHERE id = ?
      `,
      [name_ar, name_en || null, code, req.params.id]
    );

    res.json({
      success: true,
      message: "✅ تم تعديل مجموعة الحساب",
    });
  } catch (err) {
    console.error("❌ Update account group error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "❌ رقم المجموعة مستخدم مسبقاً",
      });
    }

    res.status(500).json({
      success: false,
      message: "خطأ في تعديل مجموعة الحساب",
    });
  }
});

// 🗑️ حذف مجموعة حساب
app.delete("/account-groups/:id", async (req, res) => {
  try {
    await db.query(
      "DELETE FROM account_groups WHERE id = ?",
      [req.params.id]
    );

    res.json({
      success: true,
      message: "🗑️ تم حذف مجموعة الحساب",
    });
  } catch (err) {
    console.error("❌ Delete account group error:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في حذف مجموعة الحساب",
    });
  }
});

/* =====================================================
   🏦 Bank Groups (مجموعات البنوك)
===================================================== */

/* =========================
   🟢 جلب جميع مجموعات البنوك + بحث
========================= */
app.get("/bank-groups", async (req, res) => {
  try {
    const search = req.query.search || "";

    let sql = `
      SELECT 
        bg.id,
        bg.code,
        bg.name_ar,
        bg.name_en,
        bg.created_at,
        u.name AS user_name
      FROM bank_groups bg
      LEFT JOIN users u ON u.id = bg.created_by
    `;
    const params = [];

    if (search.trim()) {
      sql += `
        WHERE bg.name_ar LIKE ?
           OR bg.name_en LIKE ?
           OR bg.code LIKE ?
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY bg.code ASC";

    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      groups: rows,
    });
  } catch (err) {
    console.error("❌ Get bank groups error:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب مجموعات البنوك",
    });
  }
});

/* =========================
   ➕ إضافة مجموعة بنك
========================= */
app.post("/bank-groups", async (req, res) => {
  try {
    const { name_ar, name_en, code } = req.body;

    if (!name_ar || !code) {
      return res.status(400).json({
        success: false,
        message: "الاسم والرقم مطلوبان",
      });
    }

    // 👤 المستخدم الحالي (مؤقتًا 1 لو ما عندك JWT)
    const createdBy = req.user?.id || 1;

    await db.query(
      `
      INSERT INTO bank_groups
      (code, name_ar, name_en, created_by, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [code, name_ar, name_en || null, createdBy]
    );

    res.json({
      success: true,
      message: "✅ تم إضافة مجموعة البنك بنجاح",
    });
  } catch (err) {
    console.error("❌ Add bank group error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "❌ رقم المجموعة مستخدم مسبقًا",
      });
    }

    res.status(500).json({
      success: false,
      message: "خطأ في إضافة مجموعة البنك",
    });
  }
});

/* =========================
   ✏️ تعديل مجموعة بنك
========================= */
app.put("/bank-groups/:id", async (req, res) => {
  try {
    const { name_ar, name_en, code } = req.body;

    if (!name_ar || !code) {
      return res.status(400).json({
        success: false,
        message: "الاسم والرقم مطلوبان",
      });
    }

    await db.query(
      `
      UPDATE bank_groups
      SET
        name_ar = ?,
        name_en = ?,
        code = ?
      WHERE id = ?
      `,
      [name_ar, name_en || null, code, req.params.id]
    );

    res.json({
      success: true,
      message: "✅ تم تعديل مجموعة البنك",
    });
  } catch (err) {
    console.error("❌ Update bank group error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "❌ رقم المجموعة مستخدم مسبقًا",
      });
    }

    res.status(500).json({
      success: false,
      message: "خطأ في تعديل مجموعة البنك",
    });
  }
});

/* =========================
   🗑️ حذف مجموعة بنك
========================= */
app.delete("/bank-groups/:id", async (req, res) => {
  try {
    await db.query(
      "DELETE FROM bank_groups WHERE id = ?",
      [req.params.id]
    );

    res.json({
      success: true,
      message: "🗑️ تم حذف مجموعة البنك",
    });
  } catch (err) {
    console.error("❌ Delete bank group error:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في حذف مجموعة البنك",
    });
  }
});

/* =====================================================
   🏦 Add Bank + Auto Create Account (CORRECT & FINAL)
===================================================== */
app.post("/banks", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      name_ar,
      name_en,
      code,
      bank_group_id,
      parent_account_id,
      created_by
    } = req.body;

    if (!name_ar || !code || !bank_group_id || !parent_account_id) {
      return res.status(400).json({
        success: false,
        message: "الاسم، الرقم، مجموعة البنوك، والحساب الأب مطلوبة"
      });
    }

    await conn.beginTransaction();

    /* =========================
       1️⃣ جلب الحساب المختار (أي مستوى)
    ========================= */
    const [[selectedParent]] = await conn.query(
      `
      SELECT id, code, parent_id
      FROM accounts
      WHERE id = ? AND is_active = 1
      `,
      [parent_account_id]
    );

    if (!selectedParent) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "الحساب المختار غير موجود"
      });
    }

    /* =========================
       2️⃣ الوصول إلى Root الحقيقي
    ========================= */
    let currentId = selectedParent.id;
    let root = null;

    while (currentId) {
      const [[row]] = await conn.query(
        `
        SELECT id, parent_id, account_type, financial_statement
        FROM accounts
        WHERE id = ?
        `,
        [currentId]
      );

      if (!row) break;

      root = row;
      currentId = row.parent_id;
    }

    if (!root) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "تعذر تحديد الحساب الجذري"
      });
    }

    /* =========================
       3️⃣ توليد كود الحساب الجديد
    ========================= */
    const [[maxRow]] = await conn.query(
      `
      SELECT MAX(CAST(SUBSTRING_INDEX(code, '-', -1) AS UNSIGNED)) AS max_no
      FROM accounts
      WHERE parent_id = ?
      `,
      [selectedParent.id]
    );

    const nextNumber = (maxRow?.max_no || 0) + 1;
    const accountCode = `${selectedParent.code}-${nextNumber}`;

    /* =========================
       4️⃣ إنشاء الحساب المحاسبي
    ========================= */
    const [accountResult] = await conn.query(
      `
      INSERT INTO accounts (
        code,
        name_ar,
        name_en,
        parent_id,
        account_level,
        account_type,
        financial_statement,
        created_by,
        is_active,
        created_at
      )
      VALUES (?, ?, ?, ?, 'فرعي', ?, ?, ?, 1, NOW())
      `,
      [
        accountCode,
        name_ar,
        name_en || null,
        selectedParent.id,
        root.account_type,
        root.financial_statement,
        created_by || null
      ]
    );

    const accountId = accountResult.insertId;

    /* =========================
       5️⃣ إنشاء البنك
    ========================= */
    await conn.query(
      `
      INSERT INTO banks (
        code,
        name_ar,
        name_en,
        bank_group_id,
        account_id,
        created_by,
        is_active,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
      `,
      [
        code,
        name_ar,
        name_en || null,
        bank_group_id,
        accountId,
        created_by || null
      ]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "✅ تم إضافة البنك وربطه بالحساب المحاسبي بنجاح",
      account: {
        id: accountId,
        code: accountCode
      }
    });

  } catch (err) {
    await conn.rollback();
    console.error("❌ ADD BANK ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في إضافة البنك"
    });
  } finally {
    conn.release();
  }
});

/* =========================
   🏦 GET Banks (دليل البنوك)
========================= */
app.get("/banks", async (req, res) => {
  try {
    const search = req.query.search || "";

    let sql = `
      SELECT
        b.id,
        b.name_ar,
        b.name_en,
        b.code,
        bg.name_ar AS bank_group_name,
        a.name_ar AS account_name,
        u.name AS user_name
      FROM banks b
      LEFT JOIN bank_groups bg ON bg.id = b.bank_group_id
      LEFT JOIN accounts a ON a.id = b.account_id
      LEFT JOIN users u ON u.id = b.created_by
      WHERE b.is_active = 1
    `;

    const params = [];

    if (search.trim()) {
      sql += `
        AND (
          b.name_ar LIKE ?
          OR b.name_en LIKE ?
          OR b.code LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY b.id DESC";

    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      banks: rows
    });
  } catch (err) {
    console.error("GET BANKS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب دليل البنوك"
    });
  }
});

 /* =====================================================
   🏦 UPDATE BANK
   تعديل (الاسم + الاسم الأجنبي + المجموعة فقط)
===================================================== */
app.put("/banks/:id", async (req, res) => {
  try {
    const bankId = req.params.id;
    const { name_ar, name_en, bank_group_id } = req.body;

    if (!name_ar || !bank_group_id) {
      return res.status(400).json({
        success: false,
        message: "الاسم ومجموعة البنوك مطلوبة"
      });
    }

    const [result] = await db.query(
      `
      UPDATE banks
      SET
        name_ar = ?,
        name_en = ?,
        bank_group_id = ?
      WHERE id = ?
        AND is_active = 1
      `,
      [
        name_ar,
        name_en || null,
        bank_group_id,
        bankId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "البنك غير موجود"
      });
    }

    res.json({
      success: true,
      message: "تم تعديل بيانات البنك بنجاح"
    });

  } catch (err) {
    console.error("UPDATE BANK ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في تعديل البنك"
    });
  }
});
/* =====================================================
   💼 Cash Box Groups API
===================================================== */

/* =====================================================
   📄 GET all cash box groups
===================================================== */
app.get("/cashbox-groups", async (req, res) => {
  try {
    const search = req.query.search || "";

    let sql = `
      SELECT 
        cg.id,
        cg.code,
        cg.name_ar,
        cg.name_en,
        u.name AS user_name
      FROM cash_box_groups cg
      LEFT JOIN users u ON u.id = cg.created_by
      WHERE cg.is_active = 1
    `;

    const params = [];

    if (search) {
      sql += `
        AND (
          cg.name_ar LIKE ?
          OR cg.name_en LIKE ?
          OR cg.code LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY cg.id DESC";

    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      groups: rows,
    });
  } catch (err) {
    console.error("GET CASHBOX GROUPS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب مجموعات الصناديق",
    });
  }
});

/* =====================================================
   ➕ ADD cash box group
===================================================== */
app.post("/cashbox-groups", async (req, res) => {
  try {
    const { name_ar, name_en, code, created_by } = req.body;

    if (!name_ar || !code) {
      return res.status(400).json({
        success: false,
        message: "الاسم والرقم مطلوبان",
      });
    }

    await db.query(
      `
      INSERT INTO cash_box_groups
        (code, name_ar, name_en, created_by, is_active)
      VALUES (?, ?, ?, ?, 1)
      `,
      [code, name_ar, name_en || null, created_by || null]
    );

    res.json({
      success: true,
      message: "✅ تم إضافة مجموعة الصناديق بنجاح",
    });
  } catch (err) {
    console.error("ADD CASHBOX GROUP ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في إضافة مجموعة الصناديق",
    });
  }
});

/* =====================================================
   ✏️ UPDATE cash box group
   - ممنوع تعديل الرقم (code)
===================================================== */
app.put("/cashbox-groups/:id", async (req, res) => {
  try {
    const { name_ar, name_en } = req.body;
    const { id } = req.params;

    if (!name_ar) {
      return res.status(400).json({
        success: false,
        message: "الاسم العربي مطلوب",
      });
    }

    await db.query(
      `
      UPDATE cash_box_groups
      SET
        name_ar = ?,
        name_en = ?
      WHERE id = ? AND is_active = 1
      `,
      [name_ar, name_en || null, id]
    );

    res.json({
      success: true,
      message: "✅ تم تعديل مجموعة الصناديق بنجاح",
    });
  } catch (err) {
    console.error("UPDATE CASHBOX GROUP ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في تعديل مجموعة الصناديق",
    });
  }
});

/* =====================================================
   🗑️ DELETE cash box group (Soft Delete)
   - ممنوع الحذف إذا كانت مرتبطة بصناديق
===================================================== */
app.delete("/cashbox-groups/:id", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    /* =========================
       1️⃣ تحقق هل توجد صناديق تابعة
    ========================= */
    const [[used]] = await conn.query(
      `
      SELECT COUNT(*) AS cnt
      FROM cash_boxes
      WHERE cash_box_group_id = ? AND is_active = 1
      `,
      [id]
    );

    if (used.cnt > 0) {
      return res.status(400).json({
        success: false,
        message: "❌ لا يمكن حذف المجموعة لوجود صناديق مرتبطة بها",
      });
    }

    /* =========================
       2️⃣ Soft Delete
    ========================= */
    await conn.query(
      `
      UPDATE cash_box_groups
      SET is_active = 0
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      message: "✅ تم حذف مجموعة الصناديق بنجاح",
    });
  } catch (err) {
    console.error("DELETE CASHBOX GROUP ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ أثناء حذف مجموعة الصناديق",
    });
  } finally {
    conn.release();
  }
});


/* =====================================================
   💰 الصناديق النقدية (Cash Boxes)
   - إنشاء صندوق + إنشاء حساب محاسبي تلقائي
===================================================== */

/* =====================================================
   📄 الحسابات المسموح بها للصناديق النقدية
   (نفس فكرة main-for-banks)
===================================================== */
app.get("/accounts/main-for-cashboxes", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        code,
        name_ar,
        parent_id
      FROM accounts
      WHERE
        is_active = 1
        AND account_level = 'رئيسي'

      ORDER BY code ASC
    `);

    res.json({
      success: true,
      accounts: rows
    });
  } catch (err) {
    console.error("❌ GET CASHBOX ACCOUNTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب حسابات الصناديق"
    });
  }
});

/* =====================================================
   ➕ إضافة صندوق نقدي + إنشاء حساب محاسبي
===================================================== */
app.post("/cash-boxes", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      name_ar,
      name_en,
      code,
      cash_box_group_id,
      parent_account_id,
      created_by
    } = req.body;

    if (!name_ar || !code || !cash_box_group_id || !parent_account_id) {
      return res.status(400).json({
        success: false,
        message: "الاسم، الرقم، مجموعة الصناديق، والحساب الأب مطلوبة"
      });
    }

    await conn.beginTransaction();

    /* 1️⃣ جلب الحساب الأب */
    const [[parent]] = await conn.query(
      `
      SELECT id, code, account_type, financial_statement
      FROM accounts
      WHERE id = ? AND is_active = 1
      `,
      [parent_account_id]
    );

    if (!parent) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "الحساب الأب غير موجود"
      });
    }

    /* 2️⃣ توليد كود الحساب الجديد */
    const [[maxRow]] = await conn.query(
      `
      SELECT MAX(
        CAST(SUBSTRING_INDEX(code, '-', -1) AS UNSIGNED)
      ) AS max_no
      FROM accounts
      WHERE parent_id = ?
      `,
      [parent.id]
    );

    const nextNumber = (maxRow?.max_no || 0) + 1;
    const accountCode = `${parent.code}-${nextNumber}`;

    /* 3️⃣ إنشاء الحساب المحاسبي */
    const [accountResult] = await conn.query(
      `
      INSERT INTO accounts (
        code,
        name_ar,
        name_en,
        parent_id,
        account_level,
        account_type,
        financial_statement,
        created_by,
        is_active,
        created_at
      )
      VALUES (?, ?, ?, ?, 'فرعي', ?, ?, ?, 1, NOW())
      `,
      [
        accountCode,
        name_ar,
        name_en || null,
        parent.id,
        parent.account_type,
        parent.financial_statement,
        created_by || null
      ]
    );

    const accountId = accountResult.insertId;

    /* 4️⃣ إنشاء الصندوق النقدي */
    await conn.query(
      `
      INSERT INTO cash_boxes (
        code,
        name_ar,
        name_en,
        cash_box_group_id,
        account_id,
        created_by,
        is_active,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
      `,
      [
        code,
        name_ar,
        name_en || null,
        cash_box_group_id,
        accountId,
        created_by || null
      ]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "✅ تم إضافة الصندوق وربطه بالحساب المحاسبي بنجاح"
    });

  } catch (err) {
    await conn.rollback();
    console.error("❌ ADD CASH BOX ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في إضافة الصندوق النقدي"
    });
  } finally {
    conn.release();
  }
});
/* =====================================================
   📄 جلب دليل الصناديق النقدية
   - عرض الحساب المحاسبي (الأب)
===================================================== */
app.get("/cash-boxes", async (req, res) => {
  try {
    const search = req.query.search || "";

    let sql = `
      SELECT
        c.id,
        c.name_ar,
        c.name_en,
        c.code,
        cg.name_ar AS cashbox_group_name,

        -- 🔑 الحساب المحاسبي الأب
        parent_acc.name_ar AS account_name,

        u.name AS user_name
      FROM cash_boxes c

      LEFT JOIN cash_box_groups cg 
        ON cg.id = c.cash_box_group_id

      -- الحساب الفرعي المرتبط بالصندوق
      LEFT JOIN accounts acc 
        ON acc.id = c.account_id

      -- الحساب الرئيسي (الأب)
      LEFT JOIN accounts parent_acc 
        ON parent_acc.id = acc.parent_id

      LEFT JOIN users u 
        ON u.id = c.created_by

      WHERE c.is_active = 1
    `;

    const params = [];

    if (search.trim()) {
      sql += `
        AND (
          c.name_ar LIKE ?
          OR c.name_en LIKE ?
          OR c.code LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY c.id DESC";

    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      cashBoxes: rows
    });

  } catch (err) {
    console.error("❌ GET CASH BOXES ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب دليل الصناديق النقدية"
    });
  }
});

/* =====================================================
   ✏️ تعديل صندوق نقدي
===================================================== */
app.put("/cash-boxes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name_ar, name_en, cash_box_group_id } = req.body;

    if (!name_ar || !cash_box_group_id) {
      return res.status(400).json({
        success: false,
        message: "الاسم ومجموعة الصناديق مطلوبة"
      });
    }

    await db.query(
      `
      UPDATE cash_boxes
      SET
        name_ar = ?,
        name_en = ?,
        cash_box_group_id = ?
      WHERE id = ?
      `,
      [name_ar, name_en || null, cash_box_group_id, id]
    );

    res.json({
      success: true,
      message: "تم التعديل بنجاح"
    });

  } catch (err) {
    console.error("UPDATE CASH BOX ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في تعديل الصندوق"
    });
  }
});


/* =====================================================
   🗑️ حذف صندوق نقدي
   - ممنوع الحذف إذا عليه عمليات
===================================================== */
app.delete("/cash-boxes/:id", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    /* 1️⃣ جلب الحساب المحاسبي */
    const [[box]] = await conn.query(
      `
      SELECT account_id
      FROM cash_boxes
      WHERE id = ? AND is_active = 1
      `,
      [id]
    );

    if (!box) {
      return res.status(404).json({
        success: false,
        message: "الصندوق غير موجود"
      });
    }

    /* 2️⃣ التحقق من وجود قيود */
    const [[used]] = await conn.query(
      `
      SELECT COUNT(*) AS cnt
      FROM journal_entries
      WHERE account_id = ?
      `,
      [box.account_id]
    );

    if (used.cnt > 0) {
      return res.status(400).json({
        success: false,
        message: "❌ لا يمكن حذف الصندوق لوجود عمليات محاسبية عليه"
      });
    }

    /* 3️⃣ حذف منطقي */
    await conn.query(
      `
      UPDATE cash_boxes
      SET is_active = 0
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      message: "✅ تم حذف الصندوق بنجاح"
    });

  } catch (err) {
    console.error("DELETE CASH BOX ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في حذف الصندوق"
    });
  } finally {
    conn.release();
  }
});

/* ===============================
   Receipt Types API
================================ */

// GET
app.get("/receipt-types", async (req, res) => {
  try {
    const search = req.query.search || "";

    let sql = `
      SELECT id, code, name_ar, name_en, sort_order
      FROM receipt_types
      WHERE is_active = 1
    `;
    const params = [];

    if (search) {
      sql += `
        AND (
          name_ar LIKE ?
          OR name_en LIKE ?
          OR code LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY sort_order ASC";

    const [rows] = await db.query(sql, params);
    res.json({ success: true, list: rows });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ADD
app.post("/receipt-types", async (req, res) => {
  const { code, name_ar, name_en, sort_order } = req.body;

  if (!code || !name_ar || sort_order === undefined)
    return res.status(400).json({ success: false });

  await db.query(
    `INSERT INTO receipt_types (code, name_ar, name_en, sort_order)
     VALUES (?, ?, ?, ?)`,
    [code, name_ar, name_en || null, sort_order]
  );

  res.json({ success: true });
});

// UPDATE (❌ code ممنوع)
app.put("/receipt-types/:id", async (req, res) => {
  const { name_ar, name_en, sort_order } = req.body;

  await db.query(
    `
    UPDATE receipt_types
    SET name_ar = ?, name_en = ?, sort_order = ?
    WHERE id = ? AND is_active = 1
    `,
    [name_ar, name_en || null, sort_order, req.params.id]
  );

  res.json({ success: true });
});

// DELETE (Soft)
app.delete("/receipt-types/:id", async (req, res) => {
  const [[used]] = await db.query(
    `SELECT COUNT(*) cnt FROM receipts WHERE receipt_type_id = ?`,
    [req.params.id]
  );

  if (used.cnt > 0)
    return res
      .status(400)
      .json({ success: false, message: "❌ النوع مستخدم" });

  await db.query(
    `UPDATE receipt_types SET is_active = 0 WHERE id = ?`,
    [req.params.id]
  );

  res.json({ success: true });
});


/* =====================================================
   💸 Payment Types API (أنواع سندات الصرف)
===================================================== */

/* =====================================================
   📄 GET payment types
===================================================== */
app.get("/payment-types", async (req, res) => {
  try {
    const search = req.query.search || "";

    let sql = `
      SELECT
        pt.id,
        pt.code,
        pt.name_ar,
        pt.name_en,
        pt.sort_order
      FROM payment_types pt
      WHERE pt.is_active = 1
    `;

    const params = [];

    if (search) {
      sql += `
        AND (
          pt.name_ar LIKE ?
          OR pt.name_en LIKE ?
          OR pt.code LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY pt.sort_order ASC, pt.id DESC";

    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      list: rows,
    });
  } catch (err) {
    console.error("GET PAYMENT TYPES ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب أنواع سندات الصرف",
    });
  }
});

/* =====================================================
   ➕ ADD payment type
===================================================== */
app.post("/payment-types", async (req, res) => {
  try {
    const { code, name_ar, name_en, sort_order } = req.body;

    if (!code || !name_ar || sort_order === undefined) {
      return res.status(400).json({
        success: false,
        message: "الرقم والاسم والترتيب مطلوبة",
      });
    }

    await db.query(
      `
      INSERT INTO payment_types
        (code, name_ar, name_en, sort_order, is_active)
      VALUES (?, ?, ?, ?, 1)
      `,
      [code, name_ar, name_en || null, sort_order]
    );

    res.json({
      success: true,
      message: "✅ تم إضافة نوع سند الصرف بنجاح",
    });
  } catch (err) {
    console.error("ADD PAYMENT TYPE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في إضافة نوع سند الصرف",
    });
  }
});

/* =====================================================
   ✏️ UPDATE payment type
   ❌ ممنوع تعديل code
===================================================== */
app.put("/payment-types/:id", async (req, res) => {
  try {
    const { name_ar, name_en, sort_order } = req.body;
    const { id } = req.params;

    if (!name_ar || sort_order === undefined) {
      return res.status(400).json({
        success: false,
        message: "الاسم والترتيب مطلوبان",
      });
    }

    await db.query(
      `
      UPDATE payment_types
      SET
        name_ar = ?,
        name_en = ?,
        sort_order = ?
      WHERE id = ? AND is_active = 1
      `,
      [name_ar, name_en || null, sort_order, id]
    );

    res.json({
      success: true,
      message: "✅ تم تعديل نوع سند الصرف بنجاح",
    });
  } catch (err) {
    console.error("UPDATE PAYMENT TYPE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في تعديل نوع سند الصرف",
    });
  }
});

/* =====================================================
   🗑️ DELETE payment type (Soft Delete)
   ❌ ممنوع الحذف إذا مستخدم في سندات صرف
===================================================== */
app.delete("/payment-types/:id", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    /* =========================
       تحقق هل مستخدم
    ========================= */
    const [[used]] = await conn.query(
      `
      SELECT COUNT(*) AS cnt
      FROM payments
      WHERE payment_type_id = ?
      `,
      [id]
    );

    if (used.cnt > 0) {
      return res.status(400).json({
        success: false,
        message: "❌ لا يمكن حذف النوع لأنه مستخدم في سندات صرف",
      });
    }

    /* =========================
       Soft Delete
    ========================= */
    await conn.query(
      `
      UPDATE payment_types
      SET is_active = 0
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      message: "✅ تم حذف نوع سند الصرف بنجاح",
    });
  } catch (err) {
    console.error("DELETE PAYMENT TYPE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ أثناء حذف نوع سند الصرف",
    });
  } finally {
    conn.release();
  }
});


/* ===============================
   Journal Types API
================================ */

app.get("/journal-types", async (req, res) => {
  const search = req.query.search || "";

  let sql = `
    SELECT id, code, name_ar, name_en, sort_order
    FROM journal_types
    WHERE is_active = 1
  `;
  const params = [];

  if (search) {
    sql += `
      AND (
        name_ar LIKE ?
        OR name_en LIKE ?
        OR code LIKE ?
      )
    `;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += " ORDER BY sort_order ASC";

  const [rows] = await db.query(sql, params);
  res.json({ success: true, list: rows });
});

// ADD
app.post("/journal-types", async (req, res) => {
  const { code, name_ar, name_en, sort_order } = req.body;

  await db.query(
    `
    INSERT INTO journal_types
    (code, name_ar, name_en, sort_order)
    VALUES (?, ?, ?, ?)
    `,
    [code, name_ar, name_en || null, sort_order]
  );

  res.json({ success: true });
});

// UPDATE
app.put("/journal-types/:id", async (req, res) => {
  const { name_ar, name_en, sort_order } = req.body;

  await db.query(
    `
    UPDATE journal_types
    SET name_ar = ?, name_en = ?, sort_order = ?
    WHERE id = ?
    `,
    [name_ar, name_en || null, sort_order, req.params.id]
  );

  res.json({ success: true });
});

// DELETE (Soft + حماية)
app.delete("/journal-types/:id", async (req, res) => {
  const [[used]] = await db.query(
    `SELECT COUNT(*) cnt FROM journal_entries WHERE journal_type_id = ?`,
    [req.params.id]
  );

  if (used.cnt > 0)
    return res.status(400).json({
      success: false,
      message: "❌ النوع مستخدم في قيود"
    });

  await db.query(
    `UPDATE journal_types SET is_active = 0 WHERE id = ?`,
    [req.params.id]
  );

  res.json({ success: true });
});
/* =====================================================
   📊 ACCOUNT CEILINGS API (تسقيف الحسابات)
===================================================== */

/* =====================================================
   📒 GET Accounts
===================================================== */
app.get("/accounts", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, code, name_ar
      FROM accounts
      WHERE is_active = 1
      ORDER BY code
    `);

    res.json({
      success: true,
      list: rows
    });
  } catch (err) {
    console.error("GET ACCOUNTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الحسابات"
    });
  }
});



/* =====================================================
   📋 GET Account Ceilings
===================================================== */
app.get("/account-ceilings", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ac.id,
        ac.scope,
        ac.ceiling_amount,
        ac.account_nature AS account_type,
        ac.exceed_action  AS limit_action,
        a.name_ar  AS account_name,
        ag.name_ar AS group_name,
        c.name_ar  AS currency_name
      FROM account_ceilings ac
      LEFT JOIN accounts a ON a.id = ac.account_id
      LEFT JOIN account_groups ag ON ag.id = ac.account_group_id
      LEFT JOIN currencies c ON c.id = ac.currency_id
      WHERE ac.is_active = 1
      ORDER BY ac.id DESC
    `);

    res.json({ success: true, list: rows });
  } catch (err) {
    console.error("GET ACCOUNT CEILINGS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب التسقيف"
    });
  }
});

/* =====================================================
   ➕ ADD Account Ceiling
===================================================== */
app.post("/account-ceilings", async (req, res) => {
  try {
    const {
      scope,
      account_id,
      account_group_id,
      currency_id,
      ceiling_amount,
      account_nature,
      exceed_action,
      created_by
    } = req.body;

    if (!scope || !currency_id || !ceiling_amount || !account_nature || !exceed_action) {
      return res.status(400).json({
        success: false,
        message: "البيانات الأساسية مطلوبة"
      });
    }

    if (scope === "account" && !account_id) {
      return res.status(400).json({
        success: false,
        message: "يجب اختيار حساب"
      });
    }

    if (scope === "group" && !account_group_id) {
      return res.status(400).json({
        success: false,
        message: "يجب اختيار مجموعة حسابات"
      });
    }

    await db.query(
      `
      INSERT INTO account_ceilings
        (scope, account_id, account_group_id, currency_id,
         ceiling_amount, account_nature, exceed_action, created_by, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        scope,
        account_id || null,
        account_group_id || null,
        currency_id,
        ceiling_amount,
        account_nature,
        exceed_action,
        created_by || null
      ]
    );

    res.json({ success: true, message: "✅ تم إضافة التسقيف بنجاح" });
  } catch (err) {
    console.error("ADD ACCOUNT CEILING ERROR:", err);

    // ✅ منع التكرار (رسالة واضحة)
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "❌ هذا التسقيف موجود مسبقًا لنفس الحساب/المجموعة والعملة"
      });
    }

    res.status(500).json({
      success: false,
      message: "خطأ في إضافة التسقيف"
    });
  }
});

/* =====================================================
   ✏️ UPDATE Account Ceiling
===================================================== */
app.put("/account-ceilings/:id", async (req, res) => {
  try {
    const {
      currency_id,
      ceiling_amount,
      account_nature,
      exceed_action
    } = req.body;

    await db.query(
      `
      UPDATE account_ceilings
      SET
        currency_id = ?,
        ceiling_amount = ?,
        account_nature = ?,
        exceed_action = ?
      WHERE id = ? AND is_active = 1
      `,
      [
        currency_id,
        ceiling_amount,
        account_nature,
        exceed_action,
        req.params.id
      ]
    );

    res.json({ success: true, message: "✅ تم تعديل التسقيف" });
  } catch (err) {
    console.error("UPDATE ACCOUNT CEILING ERROR:", err);

    // ✅ معالجة التكرار أثناء التعديل
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "❌ يوجد تسقيف آخر بنفس الحساب/المجموعة والعملة"
      });
    }

    res.status(500).json({
      success: false,
      message: "خطأ في تعديل التسقيف"
    });
  }
});

/* =====================================================
   🗑️ DELETE Account Ceiling (Soft)
===================================================== */
/* =====================================================
   🗑️ DELETE Account Ceiling (HARD DELETE)
===================================================== */
app.delete("/account-ceilings/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      `DELETE FROM account_ceilings WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "السقف غير موجود"
      });
    }

    res.json({
      success: true,
      message: "✅ تم إلغاء التسقيف نهائيًا"
    });
  } catch (err) {
    console.error("DELETE ACCOUNT CEILING ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في حذف التسقيف"
    });
  }
});

/* =====================================================
   💰 Receipt Vouchers API (سندات القبض)
===================================================== */

/* =========================
   📦 Lookups لسند القبض
   (عملات + حسابات + صناديق + بنوك + أنواع قيود)
========================= */
app.get("/receipt-vouchers/lookups", async (req, res) => {
  try {
    const [currencies] = await db.query(`
      SELECT id, name_ar, code, symbol
      FROM currencies
      WHERE is_active = 1
      ORDER BY id
    `);

    const [accounts] = await db.query(`
      SELECT id, name_ar
      FROM accounts
      WHERE is_active = 1
      ORDER BY code
    `);

    const [cashBoxes] = await db.query(`
      SELECT id, name_ar
      FROM cash_boxes
      WHERE is_active = 1
      ORDER BY id
    `);

    const [banks] = await db.query(`
      SELECT id, name_ar
      FROM banks
      WHERE is_active = 1
      ORDER BY id
    `);

    const [journalTypes] = await db.query(`
      SELECT id, name_ar
      FROM journal_types
      WHERE is_active = 1
      ORDER BY sort_order
    `);

    res.json({
      success: true,
      currencies,
      accounts,
      cashBoxes,
      banks,
      journalTypes
    });
  } catch (err) {
    console.error("RECEIPT LOOKUPS ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* =========================
   📄 GET receipt vouchers
========================= */
app.get("/receipt-vouchers", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        rv.*,
        a.name_ar AS account_name,
        c.name_ar AS currency_name
      FROM receipt_vouchers rv
      LEFT JOIN accounts a ON a.id = rv.account_id
      LEFT JOIN currencies c ON c.id = rv.currency_id
      ORDER BY rv.id DESC
    `);

    res.json({ success: true, list: rows });
  } catch (err) {
    console.error("GET RECEIPT VOUCHERS ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* =========================
   ➕ ADD receipt voucher
========================= */
app.post("/receipt-vouchers", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      voucher_no,
      voucher_date,
      receipt_type,          // cash | bank
      cash_box_account_id,
      bank_account_id,
      transfer_no,
      currency_id,
      amount,
      account_id,
      analytic_account_id,
      cost_center_id,
      journal_type_id,
      notes,
      handling,
      created_by,
      branch_id
    } = req.body;

    if (
      !voucher_no ||
      !voucher_date ||
      !receipt_type ||
      !currency_id ||
      !amount ||
      !account_id ||
      !journal_type_id
    ) {
      return res.status(400).json({
        success: false,
        message: "❌ البيانات الأساسية لسند القبض مطلوبة"
      });
    }

    if (receipt_type === "cash" && !cash_box_account_id) {
      return res.status(400).json({
        success: false,
        message: "❌ يجب اختيار صندوق نقدي"
      });
    }

    if (receipt_type === "bank" && !bank_account_id) {
      return res.status(400).json({
        success: false,
        message: "❌ يجب اختيار حساب بنك"
      });
    }

    await conn.beginTransaction();

    /* =========================
       1️⃣ إدخال سند القبض
    ========================= */
   const [voucherResult] = await conn.query(
  `
  INSERT INTO receipt_vouchers (
    voucher_no,
    voucher_date,
    receipt_type,
    cash_box_account_id,
    bank_account_id,
    transfer_no,
    currency_id,
    amount,
    account_id,
    analytic_account_id,
    cost_center_id,
    journal_type_id,
    notes,
    handling,
    created_by,
    branch_id,
    created_at
  )
  VALUES (
    ?,
    STR_TO_DATE(?, '%Y-%m-%d'),
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
  )
  `,
  [
    voucher_no,
    voucher_date, // 👈 يبقى كما هو
    receipt_type,
    receipt_type === "cash" ? cash_box_account_id : null,
    receipt_type === "bank" ? bank_account_id : null,
    transfer_no || null,
    currency_id,
    amount,
    account_id,
    analytic_account_id || null,
    cost_center_id || null,
    journal_type_id,
    notes || null,
    handling || 0,
    created_by || null,
    branch_id || null
  ]
);


    const receiptVoucherId = voucherResult.insertId;

    /* =========================
       2️⃣ إنشاء القيد المحاسبي
    ========================= */

    const debitAccount =
      receipt_type === "cash"
        ? cash_box_account_id
        : bank_account_id;

    // مدين
    await conn.query(
      `
      INSERT INTO journal_entries
      (journal_type_id, reference_id, reference_type, account_id, debit, credit, currency_id, cost_center_id, notes)
      VALUES (?, ?, 'receipt_voucher', ?, ?, 0, ?, ?, ?)
      `,
      [
        journal_type_id,
        receiptVoucherId,
        debitAccount,
        amount,
        currency_id,
        cost_center_id || null,
        notes || "قيد قبض"
      ]
    );

    // دائن
    await conn.query(
      `
      INSERT INTO journal_entries
      (journal_type_id, reference_id, reference_type, account_id, debit, credit, currency_id, cost_center_id, notes)
      VALUES (?, ?, 'receipt_voucher', ?, 0, ?, ?, ?, ?)
      `,
      [
        journal_type_id,
        receiptVoucherId,
        account_id,
        amount,
        currency_id,
        cost_center_id || null,
        notes || "قيد قبض"
      ]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "✅ تم حفظ سند القبض وإنشاء القيد المحاسبي",
      id: receiptVoucherId
    });
  } catch (err) {
    await conn.rollback();
    console.error("ADD RECEIPT VOUCHER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في حفظ سند القبض"
    });
  } finally {
    conn.release();
  }
});
/* =========================
   ✏️ UPDATE receipt voucher
========================= */
app.put("/receipt-vouchers/:id", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    const {
      voucher_date,
      receipt_type,          // cash | bank
      cash_box_account_id,
      bank_account_id,
      transfer_no,
      currency_id,
      amount,
      account_id,
      analytic_account_id,
      cost_center_id,
      journal_type_id,
      notes,
      handling
    } = req.body;

    if (
      !voucher_date ||
      !receipt_type ||
      !currency_id ||
      !amount ||
      !account_id
    ) {
      return res.status(400).json({
        success: false,
        message: "❌ البيانات الأساسية لتعديل سند القبض مطلوبة"
      });
    }

    if (receipt_type === "cash" && !cash_box_account_id) {
      return res.status(400).json({
        success: false,
        message: "❌ يجب اختيار صندوق نقدي"
      });
    }

    if (receipt_type === "bank" && !bank_account_id) {
      return res.status(400).json({
        success: false,
        message: "❌ يجب اختيار حساب بنك"
      });
    }

    await conn.beginTransaction();

    /* =========================
       1️⃣ تحديث سند القبض
    ========================= */
    const [result] = await conn.query(
      `
      UPDATE receipt_vouchers
      SET
        voucher_date = ?,
        receipt_type = ?,
        cash_box_account_id = ?,
        bank_account_id = ?,
        transfer_no = ?,
        currency_id = ?,
        amount = ?,
        account_id = ?,
        analytic_account_id = ?,
        cost_center_id = ?,
        notes = ?,
        handling = ?
      WHERE id = ?
      `,
      [
        voucher_date,
        receipt_type,
        receipt_type === "cash" ? cash_box_account_id : null,
        receipt_type === "bank" ? bank_account_id : null,
        transfer_no || null,
        currency_id,
        amount,
        account_id,
        analytic_account_id || null,
        cost_center_id || null,
        notes || null,
        handling || 0,
        id
      ]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "❌ سند القبض غير موجود"
      });
    }

    /* =========================
       2️⃣ حذف القيود القديمة
    ========================= */
    await conn.query(
      `
      DELETE FROM journal_entries
      WHERE reference_id = ?
        AND reference_type = 'receipt_voucher'
      `,
      [id]
    );

    /* =========================
       3️⃣ إعادة إنشاء القيود
    ========================= */
    const debitAccount =
      receipt_type === "cash"
        ? cash_box_account_id
        : bank_account_id;

    // مدين
    await conn.query(
      `
      INSERT INTO journal_entries
      (journal_type_id, reference_id, reference_type, account_id, debit, credit, currency_id, cost_center_id, notes)
      VALUES (?, ?, 'receipt_voucher', ?, ?, 0, ?, ?, ?)
      `,
      [
        journal_type_id || 1,
        id,
        debitAccount,
        amount,
        currency_id,
        cost_center_id || null,
        notes || "قيد قبض"
      ]
    );

    // دائن
    await conn.query(
      `
      INSERT INTO journal_entries
      (journal_type_id, reference_id, reference_type, account_id, debit, credit, currency_id, cost_center_id, notes)
      VALUES (?, ?, 'receipt_voucher', ?, 0, ?, ?, ?, ?)
      `,
      [
        journal_type_id || 1,
        id,
        account_id,
        amount,
        currency_id,
        cost_center_id || null,
        notes || "قيد قبض"
      ]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "✅ تم تعديل سند القبض بنجاح"
    });
  } catch (err) {
    await conn.rollback();
    console.error("UPDATE RECEIPT VOUCHER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في تعديل سند القبض"
    });
  } finally {
    conn.release();
  }
});

/* =========================
   🗑️ DELETE receipt voucher
   (مع حذف القيود)
========================= */
app.delete("/receipt-vouchers/:id", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    await conn.beginTransaction();

    await conn.query(
      `DELETE FROM journal_entries
       WHERE reference_id = ? AND reference_type = 'receipt_voucher'`,
      [id]
    );

    const [result] = await conn.query(
      `DELETE FROM receipt_vouchers WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "سند القبض غير موجود"
      });
    }

    await conn.commit();

    res.json({
      success: true,
      message: "🗑️ تم حذف سند القبض والقيود المرتبطة"
    });
  } catch (err) {
    await conn.rollback();
    console.error("DELETE RECEIPT VOUCHER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في حذف سند القبض"
    });
  } finally {
    conn.release();
  }
});

/* =========================
   📄 GET payment vouchers
========================= */
app.get("/payment-vouchers", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        pv.*,
        a.name_ar AS account_name,
        c.name_ar AS currency_name
      FROM payment_vouchers pv
      LEFT JOIN accounts a ON a.id = pv.account_id
      LEFT JOIN currencies c ON c.id = pv.currency_id
      ORDER BY pv.id DESC
    `);

    res.json({ success: true, list: rows });
  } catch (err) {
    console.error("GET PAYMENT VOUCHERS ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* =========================
   ➕ ADD payment voucher
========================= */
app.post("/payment-vouchers", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      voucher_no,
      voucher_date,
      payment_type,           // cash | bank
      cash_box_account_id,
      bank_account_id,
      transfer_no,
      currency_id,
      amount,
      account_id,
      analytic_account_id,
      cost_center_id,
      journal_type_id,
      notes,
      handling,
      created_by,
      branch_id
    } = req.body;

    if (
      !voucher_no ||
      !voucher_date ||
      !payment_type ||
      !currency_id ||
      !amount ||
      !account_id ||
      !journal_type_id
    ) {
      return res.status(400).json({
        success: false,
        message: "❌ البيانات الأساسية لسند الصرف مطلوبة"
      });
    }

    if (payment_type === "cash" && !cash_box_account_id) {
      return res.status(400).json({
        success: false,
        message: "❌ يجب اختيار صندوق نقدي"
      });
    }

    if (payment_type === "bank" && !bank_account_id) {
      return res.status(400).json({
        success: false,
        message: "❌ يجب اختيار حساب بنك"
      });
    }

    await conn.beginTransaction();

    /* =========================
       1️⃣ إدخال سند الصرف
    ========================= */
    const [voucherResult] = await conn.query(
      `
      INSERT INTO payment_vouchers (
        voucher_no,
        voucher_date,
        payment_type,
        cash_box_account_id,
        bank_account_id,
        transfer_no,
        currency_id,
        amount,
        account_id,
        analytic_account_id,
        cost_center_id,
        journal_type_id,
        notes,
        handling,
        created_by,
        branch_id,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        voucher_no,
        voucher_date,
        payment_type,
        payment_type === "cash" ? cash_box_account_id : null,
        payment_type === "bank" ? bank_account_id : null,
        transfer_no || null,
        currency_id,
        amount,
        account_id,
        analytic_account_id || null,
        cost_center_id || null,
        journal_type_id,
        notes || null,
        handling || 0,
        created_by || null,
        branch_id || null
      ]
    );

    const paymentVoucherId = voucherResult.insertId;

    /* =========================
       2️⃣ إنشاء القيد المحاسبي
       🔄 معكوس القبض
    ========================= */

    const creditAccount =
      payment_type === "cash"
        ? cash_box_account_id
        : bank_account_id;

    // 🔴 دائن: الصندوق / البنك
    await conn.query(
      `
      INSERT INTO journal_entries
      (journal_type_id, reference_id, reference_type, account_id, debit, credit, currency_id, cost_center_id, notes)
      VALUES (?, ?, 'payment_voucher', ?, 0, ?, ?, ?, ?)
      `,
      [
        journal_type_id,
        paymentVoucherId,
        creditAccount,
        amount,
        currency_id,
        cost_center_id || null,
        notes || "قيد صرف"
      ]
    );

    // 🟢 مدين: الحساب
    await conn.query(
      `
      INSERT INTO journal_entries
      (journal_type_id, reference_id, reference_type, account_id, debit, credit, currency_id, cost_center_id, notes)
      VALUES (?, ?, 'payment_voucher', ?, ?, 0, ?, ?, ?)
      `,
      [
        journal_type_id,
        paymentVoucherId,
        account_id,
        amount,
        currency_id,
        cost_center_id || null,
        notes || "قيد صرف"
      ]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "✅ تم حفظ سند الصرف وإنشاء القيد المحاسبي",
      id: paymentVoucherId
    });
  } catch (err) {
    await conn.rollback();
    console.error("ADD PAYMENT VOUCHER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في حفظ سند الصرف"
    });
  } finally {
    conn.release();
  }
});

/* =========================
   ✏️ UPDATE payment voucher
========================= */
app.put("/payment-vouchers/:id", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    const {
      voucher_date,
      payment_type,
      cash_box_account_id,
      bank_account_id,
      transfer_no,
      currency_id,
      amount,
      account_id,
      analytic_account_id,
      cost_center_id,
      journal_type_id,
      notes,
      handling
    } = req.body;

    await conn.beginTransaction();

    await conn.query(
      `
      UPDATE payment_vouchers
      SET
        voucher_date = ?,
        payment_type = ?,
        cash_box_account_id = ?,
        bank_account_id = ?,
        transfer_no = ?,
        currency_id = ?,
        amount = ?,
        account_id = ?,
        analytic_account_id = ?,
        cost_center_id = ?,
        notes = ?,
        handling = ?
      WHERE id = ?
      `,
      [
        voucher_date,
        payment_type,
        payment_type === "cash" ? cash_box_account_id : null,
        payment_type === "bank" ? bank_account_id : null,
        transfer_no || null,
        currency_id,
        amount,
        account_id,
        analytic_account_id || null,
        cost_center_id || null,
        notes || null,
        handling || 0,
        id
      ]
    );

    // حذف القيود القديمة
    await conn.query(
      `DELETE FROM journal_entries
       WHERE reference_id = ?
       AND reference_type = 'payment_voucher'`,
      [id]
    );

    const creditAccount =
      payment_type === "cash"
        ? cash_box_account_id
        : bank_account_id;

    // دائن
    await conn.query(
      `
      INSERT INTO journal_entries
      (journal_type_id, reference_id, reference_type, account_id, debit, credit, currency_id, cost_center_id, notes)
      VALUES (?, ?, 'payment_voucher', ?, 0, ?, ?, ?, ?)
      `,
      [
        journal_type_id,
        id,
        creditAccount,
        amount,
        currency_id,
        cost_center_id || null,
        notes || "قيد صرف"
      ]
    );

    // مدين
    await conn.query(
      `
      INSERT INTO journal_entries
      (journal_type_id, reference_id, reference_type, account_id, debit, credit, currency_id, cost_center_id, notes)
      VALUES (?, ?, 'payment_voucher', ?, ?, 0, ?, ?, ?)
      `,
      [
        journal_type_id,
        id,
        account_id,
        amount,
        currency_id,
        cost_center_id || null,
        notes || "قيد صرف"
      ]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "✅ تم تعديل سند الصرف بنجاح"
    });
  } catch (err) {
    await conn.rollback();
    console.error("UPDATE PAYMENT VOUCHER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في تعديل سند الصرف"
    });
  } finally {
    conn.release();
  }
});

/* =========================
   🗑️ DELETE payment voucher
========================= */
app.delete("/payment-vouchers/:id", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    await conn.beginTransaction();

    await conn.query(
      `DELETE FROM journal_entries
       WHERE reference_id = ?
       AND reference_type = 'payment_voucher'`,
      [id]
    );

    await conn.query(
      `DELETE FROM payment_vouchers WHERE id = ?`,
      [id]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "🗑️ تم حذف سند الصرف والقيود المرتبطة"
    });
  } catch (err) {
    await conn.rollback();
    console.error("DELETE PAYMENT VOUCHER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في حذف سند الصرف"
    });
  } finally {
    conn.release();
  }
});

/* ======================================================
   📘 Journal Entries API (Manual)
====================================================== */

/* =========================
   🔍 جلب جميع القيود (مجمّعة)
========================= */
app.get("/journal-entries", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        reference_id,
        journal_date,
        currency_id,
        SUM(debit)  AS debit,
        SUM(credit) AS credit,
        MAX(notes)  AS notes,
        MAX(created_at) AS created_at
      FROM journal_entries
      WHERE reference_type = 'manual'
      GROUP BY reference_id, journal_date, currency_id
      ORDER BY reference_id DESC
    `);

    res.json({ success: true, list: rows });
  } catch (err) {
    console.error("GET JOURNAL ENTRIES ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* =========================
   ➕ إضافة قيد يومي (مدين + دائن)
========================= */
app.post("/journal-entries", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
  journal_date,        // ✅ نفس اسم الواجهة
  amount,
  currency_id,
  debit_account_id,
  credit_account_id,
  notes,
  created_by,
  branch_id
} = req.body;


   if (
  !journal_date ||
  !amount ||
  !currency_id ||
  !debit_account_id ||
  !credit_account_id
) {
  return res.status(400).json({
    success: false,
    message: "البيانات الأساسية مطلوبة"
  });
}


    await conn.beginTransaction();

    /* 🔢 توليد رقم قيد موحد */
    const [[{ maxRef }]] = await conn.query(`
      SELECT MAX(reference_id) AS maxRef
      FROM journal_entries
      WHERE reference_type = 'manual'
    `);

    const referenceId = (maxRef || 0) + 1;

    const baseInsert = `
      INSERT INTO journal_entries
      (
        journal_type_id,
        reference_type,
        reference_id,
        journal_date,
        currency_id,
        account_id,
        debit,
        credit,
        notes,
        created_by,
        branch_id
      )
      VALUES (?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    /* 🔹 مدين */
    await conn.query(baseInsert, [
      1,
      referenceId,
      journal_date,
      currency_id,
      debit_account_id,
      amount,
      0,
      notes || "قيد يومي",
      created_by || null,
      branch_id || null
    ]);

    /* 🔹 دائن */
    await conn.query(baseInsert, [
      1,
      referenceId,
      journal_date,
      currency_id,
      credit_account_id,
      0,
      amount,
      notes || "قيد يومي",
      created_by || null,
      branch_id || null
    ]);

    await conn.commit();

    res.json({
      success: true,
      reference_id: referenceId,
      message: "✅ تم حفظ القيد اليومي"
    });

  } catch (err) {
    await conn.rollback();
    console.error("ADD JOURNAL ENTRY ERROR:", err);
    res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
});

/* =========================
   ✏️ تعديل قيد (كامل)
========================= */
app.put("/journal-entries/:referenceId", async (req, res) => {
  try {
    const { referenceId } = req.params;
    const {
      journal_date,
      amount,
      currency_id,
      debit_account_id,
      credit_account_id,
      notes
    } = req.body;

    if (!amount || !debit_account_id || !credit_account_id) {
      return res.status(400).json({
        success: false,
        message: "❌ بيانات القيد غير مكتملة"
      });
    }

    /* حذف القديم */
    await db.query(
      `DELETE FROM journal_entries 
       WHERE reference_type='manual' AND reference_id=?`,
      [referenceId]
    );

    /* إعادة الإدخال */
    const insert = `
      INSERT INTO journal_entries
      (
        journal_type_id,
        reference_type,
        reference_id,
        journal_date,
        currency_id,
        account_id,
        debit,
        credit,
        notes
      )
      VALUES (?, 'manual', ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(insert, [
      1,
      referenceId,
      journal_date,
      currency_id,
      debit_account_id,
      amount,
      0,
      notes || "قيد يومي"
    ]);

    await db.query(insert, [
      1,
      referenceId,
      journal_date,
      currency_id,
      credit_account_id,
      0,
      amount,
      notes || "قيد يومي"
    ]);

    res.json({
      success: true,
      message: "✅ تم تعديل القيد بنجاح"
    });

  } catch (err) {
    console.error("UPDATE JOURNAL ENTRY ERROR:", err);
    res.status(500).json({
      success: false,
      message: "❌ خطأ في تعديل القيد"
    });
  }
});

/* =========================
   🗑️ حذف قيد كامل
========================= */
app.delete("/journal-entries/:referenceId", async (req, res) => {
  try {
    const { referenceId } = req.params;

    const [result] = await db.query(
      `DELETE FROM journal_entries 
       WHERE reference_type='manual' AND reference_id=?`,
      [referenceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "القيد غير موجود"
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE JOURNAL ENTRY ERROR:", err);
    res.status(500).json({ success: false });
  }
});



/* ============================================================================
   تشغيل السيرفر
============================================================================ */
// 🔴 Global Error Handler (لازم قبل listen)
app.use((err, req, res, next) => {
  console.error("SERVER ERROR 🔥:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال على المنفذ ${PORT}`);
});


