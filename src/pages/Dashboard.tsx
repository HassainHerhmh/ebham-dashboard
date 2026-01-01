import React from 'react'
import StatCard from '../components/StatCard'
import { useApp } from '../contexts/AppContext'
import { useApi } from '../hooks/useApi'
import api from '../services/api'
import { 
  Users, 
  ShoppingBag, 
  Truck, 
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  Star
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const Dashboard: React.FC = () => {
  const { state, actions } = useApp()
  
  // استخدام البيانات المباشرة من السياق
  const stats = state.stats
  
  // جلب البيانات الإضافية
  const { data: recentOrders } = useApi(() => api.orders.getOrders({ limit: 10, sort: 'desc' }), [])
  const { data: salesData } = useApi(() => api.reports.getSalesReport(), [])

  React.useEffect(() => {
    // تحميل الإحصائيات عند تحميل الصفحة
    actions.loadStats()
  }, [])

  const orderStatusData = [
    { name: 'مكتملة', value: 400, color: '#10b981' },
    { name: 'قيد التوصيل', value: 300, color: '#3b82f6' },
    { name: 'ملغية', value: 200, color: '#ef4444' },
    { name: 'في الانتظار', value: 100, color: '#f59e0b' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مكتمل': return 'bg-green-100 text-green-800'
      case 'قيد التوصيل': return 'bg-blue-100 text-blue-800'
      case 'في الانتظار': return 'bg-yellow-100 text-yellow-800'
      case 'ملغي': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <div className="text-sm text-gray-500">
          آخر تحديث: الآن
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الطلبات اليوم"
          value={stats?.totalOrders?.toString() || "0"}
          change="12%"
          changeType="increase"
          icon={ShoppingBag}
          color="primary"
        />
        <StatCard
          title="العملاء النشطون"
          value={stats?.activeCustomers?.toString() || "0"}
          change="8%"
          changeType="increase"
          icon={Users}
          color="secondary"
        />
        <StatCard
          title="الكباتن المتاحون"
          value={stats?.availableCaptains?.toString() || "0"}
          change="2"
          changeType="decrease"
          icon={Truck}
          color="warning"
        />
        <StatCard
          title="إجمالي المبيعات"
          value={`${stats?.totalSales?.toLocaleString() || "0"} ريال`}
          change="15%"
          changeType="increase"
          icon={DollarSign}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">المبيعات الأسبوعية</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">حالة الطلبات</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">الطلبات الأخيرة</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">رقم الطلب</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">العميل</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">المطعم</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">المبلغ</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">الحالة</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {(recentOrders || []).slice(0, 4).map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm font-medium text-gray-900">#{order.id}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{order.customer}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{order.restaurant}</td>
                    <td className="py-3 px-6 text-sm font-medium text-gray-900">{order.amount}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-500">{order.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">إحصائيات سريعة</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp size={16} className="text-green-500" />
                  <span className="text-sm text-gray-600">متوسط وقت التوصيل</span>
                </div>
                <span className="text-sm font-medium">{stats?.averageDeliveryTime || 28} دقيقة</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Star size={16} className="text-yellow-500" />
                  <span className="text-sm text-gray-600">تقييم الخدمة</span>
                </div>
                <span className="text-sm font-medium">4.8/5</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Clock size={16} className="text-blue-500" />
                  <span className="text-sm text-gray-600">أوقات الذروة</span>
                </div>
                <span className="text-sm font-medium">12-2 م</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <MapPin size={16} className="text-purple-500" />
                  <span className="text-sm text-gray-600">المناطق النشطة</span>
                </div>
                <span className="text-sm font-medium">15 منطقة</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-semibold mb-2">هدف اليوم</h3>
            <p className="text-2xl font-bold">{stats?.dailyTarget || 200} طلب</p>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3">
              <div 
                className="bg-white h-2 rounded-full" 
                style={{ 
                  width: `${stats ? (stats.totalOrders / (stats.dailyTarget || 200)) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <p className="text-xs mt-2 opacity-90">
              {stats?.totalOrders || 0} من {stats?.dailyTarget || 200} طلب 
              ({stats ? ((stats.totalOrders / (stats.dailyTarget || 200)) * 100).toFixed(1) : 0}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard