import { useState, useEffect, useRef } from 'react'
import { List, LayoutGrid, Filter, ArrowUpDown, Plus, Play, CheckCircle, Calendar, Trash2, Square, Loader2 } from 'lucide-react'
import { BoardView } from '../components/BoardView'
import ConfirmModal from '../components/ConfirmModal'
import TaskCard from '../components/TaskCard'
import GroupedCompletedTaskCard from '../components/GroupedCompletedTaskCard'
import useTasks from '../hooks/useTasks'
import useProjects from '../hooks/useProjects'
import useClickOutside from '../hooks/useClickOutside'
import { startActivity, stopCurrentActivity } from '../services/activityService'
import { getRunningActivity } from '../services/api'
import { formatDate, getPriorityBgColor, isOverdue } from '../utils/helpers'
import { groupCompletedTasks } from '../utils/taskGrouping'

function TasksPage({ taskRefreshTrigger = 0, openTaskModal, onActivityStarted, onActivityStopped, runningActivity: propRunningActivity }) {
  const [viewMode, setViewMode] = useState('board')
  const [showCompleted, setShowCompleted] = useState(false)
  const [showTodo, setShowTodo] = useState(true)
  const [showInProgress, setShowInProgress] = useState(true)
  const [showWaiting, setShowWaiting] = useState(true)
  const [filterOption, setFilterOption] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sortOption, setSortOption] = useState('created_date')
  const [selectedProjects, setSelectedProjects] = useState([])

  // Use hooks for data management
  const { tasks, loading: tasksLoading, updateTask, deleteTask, loadTasks } = useTasks()
  const { projects, loading: projectsLoading } = useProjects()


  // Use click-outside hooks for dropdowns
  const filterDropdown = useClickOutside()
  const sortDropdown = useClickOutside()

  // Confirm modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger'
  })

  // Use running activity from props if provided, otherwise track locally
  const runningActivity = propRunningActivity !== undefined ? propRunningActivity : localRunningActivity
  const [localRunningActivity, setLocalRunningActivity] = useState(null)

  // Load running activity on mount (only if not provided via props)
  useEffect(() => {
    if (propRunningActivity === undefined) {
      loadRunningActivity()
    }
  }, [])

  const loadRunningActivity = async () => {
    try {
      const response = await getRunningActivity()
      if (response.success) {
        setLocalRunningActivity(response.data || null)
      }
    } catch (error) {
      console.error('Error loading running activity:', error)
    }
  }

  const handleStartTaskActivity = async (task) => {
    try {
      // If the task is in 'todo' status, update it to 'in_progress' before starting activity
      if (task.status === 'todo') {
        const updateResp = await updateTask({ ...task, status: 'in_progress' })
        if (!updateResp.success) {
          console.error('Error updating task status to in_progress:', updateResp.error)
        } else {
          // Update the local task object to reflect new status for subsequent activity payload
          task = { ...task, status: 'in_progress' }
        }
      }
      const response = await startActivity({
        title: task.title,
        activity_type: 'focus_session',
        source: 'manual',
        reference_type: 'task',
        reference_id: task.id,
        project_id: task.project_id
      })
      if (response.success) {
        if (propRunningActivity === undefined) {
          await loadRunningActivity()
        }
        if (onActivityStarted) {
          onActivityStarted(response.data, task)
        }
      }
    } catch (error) {
      console.error('Error starting task activity:', error)
    }
  }

  const handleStopTaskActivity = async () => {
    try {
      const response = await stopCurrentActivity()
      if (response.success) {
        if (propRunningActivity === undefined) {
          setLocalRunningActivity(null)
        }
        if (onActivityStopped) {
          onActivityStopped()
        }
      }
    } catch (error) {
      console.error('Error stopping task activity:', error)
    }
  }

  // Refresh data when trigger changes
  useEffect(() => {
    if (taskRefreshTrigger > 0) {
      loadTasks()
    }
  }, [taskRefreshTrigger, loadTasks])

  const handleUpdateTask = async (updatedTask) => {
    const response = await updateTask(updatedTask)
    if (!response.success) {
      console.error('Error updating task:', response.error)
    }
    return response
  }

  const showConfirm = (config) => {
    setConfirmModalConfig({
      ...config,
      onConfirm: () => {
        config.onConfirm()
        setConfirmModalOpen(false)
      },
      onCancel: () => {
        if (config.onCancel) config.onCancel()
        setConfirmModalOpen(false)
      }
    })
    setConfirmModalOpen(true)
  }

  const handleDeleteTask = async (taskId) => {
    showConfirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        const response = await deleteTask(taskId)
        if (!response.success) {
          alert('Failed to delete task: ' + (response.error || 'Unknown error'))
        }
      },
      // no-op onCancel (handled by showConfirm wrapper)
    })
    
  }

  const handleAddToToday = async (task) => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const response = await updateTask({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      scheduled_date: todayStr,
      project_id: task.project_id,
      is_recurring: task.is_recurring,
      recurrence_type: task.recurrence_type,
      recurrence_interval: task.recurrence_interval
    })
    if (!response.success) {
      console.error('Error adding task to today:', response.error)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-full border border-green-200">Completed</span>
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-600 rounded-full border border-yellow-200">In Progress</span>
      case 'waiting':
        return <span className="px-2 py-1 text-xs font-medium bg-purple-50 text-purple-600 rounded-full border border-purple-200">Waiting</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full border border-blue-200">To Do</span>
    }
  }

  const handleEditTask = (task) => {
    openTaskModal(task, 'edit')
  }

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    // TODO: Occurrence logic removed during frontend simplification
    // Now using single-task CRUD architecture
    const response = await updateTask({
      id: task.id,
      status: newStatus,
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date,
      scheduled_date: task.scheduled_date,
      project_id: task.project_id,
      is_recurring: task.is_recurring,
      recurrence_type: task.recurrence_type,
      recurrence_interval: task.recurrence_interval
    })
    if (!response.success) {
      console.error('Error toggling task completion:', response.error)
    }
  }

  // Combined loading state from hooks
  const loading = tasksLoading || projectsLoading

  // Filter and sort tasks
  const getFilteredAndSortedTasks = (taskList) => {
    // Filter
    let filtered = Array.isArray(taskList) ? taskList : []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (filterOption === 'today') {
      filtered = filtered.filter(t => {
        if (!t.scheduled_date) return false
        const scheduledDate = new Date(t.scheduled_date)
        scheduledDate.setHours(0, 0, 0, 0)
        return scheduledDate.getTime() === today.getTime()
      })
    } else if (filterOption === 'this_week') {
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      
      filtered = filtered.filter(t => {
        if (!t.scheduled_date) return false
        const scheduledDate = new Date(t.scheduled_date)
        return scheduledDate >= startOfWeek && scheduledDate <= endOfWeek
      })
    }

    // Project filter
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(t => t.project_id && selectedProjects.includes(t.project_id))
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => String(t.priority).toLowerCase() === priorityFilter)
    }

    // Sort with sensible tie-breakers
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return [...filtered].sort((a, b) => {
      const aDate = a.scheduled_date ? new Date(a.scheduled_date).getTime() : null
      const bDate = b.scheduled_date ? new Date(b.scheduled_date).getTime() : null
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0

      const cmpPriority = (x, y) => (priorityOrder[x] ?? 1) - (priorityOrder[y] ?? 1)

      switch (sortOption) {
        case 'due_date':
          if (aDate === null && bDate === null) {
            // fallback to priority then created
            const p = cmpPriority(a.priority, b.priority)
            if (p !== 0) return p
            return bCreated - aCreated
          }
          if (aDate === null) return 1
          if (bDate === null) return -1
          if (aDate !== bDate) return aDate - bDate
          // same date -> priority -> created
          {
            const p = cmpPriority(a.priority, b.priority)
            if (p !== 0) return p
            return bCreated - aCreated
          }
        case 'priority':
          {
            const p = cmpPriority(a.priority, b.priority)
            if (p !== 0) return p
            // fallback to earliest scheduled date, then recent created
            if (aDate !== bDate) {
              if (aDate === null) return 1
              if (bDate === null) return -1
              return aDate - bDate
            }
            return bCreated - aCreated
          }
        case 'created_date':
          if (bCreated !== aCreated) return bCreated - aCreated
          // fallback to date then priority
          if (aDate !== bDate) {
            if (aDate === null) return 1
            if (bDate === null) return -1
            return aDate - bDate
          }
          return cmpPriority(a.priority, b.priority)
        case 'name':
          {
            const nameCmp = (a.title || '').localeCompare(b.title || '')
            if (nameCmp !== 0) return nameCmp
            return bCreated - aCreated
          }
        default:
          return 0
      }
    })
  }

  const allTasks = getFilteredAndSortedTasks(tasks)
  const pendingTasks = allTasks.filter(t => t.status === 'todo')
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress')
  const waitingTasks = allTasks.filter(t => t.status === 'waiting')
  const completedTasks = allTasks.filter(t => t.status === 'completed')
  
  // Group completed tasks for recurring tasks
  const { oneTimeTasks, groupedRecurring } = groupCompletedTasks(completedTasks)
  
  const visibleTasks = [
    ...(showTodo ? pendingTasks : []),
    ...(showInProgress ? inProgressTasks : []),
    ...(showWaiting ? waitingTasks : []),
    ...(showCompleted ? oneTimeTasks : [])
  ]

  // Add state for projects dropdown
  const projectsDropdown = useClickOutside()
  const projectsHoverTimeoutRef = useRef(null)

  const clearProjectsHoverTimeout = () => {
    if (projectsHoverTimeoutRef.current) {
      clearTimeout(projectsHoverTimeoutRef.current)
      projectsHoverTimeoutRef.current = null
    }
  }

  const handleProjectsDropdownMouseEnter = () => {
    clearProjectsHoverTimeout()
    projectsDropdown.setIsOpen(true)
  }

  const handleProjectsDropdownMouseLeave = () => {
    clearProjectsHoverTimeout()
    projectsHoverTimeoutRef.current = setTimeout(() => {
      projectsDropdown.setIsOpen(false)
    }, 180)
  }

  useEffect(() => {
    return () => clearProjectsHoverTimeout()
  }, [])

  return (
    <div className="h-full bg-gray-60 flex flex-col p-4">
      {/* Top Controls Section - Fixed */}
      <div className="relative z-30 mb-4 flex-shrink-0 overflow-visible rounded-2xl border border-gray-200/80 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-start gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => setViewMode('board')}
                className={`flex h-9 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-all ${
                  viewMode === 'board'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
                title="Board View"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Board</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex h-9 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
                <span>List</span>
              </button>
            </div>

            <div
              ref={projectsDropdown.ref}
              className="relative z-40"
              onMouseEnter={handleProjectsDropdownMouseEnter}
              onMouseLeave={handleProjectsDropdownMouseLeave}
            >
              <button
                type="button"
                className="inline-flex h-9 min-w-[180px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <span className="truncate text-left">
                  {selectedProjects.length === 0
                    ? 'All projects'
                    : selectedProjects.length === 1
                    ? projects.find(p => p.id === selectedProjects[0])?.title || 'Project'
                    : `Multiple (${selectedProjects.length})`}
                </span>
              </button>
              {projectsDropdown.isOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white z-20 shadow-lg"
                  onMouseEnter={handleProjectsDropdownMouseEnter}
                  onMouseLeave={handleProjectsDropdownMouseLeave}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="p-3">
                    <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Select projects</div>
                    <div className="max-h-64 space-y-1 overflow-auto">
                      <label className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        selectedProjects.length === 0
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedProjects.length === 0}
                          onChange={() => setSelectedProjects([])}
                          className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 accent-gray-900"
                        />
                        <span>All projects</span>
                      </label>
                      {projects.map(project => (
                        <label key={project.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          selectedProjects.includes(project.id)
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjects([...selectedProjects, project.id])
                              } else {
                                setSelectedProjects(selectedProjects.filter(id => id !== project.id))
                              }
                            }}
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 accent-gray-900"
                          />
                          <span className="truncate">{project.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div ref={filterDropdown.ref} className="relative z-40">
              <button
                onClick={() => filterDropdown.setIsOpen(!filterDropdown.isOpen)}
                className={`inline-flex h-9 min-w-[112px] items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors ${
                  filterDropdown.isOpen || filterOption !== 'all'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {filterOption !== 'all' && (
                  <span className="rounded-full bg-white/20 px-1.5 text-[11px]">
                    {filterOption === 'today' ? 'Today' : 'Week'}
                  </span>
                )}
              </button>
              {filterDropdown.isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white z-10 shadow-lg">
                  <div className="p-3">
                    <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Filter options</div>
                    <div className="space-y-1">
                      <label
                        onClick={() => {
                          setFilterOption('all')
                          filterDropdown.setIsOpen(false)
                        }}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          filterOption === 'all'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="filter"
                          checked={filterOption === 'all'}
                          onChange={() => { setFilterOption('all'); filterDropdown.setIsOpen(false) }}
                          className="rounded"
                        />
                        <span>All tasks</span>
                      </label>
                      <label
                        onClick={() => { setFilterOption('today'); filterDropdown.setIsOpen(false) }}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          filterOption === 'today'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="filter"
                          checked={filterOption === 'today'}
                          onChange={() => { setFilterOption('today'); filterDropdown.setIsOpen(false) }}
                          className="rounded"
                        />
                        <span>Today</span>
                      </label>
                      <label
                        onClick={() => { setFilterOption('this_week'); filterDropdown.setIsOpen(false) }}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          filterOption === 'this_week'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="filter"
                          checked={filterOption === 'this_week'}
                          onChange={() => { setFilterOption('this_week'); filterDropdown.setIsOpen(false) }}
                          className="rounded"
                        />
                        <span>This week</span>
                      </label>
                    </div>
                    <div className="mt-4 border-t border-slate-200/80 pt-3">
                      <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Priority</div>
                      <div className="space-y-1">
                        <label
                          onClick={() => { setPriorityFilter('all'); filterDropdown.setIsOpen(false) }}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                            priorityFilter === 'all'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="priority"
                            checked={priorityFilter === 'all'}
                            onChange={() => { setPriorityFilter('all'); filterDropdown.setIsOpen(false) }}
                            className="rounded"
                          />
                          <span>All priorities</span>
                        </label>
                        <label
                          onClick={() => { setPriorityFilter('high'); filterDropdown.setIsOpen(false) }}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                            priorityFilter === 'high'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="priority"
                            checked={priorityFilter === 'high'}
                            onChange={() => { setPriorityFilter('high'); filterDropdown.setIsOpen(false) }}
                            className="rounded"
                          />
                          <span>High</span>
                        </label>
                        <label
                          onClick={() => { setPriorityFilter('medium'); filterDropdown.setIsOpen(false) }}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                            priorityFilter === 'medium'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="priority"
                            checked={priorityFilter === 'medium'}
                            onChange={() => { setPriorityFilter('medium'); filterDropdown.setIsOpen(false) }}
                            className="rounded"
                          />
                          <span>Medium</span>
                        </label>
                        <label
                          onClick={() => { setPriorityFilter('low'); filterDropdown.setIsOpen(false) }}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                            priorityFilter === 'low'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="priority"
                            checked={priorityFilter === 'low'}
                            onChange={() => { setPriorityFilter('low'); filterDropdown.setIsOpen(false) }}
                            className="rounded"
                          />
                          <span>Low</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={sortDropdown.ref} className="relative z-40">
              <button
                onClick={() => sortDropdown.setIsOpen(!sortDropdown.isOpen)}
                className={`inline-flex h-9 min-w-[112px] items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors ${
                  sortDropdown.isOpen || sortOption !== 'created_date'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort</span>
                {sortOption !== 'created_date' && (
                  <span className="rounded-full bg-white/20 px-1.5 text-[11px]">
                    {sortOption === 'due_date' ? 'Due' : sortOption === 'priority' ? 'Pri' : 'Name'}
                  </span>
                )}
              </button>
              {sortDropdown.isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white z-10 shadow-lg">
                  <div className="p-3">
                    <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Sort by</div>
                    <div className="space-y-1">
                      <button
                        onClick={() => { setSortOption('due_date'); sortDropdown.setIsOpen(false) }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          sortOption === 'due_date'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Date
                      </button>
                      <button
                        onClick={() => { setSortOption('created_date'); sortDropdown.setIsOpen(false) }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          sortOption === 'created_date'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Created date
                      </button>
                      <button
                        onClick={() => { setSortOption('priority'); sortDropdown.setIsOpen(false) }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          sortOption === 'priority'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Priority
                      </button>
                      <button
                        onClick={() => { setSortOption('name'); sortDropdown.setIsOpen(false) }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          sortOption === 'name'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Name
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden">
        {viewMode === 'list' ? (
          /* List Layout */
          <div className="h-full flex flex-col min-h-0">
            <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowTodo(!showTodo)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full transition-colors text-sm font-medium ${
                      showTodo
                        ? 'bg-gray-900 text-white hover:bg-gray-700'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>To Do</span>
                    {pendingTasks.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20">
                        {pendingTasks.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowInProgress(!showInProgress)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full transition-colors text-sm font-medium ${
                      showInProgress
                        ? 'bg-gray-900 text-white hover:bg-gray-700'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>In Progress</span>
                    {inProgressTasks.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20">
                        {inProgressTasks.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowWaiting(!showWaiting)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full transition-colors text-sm font-medium ${
                      showWaiting
                        ? 'bg-gray-900 text-white hover:bg-gray-700'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Waiting</span>
                    {waitingTasks.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20">
                        {waitingTasks.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full transition-colors text-sm font-medium ${
                      showCompleted
                        ? 'bg-gray-900 text-white hover:bg-gray-700'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Completed</span>
                    {(oneTimeTasks.length + groupedRecurring.length) > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20">
                        {oneTimeTasks.length + groupedRecurring.length}
                      </span>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-gray-600">Medium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Low</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto no-scrollbar p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
                  {visibleTasks.map(task => {
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        projects={projects}
                        onToggleComplete={handleToggleComplete}
                        onEdit={handleEditTask}
                        onStartActivity={handleStartTaskActivity}
                        onStopActivity={handleStopTaskActivity}
                        runningActivity={runningActivity}
                        onDelete={handleDeleteTask}
                        onAddToToday={handleAddToToday}
                      />
                    )
                  })}
                </div>

                {showCompleted && groupedRecurring.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
                      Recurring Completed
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
                      {groupedRecurring.map(group => (
                        <GroupedCompletedTaskCard
                          key={group.task_id}
                          group={group}
                          projects={projects}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          onToggleComplete={handleToggleComplete}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Board View */
          <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <BoardView
              tasks={allTasks}
              projects={projects}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              onAddToToday={handleAddToToday}
              onStartActivity={handleStartTaskActivity}
              onStopActivity={handleStopTaskActivity}
              runningActivity={runningActivity}
            />
          </div>
        )}

        
        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModalOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          cancelText={confirmModalConfig.cancelText}
          type={confirmModalConfig.type}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={confirmModalConfig.onCancel}
        />
      </div>
    </div>
  )
}

export default TasksPage
