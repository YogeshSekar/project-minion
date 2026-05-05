import {
  getAllHabits,
  createHabit as createHabitApi,
  updateHabit as updateHabitApi,
  deleteHabit as deleteHabitApi,
  toggleHabitCompletion as toggleHabitCompletionApi,
  getHabitLogs as getHabitLogsApi
} from './api'

async function withRetry(operation, maxRetries = 2, delay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      return result
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, data: null, error: error.toString() }
      }
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

export async function getHabits(retryCount = 0) {
  try {
    const response = await getAllHabits()
    return response
  } catch (error) {
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return getHabits(retryCount + 1)
    }
    return { success: false, data: null, error: error.toString() }
  }
}

export async function createHabit(payload) {
  try {
    const response = await createHabitApi(payload)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function updateHabit(payload) {
  try {
    const response = await updateHabitApi(payload)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function deleteHabit(id) {
  try {
    const response = await deleteHabitApi(id)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function toggleHabitCompletion(habitId, date) {
  try {
    const response = await toggleHabitCompletionApi(habitId, date)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function getHabitLogs(habitId) {
  try {
    const response = await getHabitLogsApi(habitId)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

// Helper function to get habits with weekly progress
export async function getHabitsWithWeeklyProgress() {
  try {
    const response = await getHabits()
    if (response.success && response.data) {
      const habitsWithProgress = await Promise.all(
        response.data.map(async (habit) => {
          const logsResponse = await getHabitLogs(habit.id)
          if (logsResponse.success && logsResponse.data) {
            const weeklyProgress = calculateWeeklyProgress(logsResponse.data)
            return { ...habit, weeklyProgress }
          }
          return habit
        })
      )
      return { success: true, data: habitsWithProgress, error: null }
    }
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

// Helper function to calculate weekly progress array
export function calculateWeeklyProgress(logs) {
  const today = new Date()
  const weekProgress = []
  
  // Get the start of the week (Monday)
  const startOfWeek = new Date(today)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  
  // Calculate progress for each day of the week
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    const dateString = date.toISOString().split('T')[0]
    
    const log = logs.find(l => l.date === dateString)
    weekProgress.push(log ? log.completed === 1 : false)
  }
  
  return weekProgress
}

// Helper function to calculate monthly progress array
export function calculateMonthlyProgress(logs) {
  const today = new Date()
  const monthProgress = []
  
  // Get the start of the month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  // Calculate progress for each day of the month (up to 30 days)
  for (let i = 0; i < 30; i++) {
    const date = new Date(startOfMonth)
    date.setDate(startOfMonth.getDate() + i)
    const dateString = date.toISOString().split('T')[0]
    
    const log = logs.find(l => l.date === dateString)
    monthProgress.push(log ? log.completed === 1 : false)
  }
  
  return monthProgress
}

// Helper function to check if habit is completed today
export function isCompletedToday(habit, logs) {
  const today = new Date().toISOString().split('T')[0]
  const todayLog = logs.find(l => l.date === today)
  return todayLog ? todayLog.completed === 1 : false
}

// Helper function to calculate completion rate
export function calculateCompletionRate(logs, days = 7) {
  if (!logs || logs.length === 0) return 0
  
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - days + 1)
  
  let completedCount = 0
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateString = date.toISOString().split('T')[0]
    
    const log = logs.find(l => l.date === dateString)
    if (log && log.completed === 1) {
      completedCount++
    }
  }
  
  return Math.round((completedCount / days) * 100)
}
