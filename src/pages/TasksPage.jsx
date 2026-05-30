import { useState, useEffect } from 'react'
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
  const [filterOption, setFilterOption] = useState('all')
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
      onCancel: () => {
        if (config.onCancel) config.onCancel()
        setConfirmModalOpen(false)
      }
    })
    setConfirmModalOpen(true)
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
    let filtered = taskList
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

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'due_date':
          if (!a.scheduled_date && !b.scheduled_date) return 0
          if (!a.scheduled_date) return 1
          if (!b.scheduled_date) return -1
          return new Date(a.scheduled_date) - new Date(b.scheduled_date)
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
        case 'created_date':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        case 'name':
          return (a.title || '').localeCompare(b.title || '')
        default:
          return 0
      }
    })
  }

  const allTasks = getFilteredAndSortedTasks(tasks)
  const pendingTasks = allTasks.filter(t => t.status === 'todo')
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress')

  const completedTasks = allTasks.filter(t => t.status === 'completed')
  
  // Group completed tasks for recurring tasks
  const { oneTimeTasks, groupedRecurring } = groupCompletedTasks(completedTasks)
  
  const visibleTasks = [
    ...(showTodo ? pendingTasks : []),
    ...(showInProgress ? inProgressTasks : []),
    ...(showCompleted ? oneTimeTasks : [])
  ]

  return (
    <div className="h-full bg-gray-60 flex gap-4 p-4">
      {/* Right Sidebar - Controls */}
      <div className="w-64 flex flex-col overflow-hidden">
        <div className="h-full bg-white rounded-2xl border border-gray-200 flex flex-col p-4 gap-4 overflow-hidden">
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setViewMode('board')}
            className={`flex-1 px-3 py-2 rounded-full transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
              viewMode === 'board'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Board View"
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 px-3 py-2 rounded-full transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>

        {/* Filter Button */}
        <div ref={filterDropdown.ref} className="relative">
          <button
            onClick={() => filterDropdown.setIsOpen(!filterDropdown.isOpen)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full border transition-colors text-sm font-medium ${
              filterDropdown.isOpen || filterOption !== 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            {filterOption !== 'all' && (
              <span className="text-xs bg-white/20 rounded px-1.5">
                {filterOption === 'today' ? 'Today' : 'This Week'}
              </span>
            )}
          </button>
          {filterDropdown.isOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg border border-gray-200 z-10">
              <div className="p-3">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 mb-2">Filter Options</div>
                <div className="space-y-1">
                  <label 
                    onClick={() => setFilterOption('all')}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition-colors ${
                      filterOption === 'all' 
                        ? 'bg-gray-200 text-gray-900' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="filter" 
                      checked={filterOption === 'all'}
                      onChange={() => setFilterOption('all')}
                      className="rounded" 
                    />
                    <span>All Tasks</span>
                  </label>
                  <label 
                    onClick={() => setFilterOption('today')}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition-colors ${
                      filterOption === 'today' 
                        ? 'bg-gray-200 text-gray-900' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="filter" 
                      checked={filterOption === 'today'}
                      onChange={() => setFilterOption('today')}
                      className="rounded" 
                    />
                    <span>Today</span>
                  </label>
                  <label 
                    onClick={() => setFilterOption('this_week')}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition-colors ${
                      filterOption === 'this_week' 
                        ? 'bg-gray-200 text-gray-900' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="filter" 
                      checked={filterOption === 'this_week'}
                      onChange={() => setFilterOption('this_week')}
                      className="rounded" 
                    />
                    <span>This Week</span>
                  </label>
                </div>
                              </div>
            </div>
          )}
        </div>

        {/* Sort Button */}
        <div ref={sortDropdown.ref} className="relative">
          <button
            onClick={() => sortDropdown.setIsOpen(!sortDropdown.isOpen)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full border transition-colors text-sm font-medium ${
              sortDropdown.isOpen || sortOption !== 'created_date'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Sort</span>
            {sortOption !== 'created_date' && (
              <span className="text-xs bg-white/20 rounded px-1.5">
                {sortOption === 'due_date' ? 'Due' : sortOption === 'priority' ? 'Pri' : 'Name'}
              </span>
            )}
          </button>
          {sortDropdown.isOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg border border-gray-200 z-10">
              <div className="p-3">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 mb-2">Sort By</div>
                <div className="space-y-1">
                  <button
                    onClick={() => setSortOption('due_date')}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                      sortOption === 'due_date'
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Date
                  </button>
                                    <button
                    onClick={() => setSortOption('created_date')}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                      sortOption === 'created_date'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    Created Date
                  </button>
                  <button
                    onClick={() => setSortOption('name')}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                      sortOption === 'name'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    Name
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Filter */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Projects</div>
          <div className="flex-1 overflow-auto space-y-1">
            <label className={`flex items-center justify-between px-3 py-2 rounded-full cursor-pointer transition-colors ${
              selectedProjects.length === 0
                ? 'bg-gray-200 text-gray-900 border-2 border-gray-900'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
              <span className="text-sm font-medium">All Projects</span>
              <input
                type="checkbox"
                checked={selectedProjects.length === 0}
                onChange={() => setSelectedProjects([])}
                className="rounded border-gray-900 text-gray-900 focus:ring-gray-900 accent-gray-900"
              />
            </label>
            {projects.map(project => (
              <label key={project.id} className={`flex items-center justify-between px-3 py-2 rounded-full cursor-pointer transition-colors ${
                selectedProjects.includes(project.id)
                  ? 'bg-gray-200 text-gray-900 border-2 border-gray-900'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
                <span className="text-sm font-medium truncate">{project.title}</span>
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
                  className="rounded border-gray-900 text-gray-900 focus:ring-gray-900 accent-gray-900"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Left Main Content */}
      <div className="flex-1 flex flex-col relative">
        {viewMode === 'list' ? (
          /* Table Layout */
          <div className="h-full flex flex-col">
            {/* Task List - Table View */}
            <div className="w-full h-full flex flex-col">
              {/* Merged Container: Status Filter + Task List */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Single Card with Status Filter + Task List */}
                <div className="flex-1 flex flex-col h-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  {/* Status Toggle Buttons - Fixed Header */}
                  <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
                    {/* Priority Legend */}
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

                  {/* Active Tasks List - Scrollable */}
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

                    {/* Grouped Recurring Completed Tasks */}
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
              </div>
            </div>
        ) : (
          /* Board View */
          <div className="h-full overflow-hidden">
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
