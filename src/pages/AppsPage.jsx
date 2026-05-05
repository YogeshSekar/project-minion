import { useState } from 'react'
import { Timer, Shield, Layout, Archive, Plus, ExternalLink } from 'lucide-react'

function AppsPage() {
  const [apps, setApps] = useState([
    {
      id: 1,
      name: 'Pomodoro Timer',
      description: 'Focus timer for productive work sessions',
      icon: Timer,
      color: 'red',
      isInstalled: true
    },
    {
      id: 2,
      name: 'Procrastination Buster',
      description: 'Beat procrastination and stay focused',
      icon: Shield,
      color: 'orange',
      isInstalled: true
    },
    {
      id: 3,
      name: 'Kanban Board',
      description: 'Visual project management tool',
      icon: Layout,
      color: 'blue',
      isInstalled: true
    },
    {
      id: 4,
      name: 'Archiver',
      description: 'Archive and organize completed items',
      icon: Archive,
      color: 'purple',
      isInstalled: true
    }
  ])

  const getColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
      gray: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }
    return colors[color] || colors.gray
  }

  const toggleApp = (appId) => {
    setApps(apps.map(app => 
      app.id === appId ? { ...app, isInstalled: !app.isInstalled } : app
    ))
  }

  return (
    <div className="h-full bg-[#faf9f7] dark:bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Apps</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your installed applications and discover new ones</p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {apps.map((app) => {
            const Icon = app.icon
            return (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg border ${getColorClass(app.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => toggleApp(app.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      app.isInstalled
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/40'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {app.isInstalled ? 'Installed' : 'Install'}
                  </button>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{app.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">{app.description}</p>
                
                {app.isInstalled && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition-colors text-sm mt-auto">
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </button>
                )}
              </div>
            )
          })}

          {/* Add New App Card */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all duration-200 cursor-pointer">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Add New App</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Discover more applications</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppsPage
