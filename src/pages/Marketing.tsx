import React, { useState } from 'react'
import { Mail, MessageSquare, Bell, Percent, TrendingUp, Users, DollarSign } from 'lucide-react'

interface Campaign {
  id: number
  name: string
  type: string
  status: string
  reach: number
  conversions: number
  budget: number
  startDate: string
}

const Marketing: React.FC = () => {
  const [campaigns] = useState<Campaign[]>([
    {
      id: 1,
      name: 'عرض خصم 30% على الطلبات',
      type: 'email',
      status: 'active',
      reach: 5420,
      conversions: 342,
      budget: 5000,
      startDate: '2025-10-01'
    },
    {
      id: 2,
      name: 'توصيل مجاني للطلبات الجديدة',
      type: 'sms',
      status: 'active',
      reach: 3210,
      conversions: 198,
      budget: 3000,
      startDate: '2025-10-03'
    },
    {
      id: 3,
      name: 'برنامج الولاء للعملاء',
      type: 'notification',
      status: 'scheduled',
      reach: 0,
      conversions: 0,
      budget: 4500,
      startDate: '2025-10-15'
    }
  ])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5" />
      case 'sms':
        return <MessageSquare className="w-5 h-5" />
      case 'notification':
        return <Bell className="w-5 h-5" />
      default:
        return <Percent className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800'
    }

    const labels: Record<string, string> = {
      active: 'نشطة',
      scheduled: 'مجدولة',
      completed: 'مكتملة',
      paused: 'متوقفة'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    )
  }

  const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
  const conversionRate = totalReach > 0 ? ((totalConversions / totalReach) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-7 h-7" />
          التسويق والحملات
        </h1>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          إنشاء حملة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الوصول</p>
              <p className="text-2xl font-bold text-blue-600">{totalReach.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">التحويلات</p>
              <p className="text-2xl font-bold text-green-600">{totalConversions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">معدل التحويل</p>
              <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الميزانية</p>
              <p className="text-2xl font-bold text-orange-600">{totalBudget.toLocaleString()} ريال</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">الحملات التسويقية</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الحملة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصول</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التحويلات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">معدل التحويل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الميزانية</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ البدء</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => {
                const rate = campaign.reach > 0
                  ? ((campaign.conversions / campaign.reach) * 100).toFixed(1)
                  : '0.0'

                return (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                        {getTypeIcon(campaign.type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.reach.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.conversions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.budget.toLocaleString()} ريال
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(campaign.startDate).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(campaign.status)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">قنوات التسويق</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">البريد الإلكتروني</p>
                  <p className="text-xs text-gray-500">5,420 مستخدم</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-blue-600">6.3%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">الرسائل النصية</p>
                  <p className="text-xs text-gray-500">3,210 مستخدم</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-green-600">6.2%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">الإشعارات</p>
                  <p className="text-xs text-gray-500">مجدولة</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-400">قريباً</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">أفضل العروض أداءً</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">خصم 30%</p>
                <p className="text-xs text-gray-500">342 تحويل</p>
              </div>
              <span className="text-sm font-semibold text-green-600">+6.3%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">توصيل مجاني</p>
                <p className="text-xs text-gray-500">198 تحويل</p>
              </div>
              <span className="text-sm font-semibold text-blue-600">+6.2%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">برنامج الولاء</p>
                <p className="text-xs text-gray-500">مجدولة</p>
              </div>
              <span className="text-sm font-semibold text-gray-400">قريباً</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Marketing