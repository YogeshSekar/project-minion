import { useEffect, useState } from 'react'
import { Bell, BellRing, CalendarRange, CheckCircle2, Database, FolderOpen, HardDriveDownload, Info, LayoutGrid, List, Loader2, Monitor, Moon, Palette, Power, Sun, Sunrise, Sunset, Trash2, X } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification'
import { getAutoStart, setAutoStart } from '../services/autoStartService'
import { loadNotificationPreferences, saveNotificationPreferences as persistNotificationPreferences, sendTestNotification } from '../services/notificationService'
import { createBackup, loadBackupPreferences, saveBackupPreferences } from '../services/backupService'
import { ACCENT_THEMES } from '../config/accentThemes'

const fonts = [
  { id: 'inter', name: 'Inter', family: "'Inter', system-ui, sans-serif" },
  { id: 'plus-jakarta', name: 'Plus Jakarta', family: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { id: 'manrope', name: 'Manrope', family: "'Manrope', system-ui, sans-serif" },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif" },
]

const themes = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
]

const settingsCategories = [
  ['appearance', 'Appearance', Palette],
  ['tasks', 'Tasks', CheckCircle2],
  ['notifications', 'Notifications', Bell],
  ['data', 'Data', Database],
  ['system', 'System', Power],
  ['about', 'About', Info],
]

