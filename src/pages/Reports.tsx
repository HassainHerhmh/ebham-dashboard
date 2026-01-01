import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { FileText, Download, TrendingUp, Calendar, DollarSign } from 'lucide-react'

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week')

  const salesData = [
    { name: 'السبت', orders: 45, revenue: 12500 },
    { name: 'الأحد', orders: 52, revenue: 15200 },
    { name: 'الإثنين', orders: 38, revenue: 10800 },
    { name: 'الثلاثاء', orders: 61, revenue: 17400 },
    { name: 'الأربعاء', orders: 48, revenue: 13900 },
    { name: 'الخميس', orders: 73, revenue: 21000 },
    { name: 'الجمعة', orders: 85, revenue: 24500 }
  ]

  const categoryData = [
    { name: 'مطاعم', value: 45, color: '#3b82f6' },
    { name: 'حلويات', value: 25, color: '#10b981' },
    { name: 'مشروبات', value: 15, color: '#f59e0b' },
    { name: 'وجبات سريعة', value: 15, color: '#ef4444' }
  ]

  const topRestaurants = [
    { name: 'مطعم الفخامة', orders: 156, revenue: 45200 },
    { name: 'برجر هاوس', orders: 142, revenue: 38900 },
    { name: 'بيتزا الإيطالية', orders: 128, revenue: 35600 },
    { name: 'مطعم المذاق', orders: 115, revenue: 32100 },
    { name: 'كافيه الذوق', orders: 98, revenue: 27800 }
  ]

  const reportTypes = [
    { id: 1, name: 'تقرير المبيعات اليومي', description: 'ملخص كامل للمبيعات والطلبات', icon: FileText, color: 'blue' },
    { id: 2, name: 'تقرير أداء المطاعم', description: 'تحليل أداء جميع المطاعم', icon: TrendingUp, color: 'green' },
    { id: 3, name: 'تقرير العملاء', description: 'إحصائيات وتحليلات العملاء', icon: FileText, color: 'purple' },
    { id: 4, name: 'التقرير المالي', description: 'الإيرادات والمصروفات الشهرية', icon: DollarSign, color: 'orange' }
  ]

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-7 h-7" />
          التقارير والإحصائيات
        </h1>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="year">هذا العام</option>
          </select>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            تصدير التقرير
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الطلبات</p>
              <p className="text-2xl font-bold text-gray-900">402</p>
              <p className="text-xs text-green-600 mt-1">+12.5% عن الأسبوع الماضي</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-gray-900">115,300 ريال</p>
              <p className="text-xs text-green-600 mt-1">+8.3% عن الأسبوع الماضي</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">متوسط قيمة الطلب</p>
              <p className="text-2xl font-bold text-gray-900">287 ريال</p>
              <p className="text-xs text-green-600 mt-1">+3.2% عن الأسبوع الماضي</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">معدل إكمال الطلبات</p>
              <p className="text-2xl font-bold text-gray-900">94.2%</p>
              <p className="text-xs text-green-600 mt-1">+1.8% عن الأسبوع الماضي</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">المبيعات اليومية</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" name="عدد الطلبات" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات اليومية</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="الإيرادات (ريال)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">توزيع الطلبات حسب الفئة</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${entry.value}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">أفضل المطاعم أداءً</h2>
          <div className="space-y-3">
            {topRestaurants.map((restaurant, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{restaurant.name}</p>
                    <p className="text-xs text-gray-500">{restaurant.orders} طلب</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{restaurant.revenue.toLocaleString()} ريال</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">التقارير المتاحة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className={`w-12 h-12 ${getColorClass(report.color)} rounded-lg flex items-center justify-center mb-3`}>
                <report.icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{report.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{report.description}</p>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <Download className="w-4 h-4" />
                تنزيل التقرير
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Reports