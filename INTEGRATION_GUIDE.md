# دليل ربط تطبيق Abhaam Delivery مع Backend

## نظرة عامة
هذا الدليل يشرح كيفية ربط تطبيق Abhaam Delivery (Bolt.new) مع Backend API المبني على Supabase.

## المتطلبات

### 1. إعداد Supabase في تطبيق Bolt.new

أضف هذه المكتبات إلى `package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.58.0"
  }
}
```

### 2. ملف إعدادات البيئة

أنشئ ملف `.env` في مشروع Bolt.new:

```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
VITE_API_URL=http://localhost:3001
```

### 3. إنشاء ملف اتصال Supabase

أنشئ ملف `src/lib/supabase.js` في مشروع Bolt.new:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 4. إنشاء ملف خدمة API

أنشئ ملف `src/services/api.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = {
  // المطاعم
  async getRestaurants() {
    const response = await fetch(`${API_URL}/api/restaurants`)
    return response.json()
  },

  async getRestaurant(id) {
    const response = await fetch(`${API_URL}/api/restaurants/${id}`)
    return response.json()
  },

  async getRestaurantMenu(id) {
    const response = await fetch(`${API_URL}/api/restaurants/${id}/menu`)
    return response.json()
  },

  // العملاء
  async registerCustomer(customerData) {
    const response = await fetch(`${API_URL}/api/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    })
    return response.json()
  },

  async getCustomer(id) {
    const response = await fetch(`${API_URL}/api/customers/${id}`)
    return response.json()
  },

  async updateCustomer(id, customerData) {
    const response = await fetch(`${API_URL}/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    })
    return response.json()
  },

  // العناوين
  async getCustomerAddresses(customerId) {
    const response = await fetch(`${API_URL}/api/customers/${customerId}/addresses`)
    return response.json()
  },

  async addCustomerAddress(customerId, addressData) {
    const response = await fetch(`${API_URL}/api/customers/${customerId}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressData),
    })
    return response.json()
  },

  async deleteCustomerAddress(customerId, addressId) {
    const response = await fetch(`${API_URL}/api/customers/${customerId}/addresses/${addressId}`, {
      method: 'DELETE',
    })
    return response.json()
  },

  // المحفظة
  async getWallet(customerId) {
    const response = await fetch(`${API_URL}/api/customers/${customerId}/wallet`)
    return response.json()
  },

  async addToWallet(customerId, amount, description) {
    const response = await fetch(`${API_URL}/api/customers/${customerId}/wallet/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
    })
    return response.json()
  },

  // الطلبات
  async createOrder(orderData) {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    })
    return response.json()
  },

  async getCustomerOrders(customerId) {
    const response = await fetch(`${API_URL}/api/customers/${customerId}/orders`)
    return response.json()
  },

  async getOrder(orderId) {
    const response = await fetch(`${API_URL}/api/orders/${orderId}`)
    return response.json()
  },

  // كوبونات الخصم
  async validatePromoCode(code) {
    const response = await fetch(`${API_URL}/api/promo-codes/${code}`)
    return response.json()
  },

  // التقييمات
  async rateOrder(orderId, ratingData) {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ratingData),
    })
    return response.json()
  },

  // الإشعارات
  async getNotifications(customerId) {
    const response = await fetch(`${API_URL}/api/customers/${customerId}/notifications`)
    return response.json()
  },

  async markNotificationAsRead(notificationId) {
    const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
    return response.json()
  },
}
```

## استخدام API في المكونات

### مثال: جلب المطاعم

```javascript
import { useEffect, useState } from 'react'
import { api } from '../services/api'

function RestaurantsList() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const data = await api.getRestaurants()
        setRestaurants(data)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  if (loading) return <div>جاري التحميل...</div>

  return (
    <div>
      {restaurants.map((restaurant) => (
        <div key={restaurant.id}>
          <h3>{restaurant.name}</h3>
          <p>{restaurant.description}</p>
        </div>
      ))}
    </div>
  )
}
```

### مثال: إنشاء طلب

```javascript
import { api } from '../services/api'

async function handleCreateOrder(customerId, restaurantId, addressId, items, paymentMethod) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const deliveryFee = 5
  const tax = 0
  const discount = 0
  const total = subtotal + deliveryFee - discount

  const orderData = {
    customer_id: customerId,
    restaurant_id: restaurantId,
    address_id: addressId,
    items,
    payment_method: paymentMethod,
    notes: '',
    subtotal,
    delivery_fee: deliveryFee,
    tax,
    discount,
    total,
  }

  try {
    const result = await api.createOrder(orderData)
    if (result.success) {
      console.log('Order created:', result.order_number)
      return result
    }
  } catch (error) {
    console.error('Error creating order:', error)
  }
}
```

## استخدام Supabase Realtime

لتتبع الطلبات في الوقت الفعلي:

```javascript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function OrderTracking({ orderId }) {
  const [order, setOrder] = useState(null)

  useEffect(() => {
    // جلب الطلب الأولي
    async function fetchOrder() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      setOrder(data)
    }

    fetchOrder()

    // الاشتراك في التحديثات الفورية
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId])

  return (
    <div>
      <h2>حالة الطلب: {order?.status}</h2>
      {/* عرض تفاصيل الطلب */}
    </div>
  )
}
```

## تشغيل Backend

```bash
# تثبيت المكتبات
npm install

# تشغيل Backend الجديد
node backend-supabase.cjs
```

## حالات الطلبات

- `في_الانتظار`: الطلب في انتظار التأكيد
- `قيد_التحضير`: المطعم يحضر الطلب
- `جاهز`: الطلب جاهز للتوصيل
- `قيد_التوصيل`: الكابتن في الطريق
- `مكتمل`: تم توصيل الطلب بنجاح
- `ملغي`: تم إلغاء الطلب

## طرق الدفع

- `نقدي`: الدفع عند الاستلام
- `محفظة`: الدفع من رصيد المحفظة
- `فيزا`: الدفع بالبطاقة (يتطلب تكامل مع بوابة دفع)

## ملاحظات مهمة

1. جميع endpoints تستخدم Supabase مباشرة
2. RLS مفعّل على جميع الجداول للأمان
3. التحديثات الفورية متاحة عبر Supabase Realtime
4. المحفظة تُخصم تلقائياً عند الدفع بها
5. رقم الطلب يُنشأ تلقائياً بصيغة `ORD-{timestamp}-{random}`

## الخطوات التالية

1. نسخ ملفات الإعداد إلى مشروع Bolt.new
2. تحديث المكونات لاستخدام API الجديد
3. اختبار التكامل الكامل
4. إضافة معالجة الأخطاء المناسبة
5. تطبيق Loading states و Error states
