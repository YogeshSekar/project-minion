import { Home, CheckSquare, Folder, Users, FileText, Target, TrendingUp, ChevronLeft, ChevronRight, Plus, Timer } from 'lucide-react'

const menuItems = [
  { id: 'home', label: 'Dashboard', icon: Home },
  { id: 'tasks', label: 'My Task', icon: CheckSquare },
  { id: 'activities', label: 'Activity', icon: Timer },
  { id: 'meetings', label: 'Chats', icon: Users },
  { id: 'notes', label: 'Documents', icon: FileText },
  { id: 'habits', label: 'Receipts', icon: Target },
  { id: 'projects', label: 'Projects', icon: Folder },
]

export default function Sidebar({
  activeItem,
  onItemSelect,
  isCollapsed,
  onToggleCollapse,
  onAddTask,
  onAddProject,
}) {
  const isValidItem = activeItem && menuItems.some(item => item.id === activeItem)
  const displayItem = isValidItem ? activeItem : 'home'

  return (
    <div
      className={`
        w-16
        h-[calc(100vh-3.5rem-2rem)] flex flex-col relative
        bg-white
        border border-gray-200
        rounded-2xl
        m-4
        transition-all duration-300 ease-in-out
      `}
    >
      
      {/* Navigation Menu */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = displayItem === item.id

            return (
              <button
                key={item.id}
                onClick={() => onItemSelect(item.id)}
                className={`
                  w-full flex items-center justify-center px-2 py-2.5 rounded-2xl
                  text-sm font-medium transition-all duration-200 ease-out
                  group relative
                  ${isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={item.label}
              >
                <Icon className={`
                  w-5 h-5 flex-shrink-0 flex items-center justify-center
                  ${isActive ? 'text-white' : ''}
                `} />
              </button>
            )
          })}
        </div>
      </nav>

          </div>
  )
}
