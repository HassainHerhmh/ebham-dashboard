# دليل تطبيق نظام المصادقة للعملاء

## نظرة عامة
هذا الدليل يشرح كيفية تطبيق نظام مصادقة بسيط للعملاء في تطبيق Abhaam Delivery.

## استراتيجية المصادقة

نستخدم نظام مصادقة مبسط بدون كلمات مرور للبدء:
1. العميل يدخل رقم الهاتف والاسم
2. النظام يتحقق إذا كان العميل موجود
3. إذا موجود: تسجيل دخول مباشر
4. إذا غير موجود: إنشاء حساب جديد تلقائياً

## تطبيق Context للمصادقة

أنشئ ملف `src/contexts/AuthContext.jsx`:

```javascript
import { createContext, useState, useContext, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedCustomer = localStorage.getItem('abhaam_customer')
    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer))
    }
    setLoading(false)
  }, [])

  const login = async (phone, full_name) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, full_name }),
      })

      const data = await response.json()

      if (data.success) {
        setCustomer(data.customer)
        localStorage.setItem('abhaam_customer', JSON.stringify(data.customer))
        return { success: true, customer: data.customer }
      }

      return { success: false, error: data.error }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setCustomer(null)
    localStorage.removeItem('abhaam_customer')
  }

  const updateCustomer = async (updates) => {
    try {
      const result = await api.updateCustomer(customer.id, updates)
      if (result.success) {
        const updatedCustomer = { ...customer, ...result.customer }
        setCustomer(updatedCustomer)
        localStorage.setItem('abhaam_customer', JSON.stringify(updatedCustomer))
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        customer,
        loading,
        isAuthenticated: !!customer,
        login,
        logout,
        updateCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

## تطبيق صفحة تسجيل الدخول

أنشئ ملف `src/pages/Login.jsx`:

```javascript
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!phone || !fullName) {
      setError('يرجى إدخال رقم الهاتف والاسم')
      return
    }

    if (!/^[0-9+]{9,15}$/.test(phone)) {
      setError('رقم الهاتف غير صحيح')
      return
    }

    setLoading(true)

    const result = await login(phone, fullName)

    if (result.success) {
      navigate('/')
    } else {
      setError(result.error || 'حدث خطأ أثناء تسجيل الدخول')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">مرحباً بك</h1>
          <p className="text-gray-600">سجل دخولك إلى أبهام للتوصيل</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم الهاتف
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+967 777 123 456"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الاسم الكامل
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="أحمد محمد الحداد"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>بتسجيل الدخول، أنت توافق على</p>
          <a href="#" className="text-green-600 hover:underline">
            الشروط والأحكام
          </a>
        </div>
      </div>
    </div>
  )
}
```

## تطبيق صفحة الملف الشخصي

أنشئ ملف `src/pages/Profile.jsx`:

```javascript
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { customer, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-green-600 text-2xl font-bold">
                {customer.full_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{customer.full_name}</h1>
                <p className="text-green-100">{customer.phone}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">رصيد المحفظة</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {customer.wallet_balance?.toLocaleString() || 0} ريال
                  </p>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  تعبئة الرصيد
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {customer.total_orders || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">إجمالي الطلبات</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-600">
                  {customer.is_active ? 'نشط' : 'غير نشط'}
                </p>
                <p className="text-sm text-gray-600 mt-1">حالة الحساب</p>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <button
                onClick={() => navigate('/orders')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg text-right px-4 transition-colors"
              >
                📦 طلباتي
              </button>
              <button
                onClick={() => navigate('/addresses')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg text-right px-4 transition-colors"
              >
                📍 عناويني
              </button>
              <button
                onClick={() => navigate('/wallet')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg text-right px-4 transition-colors"
              >
                💰 المحفظة
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg text-right px-4 transition-colors"
              >
                ⚙️ الإعدادات
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg mt-6 transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## تحديث Backend بـ endpoint تسجيل الدخول

أضف هذا الـ endpoint إلى `backend-supabase.cjs`:

```javascript
app.post("/api/customers/login", async (req, res) => {
  try {
    const { phone, full_name } = req.body;

    if (!phone || !full_name) {
      return res.status(400).json({ error: "رقم الهاتف والاسم مطلوبان" });
    }

    const { data: existingCustomer, error: searchError } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (searchError) throw searchError;

    if (existingCustomer) {
      return res.json({ success: true, customer: existingCustomer, isNew: false });
    }

    const { data: newCustomer, error: createError } = await supabase
      .from("customers")
      .insert([
        {
          full_name,
          phone,
          wallet_balance: 0,
          total_orders: 0,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (createError) throw createError;

    res.json({ success: true, customer: newCustomer, isNew: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## حماية الصفحات

أنشئ مكون `ProtectedRoute.jsx`:

```javascript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

## تحديث App.jsx

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
// ... المكونات الأخرى

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          {/* المسارات الأخرى */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

## ملاحظات مهمة

1. هذا نظام مصادقة مبسط للبدء السريع
2. للإنتاج، يُنصح بإضافة:
   - OTP (رمز التحقق) عبر SMS
   - JWT Tokens للأمان
   - Refresh Tokens
   - Rate Limiting
3. البيانات محمية بـ RLS في Supabase
4. يمكن الترقية لاحقاً لاستخدام Supabase Auth الكامل

## الخطوات التالية

1. نسخ الملفات إلى مشروع Bolt.new
2. تحديث Backend بـ endpoint تسجيل الدخول
3. اختبار تسجيل الدخول والملف الشخصي
4. إضافة صفحات الطلبات والعناوين
5. تطبيق حماية المسارات
