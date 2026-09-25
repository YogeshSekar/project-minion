import { invoke } from '@tauri-apps/api/core'

const STORAGE_KEY = 'dataBackup.preferences'
const defaultPreferences = {
  location: '',
  schedule: 'off',
  lastBackupAt: null,
  lastBackupPath: '',
}

export const loadBackupPreferences = () => {
  try {
    return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch {
    return { ...defaultPreferences }
  }
}

export const saveBackupPreferences = preferences => {
  const next = { ...defaultPreferences, ...preferences }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('backup-preferences-change', { detail: next }))
  return next
}

export const createBackup = async location => {
  const path = await invoke('backup_database', { destinationDir: location })
  const next = saveBackupPreferences({
    ...loadBackupPreferences(),
    lastBackupAt: new Date().toISOString(),
    lastBackupPath: path,
  })
  return { path, preferences: next }
}

const backupIsDue = preferences => {
  if (!preferences.location || preferences.schedule === 'off') return false
  if (!preferences.lastBackupAt) return true
  const elapsed = Date.now() - new Date(preferences.lastBackupAt).getTime()
  const interval = preferences.schedule === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  return Number.isNaN(elapsed) || elapsed >= interval
}

let backupRunning = false

export const checkScheduledBackup = async () => {
  const preferences = loadBackupPreferences()
  if (backupRunning || !backupIsDue(preferences)) return
  backupRunning = true
  try {
    await createBackup(preferences.location)
  } catch (error) {
    console.error('Scheduled backup failed:', error)
  } finally {
    backupRunning = false
  }
}

export const startBackupScheduler = () => {
  checkScheduledBackup()
  const timer = window.setInterval(checkScheduledBackup, 60 * 60 * 1000)
  return () => window.clearInterval(timer)
}
