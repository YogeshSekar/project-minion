import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { getTasks } from './taskService'

export const notificationDefaults = {
  enabled: false,
  dailyStart: { enabled: true, time: '08:30' },
  endOfDay: { enabled: true, time: '18:00' },
  weeklyReview: { enabled: true, day: 'friday', time: '17:00' },
}

const weekdayNumbers = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

let scheduleCheckInProgress = false

const parseTime = value => {
  const [hour, minute] = String(value || '').split(':').map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export const loadNotificationPreferences = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('notifications.preferences'))
    if (!saved) return notificationDefaults
    return {
      ...notificationDefaults,
      ...saved,
      dailyStart: { ...notificationDefaults.dailyStart, ...saved.dailyStart },
      endOfDay: { ...notificationDefaults.endOfDay, ...saved.endOfDay },
      weeklyReview: { ...notificationDefaults.weeklyReview, ...saved.weeklyReview },
    }
  } catch {
    return notificationDefaults
  }
}

export const saveNotificationPreferences = preferences => {
  localStorage.setItem('notifications.preferences', JSON.stringify(preferences))
  window.dispatchEvent(new CustomEvent('notification-preferences-change'))
}

const dateKey = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')

const taskDateKey = value => value ? String(value).slice(0, 10) : ''

const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`

const loadTaskSummary = async now => {
  const response = await getTasks()
  if (!response.success || !Array.isArray(response.data)) throw new Error(response.error || 'Task data is unavailable')
  const tasks = response.data
  const today = dateKey(now)
  const scheduledToday = tasks.filter(task => taskDateKey(task.scheduled_date) === today)
  const incompleteToday = scheduledToday.filter(task => task.status !== 'completed')
  const completedToday = scheduledToday.filter(task => task.status === 'completed')
  const overdue = tasks.filter(task => task.status !== 'completed' && taskDateKey(task.scheduled_date) && taskDateKey(task.scheduled_date) < today)

  const weekStart = new Date(now)
  const daysSinceMonday = (weekStart.getDay() + 6) % 7
  weekStart.setDate(weekStart.getDate() - daysSinceMonday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekStartKey = dateKey(weekStart)
  const weekEndKey = dateKey(weekEnd)
  const scheduledThisWeek = tasks.filter(task => {
    const scheduled = taskDateKey(task.scheduled_date)
    return scheduled && scheduled >= weekStartKey && scheduled <= weekEndKey
  })

  return {
    scheduledToday,
    incompleteToday,
    completedToday,
    overdue,
    scheduledThisWeek,
  }
}

const buildNotificationCopy = async (key, now) => {
  let summary
  try {
    summary = await loadTaskSummary(now)
  } catch (error) {
    console.warn('Sending review reminder without task summary:', error)
    if (key === 'dailyStart') return { title: 'Start your day', body: 'Review today\'s tasks and choose your priorities.' }
    if (key === 'endOfDay') return { title: 'End-of-day review', body: 'Wrap up completed work and prepare tomorrow\'s plan.' }
    return { title: 'Weekly review', body: 'Reflect on this week and prepare your priorities for the next one.' }
  }

  if (key === 'dailyStart') {
    const todayText = pluralize(summary.incompleteToday.length, 'task')
    const overdueText = pluralize(summary.overdue.length, 'overdue item')
    return { title: 'Start your day', body: `${todayText} planned today • ${overdueText}` }
  }

  if (key === 'endOfDay') {
    if (!summary.scheduledToday.length) return { title: 'End-of-day review', body: 'No tasks were scheduled today. Take a moment to plan tomorrow.' }
    return {
      title: 'End-of-day review',
      body: `${summary.completedToday.length} of ${summary.scheduledToday.length} completed • ${pluralize(summary.incompleteToday.length, 'task')} remaining`,
    }
  }

  const completedThisWeek = summary.scheduledThisWeek.filter(task => task.status === 'completed').length
  return {
    title: 'Weekly review',
    body: `${completedThisWeek} of ${summary.scheduledThisWeek.length} scheduled tasks completed • ${pluralize(summary.overdue.length, 'overdue item')}`,
  }
}

const isDueNow = (time, now) => {
  const parsedTime = parseTime(time)
  if (!parsedTime) return false
  const scheduledMinutes = parsedTime.hour * 60 + parsedTime.minute
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  return currentMinutes >= scheduledMinutes && currentMinutes < scheduledMinutes + 5
}

const loadDeliveryHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('notifications.deliveryHistory')) || {}
  } catch {
    return {}
  }
}

const deliverOnce = async (key, period, history, now) => {
  if (history[key] === period) return false
  const { title, body } = await buildNotificationCopy(key, now)
  sendNotification({ title, body })
  history[key] = period
  return true
}

export const checkNotificationSchedules = async () => {
  if (scheduleCheckInProgress) return
  scheduleCheckInProgress = true
  try {
    const preferences = loadNotificationPreferences()
    if (!preferences.enabled || !(await isPermissionGranted())) return

    const now = new Date()
    const today = dateKey(now)
    const history = loadDeliveryHistory()
    let changed = false

    if (preferences.dailyStart.enabled && isDueNow(preferences.dailyStart.time, now)) {
      changed = await deliverOnce('dailyStart', today, history, now) || changed
    }

    if (preferences.endOfDay.enabled && isDueNow(preferences.endOfDay.time, now)) {
      changed = await deliverOnce('endOfDay', today, history, now) || changed
    }

    if (preferences.weeklyReview.enabled && weekdayNumbers[preferences.weeklyReview.day] === now.getDay() && isDueNow(preferences.weeklyReview.time, now)) {
      changed = await deliverOnce('weeklyReview', today, history, now) || changed
    }

    if (changed) localStorage.setItem('notifications.deliveryHistory', JSON.stringify(history))
  } catch (error) {
    console.error('Could not check notification schedules:', error)
  } finally {
    scheduleCheckInProgress = false
  }
}

export const sendTestNotification = async () => {
  if (!(await isPermissionGranted())) throw new Error('Notification permission is not enabled')
  const { title, body } = await buildNotificationCopy('dailyStart', new Date())
  sendNotification({ title: `Test • ${title}`, body })
}

export const sendFocusMilestoneNotification = async taskTitle => {
  let granted = await isPermissionGranted()
  if (!granted) granted = (await requestPermission()) === 'granted'
  if (!granted) return false
  sendNotification({
    title: '25 minutes focused',
    body: `${taskTitle || 'Your task'} has reached a 25-minute focus session. Take a short break or keep going.`,
  })
  return true
}

export const startNotificationScheduler = () => {
  const checkSchedules = () => { void checkNotificationSchedules() }
  const handlePreferenceChange = () => checkSchedules()
  const handleVisibilityChange = () => { if (!document.hidden) checkSchedules() }
  window.addEventListener('notification-preferences-change', handlePreferenceChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  const intervalId = window.setInterval(checkSchedules, 30_000)
  checkSchedules()
  return () => {
    window.clearInterval(intervalId)
    window.removeEventListener('notification-preferences-change', handlePreferenceChange)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}
