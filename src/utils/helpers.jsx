// Date formatting utilities
export function getCurrentDateTime() {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDate(dateStr) {
  if (!dateStr) return 'No date'
  const date = parseDateWithoutTimezoneShift(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const date = parseDateWithoutTimezoneShift(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDateISO(date) {
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseDateWithoutTimezoneShift(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/)
  if (match && String(value).length === 10) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return new Date(value)
}

// Time formatting utilities
export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

// Priority color mappings
export function getPriorityColor(priority) {
  switch (priority) {
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'low':
      return 'text-blue-500'
    default:
      return 'text-gray-400'
  }
}

export function getPriorityBgColor(priority) {
  switch (priority) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-green-500'
    default:
      return 'bg-gray-400'
  }
}

export function getPriorityBorderColor(priority) {
  switch (priority) {
    case 'high':
      return 'border-red-500'
    case 'medium':
      return 'border-yellow-500'
    case 'low':
      return 'border-green-500'
    default:
      return 'border-gray-300'
  }
}

// Status color mappings
export function getStatusColor(status) {
  switch (status) {
    case 'active':
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
    case 'in_progress':
      return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700'
    case 'planning':
      return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700'
    case 'completed':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
    case 'on_hold':
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
    case 'pending':
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
  }
}

export function getStatusTextColor(status) {
  switch (status) {
    case 'active':
      return 'text-blue-500'
    case 'in_progress':
      return 'text-purple-500'
    case 'planning':
      return 'text-indigo-500'
    case 'completed':
      return 'text-green-500'
    case 'on_hold':
      return 'text-orange-500'
    case 'pending':
      return 'text-gray-400'
    default:
      return 'text-gray-400'
  }
}

// Project color mappings
export function getProjectColor(color) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  }
  return colors[color] || colors.gray
}

export function getProjectColorDark(color) {
  const colors = {
    blue: 'bg-blue-900/30 text-blue-400 border-blue-700',
    green: 'bg-green-900/30 text-green-400 border-green-700',
    purple: 'bg-red-900/30 text-red-400 border-red-700',
    gray: 'bg-gray-700 text-gray-400 border-gray-600'
  }
  return colors[color] || colors.gray
}

// String utilities
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function capitalizeFirst(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatStatusLabel(status) {
  if (!status) return ''
  return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Task-specific status utilities
export function getTaskStatusBadge(status) {
  switch (status) {
    case 'completed':
      return 'bg-green-50 text-green-600 border-green-200'
    case 'in_progress':
      return 'bg-yellow-50 text-yellow-600 border-yellow-200'
    case 'waiting':
      return 'bg-purple-50 text-purple-600 border-purple-200'
    case 'todo':
      return 'bg-blue-50 text-blue-600 border-blue-200'
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

export function getTaskStatusLabel(status) {
  switch (status) {
    case 'todo':
      return 'To Do'
    case 'in_progress':
      return 'In Progress'
    case 'waiting':
      return 'Waiting'
    case 'completed':
      return 'Completed'
    default:
      return status
  }
}

// Date comparison utilities
export function isToday(dateStr) {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  return date.getTime() === today.getTime()
}

export function isOverdue(dateStr) {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

export function isThisWeek(dateStr) {
  if (!dateStr) return false
  const today = new Date()
  const date = new Date(dateStr)
  const diffTime = date - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 7
}

// Date navigator helper functions
export function getWeekDays(selectedDate) {
  const days = []
  const startOfWeek = new Date(selectedDate)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    days.push(day)
  }
  return days
}

export function formatDateLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// Stats calculation utilities
export function calculateDailyStats(tasks, runningActivity) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayTasks = tasks.filter(task => {
    if (!task.scheduled_date) return false
    const taskDate = new Date(task.scheduled_date)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() === today.getTime()
  })
  
  const completedToday = todayTasks.filter(task => task.status === 'completed').length
  const totalToday = todayTasks.length
  const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
  
  // Calculate week stats
  const weekStart = new Date(today)
  const day = weekStart.getDay()
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)
  
  const weekTasks = tasks.filter(task => {
    if (!task.scheduled_date) return false
    const taskDate = new Date(task.scheduled_date)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() >= weekStart.getTime()
  })
  
  const completedThisWeek = weekTasks.filter(task => task.status === 'completed').length
  
  return {
    completedToday,
    totalToday,
    completionRate,
    completedThisWeek,
    totalWeek: weekTasks.length
  }
}

export function calculateProjectStats(projects, tasks) {
  const activeProjects = projects.filter(p => p.status !== 'completed').length
  const totalProjects = projects.length
  
  // Calculate overall project completion
  const completedTasks = tasks.filter(task => task.status === 'completed').length
  const totalTasks = tasks.length
  const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  return {
    activeProjects,
    totalProjects,
    overallCompletion
  }
}

export function calculateTimeStats(runningActivity) {
  // For now, return basic stats - can be enhanced with actual time tracking data
  const hasActiveSession = runningActivity !== null
  const sessionDuration = hasActiveSession ? 
    Math.floor((Date.now() - new Date(runningActivity.started_at).getTime()) / 1000 / 60) : 0
  
  return {
    hasActiveSession,
    sessionDuration,
    totalFocusTime: sessionDuration // In minutes
  }
}
