# دليل ربط تطبيق Abhaam Delivery (Bolt.new) مع Backend

## ملخص التكامل

تم إعداد كل شيء للربط بين تطبيق Abhaam Delivery (Bolt.new) وقاعدة بيانات Supabase مع Backend API كامل.

## ما تم إنجازه ✅

### 1. قاعدة البيانات (Supabase)
- ✅ جميع الجداول المطلوبة موجودة ومُعدة:
  - `customers` - العملاء
  - `customer_addresses` - عناوين العملاء
  - `restaurants` - المطاعم
  - `menu_items` - منتجات المطاعم
  - `orders` - الطلبات
  - `order_items` - عناصر الطلبات
  - `captains` - الكباتن
  - `wallet_transactions` - معاملات المحفظة
  - `promo_codes` - كوبونات الخصم
  - `order_ratings` - تقييمات الطلبات
  - `notifications` - الإشعارات

### 2. Row Level Security (RLS)
- ✅ تم تفعيل RLS على جميع الجداول
- ✅ سياسات أمان كاملة للحماية
- ✅ سياسات وصول عام للمطاعم والمنتجات
- ✅ سياسات خاصة للعملاء (كل عميل يرى بياناته فقط)

### 3. Backend API
- ✅ Backend جديد كامل (`backend-supabase.cjs`)
- ✅ جميع endpoints جاهزة:
  - تسجيل دخول العملاء
  - إدارة الملف الشخصي
  - إدارة العناوين
  - المحفظة والمعاملات
  - عرض المطاعم والمنتجات
  - إنشاء وتتبع الطلبات
  - التقييمات والإشعارات
  - كوبونات الخصم

### 4. ملفات التوثيق
- ✅ `INTEGRATION_GUIDE.md` - دليل الربط الكامل
- ✅ `AUTH_IMPLEMENTATION.md` - دليل تطبيق المصادقة
- ✅ `API_DOCUMENTATION.md` - توثيق API الموجود
- ✅ `BOLT_INTEGRATION_README.md` - هذا الملف

## خطوات الربط السريع 🚀

### الخطوة 1: تجهيز مشروع Bolt.new

1. افتح مشروع Bolt.new
2. أنشئ ملف `.env` بهذا المحتوى:

```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
VITE_API_URL=http://localhost:3001
```

3. أضف مكتبة Supabase:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.58.0"
  }
}
```

### الخطوة 2: نسخ ملفات الإعداد

انسخ من `INTEGRATION_GUIDE.md`:
- ملف `src/lib/supabase.js` - اتصال Supabase
- ملف `src/services/api.js` - خدمة API الكاملة

### الخطوة 3: إضافة نظام المصادقة

انسخ من `AUTH_IMPLEMENTATION.md`:
- `src/contexts/AuthContext.jsx` - Context المصادقة
- `src/pages/Login.jsx` - صفحة تسجيل الدخول
- `src/pages/Profile.jsx` - صفحة الملف الشخصي
- `src/components/ProtectedRoute.jsx` - حماية المسارات

### الخطوة 4: تشغيل Backend

في مجلد المشروع الحالي:

```bash
# تثبيت المكتبات إن لم تكن مثبتة
npm install

# تشغيل Backend الجديد
node backend-supabase.cjs
```

سيعمل Backend على `http://localhost:3001`

### الخطوة 5: تحديث تطبيق Bolt.new

قم بتحديث مكونات تطبيق Bolt.new لاستخدام API:

#### مثال: صفحة المطاعم

```javascript
import { useEffect, useState } from 'react'
import { api } from '../services/api'

function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const data = await api.getRestaurants()
        setRestaurants(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRestaurants()
  }, [])

  if (loading) return <div>جاري التحميل...</div>

  return (
    <div>
      {restaurants.map(restaurant => (
        <div key={restaurant.id}>
          <img src={restaurant.logo_url} alt={restaurant.name} />
          <h2>{restaurant.name}</h2>
          <p>{restaurant.description}</p>
          <p>⭐ {restaurant.rating}</p>
          <p>🕐 {restaurant.delivery_time}</p>
        </div>
      ))}
    </div>
  )
}
```

#### مثال: صفحة الطلب

```javascript
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

function CheckoutPage({ cart, restaurantId }) {
  const { customer } = useAuth()
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('نقدي')

  const handleOrder = async () => {
    const orderData = {
      customer_id: customer.id,
      restaurant_id: restaurantId,
      address_id: selectedAddress.id,
      items: cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      })),
      payment_method: paymentMethod,
      notes: '',
      subtotal: calculateSubtotal(cart),
      delivery_fee: 5,
      tax: 0,
      discount: 0,
      total: calculateTotal(cart),
    }

    try {
      const result = await api.createOrder(orderData)
      if (result.success) {
        // الانتقال لصفحة تتبع الطلب
        navigate(`/orders/${result.order.id}`)
      }
    } catch (error) {
      alert('حدث خطأ في إنشاء الطلب')
    }
  }

  return (
    <div>
      {/* واجهة صفحة الطلب */}
      <button onClick={handleOrder}>تأكيد الطلب</button>
    </div>
  )
}
```

## الميزات المتاحة 🎯

