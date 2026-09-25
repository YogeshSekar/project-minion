import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, FileText, FolderKanban, Link2, ListTodo, MapPin, MessageSquareText, Play, Plus, RefreshCw, Square, Unlink2, Video, X } from 'lucide-react'
import useProjects from '../hooks/useProjects'
import usePages from '../hooks/usePages'
import useTasks from '../hooks/useTasks'
import TipTapEditor from '../components/TipTapEditor'
import DatePickerField from '../components/DatePickerField'
import Select from '../components/ui/Select'
import { getTaskIdsForPage } from '../services/pageTaskService'
import { getPageUpdates } from '../services/pageUpdateService'
import { sanitizeUpdateHtml } from '../utils/updateContent'
import { startActivity, stopCurrentActivity, updateExistingActivity } from '../services/activityService'

const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const addDays = (value, days) => {
  const [year, month, day] = value.split('-').map(Number)
  return localDate(new Date(year, month - 1, day + days))
}
const dateLabel = value => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}
const timeLabel = value => value ? new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—'
const meetingKey = meeting => meeting.entry_id || `${meeting.start || ''}:${meeting.subject || ''}`
const locationUrl = location => location?.match(/https?:\/\/[^\s<>]+/i)?.[0] || ''
const isCanceled = meeting => /^cancel(?:ed|led)\s*:/i.test(meeting?.subject || '')
const meetingTitle = meeting => (meeting?.subject || 'Untitled meeting').replace(/^cancel(?:ed|led)\s*:\s*/i, '')

function MeetingsPage({ onOpenPage, meetingToOpen, onMeetingOpened, runningActivity, onActivityStarted, onActivityStopped }) {
  const [date, setDate] = useState(() => meetingToOpen?.start ? localDate(new Date(meetingToOpen.start)) : localDate(new Date()))
  const [meetings, setMeetings] = useState([])
  const [savedMeetings, setSavedMeetings] = useState({})
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [linkedPages, setLinkedPages] = useState([])
  const [selectedPageId, setSelectedPageId] = useState(null)
  const [pageView, setPageView] = useState('content')
  const tabRailRef = useRef(null)
  const tabRefs = useRef(new Map())
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0, visible: false })
  const [pageTaskIds, setPageTaskIds] = useState([])
  const [pageUpdates, setPageUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pageSearch, setPageSearch] = useState('')
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const { projects } = useProjects()
  const { pages, loading: pagesLoading, createPage } = usePages()
  const { tasks } = useTasks()

  useEffect(() => {
    if (!imagePreview) return
    const closeOnEscape = event => { if (event.key === 'Escape') setImagePreview(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [imagePreview])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      setActionError('')
      setSelectedIndex(0)
      setLinkedPages([])
      setSelectedPageId(null)
      try {
        const [outlook, saved] = await Promise.all([
          invoke('get_outlook_meetings', { date }),
          invoke('get_all_meetings')
        ])
        if (cancelled) return
        if (!saved.success) throw new Error(saved.error || 'Could not load saved meeting details')
        const rows = Array.isArray(outlook) ? outlook.filter(item => item.start) : []
        rows.sort((a, b) => new Date(a.start) - new Date(b.start))
        setMeetings(rows)
        if (meetingToOpen?.entry_id) {
          const index = rows.findIndex(item => item.entry_id === meetingToOpen.entry_id)
          setSelectedIndex(index >= 0 ? index : 0)
          onMeetingOpened?.()
        }
        setSavedMeetings(Object.fromEntries((saved.data || []).filter(item => item.outlook_id).map(item => [item.outlook_id, item])))
      } catch (cause) {
        if (cancelled) return
        setMeetings([])
        setError(cause?.message || 'Could not load meetings from Outlook')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [date, reloadKey])

  const meeting = meetings[selectedIndex] || null
  const outlookId = meeting?.entry_id || null
  const savedMeeting = outlookId ? savedMeetings[outlookId] : null
  const selectedProjectId = savedMeeting?.project_id ?? null
  const meetingUrl = savedMeeting?.meeting_url || locationUrl(meeting?.location)
  const selectedPage = linkedPages.find(page => page.id === selectedPageId) || linkedPages[0] || null
  const pageTasks = tasks.filter(task => pageTaskIds.includes(task.id))
  const isTrackingMeeting = Boolean(savedMeeting?.id && runningActivity?.reference_type === 'meeting' && runningActivity.reference_id === savedMeeting.id)

  useLayoutEffect(() => {
    const rail = tabRailRef.current
    const activeTab = tabRefs.current.get(pageView)
    if (!rail || !activeTab) {
      setTabIndicator(current => ({ ...current, visible: false }))
      return undefined
    }
    const updateIndicator = () => setTabIndicator({ left: activeTab.offsetLeft, width: activeTab.offsetWidth, visible: true })
    updateIndicator()
    const observer = new ResizeObserver(updateIndicator)
    observer.observe(rail)
    observer.observe(activeTab)
    return () => observer.disconnect()
  }, [pageView, selectedPage?.id, pageTaskIds.length, pageUpdates.length])
  const availablePages = useMemo(() => pages
    .filter(page => page.status !== 'archived')
    .filter(page => !linkedPages.some(linked => linked.id === page.id))
    .filter(page => selectedProjectId == null || page.project_id == null || String(page.project_id) === String(selectedProjectId))
    .filter(page => page.title.toLowerCase().includes(pageSearch.toLowerCase()))
    .sort((a, b) => Number(String(b.project_id) === String(selectedProjectId)) - Number(String(a.project_id) === String(selectedProjectId)))
    .slice(0, 12), [pages, linkedPages, selectedProjectId, pageSearch])

  useEffect(() => {
    let cancelled = false
    setLinkedPages([])
    setSelectedPageId(null)
    setPickerOpen(false)
    if (!savedMeeting?.id) return () => { cancelled = true }
    invoke('get_pages_for_meeting', { meetingId: savedMeeting.id }).then(response => {
      if (cancelled) return
      if (response.success) {
        setLinkedPages(response.data || [])
        setSelectedPageId(response.data?.[0]?.id ?? null)
      } else setActionError(response.error || 'Could not load linked pages')
    }).catch(cause => { if (!cancelled) setActionError(cause?.message || 'Could not load linked pages') })
    return () => { cancelled = true }
  }, [savedMeeting?.id, outlookId])

  useEffect(() => {
    let cancelled = false
    setPageView('content')
    setImagePreview(null)
    setPageTaskIds([])
    setPageUpdates([])
    if (!selectedPage?.id) return () => { cancelled = true }
    Promise.all([getTaskIdsForPage(selectedPage.id), getPageUpdates(selectedPage.id)]).then(([taskResponse, updateResponse]) => {
      if (cancelled) return
      if (taskResponse.success) setPageTaskIds(taskResponse.data || [])
      if (updateResponse.success) setPageUpdates(updateResponse.data || [])
    })
    return () => { cancelled = true }
  }, [selectedPage?.id])

  const storeMeeting = row => setSavedMeetings(current => ({ ...current, [row.outlook_id]: row }))
  const ensureMeeting = async () => {
    if (!outlookId) throw new Error('This Outlook event has no stable ID, so it cannot be linked')
    if (savedMeeting) return savedMeeting
    const request = {
      outlook_id: outlookId,
      title: meeting.subject || 'Untitled meeting',
      description: null,
      date,
      start_time: meeting.start || '',
      end_time: meeting.end || '',
      location: meeting.location || null,
      attendees: null,
      meeting_url: null,
      meeting_type: null,
      project_id: null
    }
    let response = await invoke('create_meeting', { request })
    if (!response.success) response = await invoke('get_meeting_by_outlook_id', { outlookId })
    if (!response.success || !response.data) throw new Error(response.error || 'Could not save meeting')
    storeMeeting(response.data)
    return response.data
  }

  const runAction = async action => {
    if (busy) return
    setBusy(true)
    setActionError('')
    try { await action() } catch (cause) { setActionError(cause?.message || 'Could not complete the action') }
    finally { setBusy(false) }
  }

  const changeProject = projectId => runAction(async () => {
    if (projectId == null && !savedMeeting) return
    if (projectId != null && linkedPages.some(page => page.project_id != null && String(page.project_id) !== String(projectId))) {
      throw new Error('Unlink pages from the other project before changing this meeting’s project')
    }
    const row = await ensureMeeting()
    const response = await invoke('set_meeting_project', { outlookId: row.outlook_id, projectId })
    if (!response.success) throw new Error(response.error || 'Could not change project')
    storeMeeting(response.data)
    if (runningActivity?.reference_type === 'meeting' && runningActivity.reference_id === row.id) {
      const activityResponse = await updateExistingActivity({ ...runningActivity, project_id: projectId })
      if (!activityResponse.success) throw new Error(activityResponse.error || 'Meeting changed, but its running time entry could not be updated')
      onActivityStarted?.(activityResponse.data, null)
    }
  })

  const linkPage = page => runAction(async () => {
    const row = await ensureMeeting()
    const response = await invoke('link_page_to_meeting', { meetingId: row.id, pageId: page.id })
    if (!response.success) throw new Error(response.error || 'Could not link page')
    setLinkedPages(current => current.some(item => item.id === page.id) ? current : [...current, page])
    setSelectedPageId(page.id)
    setPickerOpen(false)
    const refreshed = await invoke('get_meeting_by_outlook_id', { outlookId: row.outlook_id })
    if (refreshed.success && refreshed.data) storeMeeting(refreshed.data)
  })

  const createAndLinkPage = () => runAction(async () => {
    const row = await ensureMeeting()
    const created = await createPage({
      project_id: row.project_id,
      area_id: null,
      title: meeting.subject || 'Meeting page',
      content: '',
      page_type: 'meeting',
      status: 'active',
      sort_order: 0,
      meeting_id: null
    })
    if (!created.success || !created.data) throw new Error(created.error || 'Could not create page')
    const linked = await invoke('link_page_to_meeting', { meetingId: row.id, pageId: created.data.id })
    if (!linked.success) throw new Error(`Page created, but linking failed: ${linked.error || 'unknown error'}`)
    setLinkedPages(current => [...current, created.data])
    setSelectedPageId(created.data.id)
    setPickerOpen(false)
  })

  const unlinkPage = page => runAction(async () => {
    const response = await invoke('unlink_page_from_meeting', { meetingId: savedMeeting.id, pageId: page.id })
    if (!response.success) throw new Error(response.error || 'Could not unlink page')
    setLinkedPages(current => current.filter(item => item.id !== page.id))
    if (selectedPageId === page.id) setSelectedPageId(null)
  })

  const saveUrl = () => runAction(async () => {
    const row = await ensureMeeting()
    const response = await invoke('update_meeting_url', { request: { outlook_id: row.outlook_id, meeting_url: urlDraft.trim() } })
    if (!response.success) throw new Error(response.error || 'Could not save meeting link')
    storeMeeting(response.data)
    setEditingUrl(false)
  })

  const startMeetingTracking = () => runAction(async () => {
    if (!meeting || isCanceled(meeting)) throw new Error('Canceled meetings cannot be tracked')
    const row = await ensureMeeting()
    const response = await startActivity({
      title: meetingTitle(meeting),
      activity_type: 'meeting',
      source: 'manual',
      reference_type: 'meeting',
      reference_id: row.id,
      project_id: row.project_id
    })
    if (!response.success) throw new Error(response.error || 'Could not start meeting tracking')
    onActivityStarted?.(response.data, null)
  })

  const stopMeetingTracking = () => runAction(async () => {
    const response = await stopCurrentActivity()
    if (!response.success) throw new Error(response.error || 'Could not stop meeting tracking')
    onActivityStopped?.()
  })

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-slate-100 text-slate-900">
      <div className="relative z-20 flex h-16 flex-none items-center border-b border-slate-200 bg-white">
        <div className="flex h-16 w-72 flex-none items-center border-r border-slate-200 px-3">
          <div className="flex h-9 w-full items-center rounded-full border border-slate-200 bg-white">
            <button type="button" onClick={() => setDate(value => addDays(value, -1))} className="grid h-8 w-8 flex-none place-items-center rounded-full text-slate-500 hover:bg-slate-50" aria-label="Previous day"><ChevronLeft className="h-4 w-4" /></button>
            <DatePickerField value={date} onChange={next => next && setDate(next)} ariaLabel="Select meeting date" compact className="min-w-0 flex-1 justify-center border-0 bg-transparent px-1 hover:bg-slate-50" />
            <button type="button" onClick={() => setDate(value => addDays(value, 1))} className="grid h-8 w-8 flex-none place-items-center rounded-full text-slate-500 hover:bg-slate-50" aria-label="Next day"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-5">
          {meeting && <>
            <div className="flex min-w-0 items-center gap-2"><h1 className="min-w-0 truncate text-lg font-semibold tracking-tight" title={meetingTitle(meeting)}>{meetingTitle(meeting)}</h1>{isCanceled(meeting) && <span className="flex-none rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">Canceled</span>}</div>
            <div className="flex flex-none items-center gap-2">
              <div className="relative w-44 flex-none"><FolderKanban className="pointer-events-none absolute left-3 top-2.5 z-10 h-4 w-4 text-indigo-600" /><Select value={selectedProjectId ?? ''} disabled={busy || !outlookId} onChange={value => changeProject(value ? Number(value) : null)} options={[{ value: '', label: 'No project' }, ...projects.map(project => ({ value: project.id, label: project.title }))]} ariaLabel="Meeting project" triggerClassName="border-indigo-200 bg-indigo-50 pl-9 font-semibold text-indigo-800 hover:border-indigo-300 hover:bg-indigo-100" menuClassName="right-0 left-auto w-56" /></div>
              {meetingUrl && !isCanceled(meeting) && <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-indigo-600 bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:border-indigo-700 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"><Video className="h-4 w-4" /> Join</a>}
              {!isCanceled(meeting) && (isTrackingMeeting ? <button type="button" onClick={stopMeetingTracking} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"><Square className="h-3.5 w-3.5" /> Stop tracking</button> : <button type="button" onClick={startMeetingTracking} disabled={busy || !outlookId} className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"><Play className="h-4 w-4" />{runningActivity ? 'Switch to meeting' : 'Track meeting'}</button>)}
              <div className="relative"><button type="button" onClick={() => { setUrlDraft(savedMeeting?.meeting_url || meetingUrl || ''); setEditingUrl(true) }} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 ${meetingUrl ? 'w-9' : 'px-3'}`} title={meetingUrl ? 'Edit meeting link' : 'Add meeting link'} aria-label={meetingUrl ? 'Edit meeting link' : 'Add meeting link'}><Link2 className="h-4 w-4" />{!meetingUrl && 'Add link'}</button>
                {editingUrl && <div className="absolute right-0 top-11 z-40 flex w-80 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"><input value={urlDraft} onChange={event => setUrlDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') saveUrl(); if (event.key === 'Escape') setEditingUrl(false) }} placeholder="https://…" className="h-9 min-w-0 flex-1 rounded-full border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400" autoFocus /><button onClick={saveUrl} disabled={busy || !urlDraft.trim()} className="grid h-9 w-9 flex-none place-items-center rounded-full bg-indigo-600 text-white disabled:opacity-50" aria-label="Save meeting link"><Check className="h-4 w-4" /></button><button onClick={() => setEditingUrl(false)} className="grid h-9 w-9 flex-none place-items-center rounded-full border border-slate-200" aria-label="Cancel"><X className="h-4 w-4" /></button></div>}</div>
            </div>
          </>}
        </div>
      </div>

      {loading ? <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Loading Outlook meetings…</div>
        : error ? <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-slate-600"><p>{error}</p><button onClick={() => setReloadKey(value => value + 1)} className="rounded-full bg-indigo-600 px-4 py-2 font-semibold text-white">Retry</button></div>
          : <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[288px_minmax(0,1fr)]">
              <aside className="min-h-0 overflow-y-auto border-b border-slate-200 bg-white lg:border-b-0 lg:border-r" aria-label="Meetings for selected day">
                <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 px-3"><span className="flex-none rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{meetings.length} meetings</span><div className="flex flex-none items-center gap-1"><button type="button" onClick={() => setDate(localDate(new Date()))} className="h-8 rounded-full border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Today</button><button type="button" onClick={() => setReloadKey(value => value + 1)} className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50" title="Refresh meetings" aria-label="Refresh meetings"><RefreshCw className="h-4 w-4" /></button></div></div>
                {meetings.length ? <div className="divide-y divide-slate-100">{meetings.map((item, index) => {
                  const itemProject = projects.find(project => String(project.id) === String(savedMeetings[item.entry_id]?.project_id))
                  const itemIsRunning = runningActivity?.reference_type === 'meeting' && runningActivity.reference_id === savedMeetings[item.entry_id]?.id
                  return <button key={`${meetingKey(item)}-${index}`} type="button" onClick={() => { setSelectedIndex(index); setActionError(''); setEditingUrl(false) }} aria-current={selectedIndex === index ? 'true' : undefined} className={`relative flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${selectedIndex === index ? 'bg-indigo-50/70' : 'hover:bg-slate-50'} ${isCanceled(item) ? 'opacity-65' : ''}`}>
                    {selectedIndex === index && <span className="absolute inset-y-0 left-0 w-0.5 bg-indigo-500" />}
                    <span className="flex w-full items-start gap-2"><span className={`min-w-0 flex-1 line-clamp-2 text-sm font-semibold leading-snug ${selectedIndex === index ? 'text-indigo-800' : 'text-slate-800'}`}>{meetingTitle(item)}</span>{itemIsRunning && <span className="mt-1 h-2 w-2 flex-none animate-pulse rounded-full bg-emerald-500" title="Tracking" />}{isCanceled(item) && <span className="flex-none rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Canceled</span>}</span>
                    <span className="flex w-full items-center gap-2 text-xs text-slate-500"><span className="flex-none tabular-nums">{timeLabel(item.start)} – {timeLabel(item.end)}</span>{itemProject && <span className="ml-auto max-w-28 truncate rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600" title={itemProject.title}>{itemProject.title}</span>}</span>
                  </button>
                })}</div> : <p className="px-4 py-8 text-center text-sm text-slate-500">No meetings on this day.</p>}
              </aside>
              <div className="flex min-h-0 min-w-0 flex-col">
              {!meeting ? <div className="flex flex-1 flex-col items-center justify-center text-slate-500"><CalendarDays className="mb-3 h-7 w-7 text-slate-300" /><p className="text-sm font-medium">No meetings on {dateLabel(date)}</p><p className="mt-1 text-xs">Choose another day to browse Outlook.</p></div> : <>
              <div className="flex h-16 flex-none items-center gap-8 border-b border-slate-200 bg-white px-5 text-sm font-medium text-slate-700"><span className="inline-flex flex-none items-center gap-2"><Clock3 className="h-4 w-4 text-indigo-600" />{timeLabel(meeting.start)} – {timeLabel(meeting.end)}</span><span className="inline-flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 flex-none text-indigo-600" /><span className="truncate" title={meeting.location || ''}>{meeting.location || 'No location'}</span></span></div>
              {actionError && <p role="alert" className="mx-5 mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{actionError}</p>}
              {!outlookId && <p className="mx-5 mt-2 text-xs text-amber-700">Outlook did not provide an event ID. Project and page links cannot be saved for this meeting.</p>}
              <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-100">
                <div className="relative z-10 flex min-h-12 flex-none flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-5 py-2">
                  <div className="flex min-w-0 items-center gap-2"><span className="inline-flex h-7 flex-none items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-700"><FileText className="h-3.5 w-3.5" />Page</span>{linkedPages.length > 1 ? <Select value={selectedPage?.id || ''} onChange={value => setSelectedPageId(Number(value))} options={linkedPages.map(page => ({ value: page.id, label: page.title }))} ariaLabel="Linked page" className="w-56" triggerClassName="h-8 text-xs font-semibold" /> : <h2 className="max-w-56 truncate text-sm font-semibold" title={selectedPage?.title}>{selectedPage?.title || 'Linked page'}</h2>}{linkedPages.length > 1 && <span className="text-[11px] text-slate-400">{linkedPages.length} pages</span>}</div>
                  <div className="ml-auto flex items-center gap-2">{selectedPage && <><button onClick={() => onOpenPage?.(selectedPage)} className="inline-flex h-8 items-center gap-1 rounded-full border border-indigo-200 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">Open in Pages <ArrowRight className="h-3.5 w-3.5" /></button><button onClick={() => unlinkPage(selectedPage)} disabled={busy} className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-rose-600" title="Unlink page (does not delete it)" aria-label="Unlink page"><Unlink2 className="h-3.5 w-3.5" /></button></>}<button onClick={createAndLinkPage} disabled={busy || !outlookId} className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> New</button><div className="relative"><button onClick={() => setPickerOpen(value => !value)} disabled={busy || !outlookId} className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Link2 className="h-3.5 w-3.5" /> Link page</button>{pickerOpen && <div className="absolute right-0 top-10 z-30 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><input value={pageSearch} onChange={event => setPageSearch(event.target.value)} placeholder="Search pages" autoFocus className="h-9 w-full rounded-full border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400" /><div className="mt-2 max-h-64 overflow-y-auto">{pagesLoading ? <p className="p-3 text-xs text-slate-500">Loading pages…</p> : availablePages.length ? availablePages.map(page => <button key={page.id} onClick={() => linkPage(page)} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-indigo-50"><span className="min-w-0 truncate">{page.title}</span><span className="flex-none text-[11px] text-slate-500">{projects.find(project => project.id === page.project_id)?.title || 'No project'}</span></button>) : <p className="p-3 text-xs text-slate-500">No matching pages</p>}</div></div>}</div></div>
                </div>
                {selectedPage && <div ref={tabRailRef} className="relative flex h-12 flex-none items-end gap-1 border-b border-slate-200 bg-white px-5" role="tablist" aria-label="Linked page views"><span aria-hidden="true" className={`pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-indigo-500 transition-[left,width] duration-300 ease-out motion-reduce:transition-none ${tabIndicator.visible ? 'opacity-100' : 'opacity-0'}`} style={{ left: tabIndicator.left, width: tabIndicator.width }} />{[["content", "Content", FileText, null], ["tasks", "Tasks", ListTodo, pageTaskIds.length], ["updates", "Page updates", MessageSquareText, pageUpdates.length]].map(([value, label, Icon, count]) => <button key={value} ref={element => { if (element) tabRefs.current.set(value, element); else tabRefs.current.delete(value) }} type="button" role="tab" aria-selected={pageView === value} onClick={() => setPageView(value)} className={`relative z-10 inline-flex h-12 items-center gap-2 px-3 text-sm font-medium transition-colors duration-300 ${pageView === value ? 'text-indigo-700' : 'text-slate-700 hover:text-slate-900'}`}><Icon className="h-4 w-4" />{label}{count != null && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors duration-300 ${pageView === value ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>{count}</span>}</button>)}</div>}
                {selectedPage ? (
                  <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-3">
                    <div className="mx-auto flex min-h-[calc(100%-1.5rem)] max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#fffefa]">
                      {pageView === 'content' ? <div className="min-h-72 flex-1"><TipTapEditor key={selectedPage.id} content={selectedPage.content} editable={false} showToolbar={false} onChange={() => {}} /></div>
                        : pageView === 'tasks' ? <div className="divide-y divide-slate-100 bg-white">{pageTasks.length ? pageTasks.map(task => <div key={task.id} className="flex items-center gap-3 px-5 py-3 text-sm"><span className={`h-4 w-4 flex-none rounded-full border ${task.status === 'completed' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-400'}`} /><span className={`min-w-0 flex-1 truncate ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</span><span className="text-xs capitalize text-slate-500">{task.status.replace('_', ' ')}</span></div>) : <p className="px-5 py-8 text-center text-sm text-slate-500">No tasks linked to this page yet.</p>}</div>
                          : <div className="space-y-3 bg-slate-50/50 p-5">{pageUpdates.length ? pageUpdates.map(update => <article key={update.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="mb-2 text-xs font-semibold text-slate-600">Page update · {update.update_date}</p><div className="prose prose-sm max-w-none break-words [&_img]:!h-auto [&_img]:!w-auto [&_img]:max-h-72 [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:object-contain" onClick={event => { if (event.target instanceof HTMLImageElement) setImagePreview({ src: event.target.src, alt: event.target.alt || 'Update image' }) }} dangerouslySetInnerHTML={{ __html: sanitizeUpdateHtml(update.content) }} /></article>) : <p className="py-6 text-center text-sm text-slate-500">No updates on this page yet.</p>}</div>}
                    </div>
                  </div>
                )
                  : <div className="flex flex-1 flex-col items-center justify-center px-5 text-center"><FileText className="mb-3 h-7 w-7 text-slate-300" /><p className="text-sm font-semibold text-slate-700">No page linked to this meeting</p><p className="mt-1 max-w-sm text-xs text-slate-500">Link an existing project page or create a meeting page. The page holds the discussion, updates, and follow-up tasks.</p></div>}
              </section>
              </>}
              </div>
            </div>}
      {imagePreview && <div role="dialog" aria-modal="true" aria-label="Update image preview" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6" onClick={() => setImagePreview(null)}><button type="button" onClick={() => setImagePreview(null)} className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="Close image preview"><X className="h-5 w-5" /></button><img src={imagePreview.src} alt={imagePreview.alt} className="max-h-[88vh] max-w-[90vw] object-contain" onClick={event => event.stopPropagation()} /></div>}
    </div>
  )
}

export default MeetingsPage
