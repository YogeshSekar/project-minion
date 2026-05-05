import { useState, useRef, useEffect } from 'react'
import { Plus, X, Check, Send } from 'lucide-react'
import useClickOutside from '../hooks/useClickOutside'
import useProjects from '../hooks/useProjects'

function QuickAddTask({ onCreateTask, isExpanded, setIsExpanded }) {
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(null)
  const [priority, setPriority] = useState('medium')
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const inputRef = useRef(null)
  
  const { projects } = useProjects()
  const dropdownRef = useClickOutside()
  const priorityDropdownRef = useClickOutside()
  const containerRef = useRef(null)

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100)
    }
  }, [isExpanded])

  // Auto-hide success message
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  // Close when clicking outside (only when expanded)
  useEffect(() => {
    if (!isExpanded) return
    
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // Only close if not actively typing
        if (!title.trim()) {
          setIsExpanded(false)
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded, title, setIsExpanded])

  // Keyboard shortcut: Ctrl+Shift+T or Cmd+Shift+T
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setIsExpanded(prev => !prev)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setIsExpanded])

  const handleAdd = async () => {
    if (!title.trim() || isAdding) return
    
    setIsAdding(true)
    
    const payload = {
      title: title.trim(),
      description: null,
      priority,
      status: 'todo',
      project_id: projectId,
      scheduled_date: new Date().toISOString().split('T')[0],
      parent_task_id: null,
      estimated_minutes: 0,
      is_recurring: 0,
      recurrence_rule: null,
      recurrence_end_date: null
    }
    
    const response = await onCreateTask(payload)
    
    if (response.success) {
      setTitle('')
      setShowSuccess(true)
      // Keep expanded for next task
      inputRef.current?.focus()
    }
    
    setIsAdding(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      if (title.trim()) {
        setTitle('')
      } else {
        setIsExpanded(false)
      }
    }
  }

  const getSelectedProject = () => {
    return projects.find(p => p.id === projectId)
  }

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  }

  // Collapsed state - just the FAB button
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center z-50 group"
        title="Quick add task (Ctrl+Shift+T)"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
      </button>
    )
  }

  // Expanded state - full form with X FAB button
  return (
    <>
      {/* X FAB Button to close */}
      <button
        onClick={() => setIsExpanded(false)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center z-50 group"
        title="Close (Esc)"
      >
        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Form Card */}
      <div
        ref={containerRef}
        className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-[560px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Quick Add Task</span>
            {showSuccess && (
              <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in">
                <Check className="w-3 h-3" />
                Added
              </span>
            )}
          </div>

          {/* Form Row */}
          <div className="flex items-center gap-2">
            {/* Project Selector */}
            <div className="relative" ref={dropdownRef.ref}>
              <button
                onClick={() => dropdownRef.setIsOpen(!dropdownRef.isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors text-sm min-w-[120px] max-w-[160px]"
              >
                <span className="truncate text-gray-700">
                  {getSelectedProject()?.title || 'No Project'}
                </span>
              </button>
              {dropdownRef.isOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setProjectId(null)
                      dropdownRef.setIsOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${!projectId ? 'bg-gray-100 text-gray-900' : ''}`}
                  >
                    No Project
                  </button>
                  {projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setProjectId(project.id)
                        dropdownRef.setIsOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 truncate ${projectId === project.id ? 'bg-gray-100 text-gray-900' : ''}`}
                    >
                      {project.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Selector */}
            <div className="relative" ref={priorityDropdownRef.ref}>
              <button
                onClick={() => priorityDropdownRef.setIsOpen(!priorityDropdownRef.isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors text-sm"
              >
                <div className={`w-2 h-2 rounded-full ${priorityColors[priority]}`} />
                <span className="capitalize text-gray-700">{priority}</span>
              </button>
              {priorityDropdownRef.isOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-32 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  {['high', 'medium', 'low'].map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setPriority(p)
                        priorityDropdownRef.setIsOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${priority === p ? 'bg-gray-100' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${priorityColors[p]}`} />
                      <span className="capitalize">{p}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Task Input */}
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />

            {/* Send Button */}
            <button
              onClick={handleAdd}
              disabled={!title.trim() || isAdding}
              className="w-10 h-10 bg-gray-900 text-white rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
            >
              {isAdding ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Hint */}
          <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
            <span>Press Enter to add, Esc to close</span>
            <span>{title.length}/200</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default QuickAddTask