### للعملاء:
- ✅ تسجيل الدخول البسيط (رقم الهاتف + الاسم)
- ✅ عرض جميع المطاعم
- ✅ عرض قوائم المطاعم والمنتجات
- ✅ إنشاء وتتبع الطلبات
- ✅ إدارة العناوين (إضافة، حذف، تعيين افتراضي)
- ✅ المحفظة الإلكترونية (رصيد، تعبئة، معاملات)
- ✅ كوبونات الخصم
- ✅ تقييم الطلبات (المطعم، الكابتن، الجودة، السرعة)
- ✅ الإشعارات
- ✅ سجل الطلبات

### للإدارة (Dashboard الموجود):
- ✅ إدارة المطاعم
- ✅ إدارة المنتجات
- ✅ إدارة الطلبات
- ✅ إدارة الكباتن
- ✅ إدارة العملاء
- ✅ تقارير وإحصائيات
- ✅ العروض والتسويق

## التحديثات في الوقت الفعلي 🔄

استخدم Supabase Realtime لتتبع الطلبات:

```javascript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function OrderTracking({ orderId }) {
  const [order, setOrder] = useState(null)

  useEffect(() => {
    // جلب الطلب
    async function fetchOrder() {
      const { data } = await supabase
        .from('orders')
        .select('*, restaurants(*), captains(*)')
        .eq('id', orderId)
        .single()
      setOrder(data)
    }

    fetchOrder()

    // الاشتراك في التحديثات الفورية
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setOrder(payload.new)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [orderId])

  return (
    <div>
      <h2>حالة الطلب: {order?.status}</h2>
      {order?.captain && (
        <div>
          <p>الكابتن: {order.captain.full_name}</p>
          <p>الهاتف: {order.captain.phone}</p>
        </div>
      )}
    </div>
  )
}
```

## حالات الطلب 📦

| الحالة | الوصف |
|--------|-------|
| `في_الانتظار` | الطلب في انتظار التأكيد |
| `قيد_التحضير` | المطعم يحضر الطلب |
| `جاهز` | الطلب جاهز للتوصيل |
| `قيد_التوصيل` | الكابتن في الطريق |
| `مكتمل` | تم التوصيل بنجاح |
| `ملغي` | تم إلغاء الطلب |

## طرق الدفع 💳

| الطريقة | الوصف |
|---------|-------|
| `نقدي` | الدفع عند الاستلام |
| `محفظة` | الدفع من رصيد المحفظة (يُخصم تلقائياً) |
| `فيزا` | الدفع بالبطاقة (للتطوير المستقبلي) |

## نصائح مهمة 💡

### 1. معالجة الأخطاء
```javascript
try {
  const result = await api.createOrder(orderData)
  if (result.success) {
    // نجح
  } else {
    // فشل
    console.error(result.error)
  }
} catch (error) {
  // خطأ في الشبكة أو السيرفر
  console.error(error)
}
```

### 2. Loading States
```javascript
const [loading, setLoading] = useState(false)

async function handleSubmit() {
  setLoading(true)
  try {
    await api.someEndpoint()
  } finally {
    setLoading(false)
  }
}
```

### 3. التحقق من المحفظة قبل الطلب
```javascript
if (paymentMethod === 'محفظة') {
  const { balance } = await api.getWallet(customer.id)
  if (balance < total) {
    alert('رصيد المحفظة غير كافٍ')
    return
  }
}
```

## الاختبار 🧪

### اختبار تسجيل الدخول:
```
الهاتف: +967 777 123 456
الاسم: أحمد محمد الحداد
```

### اختبار البيانات:
يمكنك إضافة بيانات تجريبية عبر:
1. Dashboard الإداري
2. مباشرة من Supabase Studio
3. عبر SQL في Supabase

## الدعم والمساعدة 📞

إذا واجهت أي مشاكل:

1. **تحقق من Console**:
   - افتح Developer Tools في المتصفح
   - تحقق من رسائل الأخطاء

2. **تحقق من Backend**:
   - تأكد أن Backend يعمل على port 3001
   - تحقق من logs في Terminal

3. **تحقق من Supabase**:
   - تحقق من RLS policies
   - تحقق من الاتصال بقاعدة البيانات

4. **تحقق من .env**:
   - تأكد من صحة SUPABASE_URL
   - تأكد من صحة SUPABASE_ANON_KEY

## الخطوات التالية 🚀

1. ✅ نسخ الملفات لمشروع Bolt.new
2. ✅ تشغيل Backend
3. ⏳ تحديث المكونات في Bolt.new
4. ⏳ اختبار التكامل الكامل
5. ⏳ إضافة ميزات إضافية (اختياري)
6. ⏳ النشر للإنتاج

## ملاحظات الأمان 🔒

- جميع الجداول محمية بـ RLS
- كل عميل يرى بياناته فقط
- المصادقة مطلوبة لجميع العمليات الحساسة
- لا يمكن للعملاء الوصول لبيانات بعضهم
- الإداريون لهم صلاحيات كاملة عبر Dashboard

## النجاح! 🎉

الآن لديك نظام توصيل متكامل يربط بين:
- تطبيق العملاء (Bolt.new)
- Dashboard الإداري
- Backend API
- قاعدة بيانات Supabase

جميع الأنظمة جاهزة ومتزامنة في الوقت الفعلي!
