import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Clock3, RefreshCw, Target, Users } from 'lucide-react'
import { useActivityAnalytics } from '../hooks/useActivityAnalytics'
import DatePickerField from '../components/DatePickerField'
import useActivityTracker from '../hooks/useActivityTracker'

const RANGE_OPTIONS = [['day', 'Today'], ['week', 'Week'], ['month', 'Month'], ['custom', 'Custom']]
const pad = value => String(value).padStart(2, '0')
const localDate = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const fromDateKey = value => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day) }
const addDays = (value, amount) => { const date = fromDateKey(value); date.setDate(date.getDate() + amount); return localDate(date) }
const timeLabel = value => new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
const durationLabel = milliseconds => {
  const minutes = Math.max(0, Math.round(milliseconds / 60000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60); const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function getRange(mode, anchor, customStart, customEnd) {
  const date = fromDateKey(anchor)
  if (mode === 'day') {
    const end = new Date(date); end.setDate(end.getDate() + 1)
    return { start: date, end }
  }
  if (mode === 'week') {
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    const end = new Date(date); end.setDate(end.getDate() + 7)
    return { start: date, end }
  }
  if (mode === 'month') return { start: new Date(date.getFullYear(), date.getMonth(), 1), end: new Date(date.getFullYear(), date.getMonth() + 1, 1) }
  const start = fromDateKey(customStart)
  const end = fromDateKey(customEnd); end.setDate(end.getDate() + 1)
  return { start, end }
}

function StatCard({ icon: Icon, label, value, detail, tone }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div><p className="mt-3 text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold text-slate-900">{value}</p><p className="mt-1 text-[11px] text-slate-400">{detail}</p></div>
}

function DetailList({ title, icon: Icon, rows = [], emptyLabel }) {
  const maximum = Math.max(...rows.map(row => row.total_seconds), 1)
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-4 flex items-center gap-2"><Icon className="h-4 w-4 text-indigo-600" /><h3 className="text-sm font-semibold text-slate-900">{title}</h3><span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{rows.length}</span></div>{rows.length ? <div className="space-y-4">{rows.slice(0, 6).map((row, index) => <div key={row.key}><div className="flex items-center gap-2 text-xs"><span className="w-4 text-slate-400">{index + 1}</span><span className="min-w-0 flex-1 truncate font-medium text-slate-700">{row.label}</span><span className="font-semibold tabular-nums text-slate-500">{durationLabel(row.total_seconds * 1000)}</span></div><div className="ml-6 mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${row.total_seconds / maximum * 100}%` }} /></div></div>)}</div> : <p className="py-5 text-center text-xs text-slate-400">{emptyLabel}</p>}</section>
}

export default function ActivitiesPage() {
  const today = localDate()
  const [range, setRange] = useState('day')
  const [anchor, setAnchor] = useState(today)
  const [customStart, setCustomStart] = useState(today)
  const [customEnd, setCustomEnd] = useState(today)
  const rangeRailRef = useRef(null)
  const rangeRefs = useRef(new Map())
  const [rangeIndicator, setRangeIndicator] = useState({ left: 0, width: 0, visible: false })
  const { activities } = useActivityTracker()
  const selectedRange = useMemo(() => getRange(range, anchor, customStart, customEnd), [range, anchor, customStart, customEnd])
  const { analytics, loading, refresh } = useActivityAnalytics(selectedRange.start.toISOString(), selectedRange.end.toISOString())
  const atCurrentPeriod = range === 'month'
    ? anchor.slice(0, 7) >= today.slice(0, 7)
    : range === 'week'
      ? getRange('week', anchor).start >= getRange('week', today).start
      : anchor >= today
  const dayTimeline = useMemo(() => {
    const selected = fromDateKey(anchor)
    const workStart = new Date(selected); workStart.setHours(8, 0, 0, 0)
    const workEnd = new Date(selected); workEnd.setHours(20, 0, 0, 0)
    const now = Date.now()
    const sessions = activities.map(item => ({
      ...item,
      visibleStart: Math.max(new Date(item.start_time).getTime(), workStart.getTime()),
      visibleEnd: Math.min(item.end_time ? new Date(item.end_time).getTime() : now, workEnd.getTime())
    })).filter(item => item.visibleEnd > item.visibleStart).sort((a, b) => a.visibleStart - b.visibleStart)
    const rows = []
    let cursor = workStart.getTime()
    sessions.forEach(item => {
      if (item.visibleStart > cursor) rows.push({ type: 'gap', start: cursor, end: item.visibleStart })
      rows.push({ type: 'session', start: item.visibleStart, end: item.visibleEnd, item })
      cursor = Math.max(cursor, item.visibleEnd)
    })
    if (cursor < workEnd.getTime()) {
      if (anchor === today && now < workEnd.getTime()) {
        if (cursor < now) rows.push({ type: 'gap', start: cursor, end: now })
        rows.push({ type: 'future', start: Math.max(cursor, now), end: workEnd.getTime() })
      } else rows.push({ type: 'gap', start: cursor, end: workEnd.getTime() })
    }
    return rows
  }, [activities, anchor, today, loading])
  const taskSeconds = (analytics?.tasks || []).reduce((sum, task) => sum + task.total_seconds, 0)

  useLayoutEffect(() => {
    const rail = rangeRailRef.current
    const active = rangeRefs.current.get(range)
    if (!rail || !active) return undefined
    const update = () => setRangeIndicator({ left: active.offsetLeft, width: active.offsetWidth, visible: true })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(rail)
    observer.observe(active)
    return () => observer.disconnect()
  }, [range])

  const shift = amount => {
    if (range !== 'month') return setAnchor(addDays(anchor, range === 'week' ? amount * 7 : amount))
    const date = fromDateKey(anchor)
    date.setDate(1)
    date.setMonth(date.getMonth() + amount)
    setAnchor(localDate(date))
  }

  return <div className="flex h-full min-h-0 flex-col bg-slate-100 text-slate-900">
    <div className="flex h-16 flex-none items-center border-b border-slate-200 bg-white">
      <div className="flex h-16 w-72 flex-none items-center gap-2 border-r border-slate-200 px-3">
        <div className="min-w-0"><h2 className="truncate text-sm font-semibold text-slate-900">Workday timeline</h2><p className="mt-0.5 text-[11px] text-slate-400">8:00 AM – 8:00 PM</p></div>
      </div>
      <div className="flex h-16 min-w-0 flex-1 items-center gap-2 overflow-x-auto px-3 no-scrollbar">
        <div ref={rangeRailRef} className="relative flex h-10 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
          <span aria-hidden="true" className={`pointer-events-none absolute inset-y-1 left-0 z-0 rounded-full border border-slate-200 bg-white transition-[transform,width,opacity] duration-300 ease-out ${rangeIndicator.visible ? 'opacity-100' : 'opacity-0'}`} style={{ width: rangeIndicator.width, transform: `translateX(${rangeIndicator.left}px)` }} />
          {RANGE_OPTIONS.map(([id, label]) => <button ref={element => { if (element) rangeRefs.current.set(id, element); else rangeRefs.current.delete(id) }} key={id} onClick={() => setRange(id)} className={`relative z-10 h-8 flex-none rounded-full px-3.5 text-sm font-medium transition-colors duration-300 ${range === id ? 'text-indigo-700' : 'text-slate-700 hover:text-slate-900'}`}>{label}</button>)}
        </div>
        {range === 'custom' ? <div className="flex min-w-0 items-center gap-1">
          <DatePickerField value={customStart} onChange={next => next && setCustomStart(next)} ariaLabel="Custom range start" compact className="w-32 justify-center" />
          <span className="text-slate-400">–</span>
          <DatePickerField value={customEnd} onChange={next => next && setCustomEnd(next)} ariaLabel="Custom range end" compact className="w-32 justify-center" />
        </div> : <div className="flex h-9 w-64 min-w-0 flex-none items-center rounded-full border border-slate-200 bg-white">
          <button onClick={() => shift(-1)} className="grid h-8 w-8 flex-none place-items-center rounded-full text-slate-500 hover:bg-slate-50" aria-label="Previous period"><ChevronLeft className="h-4 w-4" /></button>
          <DatePickerField value={anchor} onChange={next => next && setAnchor(next)} ariaLabel={`Select ${range}`} compact className="min-w-0 flex-1 justify-center border-0 bg-transparent px-1 hover:bg-slate-50" />
          <button onClick={() => shift(1)} disabled={atCurrentPeriod} className="grid h-8 w-8 flex-none place-items-center rounded-full text-slate-500 hover:bg-slate-50 disabled:opacity-30" aria-label="Next period"><ChevronRight className="h-4 w-4" /></button>
        </div>}
        <button onClick={refresh} className="grid h-9 w-9 flex-none place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50" title="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
    </div>
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-72 flex-none flex-col border-r border-slate-200 bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
          <div className="relative pl-14">
            <span className="absolute left-0 top-0 text-[10px] font-semibold tabular-nums text-slate-400">8:00 AM</span>
            <div className="space-y-1.5 border-l border-slate-200 pl-3">
              {dayTimeline.map((row, index) => {
                const minutes = Math.round((row.end - row.start) / 60000)
                const proportionalHeight = Math.max(34, Math.min(112, minutes * 0.32))
                if (row.type === 'future') return <div key={index} className="rounded-lg bg-slate-50 px-3 py-2 text-[10px] text-slate-300" style={{ minHeight: proportionalHeight }}>Future time</div>
                if (row.type === 'gap') return <div key={index} className="relative flex flex-col justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2" style={{ minHeight: proportionalHeight }}><span className="absolute -left-[18px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-slate-300 bg-white" /><p className="text-[10px] font-medium tabular-nums text-slate-500">{timeLabel(row.start)} – {timeLabel(row.end)}</p><p className="mt-0.5 text-[10px] text-slate-400">Untracked · {durationLabel(row.end - row.start)}</p></div>
                const item = row.item
                return <div key={`${item.id}-${index}`} className={`relative flex flex-col justify-center rounded-lg border px-3 py-2 ${item.status === 'running' ? 'border-emerald-200 bg-emerald-50' : item.activity_type === 'meeting' ? 'border-amber-200 bg-amber-50' : 'border-indigo-200 bg-indigo-50'}`} style={{ minHeight: proportionalHeight }}><span className={`absolute -left-[18px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ring-2 ring-white ${item.status === 'running' ? 'animate-pulse bg-emerald-500' : item.activity_type === 'meeting' ? 'bg-amber-400' : 'bg-indigo-500'}`} /><p className="truncate text-xs font-semibold text-slate-800">{item.title}</p><p className="mt-1 text-[10px] font-medium tabular-nums text-slate-500">{timeLabel(row.start)} – {timeLabel(row.end)}</p><p className="mt-0.5 text-[10px] text-slate-400">{item.status === 'running' ? 'Running' : durationLabel(row.end - row.start)}</p></div>
              })}
            </div>
            <span className="mt-2 block text-[10px] font-semibold tabular-nums text-slate-400">8:00 PM</span>
          </div>
        </div>
      </aside>
      <main className="grid min-w-0 flex-1 grid-cols-2 gap-3 overflow-y-auto bg-slate-100 p-3">
        <section className="min-w-0 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Work summary</h2><p className="mt-1 text-xs text-slate-400">What you worked on during the selected period</p></div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Target} label="Tasks worked" value={analytics?.tasks?.length || 0} detail={`${durationLabel(taskSeconds * 1000)} spent on tasks`} tone="bg-indigo-50 text-indigo-600" />
            <StatCard icon={Clock3} label="Total worked" value={durationLabel((analytics?.total_seconds || 0) * 1000)} detail={`${analytics?.session_count || 0} tracked sessions`} tone="bg-emerald-50 text-emerald-600" />
            <StatCard icon={Users} label="Meetings" value={analytics?.meetings?.length || 0} detail={`${durationLabel((analytics?.meeting_seconds || 0) * 1000)} spent in meetings`} tone="bg-amber-50 text-amber-600" />
            <StatCard icon={BriefcaseBusiness} label="Projects touched" value={(analytics?.projects || []).filter(project => project.id).length} detail={`${analytics?.active_days || 0} active days`} tone="bg-violet-50 text-violet-600" />
          </div>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-indigo-600" /><h3 className="text-sm font-semibold text-slate-900">Time spent by project</h3></div>
            {(analytics?.projects || []).length ? <div className="space-y-4">{analytics.projects.map(project => { const percentage = analytics.total_seconds ? Math.round(project.total_seconds / analytics.total_seconds * 100) : 0; return <div key={project.key}><div className="flex items-center gap-3"><span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{project.label}</span><span className="text-xs text-slate-400">{percentage}%</span><span className="w-16 text-right text-xs font-semibold tabular-nums text-slate-600">{durationLabel(project.total_seconds * 1000)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(percentage, project.total_seconds ? 2 : 0)}%` }} /></div></div>})}</div> : <p className="py-8 text-center text-xs text-slate-400">No project time in this period</p>}
          </section>
        </section>

        <aside className="min-w-0 space-y-3">
          <DetailList title="Task details" icon={Target} rows={analytics?.tasks} emptyLabel="No tasks tracked" />
          <DetailList title="Project details" icon={BriefcaseBusiness} rows={analytics?.projects} emptyLabel="No projects tracked" />
          <DetailList title="Meeting details" icon={Users} rows={analytics?.meetings} emptyLabel="No meetings tracked" />
        </aside>
      </main>
    </div>
  </div>
}
