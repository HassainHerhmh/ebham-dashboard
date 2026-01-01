import React from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

const RealTimeIndicator: React.FC = () => {
  const { state, actions } = useApp()

  return (
    <div className="flex items-center space-x-2 space-x-reverse">
      <button
        onClick={actions.toggleRealTimeUpdates}
        className={`flex items-center space-x-2 space-x-reverse px-3 py-1 rounded-full text-sm transition-colors ${
          state.realTimeUpdates
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {state.realTimeUpdates ? (
          <Wifi size={16} />
        ) : (
          <WifiOff size={16} />
        )}
        <span>
          {state.realTimeUpdates ? 'متصل' : 'غير متصل'}
        </span>
      </button>
      
      {state.realTimeUpdates && (
        <div className="flex items-center space-x-1 space-x-reverse">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">مباشر</span>
        </div>
      )}
    </div>
  )
}

export default RealTimeIndicator