import { Home, CheckSquare, Folder, Users, FileText, BarChart3, Bell, Settings } from 'lucide-react'

const menuItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tasks', label: 'My Task', icon: CheckSquare },
  { id: 'notes', label: 'Pages', icon: FileText },
  { id: 'meetings', label: 'Meetings', icon: Users },
  { id: 'activities', label: 'Analytics', icon: BarChart3 },
  { id: 'projects', label: 'Projects', icon: Folder },
]

export default function Sidebar({
  activeItem,
  onItemSelect,
  isCollapsed,
  onToggleCollapse,
  onAddTask,
  onAddProject,
  onSettingsClick,
}) {
  const isValidItem = activeItem && menuItems.some(item => item.id === activeItem)
  const displayItem = isValidItem ? activeItem : 'home'

  return (
    <div
      className={`
        w-16
        h-full flex flex-col relative
        bg-slate-900
        border-r border-slate-800
        transition-all duration-300 ease-in-out
      `}
    >
      
      {/* Navigation Menu */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto" aria-label="Main navigation">
        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = displayItem === item.id

            return (
              <button
                key={item.id}
                onClick={() => onItemSelect(item.id)}
                className={`
                  w-full flex h-10 items-center justify-center rounded-xl
                  text-sm font-medium transition-all duration-200 ease-out
                group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                  ${isActive
                    ? 'bg-accent-solid text-accent-foreground'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom Icons */}
      <div className="space-y-1.5 border-t border-slate-800 px-2 pb-3 pt-3">
        <button
            className="flex h-10 w-full items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 flex-shrink-0 flex items-center justify-center" />
        </button>
        <button
          onClick={onSettingsClick}
            className="flex h-10 w-full items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 flex-shrink-0 flex items-center justify-center" />
        </button>
      </div>

          </div>
  )
}
