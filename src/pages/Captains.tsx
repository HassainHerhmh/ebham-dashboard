import React, { useState, useEffect } from 'react'
import { Bike } from 'lucide-react'

interface Captain {
  id: number
  name: string
  email?: string
  phone: string
  password?: string
  status: string
  vehicle_type: string
  vehicle_number?: string
  rating?: number | string | null
  deliveries_count?: number | string | null
  created_at: string
}

const Captains: React.FC = () => {
  const [captains, setCaptains] = useState<Captain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [vehicleType, setVehicleType] = useState('دراجة')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [status, setStatus] = useState('available')

  const fetchCaptains = async () => {
    try {
      const res = await fetch('http://localhost:5000/captains')
      const data = await res.json()
      if (data.success && Array.isArray(data.captains)) {
        setCaptains(data.captains)
        setError(null)
      } else {
        setError('🚫 لا توجد بيانات')
      }
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaptains()
  }, [])

  const startEditCaptain = (c: Captain) => {
    setEditId(c.id)
    setName(c.name)
    setEmail(c.email || '')
    setPhone(c.phone)
    setPassword('')
    setConfirmPassword('')
    setVehicleType(c.vehicle_type)
    setVehicleNumber(c.vehicle_number || '')
    setStatus(c.status)
    setIsModalOpen(true)
  }

  const saveCaptain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId && password !== confirmPassword) {
      alert('❌ كلمة المرور غير متطابقة')
      return
    }
    const method = editId ? 'PUT' : 'POST'
    const url = editId
      ? `http://localhost:5000/captains/${editId}`
      : `http://localhost:5000/captains`

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          vehicle_type: vehicleType,
          vehicle_number: vehicleNumber,
          status
        })
      })
      const data = await res.json()
      if (data.success) {
        alert(data.message || '✅ تم الحفظ')
        setIsModalOpen(false)
        setEditId(null)
        fetchCaptains()
      } else {
        alert(data.message || '❌ فشل الحفظ')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteCaptain = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الكابتن؟')) return
    const res = await fetch(`http://localhost:5000/captains/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      alert('🗑 تم الحذف')
      fetchCaptains()
    }
  }

  const updateCaptainStatus = async (id: number, newStatus: string) => {
    const res = await fetch(`http://localhost:5000/captains/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    const data = await res.json()
    if (data.success) {
      alert('✅ تم تحديث الحالة')
      fetchCaptains()
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'متاح',
      busy: 'مشغول',
      offline: 'غير متصل',
      inactive: 'غير نشط'
    }
    return labels[status] || 'غير محدد'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bike className="w-7 h-7" /> الكباتن
        </h1>
        <button
          onClick={() => { setEditId(null); setIsModalOpen(true) }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          ➕ إضافة كابتن
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">⏳ جاري التحميل...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : captains.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">الاسم</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">نوع المركبة</th>
                <th className="p-3">رقم المركبة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {captains.map((c) => (
                <tr key={c.id}>
                  <td className="p-3">#{c.id}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">{c.vehicle_type}</td>
                  <td className="p-3">{c.vehicle_number || '-'}</td>
                  <td className="p-3">
                    <select
                      value={c.status}
                      onChange={(e) => updateCaptainStatus(c.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="available">متاح</option>
                      <option value="busy">مشغول</option>
                      <option value="offline">غير متصل</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEditCaptain(c)} className="bg-blue-500 text-white px-2 rounded">تعديل</button>
                    <button onClick={() => deleteCaptain(c.id)} className="bg-red-500 text-white px-2 rounded">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center">🚫 لا يوجد كباتن</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">{editId ? 'تعديل كابتن' : 'إضافة كابتن جديد'}</h2>
            <form onSubmit={saveCaptain} className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="border p-2 w-full" required />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="border p-2 w-full" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الهاتف" className="border p-2 w-full" required />
              
              {/* كلمة المرور */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="border p-2 w-full"
                  required={!editId}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2 top-2"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تأكيد كلمة المرور"
                className="border p-2 w-full"
                required={!editId}
              />

              <input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="نوع المركبة" className="border p-2 w-full" />
              <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="رقم المركبة" className="border p-2 w-full" />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="border p-2 w-full">
                <option value="available">متاح</option>
                <option value="busy">مشغول</option>
                <option value="offline">غير متصل</option>
                <option value="inactive">غير نشط</option>
              </select>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white px-4 py-2 rounded">إلغاء</button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Captains