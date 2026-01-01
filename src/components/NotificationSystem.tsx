import React from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  timestamp: Date
  isVisible: boolean
}

const NotificationSystem: React.FC = () => {
  const { state, actions } = useApp()

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-600" />
      case 'error':
        return <AlertCircle size={20} className="text-red-600" />
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-600" />
      default:
        return <Info size={20} className="text-blue-600" />
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (state.notifications.length === 0) return null

  return (
    <div className="fixed top-4 left-4 z-50 space-y-2 max-w-sm">
      {state.notifications.map((notification: Notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border shadow-lg transition-all duration-300 ${getBackgroundColor(notification.type)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 space-x-reverse">
              {getIcon(notification.type)}
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {notification.timestamp.toLocaleTimeString('ar-SA')}
                </p>
              </div>
            </div>
            <button
              onClick={() => actions.hideNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotificationSystem