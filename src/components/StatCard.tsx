import React from 'react'

interface StatCardProps {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: React.ComponentType<any>
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return 'bg-blue-50 text-blue-600'
      case 'secondary':
        return 'bg-purple-50 text-purple-600'
      case 'success':
        return 'bg-green-50 text-green-600'
      case 'warning':
        return 'bg-yellow-50 text-yellow-600'
      case 'danger':
        return 'bg-red-50 text-red-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  const getChangeColor = () => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          <div className="flex items-center">
            <span className={`text-sm font-medium ${getChangeColor()}`}>
              {changeType === 'increase' ? '+' : '-'}{change}
            </span>
            <span className="text-xs text-gray-500 mr-1">من الأمس</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${getColorClasses()}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}

export default StatCard