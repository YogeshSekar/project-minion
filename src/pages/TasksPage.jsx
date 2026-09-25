import { useState, useEffect } from 'react'
import { AlertCircle, ChevronDown, List, LayoutGrid, Filter, ArrowUpDown, Plus, Play, CheckCircle, Calendar, Trash2, Square, Loader2, Inbox, RefreshCw, Search, X, Layers3 } from 'lucide-react'
import { BoardView } from '../components/BoardView'
import ConfirmModal from '../components/ConfirmModal'
import TaskListView from '../components/TaskListView'
import DatePickerField from '../components/DatePickerField'
import useTasks from '../hooks/useTasks'
import useProjects from '../hooks/useProjects'
import useClickOutside from '../hooks/useClickOutside'
import { startActivity, stopCurrentActivity } from '../services/activityService'
import { getRunningActivity } from '../services/api'
import { formatDate, getPriorityBgColor, isOverdue } from '../utils/helpers'
import { groupCompletedTasks } from '../utils/taskGrouping'

function TasksLoadingState({ viewMode, showDone }) {
  if (viewMode === 'list') {
    return (
      <div className="h-full overflow-hidden bg-white" aria-label="Loading tasks" aria-busy="true">
        <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-3 animate-pulse rounded-full bg-slate-200" />)}
        </div>
        <div className="divide-y divide-slate-100 px-4">
          {Array.from({ length: 7 }).map((_, row) => (
            <div key={row} className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr] items-center gap-4 py-4">
              {Array.from({ length: 6 }).map((_, cell) => <div key={cell} className="h-4 animate-pulse rounded-full bg-slate-100" />)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[420px] gap-3 overflow-hidden bg-white p-4" aria-label="Loading tasks" aria-busy="true">
      {Array.from({ length: showDone ? 4 : 3 }).map((_, column) => (
        <div key={column} className="min-w-[260px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
            <div className="h-2.5 w-6 animate-pulse rounded-full bg-slate-300" />
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, card) => (
              <div key={card} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-4 h-4 animate-pulse rounded-full bg-slate-200" />
                <div className="flex gap-2">
                  <div className="h-5 w-14 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TasksPage({ taskRefreshTrigger = 0, openTaskModal, onActivityStarted, onActivityStopped, runningActivity: propRunningActivity }) {
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('tasks.viewMode') || 'board')
  const [showDone, setShowDone] = useState(() => localStorage.getItem('tasks.showDone') === 'true')
  const [filterOption, setFilterOption] = useState('all')
  const [priorityFilters, setPriorityFilters] = useState([])
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')
  const [sortOption, setSortOption] = useState(() => localStorage.getItem('tasks.sort.option') || 'created_date')
  const [sortDirection, setSortDirection] = useState(() => localStorage.getItem('tasks.sort.direction') || 'desc')
  const [listGroupBy, setListGroupBy] = useState(() => localStorage.getItem('tasks.list.groupBy') || 'date')
  const [selectedProjects, setSelectedProjects] = useState([])
  const [projectSearch, setProjectSearch] = useState('')
  const [focusTaskId, setFocusTaskId] = useState(null)

  // Use hooks for data management
  const { tasks, loading: tasksLoading, error: tasksError, createTask, updateTask, deleteTask, loadTasks } = useTasks()
  const { projects, loading: projectsLoading, error: projectsError, loadProjects } = useProjects()


  // Use click-outside hooks for dropdowns
  const dateDropdown = useClickOutside()
  const priorityDropdown = useClickOutside()
  const sortDropdown = useClickOutside()
  const groupDropdown = useClickOutside()

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

  useEffect(() => {
    localStorage.setItem('tasks.sort.option', sortOption)
    localStorage.setItem('tasks.sort.direction', sortDirection)
  }, [sortOption, sortDirection])

  useEffect(() => {
    localStorage.setItem('tasks.list.groupBy', listGroupBy)
  }, [listGroupBy])

  useEffect(() => {
    localStorage.setItem('tasks.viewMode', viewMode)
    localStorage.setItem('tasks.showDone', String(showDone))
  }, [viewMode, showDone])

  useEffect(() => {
    const applyPreferences = event => {
      if (event.detail?.viewMode) setViewMode(event.detail.viewMode)
      if (typeof event.detail?.showDone === 'boolean') setShowDone(event.detail.showDone)
    }
    window.addEventListener('tasks-preferences-change', applyPreferences)
    return () => window.removeEventListener('tasks-preferences-change', applyPreferences)
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

  // Add a key to force TaskListView re-render when sort changes
  const listViewKey = `${sortOption}-${sortDirection}-${listGroupBy}-${filterOption}-${customDateStart}-${customDateEnd}-${priorityFilters.join('-')}-${selectedProjects.join('-')}`

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

  const handleEditTask = (task, options = {}) => {
    openTaskModal(task, 'edit', options)
  }
  const handleLinkPage = task => handleEditTask(task, { openPages: true })

  const handleQuickAddTask = async (status, title, overrides = {}) => {
    const quickAddDate = new Date()
    if (filterOption === 'tomorrow') quickAddDate.setDate(quickAddDate.getDate() + 1)
    if (filterOption === 'overdue') quickAddDate.setDate(quickAddDate.getDate() - 1)
    const scheduledDate = filterOption === 'all' || filterOption === 'no_date'
      ? null
      : filterOption === 'custom'
      ? customDateStart || null
      : quickAddDate.toISOString().split('T')[0]
    const response = await createTask({
      title,
      description: null,
      status,
      priority: overrides.priority || priorityFilters[0] || 'medium',
      due_date: null,
      scheduled_date: overrides.scheduled_date !== undefined ? overrides.scheduled_date : scheduledDate,
      project_id: overrides.project_id !== undefined ? overrides.project_id : selectedProjects[0] || null,
      is_recurring: 0,
      recurrence_type: null,
      recurrence_interval: 1,
      meeting_id: null
    })

    if (response.success && response.data && overrides.focusAfterCreate !== false) {
      setFocusTaskId(response.data.id)
    }

    return response
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
  const loadError = tasksError || projectsError
  const initialLoading = loading && tasks.length === 0
  const hasActiveFilters = filterOption !== 'all' || priorityFilters.length > 0 || selectedProjects.length > 0

  const clearAllFilters = () => {
    setFilterOption('all')
    setPriorityFilters([])
    setCustomDateStart('')
    setCustomDateEnd('')
    setSelectedProjects([])
  }

  const retryLoading = () => {
    loadTasks()
    loadProjects()
  }

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
    } else if (filterOption === 'tomorrow') {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      filtered = filtered.filter(t => {
        if (!t.scheduled_date) return false
        const scheduledDate = new Date(t.scheduled_date)
        scheduledDate.setHours(0, 0, 0, 0)
        return scheduledDate.getTime() === tomorrow.getTime()
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
    } else if (filterOption === 'overdue') {
      filtered = filtered.filter(t => {
        if (!t.scheduled_date || t.status === 'completed') return false
        const scheduledDate = new Date(t.scheduled_date)
        scheduledDate.setHours(0, 0, 0, 0)
        return scheduledDate < today
      })
    } else if (filterOption === 'no_date') {
      filtered = filtered.filter(t => !t.scheduled_date)
    } else if (filterOption === 'custom') {
      const start = customDateStart ? new Date(customDateStart) : null
      const end = customDateEnd ? new Date(customDateEnd) : null
      if (start) start.setHours(0, 0, 0, 0)
      if (end) end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(t => {
        if (!t.scheduled_date) return false
        const scheduledDate = new Date(t.scheduled_date)
        return (!start || scheduledDate >= start) && (!end || scheduledDate <= end)
      })
    }

    // Project filter
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(t => t.project_id && selectedProjects.includes(t.project_id))
    }

    // Priority filter
    if (priorityFilters.length > 0) {
      filtered = filtered.filter(t => priorityFilters.includes(String(t.priority).toLowerCase()))
    }

    // Sort with sensible tie-breakers. Missing dates always remain at the end.
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return [...filtered].sort((a, b) => {
      const aDate = a.scheduled_date ? new Date(a.scheduled_date).getTime() : null
      const bDate = b.scheduled_date ? new Date(b.scheduled_date).getTime() : null
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0

      const cmpPriority = (x, y) => (priorityOrder[x] ?? 1) - (priorityOrder[y] ?? 1)
      const direction = sortDirection === 'asc' ? 1 : -1

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
          if (aDate !== bDate) return (aDate - bDate) * direction
          // same date -> priority -> created
          {
            const p = cmpPriority(a.priority, b.priority) * direction
            if (p !== 0) return p
            return bCreated - aCreated
          }
        case 'priority':
          {
            // Priority uses a semantic order: descending is High → Medium → Low,
            // while ascending is Low → Medium → High.
            const p = cmpPriority(a.priority, b.priority) * (sortDirection === 'desc' ? 1 : -1)
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
          if (bCreated !== aCreated) return (aCreated - bCreated) * direction
          // fallback to date then priority
          if (aDate !== bDate) {
            if (aDate === null) return 1
            if (bDate === null) return -1
            return aDate - bDate
          }
          return cmpPriority(a.priority, b.priority)
        case 'name':
          {
            const nameCmp = (a.title || '').localeCompare(b.title || '') * direction
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
  const { oneTimeTasks } = groupCompletedTasks(completedTasks)
  
  const visibleTasks = [
    ...pendingTasks,
    ...inProgressTasks,
    ...waitingTasks,
    ...(showDone ? oneTimeTasks : [])
  ]

  // Add state for projects dropdown
  const projectsDropdown = useClickOutside()
  const orderedProjects = [...projects]
    .filter(project => project.title.toLowerCase().includes(projectSearch.trim().toLowerCase()))
    .sort((a, b) => {
      const selectedDifference = Number(selectedProjects.includes(b.id)) - Number(selectedProjects.includes(a.id))
      return selectedDifference || a.title.localeCompare(b.title)
    })
  const dateFilterLabels = {
    all: 'Any',
    today: 'Today',
    tomorrow: 'Tomorrow',
    this_week: 'This week',
    overdue: 'Overdue',
    no_date: 'No date',
    custom: 'Custom'
  }
  const priorityFilterLabel = priorityFilters.length === 0
    ? 'Any'
    : priorityFilters.length === 1
    ? `${priorityFilters[0].charAt(0).toUpperCase()}${priorityFilters[0].slice(1)}`
    : `${priorityFilters.length} selected`
  const sortLabel = sortOption === 'created_date'
    ? (sortDirection === 'desc' ? 'Recently created' : 'Oldest created')
    : sortOption === 'due_date'
    ? 'Due date'
    : sortOption === 'priority'
    ? 'Priority'
    : (sortDirection === 'asc' ? 'Name A–Z' : 'Name Z–A')
  const listGroupLabels = { none: 'None', date: 'Date', priority: 'Priority', status: 'Status', project: 'Project' }
  const chooseSort = (option, direction) => {
    setSortOption(option)
    setSortDirection(direction)
    sortDropdown.setIsOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-white">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
      {/* Top Controls Section - Fixed */}
      <div className="relative z-30 flex-shrink-0 overflow-visible border-b border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <div className="contents">
            <div
              className="relative order-last ml-auto flex h-10 shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-0.5"
              role="group"
              aria-label="Task view"
            >
              <span
          className={`pointer-events-none absolute inset-y-0.5 left-0.5 w-24 rounded-full border border-accent-border bg-accent-muted transition-transform duration-300 ease-out ${viewMode === 'list' ? 'translate-x-[100px]' : 'translate-x-0'}`}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setViewMode('board')}
                aria-pressed={viewMode === 'board'}
                className={`relative z-10 flex h-9 w-24 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors duration-300 ${
                  viewMode === 'board'
                  ? 'text-accent-text'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                title="Board View"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Board</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`relative z-10 flex h-9 w-24 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors duration-300 ${
                  viewMode === 'list'
                  ? 'text-accent-text'
                    : 'text-slate-700 hover:text-slate-900'
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
            >
              <button
                type="button"
                onClick={() => {
                  const nextOpen = !projectsDropdown.isOpen
                  projectsDropdown.setIsOpen(nextOpen)
                  if (nextOpen) setProjectSearch('')
                }}
              className={`inline-flex h-9 min-w-[180px] max-w-[240px] items-center justify-between gap-2 rounded-full border px-3 text-sm font-medium transition-colors ${projectsDropdown.isOpen || selectedProjects.length > 0 ? 'border-accent-focus bg-accent-surface text-accent-text' : 'border-slate-200 bg-white text-slate-700 hover:border-accent-border hover:bg-accent-surface/50'}`}
                aria-expanded={projectsDropdown.isOpen}
                aria-haspopup="listbox"
              >
                <span className="truncate text-left">
                  {selectedProjects.length === 0
                    ? 'All projects'
                    : selectedProjects.length === 1
                    ? projects.find(p => p.id === selectedProjects[0])?.title || 'Project'
                    : `${selectedProjects.length} projects`}
                </span>
                <ChevronDown className={`h-4 w-4 flex-none transition-transform duration-200 ${projectsDropdown.isOpen ? 'rotate-180' : ''}`} />
              </button>
              {projectsDropdown.isOpen && (
                <div
                  className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-md"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="p-3">
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Select projects</span>
                      {selectedProjects.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedProjects([])}
                    className="text-xs font-semibold text-accent-text hover:text-accent-solid-hover"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>

                    <div className="relative mb-2">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        value={projectSearch}
                        onChange={(event) => setProjectSearch(event.target.value)}
                        placeholder="Search projects"
                  className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-accent-focus focus:bg-white focus:ring-2 focus:ring-accent-focus/30"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-64 space-y-1 overflow-auto">
                      {orderedProjects.map(project => (
                        <label key={project.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          selectedProjects.includes(project.id)
                          ? 'bg-accent-surface text-accent-text'
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
                          className="rounded border-gray-300 accent-accent-solid focus:ring-accent-focus"
                          />
                          <span className="truncate">{project.title}</span>
                        </label>
                      ))}
                      {orderedProjects.length === 0 && (
                        <div className="px-3 py-6 text-center text-sm text-gray-400">No projects found</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div ref={dateDropdown.ref} className="relative z-40">
              <button
                type="button"
                onClick={() => dateDropdown.setIsOpen(!dateDropdown.isOpen)}
              className={`inline-flex h-9 min-w-[128px] items-center justify-between gap-2 rounded-full border bg-white px-3 text-sm font-medium transition-colors ${dateDropdown.isOpen || filterOption !== 'all' ? 'border-accent-focus bg-accent-surface text-accent-text' : 'border-gray-200 text-slate-700 hover:bg-gray-50 hover:text-slate-900'}`}
                aria-expanded={dateDropdown.isOpen}
              >
                <Calendar className="h-4 w-4" />
                <span className="whitespace-nowrap">Date: {dateFilterLabels[filterOption]}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${dateDropdown.isOpen ? 'rotate-180' : ''}`} />
              </button>
              {dateDropdown.isOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-md">
                  {[
                    ['all', 'Any date'], ['today', 'Today'], ['tomorrow', 'Tomorrow'],
                    ['this_week', 'This week'], ['overdue', 'Overdue'], ['no_date', 'No date'], ['custom', 'Custom range']
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setFilterOption(value)
                        if (value !== 'custom') dateDropdown.setIsOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${filterOption === value ? 'bg-accent-surface font-semibold text-accent-text' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {label}
                      {filterOption === value && <CheckCircle className="h-4 w-4" />}
                    </button>
                  ))}
                  {filterOption === 'custom' && (
                    <div className="mt-2 space-y-2 border-t border-gray-100 p-2 pt-3">
                      <label className="block text-xs font-medium text-gray-500">From
                        <DatePickerField value={customDateStart} onChange={setCustomDateStart} placeholder="Start date" ariaLabel="Select custom range start date" className="mt-1 w-full" />
                      </label>
                      <label className="block text-xs font-medium text-gray-500">To
                        <DatePickerField value={customDateEnd} onChange={setCustomDateEnd} placeholder="End date" ariaLabel="Select custom range end date" className="mt-1 w-full" />
                      </label>
                      <button type="button" onClick={() => dateDropdown.setIsOpen(false)} className="h-9 w-full rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">Done</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div ref={priorityDropdown.ref} className="relative z-40">
              <button
                type="button"
                onClick={() => priorityDropdown.setIsOpen(!priorityDropdown.isOpen)}
              className={`inline-flex h-9 min-w-[140px] items-center justify-between gap-2 rounded-full border bg-white px-3 text-sm font-medium transition-colors ${priorityDropdown.isOpen || priorityFilters.length > 0 ? 'border-accent-focus bg-accent-surface text-accent-text' : 'border-gray-200 text-slate-700 hover:bg-gray-50 hover:text-slate-900'}`}
                aria-expanded={priorityDropdown.isOpen}
              >
                <span className="whitespace-nowrap">Priority: {priorityFilterLabel}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${priorityDropdown.isOpen ? 'rotate-180' : ''}`} />
              </button>
              {priorityDropdown.isOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Priorities</span>
                {priorityFilters.length > 0 && <button type="button" onClick={() => setPriorityFilters([])} className="text-xs font-semibold text-accent-text hover:text-accent-solid-hover">Clear</button>}
                  </div>
                  {[
                    ['high', 'High', 'bg-red-500'], ['medium', 'Medium', 'bg-amber-500'], ['low', 'Low', 'bg-emerald-500']
                  ].map(([value, label, dot]) => (
                  <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm ${priorityFilters.includes(value) ? 'bg-accent-surface text-accent-text' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        checked={priorityFilters.includes(value)}
                        onChange={event => setPriorityFilters(event.target.checked ? [...priorityFilters, value] : priorityFilters.filter(item => item !== value))}
                      className="rounded border-gray-300 accent-accent-solid"
                      />
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div ref={sortDropdown.ref} className="relative z-40">
              <button
                type="button"
                onClick={() => sortDropdown.setIsOpen(!sortDropdown.isOpen)}
                className={`inline-flex h-9 min-w-[176px] items-center justify-between gap-2 rounded-full border bg-white px-3 text-sm font-medium transition-colors ${
                  sortDropdown.isOpen || sortOption !== 'created_date' || sortDirection !== 'desc'
                ? 'border-accent-focus text-accent-text'
                    : 'border-gray-200 text-slate-700 hover:bg-gray-50 hover:text-slate-900'
                }`}
                aria-expanded={sortDropdown.isOpen}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="whitespace-nowrap">Sort: {sortLabel}</span>
                <span aria-hidden="true" className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              </button>
              {sortDropdown.isOpen && (
                <div className="absolute left-0 top-full z-10 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-md">
                  <div className="p-3">
                    <div className="mb-2 flex items-center justify-between px-2 py-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Sort by</span>
                      <button
                        type="button"
                        onClick={() => setSortDirection(current => current === 'asc' ? 'desc' : 'asc')}
                  className="rounded-full border border-accent-border bg-accent-surface px-2.5 py-1 text-xs font-semibold text-accent-text transition-colors hover:bg-accent-surface-hover"
                        title={`Switch to ${sortDirection === 'asc' ? 'descending' : 'ascending'} order`}
                      >
                        {sortDirection === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {[
                        ['created_date', 'desc', 'Recently created'],
                        ['created_date', 'asc', 'Oldest created'],
                        ['due_date', 'asc', 'Due date'],
                        ['priority', 'desc', 'Priority'],
                        ['name', 'asc', 'Name A–Z'],
                        ['name', 'desc', 'Name Z–A']
                      ].map(([option, direction, label]) => {
                        const selected = sortOption === option && sortDirection === direction
                        return (
                          <button
                            key={`${option}-${direction}`}
                            type="button"
                            onClick={() => chooseSort(option, direction)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${selected ? 'bg-accent-surface font-semibold text-accent-text' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            <span>{label}</span>
                            {selected && <CheckCircle className="h-4 w-4" />}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-2 border-t border-gray-100 px-2 pt-2 text-xs leading-5 text-gray-500">
                      Board dragging changes task status. Saved manual ordering is not available yet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {viewMode === 'list' && (
              <div ref={groupDropdown.ref} className="relative z-40">
                <button
                  type="button"
                  onClick={() => groupDropdown.setIsOpen(!groupDropdown.isOpen)}
                  className={`inline-flex h-9 min-w-[132px] items-center justify-between gap-2 rounded-full border bg-white px-3 text-sm font-medium transition-colors ${
                    groupDropdown.isOpen || listGroupBy !== 'none'
                ? 'border-accent-focus text-accent-text'
                      : 'border-gray-200 text-slate-700 hover:bg-gray-50 hover:text-slate-900'
                  }`}
                  aria-expanded={groupDropdown.isOpen}
                >
                  <Layers3 className="h-4 w-4" />
                  <span className="whitespace-nowrap">Group: {listGroupLabels[listGroupBy]}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${groupDropdown.isOpen ? 'rotate-180' : ''}`} />
                </button>
                {groupDropdown.isOpen && (
                  <div className="absolute left-0 top-full z-10 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-md">
                    {[
                      ['date', 'Date'],
                      ['priority', 'Priority'],
                      ['status', 'Status'],
                      ['project', 'Project'],
                      ['none', 'No grouping']
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setListGroupBy(value); groupDropdown.setIsOpen(false) }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${listGroupBy === value ? 'bg-accent-surface font-semibold text-accent-text' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span>{label}</span>
                        {listGroupBy === value && <CheckCircle className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDone(!showDone)}
              className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                showDone
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50 hover:text-slate-900'
              }`}
              title={showDone ? 'Hide completed tasks' : 'Show completed tasks'}
              aria-label={showDone ? 'Hide completed tasks' : 'Show completed tasks'}
              aria-pressed={showDone}
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => openTaskModal()}
          className="order-first inline-flex h-9 items-center justify-center gap-2 rounded-full border border-accent-solid bg-accent-solid px-4 text-sm font-semibold text-accent-foreground transition-colors duration-200 hover:border-accent-solid-hover hover:bg-accent-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
          >
            <Plus className="h-4 w-4" />
            New task
          </button>
        </div>

        {selectedProjects.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3" aria-label="Selected project filters">
            {selectedProjects.map(projectId => {
              const project = projects.find(item => item.id === projectId)
              if (!project) return null

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjects(selectedProjects.filter(id => id !== project.id))}
              className="inline-flex h-7 max-w-[220px] items-center gap-1.5 rounded-full border border-accent-border bg-accent-surface px-2.5 text-xs font-semibold text-accent-text transition-colors hover:border-accent-focus hover:bg-accent-surface-hover"
                  title={`Remove ${project.title} filter`}
                >
                  <span className="truncate">{project.title}</span>
                  <X className="h-3.5 w-3.5 flex-none" />
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setSelectedProjects([])}
              className="h-7 rounded-full px-2.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
        {initialLoading ? (
          <TasksLoadingState viewMode={viewMode} showDone={showDone} />
        ) : loadError ? (
          <div className="flex h-full min-h-[360px] items-center justify-center bg-white px-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">Tasks could not be loaded</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{String(loadError)}</p>
              <button
                type="button"
                onClick={retryLoading}
                disabled={loading}
                className="mx-auto mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Retrying…' : 'Try again'}
              </button>
            </div>
          </div>
        ) : allTasks.length === 0 && (viewMode !== 'list' || !hasActiveFilters) ? (
          <div className="flex h-full min-h-[360px] items-center justify-center bg-white px-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                {hasActiveFilters ? <Filter className="h-5 w-5" /> : <Inbox className="h-5 w-5" />}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                {hasActiveFilters ? 'No tasks match these filters' : 'No tasks yet'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? 'Adjust or clear the active filters to bring tasks back into view.'
                  : 'Create your first task and start organizing your work.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openTaskModal()}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-accent-solid px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-solid-hover"
                >
                  <Plus className="h-4 w-4" />
                  New task
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* List Layout */
          <div className="h-full min-h-0 min-w-0 flex flex-col">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <TaskListView
                  key={listViewKey}
                  tasks={visibleTasks}
                  projects={projects}
                  groupBy={listGroupBy}
                  onUpdateTask={handleUpdateTask}
                  onEdit={handleEditTask}
                  onLinkPage={handleLinkPage}
                  onDelete={handleDeleteTask}
                  onAddToToday={handleAddToToday}
                  onStartActivity={handleStartTaskActivity}
                  onStopActivity={handleStopTaskActivity}
                  runningActivity={runningActivity}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={clearAllFilters}
                  onQuickAddTask={handleQuickAddTask}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Board View */
          <div className="h-full min-h-0 overflow-hidden bg-transparent">
            <BoardView
              tasks={allTasks}
              projects={projects}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              onLinkPage={handleLinkPage}
              onAddToToday={handleAddToToday}
              onStartActivity={handleStartTaskActivity}
              onStopActivity={handleStopTaskActivity}
              runningActivity={runningActivity}
              showDone={showDone}
              onQuickAddTask={handleQuickAddTask}
              focusTaskId={focusTaskId}
              onTaskFocusHandled={() => setFocusTaskId(null)}
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
    </div>
  )
}

export default TasksPage