function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} disabled={disabled} className={`relative inline-flex h-6 w-11 flex-none rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50 ${checked ? 'bg-accent-solid' : 'bg-slate-300 dark:bg-slate-600'}`}>
      <span className={`mt-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-accent-surface text-accent-text"><Icon className="h-4 w-4" /></span>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
    </div>
  )
}

export default function SettingsModal({ isOpen, onClose, theme, setTheme, font, setFont, accent, setAccent }) {
  const [autoStart, setAutoStartState] = useState(false)
  const [autoStartLoading, setAutoStartLoading] = useState(true)
  const [autoStartError, setAutoStartError] = useState('')
  const [taskView, setTaskView] = useState(() => localStorage.getItem('tasks.viewMode') || 'board')
  const [showCompleted, setShowCompleted] = useState(() => localStorage.getItem('tasks.showDone') === 'true')
  const [notificationPreferences, setNotificationPreferences] = useState(loadNotificationPreferences)
  const [notificationPermissionLoading, setNotificationPermissionLoading] = useState(false)
  const [notificationError, setNotificationError] = useState('')
  const [notificationTestState, setNotificationTestState] = useState('idle')
  const [backupPreferences, setBackupPreferences] = useState(loadBackupPreferences)
  const [backupState, setBackupState] = useState('idle')
  const [backupMessage, setBackupMessage] = useState('')
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteState, setDeleteState] = useState('idle')
  const [activeSettingsSection, setActiveSettingsSection] = useState('appearance')

  useEffect(() => {
    if (!isOpen) return undefined
    setTaskView(localStorage.getItem('tasks.viewMode') || 'board')
    setShowCompleted(localStorage.getItem('tasks.showDone') === 'true')
    setNotificationPreferences(loadNotificationPreferences())
    setNotificationError('')
    setNotificationTestState('idle')
    setBackupPreferences(loadBackupPreferences())
    setBackupState('idle')
    setBackupMessage('')
    setShowDeleteConfirmation(false)
    setDeleteConfirmation('')
    setDeleteState('idle')
    setAutoStartError('')
    setAutoStartLoading(true)
    getAutoStart().then(setAutoStartState).catch(() => setAutoStartError('Could not read the startup preference.')).finally(() => setAutoStartLoading(false))
    isPermissionGranted().then(granted => {
      const preferences = loadNotificationPreferences()
      if (!granted && preferences.enabled) {
        const next = { ...preferences, enabled: false }
        setNotificationPreferences(next)
        persistNotificationPreferences(next)
        setNotificationError('Notifications were disabled because permission is no longer available.')
      }
    }).catch(() => {})
    const handleKeyDown = event => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleAutoStartToggle = async () => {
    const previous = autoStart
    const next = !previous
    setAutoStartState(next)
    setAutoStartLoading(true)
    setAutoStartError('')
    try {
      await setAutoStart(next)
    } catch (error) {
      console.error('Autostart toggle failed:', error)
      setAutoStartState(previous)
      setAutoStartError('Could not update the startup preference.')
    } finally {
      setAutoStartLoading(false)
    }
  }

  const selectTaskView = value => {
    setTaskView(value)
    localStorage.setItem('tasks.viewMode', value)
    window.dispatchEvent(new CustomEvent('tasks-preferences-change', { detail: { viewMode: value } }))
  }

  const toggleShowCompleted = () => {
    const next = !showCompleted
    setShowCompleted(next)
    localStorage.setItem('tasks.showDone', String(next))
    window.dispatchEvent(new CustomEvent('tasks-preferences-change', { detail: { showDone: next } }))
  }

  const saveNotificationPreferences = update => {
    setNotificationPreferences(current => {
      const next = typeof update === 'function' ? update(current) : update
      persistNotificationPreferences(next)
      return next
    })
  }

  const handleNotificationMasterToggle = async () => {
    if (notificationPreferences.enabled) {
      saveNotificationPreferences(current => ({ ...current, enabled: false }))
      setNotificationError('')
      return
    }

    setNotificationPermissionLoading(true)
    setNotificationError('')
    try {
      let granted = await isPermissionGranted()
      if (!granted) granted = (await requestPermission()) === 'granted'
      if (!granted) {
        setNotificationError('Notification permission was not granted. You can allow it in Windows settings.')
        return
      }
      saveNotificationPreferences(current => ({ ...current, enabled: true }))
    } catch (error) {
      console.error('Notification permission request failed:', error)
      setNotificationError('Could not request notification permission.')
    } finally {
      setNotificationPermissionLoading(false)
    }
  }

  const updateNotificationSchedule = (schedule, changes) => {
    saveNotificationPreferences(current => ({
      ...current,
      [schedule]: { ...current[schedule], ...changes },
    }))
  }

  const handleTestNotification = async () => {
    setNotificationTestState('sending')
    setNotificationError('')
    try {
      await sendTestNotification()
      setNotificationTestState('sent')
      window.setTimeout(() => setNotificationTestState('idle'), 2500)
    } catch (error) {
      console.error('Test notification failed:', error)
      setNotificationTestState('idle')
      setNotificationError('Could not send the test notification. Make sure the installed app is allowed in Windows notification settings.')
    }
  }

  const chooseBackupLocation = async () => {
    const selected = await openDialog({ directory: true, multiple: false, title: 'Choose backup folder' })
    if (!selected || Array.isArray(selected)) return
    const next = saveBackupPreferences({ ...backupPreferences, location: selected })
    setBackupPreferences(next)
    setBackupMessage('')
  }

  const updateBackupSchedule = schedule => {
    const next = saveBackupPreferences({ ...backupPreferences, schedule })
    setBackupPreferences(next)
  }

  const handleBackupNow = async () => {
    if (!backupPreferences.location) return
    setBackupState('running')
    setBackupMessage('')
    try {
      const result = await createBackup(backupPreferences.location)
      setBackupPreferences(result.preferences)
      setBackupState('success')
      setBackupMessage('Backup created successfully.')
    } catch (error) {
      setBackupState('error')
      setBackupMessage(String(error))
    }
  }

  const handleDeleteAllData = async () => {
    if (deleteConfirmation !== 'DELETE') return
    setDeleteState('running')
    try {
      await invoke('delete_all_data')
      localStorage.removeItem('home.pinnedPageIds')
      localStorage.removeItem('home.pinnedPageId')
      setDeleteState('success')
      window.setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      setDeleteState('error')
      setBackupMessage(`Could not delete the data: ${String(error)}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="flex h-[82vh] min-h-[520px] w-[min(92vw,980px)] min-w-[640px] max-h-[94vh] max-w-[96vw] resize flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex flex-none items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div><h2 id="settings-title" className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Personalize Project Minion for the way you work.</p></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close settings"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="w-52 flex-none border-r border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/30">
            <nav className="space-y-1" aria-label="Settings categories">
              {settingsCategories.map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setActiveSettingsSection(id)} className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${activeSettingsSection === id ? 'bg-accent-surface text-accent-text shadow-sm ring-1 ring-accent-border' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'}`}><Icon className="h-4 w-4 flex-none" />{label}</button>)}
            </nav>
          </aside>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-5">
          {activeSettingsSection === 'appearance' && <section>
            <SectionTitle icon={Palette} title="Appearance" description="Choose how the application looks on this device." />
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Appearance mode</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Use a light, dark, or system-matched interface.</p></div>
                <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  {themes.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTheme(id)} title={label} aria-label={`${label} theme`} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${theme === id ? 'bg-accent-surface text-accent-text shadow-sm ring-1 ring-accent-border' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}><Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{label}</span></button>)}
                </div>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Accent color</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Choose the color used for actions, selections, and highlights.</p>
                </div>
                <div className="grid flex-none grid-cols-4 gap-2" role="radiogroup" aria-label="Accent color">
                  {ACCENT_THEMES.map(item => {
                    const selected = accent === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${item.label} accent`}
                        title={`${item.label} accent`}
                        onClick={() => setAccent(item.id)}
                        className={`inline-flex min-w-[70px] flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${selected ? 'border-accent-border bg-accent-surface text-accent-text ring-1 ring-accent-border' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700'}`}
                      >
                        <span className="relative h-5 w-5 rounded-full ring-1 ring-black/10 dark:ring-white/20" style={{ backgroundColor: item.preview }} aria-hidden="true">
                          {selected && <span className="absolute inset-0 grid place-items-center text-[11px] font-bold leading-none text-white">✓</span>}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Interface font</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Choose the typeface used throughout the app.</p></div>
                <select value={font} onChange={event => setFont(event.target.value)} className="h-9 w-40 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {fonts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            </div>
          </section>}

          {activeSettingsSection === 'tasks' && <section>
            <SectionTitle icon={CheckCircle2} title="Tasks" description="Set the default layout used when you open My Task." />
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Preferred view</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Your selection is remembered between sessions.</p></div>
                <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  {[['board', 'Board', LayoutGrid], ['list', 'List', List]].map(([value, label, Icon]) => <button key={value} type="button" onClick={() => selectTaskView(value)} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${taskView === value ? 'bg-accent-surface text-accent-text shadow-sm ring-1 ring-accent-border' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Show completed tasks</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Include completed work in task views.</p></div>
                <Toggle checked={showCompleted} onChange={toggleShowCompleted} label="Show completed tasks" />
              </div>
            </div>
          </section>}

          {activeSettingsSection === 'notifications' && <section>
            <SectionTitle icon={Bell} title="Notifications" description="Choose when Project Minion should remind you to review your work." />
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Desktop notifications</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Allow review reminders on this device.</p>{notificationError && <p className="mt-1 max-w-sm text-xs font-medium text-red-600">{notificationError}</p>}</div>
                <Toggle checked={notificationPreferences.enabled} onChange={handleNotificationMasterToggle} disabled={notificationPermissionLoading} label="Desktop notifications" />
              </div>

              {[
                ['dailyStart', 'Start review', 'Plan the day and check your priorities.', Sunrise],
                ['endOfDay', 'End review', 'Wrap up completed work and plan tomorrow.', Sunset],
              ].map(([key, title, description, Icon]) => (
                <div key={key} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><Icon className="h-4 w-4" /></span>
                    <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{title}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p></div>
                  </div>
                  <div className="ml-11 flex items-center gap-3 sm:ml-0">
                  <input type="time" value={notificationPreferences[key].time} onChange={event => updateNotificationSchedule(key, { time: event.target.value })} disabled={!notificationPreferences.enabled || !notificationPreferences[key].enabled} aria-label={`${title} time`} className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" />
                    <Toggle checked={notificationPreferences[key].enabled} onChange={() => updateNotificationSchedule(key, { enabled: !notificationPreferences[key].enabled })} disabled={!notificationPreferences.enabled} label={`${title} reminder`} />
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><CalendarRange className="h-4 w-4" /></span>
                  <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Weekly review</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Reflect on the week and prepare the next one.</p></div>
                </div>
                <div className="ml-11 flex flex-wrap items-center gap-2 sm:ml-0">
                  <select value={notificationPreferences.weeklyReview.day} onChange={event => updateNotificationSchedule('weeklyReview', { day: event.target.value })} disabled={!notificationPreferences.enabled || !notificationPreferences.weeklyReview.enabled} aria-label="Weekly review day" className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium capitalize text-slate-700 outline-none transition-colors focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>)}
                  </select>
                  <input type="time" value={notificationPreferences.weeklyReview.time} onChange={event => updateNotificationSchedule('weeklyReview', { time: event.target.value })} disabled={!notificationPreferences.enabled || !notificationPreferences.weeklyReview.enabled} aria-label="Weekly review time" className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" />
                  <Toggle checked={notificationPreferences.weeklyReview.enabled} onChange={() => updateNotificationSchedule('weeklyReview', { enabled: !notificationPreferences.weeklyReview.enabled })} disabled={!notificationPreferences.enabled} label="Weekly review reminder" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><BellRing className="h-4 w-4" /></span>
                  <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Test notification</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Preview a reminder using your current task data.</p></div>
                </div>
                <button type="button" onClick={handleTestNotification} disabled={!notificationPreferences.enabled || notificationTestState === 'sending'} className="h-9 flex-none rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-accent-border hover:text-accent-text disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {notificationTestState === 'sending' ? 'Sending…' : notificationTestState === 'sent' ? 'Sent' : 'Send test'}
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Reminders use your device's local time while Project Minion is running.</p>
          </section>}

          {activeSettingsSection === 'data' && <section>
            <SectionTitle icon={Database} title="Data management" description="Keep local backups and manage the data stored by Project Minion." />
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Backup location</p><p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400" title={backupPreferences.location}>{backupPreferences.location || 'No folder selected'}</p></div>
                <button type="button" onClick={chooseBackupLocation} className="inline-flex h-9 flex-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-accent-border hover:text-accent-text dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"><FolderOpen className="h-4 w-4" />Choose folder</button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Automatic backup</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Runs when the app is open and the selected interval is due.</p></div>
                <select value={backupPreferences.schedule} onChange={event => updateBackupSchedule(event.target.value)} disabled={!backupPreferences.location} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"><option value="off">Off</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Manual backup</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{backupPreferences.lastBackupAt ? `Last backup ${new Date(backupPreferences.lastBackupAt).toLocaleString()}` : 'No backup has been created yet.'}</p>{backupMessage && <p className={`mt-1 text-xs font-medium ${backupState === 'error' || deleteState === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>{backupMessage}</p>}</div>
                <button type="button" onClick={handleBackupNow} disabled={!backupPreferences.location || backupState === 'running'} className="inline-flex h-9 flex-none items-center gap-2 rounded-lg bg-accent-solid px-3 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-solid-hover disabled:cursor-not-allowed disabled:opacity-50">{backupState === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveDownload className="h-4 w-4" />}Back up now</button>
              </div>
              <div className="bg-red-50/60 px-4 py-3 dark:bg-red-950/20">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-red-800 dark:text-red-300">Delete all data</p><p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400">Permanently removes projects, tasks, pages, meetings, and activity history.</p></div><button type="button" onClick={() => setShowDeleteConfirmation(value => !value)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-300"><Trash2 className="h-4 w-4" />Delete all data</button></div>
                {showDeleteConfirmation && <div className="mt-3 rounded-lg border border-red-200 bg-white p-3 dark:border-red-900 dark:bg-slate-900"><p className="text-xs text-slate-600 dark:text-slate-300">This cannot be undone. Type <strong>DELETE</strong> to confirm.</p><div className="mt-2 flex gap-2"><input value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} placeholder="Type DELETE" className="h-9 min-w-0 flex-1 rounded-lg border border-red-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-900 dark:bg-slate-800" /><button type="button" onClick={handleDeleteAllData} disabled={deleteConfirmation !== 'DELETE' || deleteState === 'running'} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">{deleteState === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}{deleteState === 'success' ? 'Deleted' : 'Delete permanently'}</button></div></div>}
              </div>
            </div>
          </section>}

          {activeSettingsSection === 'system' && <section>
            <SectionTitle icon={Power} title="System" description="Control how Project Minion behaves on Windows." />
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
              <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Start on login</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Launch Project Minion when Windows starts.</p>{autoStartError && <p className="mt-1 text-xs font-medium text-red-600">{autoStartError}</p>}</div>
              <Toggle checked={autoStart} onChange={handleAutoStartToggle} disabled={autoStartLoading} label="Start Project Minion on login" />
            </div>
          </section>}

          {activeSettingsSection === 'about' && <section>
            <SectionTitle icon={Info} title="About" />
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/70">
              <div><p className="font-semibold text-slate-800 dark:text-slate-200">Project Minion</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Your private productivity workspace</p></div>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">v0.1.0</span>
            </div>
          </section>}
          </div>
        </div>
      </div>
    </div>
  )
}
