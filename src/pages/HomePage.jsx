import React, { useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { BriefcaseBusiness, Calendar, CalendarDays, Check, CheckCircle2, CirclePlay, Clock3, FileText, Pin, Square } from 'lucide-react'
import { startActivity, stopCurrentActivity } from '../services/activityService'
import { getRunningActivity } from '../services/api'
import useTasks from '../hooks/useTasks'
import useProjects from '../hooks/useProjects'
import usePages from '../hooks/usePages'
import { calculateProjectStats, calculateTimeStats, formatDate, getTaskStatusBadge, isOverdue } from '../utils/helpers'

const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const dateOnly = value => value ? String(value).slice(0, 10) : ''
const taskStatusLabel = { todo: 'To Do', in_progress: 'In Progress', waiting: 'Waiting', completed: 'Completed' }

function HomePage({ openTaskModal, taskRefreshTrigger = 0, onActivityStarted, onActivityStopped, runningActivity: propRunningActivity, onOpenPage, onOpenPages, onOpenTasks, onOpenMeetings }) {
  const { tasks, loading: tasksLoading, updateTask, loadTasks } = useTasks()
  const { projects } = useProjects()
  const { pages, loading: pagesLoading, error: pagesError } = usePages()
  const [localRunningActivity, setLocalRunningActivity] = useState(null)
  const runningActivity = propRunningActivity !== undefined ? propRunningActivity : localRunningActivity
  const [pinnedPageIds, setPinnedPageIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('home.pinnedPageIds') || 'null')
      if (Array.isArray(saved)) return [...new Set(saved.map(String))].slice(0, 5)
    } catch { /* Fall back to the previous single-page preference. */ }
    const previousPin = localStorage.getItem('home.pinnedPageId')
    return previousPin ? [previousPin] : []
  })
  const [meetings, setMeetings] = useState([])
  const [meetingsLoading, setMeetingsLoading] = useState(true)
  const [meetingsError, setMeetingsError] = useState(false)
  const [windowsUsername, setWindowsUsername] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => { loadTasks() }, [loadTasks, taskRefreshTrigger])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    invoke('get_windows_username').then(name => setWindowsUsername(name || '')).catch(() => {})
  }, [])
  useEffect(() => { localStorage.setItem('home.pinnedPageIds', JSON.stringify(pinnedPageIds)) }, [pinnedPageIds])
  useEffect(() => {
    if (pagesLoading) return
    setPinnedPageIds(current => {
      const valid = current.filter(id => pages.some(page => String(page.id) === id))
      return valid.length === current.length ? current : valid
    })
  }, [pages, pagesLoading])
  useEffect(() => {
    if (propRunningActivity !== undefined) return
    getRunningActivity().then(response => { if (response.success) setLocalRunningActivity(response.data || null) })
  }, [propRunningActivity])
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const today = new Date()
      const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      const tomorrowCutoff = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 13, 0, 0, 0)
      const [results, savedMeetingsResult] = await Promise.all([
        Promise.allSettled([localDate(today), localDate(tomorrow)].map(date => invoke('get_outlook_meetings', { date }))),
        invoke('get_all_meetings').catch(() => null)
      ])
      if (cancelled) return
      const savedByOutlookId = new Map((savedMeetingsResult?.data || [])
        .filter(meeting => meeting.outlook_id)
        .map(meeting => [meeting.outlook_id, meeting]))
      setMeetingsError(results.every(result => result.status === 'rejected'))
      setMeetings(results.flatMap(result => result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : [])
        .filter(meeting => meeting.start && new Date(meeting.end || meeting.start).getTime() >= Date.now() && new Date(meeting.start) <= tomorrowCutoff)
        .map(meeting => ({ ...meeting, project_id: savedByOutlookId.get(meeting.entry_id)?.project_id ?? null }))
        .sort((a, b) => new Date(a.start) - new Date(b.start)))
      setMeetingsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const today = localDate(now)
  const tomorrow = localDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening'
  const lastName = windowsUsername.trim().split(/\s+/).at(-1) || ''
  const meetingGroups = [
      ['Today', meetings.filter(meeting => localDate(new Date(meeting.start)) === today), 'text-accent-text'],
    ['Tomorrow', meetings.filter(meeting => localDate(new Date(meeting.start)) === tomorrow), 'text-sky-700']
  ].filter(([, items]) => items.length)
  const activeTrackedTask = runningActivity?.reference_type === 'task' ? tasks.find(task => task.id === runningActivity.reference_id) : null
  const isActiveTrackedTask = task => activeTrackedTask?.id === task.id
  const overdueTasks = tasks.filter(task => task.status !== 'completed' && !isActiveTrackedTask(task) && dateOnly(task.scheduled_date) && dateOnly(task.scheduled_date) < today).sort((a, b) => dateOnly(a.scheduled_date).localeCompare(dateOnly(b.scheduled_date)))
  const todayTasks = tasks.filter(task => task.status !== 'completed' && !isActiveTrackedTask(task) && dateOnly(task.scheduled_date) === today)
  const attentionGroups = [
    ['Overdue', overdueTasks, 'text-rose-600'],
    ['High priority', todayTasks.filter(task => task.priority === 'high'), 'text-red-600'],
    ['Medium priority', todayTasks.filter(task => task.priority === 'medium' || !task.priority), 'text-amber-700'],
    ['Low priority', todayTasks.filter(task => task.priority === 'low'), 'text-emerald-700']
  ].filter(([, list]) => list.length)
  const attentionTaskCount = overdueTasks.length + todayTasks.length
  const recentPages = useMemo(() => [...pages].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)), [pages])
  const pinnedPages = pinnedPageIds.map(id => pages.find(page => String(page.id) === id)).filter(Boolean)
  const pinLimitReached = pinnedPageIds.length >= 5
  const tasksScheduledToday = tasks.filter(task => dateOnly(task.scheduled_date) === today)
  const dailyStats = { completedToday: tasksScheduledToday.filter(task => task.status === 'completed').length, totalToday: tasksScheduledToday.length }
  const projectStats = calculateProjectStats(projects, tasks)
  const timeStats = calculateTimeStats(runningActivity)

  const handleToggleComplete = async task => { await updateTask({ ...task, status: task.status === 'completed' ? 'todo' : 'completed' }) }
  const handleStartTaskActivity = async task => {
    const response = await startActivity({ title: task.title, activity_type: 'focus_session', source: 'manual', reference_type: 'task', reference_id: task.id, project_id: task.project_id })
    if (response.success) {
      if (propRunningActivity === undefined) setLocalRunningActivity(response.data)
      onActivityStarted?.(response.data, task)
    }
  }
  const handleStopTaskActivity = async () => {
    const response = await stopCurrentActivity()
    if (response.success) {
      if (propRunningActivity === undefined) setLocalRunningActivity(null)
      onActivityStopped?.()
    }
  }
  const taskListRow = (task, isTracking = false) => {
    const project = projects.find(item => String(item.id) === String(task.project_id))
    const overdue = task.scheduled_date && isOverdue(task.scheduled_date) && task.status !== 'completed'

    return <div key={task.id} onClick={() => openTaskModal?.(task, 'edit')} className={`group flex min-h-11 cursor-pointer items-center gap-2 border-b border-slate-200 px-3 py-2 transition-colors last:border-b-0 ${isTracking ? 'bg-emerald-50 hover:bg-emerald-50 dark:bg-emerald-900/20' : 'bg-white hover:bg-slate-50/80 dark:bg-gray-900 dark:hover:bg-gray-800'}`}>
      <span className="relative h-4 w-4 flex-none" onClick={event => event.stopPropagation()}>
        <input type="checkbox" checked={task.status === 'completed'} onChange={() => handleToggleComplete(task)} className="peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-slate-400 bg-white transition-colors hover:border-slate-600 checked:border-slate-900 checked:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1" aria-label={`Mark ${task.title} complete`} title="Mark task complete" />
        <Check className="pointer-events-none absolute left-0.5 top-0.5 hidden h-3 w-3 text-white peer-checked:block" strokeWidth={3} />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-gray-100" title={task.title}>{task.title}</span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden">
          <span className={`inline-flex h-5 flex-none items-center rounded-full border px-2 text-[10px] font-semibold leading-none ${getTaskStatusBadge(task.status)}`}>{taskStatusLabel[task.status] || task.status}</span>
          <span className={`inline-flex min-w-0 items-center gap-1 border-l border-slate-200 pl-1.5 text-[11px] font-medium ${overdue ? 'text-red-700' : 'text-slate-500'}`}><Calendar className="h-3 w-3 flex-none" /><span className="truncate">{task.scheduled_date ? formatDate(task.scheduled_date) : 'No date'}</span></span>
          <span className="min-w-0 truncate border-l border-slate-200 pl-1.5 text-[11px] font-medium text-slate-500">{project?.title || 'No project'}</span>
        </span>
      </div>
      <button onClick={event => { event.stopPropagation(); isTracking ? handleStopTaskActivity() : handleStartTaskActivity(task) }} disabled={!isTracking && Boolean(runningActivity)} className={`grid h-7 w-7 flex-none place-items-center rounded-md opacity-0 transition-all group-hover:opacity-100 group-focus-within:opacity-100 ${isTracking ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 opacity-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700'}`} title={isTracking ? 'Stop time tracking' : runningActivity ? 'Another activity is running' : 'Start time tracking'} aria-label={isTracking ? `Stop tracking ${task.title}` : `Start tracking ${task.title}`}>{isTracking ? <Square className="h-3.5 w-3.5" /> : <CirclePlay className="h-4 w-4" />}</button>
    </div>
  }
  const pinPage = id => {
    const pageId = String(id)
    setPinnedPageIds(current => current.includes(pageId)
      ? current.filter(item => item !== pageId)
      : current.length < 5 ? [...current, pageId] : current)
  }
  const pageProject = page => projects.find(project => String(project.id) === String(page.project_id))?.title || 'No project'
  const meetingProject = meeting => projects.find(project => String(project.id) === String(meeting.project_id))?.title
  const happeningNowMeeting = meetings.find(meeting => new Date(meeting.start) <= now && new Date(meeting.end || meeting.start) >= now) || null
  const nextMeeting = meetings.find(meeting => new Date(meeting.start) > now) || null
  const nextMeetingCountdown = (() => {
    if (!nextMeeting) return ''
    const minutes = Math.ceil((new Date(nextMeeting.start).getTime() - now.getTime()) / 60000)
    if (minutes <= 0) return 'Happening now'
    if (minutes < 60) return `In ${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    if (hours < 24) return remainder ? `In ${hours}h ${remainder}m` : `In ${hours}h`
    return `In ${Math.ceil(hours / 24)} days`
  })()

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-100 text-slate-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="flex h-full min-h-0 w-full flex-col">
        <header className="flex min-h-16 flex-none flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-slate-200 bg-white px-6 py-2 dark:border-gray-700 dark:bg-gray-800 lg:h-16 lg:py-0">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">{greeting}{lastName ? `, ${lastName}` : ''}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30"><CheckCircle2 className="h-4 w-4" /></span><span><strong className="mr-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-gray-100">{dailyStats.completedToday}/{dailyStats.totalToday}</strong>completed</span></span>
          <span className="inline-flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-surface text-accent-text"><Clock3 className="h-4 w-4" /></span><span><strong className="mr-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-gray-100">{Math.floor((timeStats.totalFocusTime || 0) / 60)}h {Math.floor((timeStats.totalFocusTime || 0) % 60)}m</strong>focused</span></span>
            <span className="inline-flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-300"><BriefcaseBusiness className="h-4 w-4" /></span><span><strong className="mr-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-gray-100">{projectStats.activeProjects}</strong>projects</span></span>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch lg:grid-cols-[minmax(360px,1.15fr)_minmax(320px,0.9fr)_minmax(380px,1fr)]">
          <section className="flex min-h-0 min-w-0 flex-col border-r border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex h-14 flex-none items-center justify-between border-b border-slate-200 px-4 dark:border-gray-700">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent-text" /><h2 className="text-sm font-semibold">Tasks</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-gray-700 dark:text-gray-300">{attentionTaskCount + (activeTrackedTask ? 1 : 0)}</span></div>
            <button onClick={onOpenTasks} className="text-xs font-semibold text-accent-text hover:underline">All tasks</button>
            </div>
            <div className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-3">
              {activeTrackedTask && <div><div className="mb-1.5 flex items-center gap-2 px-1"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /><span className="text-xs font-bold text-emerald-700">Currently tracking</span></div><div className="overflow-hidden rounded-xl border border-slate-200">{taskListRow(activeTrackedTask, true)}</div></div>}
              {tasksLoading ? <p className="py-6 text-center text-sm text-slate-500">Loading tasks…</p> : attentionGroups.map(([title, list, color]) => <div key={title}><div className="mb-1.5 flex items-center gap-2 px-1"><h3 className={`text-[11px] font-semibold uppercase tracking-wide ${color}`}>{title}</h3><span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">{String(list.length).padStart(2, '0')}</span></div><div className="overflow-hidden rounded-xl border border-slate-200">{list.map(task => taskListRow(task))}</div></div>)}
              {!tasksLoading && !activeTrackedTask && !attentionGroups.length && <div className="py-12 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" /><p className="mt-3 text-sm font-medium">You’re all caught up for today</p><p className="mt-1 text-xs text-slate-500">No overdue or scheduled tasks need attention.</p></div>}
            </div>
          </section>

          <section className="flex min-h-0 min-w-0 flex-col border-r border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-14 flex-none items-center justify-between border-b border-slate-200 px-4 dark:border-gray-700"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-accent-text" /><h2 className="text-sm font-semibold">Pages</h2></div><button onClick={onOpenPages} className="text-xs font-semibold text-accent-text hover:underline">All pages</button></div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {pagesLoading ? <p className="py-5 text-center text-sm text-slate-500">Loading pages…</p> : pagesError ? <p className="py-5 text-center text-sm text-slate-500">Couldn’t load pages.</p> : pages.length ? <>
              {pinnedPages.length > 0 && <div className="mb-4"><div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pinned pages</p><span className="text-[11px] text-slate-400">{pinnedPages.length}/5</span></div><div className="space-y-1.5">{pinnedPages.map(page => <div key={page.id} className="flex items-center gap-2 rounded-lg border border-accent-border bg-accent-surface/60 px-3 py-2.5"><Pin className="h-3.5 w-3.5 flex-none text-accent-text" /><button onClick={() => onOpenPage?.(page)} className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-accent-text hover:underline" title={page.title}>{page.title}</button><span className="inline-flex max-w-36 flex-none rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300" title={pageProject(page)}><span className="truncate">{pageProject(page)}</span></span><button onClick={() => pinPage(page.id)} className="rounded-md px-1.5 py-1 text-xs text-slate-400 hover:bg-accent-surface-hover hover:text-slate-700" title="Unpin from Home" aria-label={`Unpin ${page.title}`}>×</button></div>)}</div></div>}
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recently updated</p>
              <div className="divide-y divide-slate-100 dark:divide-gray-700">{recentPages.filter(page => !pinnedPageIds.includes(String(page.id))).slice(0, 8).map(page => <div key={page.id} className="flex items-center gap-2 py-3"><button onClick={() => onOpenPage?.(page)} className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-accent-text" title={page.title}>{page.title}</button><span className="inline-flex max-w-36 flex-none rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300" title={pageProject(page)}><span className="truncate">{pageProject(page)}</span></span><button onClick={() => pinPage(page.id)} disabled={pinLimitReached} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-accent-surface hover:text-accent-text disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400" title={pinLimitReached ? 'Unpin a page to add another' : 'Pin to Home'} aria-label={pinLimitReached ? `Pin limit reached; unpin a page before pinning ${page.title}` : `Pin ${page.title}`}><Pin className="h-3.5 w-3.5" /></button></div>)}</div>
            </> : <div className="py-8 text-center"><p className="text-sm text-slate-500">Your project pages will appear here.</p><button onClick={onOpenPages} className="mt-2 text-xs font-semibold text-accent-text hover:underline">Open Pages</button></div>}
            </div>
          </section>

          <section className="flex min-h-0 min-w-0 flex-col border-t border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:border-t-0">
          <div className="flex h-14 flex-none items-center justify-between border-b border-slate-200 px-4 dark:border-gray-700"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent-text" /><h2 className="text-sm font-semibold">Upcoming meetings</h2></div><button onClick={onOpenMeetings} className="text-xs font-semibold text-accent-text hover:underline">Open Meetings</button></div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <div className="mb-4 overflow-hidden rounded-xl border border-accent-border bg-accent-surface/50">
                <button type="button" onClick={() => happeningNowMeeting && onOpenMeetings?.(happeningNowMeeting)} disabled={!happeningNowMeeting} className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors enabled:hover:bg-accent-surface-hover disabled:cursor-default">
                  <span className={`relative grid h-9 w-9 flex-none place-items-center rounded-lg bg-white shadow-sm dark:bg-gray-800 ${happeningNowMeeting ? 'text-emerald-600' : 'text-slate-400'}`}><Clock3 className="h-4 w-4" />{happeningNowMeeting && <span className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}</span>
                  <span className="min-w-0 flex-1"><span className={`block text-[10px] font-semibold uppercase tracking-wide ${happeningNowMeeting ? 'text-emerald-700' : 'text-slate-500'}`}>Happening now</span>{happeningNowMeeting ? <><span className="mt-0.5 block truncate text-sm font-semibold text-slate-800 dark:text-gray-100">{happeningNowMeeting.subject || 'Untitled meeting'}</span><span className="mt-1 block text-[11px] text-slate-500">Until {new Date(happeningNowMeeting.end || happeningNowMeeting.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span></> : <span className="mt-0.5 block text-sm text-slate-500">No meeting in progress</span>}</span>
                  {happeningNowMeeting && meetingProject(happeningNowMeeting) && <span className="inline-flex max-w-28 flex-none truncate rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">{meetingProject(happeningNowMeeting)}</span>}
                </button>
                <div className="mx-3 border-t border-accent-border" />
                <button type="button" onClick={() => nextMeeting && onOpenMeetings?.(nextMeeting)} disabled={!nextMeeting} className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors enabled:hover:bg-accent-surface-hover disabled:cursor-default">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-white text-accent-text shadow-sm dark:bg-gray-800"><CalendarDays className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wide text-accent-text">Next meeting{nextMeetingCountdown ? ` · ${nextMeetingCountdown}` : ''}</span>{nextMeeting ? <><span className="mt-0.5 block truncate text-sm font-semibold text-slate-800 dark:text-gray-100">{nextMeeting.subject || 'Untitled meeting'}</span><span className="mt-1 block text-[11px] text-slate-500">{new Date(nextMeeting.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}{nextMeeting.end ? ` – ${new Date(nextMeeting.end).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : ''}</span></> : <span className="mt-0.5 block text-sm text-slate-500">No upcoming meeting</span>}</span>
                  {nextMeeting && meetingProject(nextMeeting) && <span className="inline-flex max-w-28 flex-none truncate rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">{meetingProject(nextMeeting)}</span>}
                </button>
              </div>
              {meetingsLoading ? <p className="py-5 text-center text-sm text-slate-500">Checking Outlook…</p> : meetingsError ? <p className="py-5 text-center text-sm text-slate-500">Couldn’t reach Outlook. Open Meetings to try again.</p> : meetingGroups.length ? <div className="space-y-5">{meetingGroups.map(([label, items, color]) => <div key={label}><h3 className={`mb-1 text-[11px] font-semibold uppercase tracking-wide ${color}`}>{label}</h3><div className="divide-y divide-slate-100 dark:divide-gray-700">{items.slice(0, 8).map((meeting, index) => <button key={`${meeting.entry_id || meeting.subject}-${index}`} onClick={() => onOpenMeetings?.(meeting)} className="flex w-full items-center gap-3 py-3 text-left hover:text-accent-text"><span className="w-16 shrink-0 text-xs font-semibold tabular-nums text-accent-text">{new Date(meeting.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{meeting.subject || 'Untitled meeting'}</span>{meetingProject(meeting) && <span className="inline-flex max-w-32 flex-none rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300" title={meetingProject(meeting)}><span className="truncate">{meetingProject(meeting)}</span></span>}</button>)}</div></div>)}</div> : <p className="py-5 text-center text-sm text-slate-500">No meetings today or tomorrow.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default HomePage
