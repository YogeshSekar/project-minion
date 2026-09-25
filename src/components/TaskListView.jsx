import { Calendar, CalendarPlus, Check, CirclePlay, Filter, Link2, Loader2, MoreVertical, Pencil, Plus, RotateCcw, Search, Square, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { formatDate, getTaskStatusBadge, isOverdue } from '../utils/helpers'
import useClickOutside from '../hooks/useClickOutside'
import DatePickerField from './DatePickerField'

const statuses = [
  ['todo', 'To Do'],
  ['in_progress', 'In Progress'],
  ['waiting', 'Waiting'],
  ['completed', 'Completed']
]

const priorityTone = priority => ({
  high: 'border-red-200 bg-red-50 text-red-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700'
}[String(priority || 'medium').toLowerCase()] || 'border-slate-200 bg-slate-50 text-slate-700')

const priorityCheckboxTone = priority => ({
  high: 'border-red-500 checked:border-red-500 hover:border-red-600',
  medium: 'border-amber-500 checked:border-amber-500 hover:border-amber-600',
  low: 'border-emerald-500 checked:border-emerald-500 hover:border-emerald-600'
}[String(priority || 'medium').toLowerCase()] || 'border-slate-400 checked:border-slate-400 hover:border-slate-500')

function InlineMenu({ value, options, onChange, triggerClassName = '', searchable = false, align = 'left' }) {
  const { ref, isOpen, setIsOpen } = useClickOutside()
  const [query, setQuery] = useState('')
  const selectedOption = options.find(option => String(option.value) === String(value)) || options[0]
  const visibleOptions = searchable && query.trim()
    ? options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  return (
    <div ref={ref} className="relative inline-block max-w-full">
      <button type="button" onClick={() => { setQuery(''); setIsOpen(!isOpen) }} aria-expanded={isOpen} aria-haspopup="listbox" className={`flex h-full max-w-full items-center truncate ${triggerClassName}`}>
        {selectedOption?.label || 'Select'}
      </button>
      {isOpen && (
        <div className={`absolute top-full z-50 mt-2 min-w-44 max-w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-md ${align === 'right' ? 'right-0' : 'left-0'}`} role="listbox">
          {searchable && (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects" className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-accent-focus focus:bg-white focus:ring-2 focus:ring-accent-focus/30" autoFocus />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto">
          {visibleOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setIsOpen(false) }}
              role="option"
              aria-selected={String(option.value) === String(value)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${String(option.value) === String(value) ? 'bg-accent-surface font-semibold text-accent-text' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {option.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${option.dot}`} />}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {String(option.value) === String(value) && <Check className="h-4 w-4 flex-none" />}
            </button>
          ))}
          {visibleOptions.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-500">No projects found</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskActions({ task, isRunning, onEdit, onLinkPage, onDelete, onAddToToday, onStartActivity, onStopActivity }) {
  const { ref, isOpen, setIsOpen } = useClickOutside()

  return (
    <div ref={ref} data-list-actions className="relative ml-auto flex w-[92px] flex-none items-center justify-end gap-1">
      <div className="pointer-events-none flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        {isRunning ? (
          <button type="button" onClick={onStopActivity} className="relative grid h-7 w-7 place-items-center rounded-md bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100" title="Stop time tracking" aria-label="Stop time tracking">
            <Square className="h-3.5 w-3.5" />
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          </button>
        ) : (
          <button type="button" onClick={() => onStartActivity(task)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" title="Start time tracking" aria-label="Start time tracking">
            <CirclePlay className="h-4 w-4" />
          </button>
        )}
        <button type="button" onClick={() => onAddToToday(task)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700" title="Add to today" aria-label="Add to today">
          <CalendarPlus className="h-4 w-4" />
        </button>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`grid h-7 w-7 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 ${isOpen ? 'bg-slate-100 text-slate-700' : ''}`}
          title="More task actions"
          aria-label="More task actions"
          aria-expanded={isOpen}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-8 z-50 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg" onClick={() => setIsOpen(false)}>
            <button type="button" onClick={() => onEdit(task)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100">
              <Pencil className="h-3.5 w-3.5" />
              Edit task
            </button>
            {onLinkPage && <button type="button" onClick={() => onLinkPage(task)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-accent-surface hover:text-accent-text">
              <Link2 className="h-3.5 w-3.5" />
              Link page
            </button>}
            <button type="button" onClick={() => onDelete(task.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function QuickAddRow({ projects, onQuickAddTask }) {
  const titleInputRef = useRef(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('todo')
  const [scheduledDate, setScheduledDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [projectId, setProjectId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const nextTitle = title.trim()
    if (!nextTitle || saving) return
    setSaving(true)
    setError('')
    const response = await onQuickAddTask(status, nextTitle, {
      scheduled_date: scheduledDate || null,
      priority,
      project_id: projectId || null,
      focusAfterCreate: false
    })
    setSaving(false)
    if (response?.success) {
      setTitle('')
      setTimeout(() => titleInputRef.current?.focus(), 0)
    } else {
      setError(response?.error || 'Could not add task')
    }
  }

  return (
    <div className="relative z-20 flex-none rounded-xl border border-accent-border bg-accent-surface/50 px-3 py-3 transition-colors focus-within:border-accent-focus">
      <div className="flex min-h-9 items-center gap-2">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-accent-solid text-accent-foreground"><Plus className="h-4 w-4" /></span>
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={event => setTitle(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
          }}
          placeholder="Add a new task…"
          className="h-9 min-w-[180px] max-w-[440px] flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-500"
          disabled={saving}
          aria-label="New task title"
        />
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-visible">
          <span onClick={event => { if (!event.target.closest('button')) event.currentTarget.querySelector('button')?.click() }} className={`inline-flex h-9 flex-none cursor-pointer items-center rounded-full border px-3 ${getTaskStatusBadge(status)}`}>
            <InlineMenu value={status} options={statuses.map(([value, label]) => ({ value, label }))} onChange={setStatus} triggerClassName="text-xs font-semibold outline-none" />
          </span>
          <span onClick={event => { if (!event.target.closest('button')) event.currentTarget.querySelector('button')?.click() }} className={`inline-flex h-9 flex-none cursor-pointer items-center rounded-full border px-3 ${priorityTone(priority)}`}>
            <InlineMenu value={priority} options={[{ value: 'high', label: 'High', dot: 'bg-red-500' }, { value: 'medium', label: 'Medium', dot: 'bg-yellow-500' }, { value: 'low', label: 'Low', dot: 'bg-green-500' }]} onChange={setPriority} triggerClassName="text-xs font-semibold capitalize outline-none" />
          </span>
          <DatePickerField value={scheduledDate} onChange={setScheduledDate} placeholder="No date" ariaLabel="Select new task date" className="max-w-[130px] flex-none text-xs" />
          <div onClick={event => { if (!event.target.closest('button, input')) event.currentTarget.querySelector('button')?.click() }} className="inline-flex h-9 min-w-0 max-w-[140px] flex-none cursor-pointer items-center rounded-full border border-slate-200 bg-white px-3 text-slate-700">
            <InlineMenu value={projectId} options={[{ value: '', label: 'No project' }, ...(projects || []).map(project => ({ value: project.id, label: project.title }))]} onChange={setProjectId} searchable align="right" triggerClassName="max-w-[116px] text-xs font-medium outline-none" />
          </div>
        </div>
        <button type="button" onClick={submit} disabled={!title.trim() || saving} className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-accent-solid px-4 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-solid-hover disabled:cursor-not-allowed disabled:opacity-40">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add
        </button>
      </div>
      {error && <p className="mt-1 pl-8 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function TaskListView({ tasks, projects, groupBy = 'none', onUpdateTask, onEdit, onLinkPage, onDelete, onAddToToday, onStartActivity, onStopActivity, runningActivity, hasActiveFilters = false, onClearFilters, onQuickAddTask }) {
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [titleDraft, setTitleDraft] = useState('')

  const orderedTasks = tasks

  const toLocalDateKey = (date = new Date()) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const todayKey = toLocalDateKey(today)
  const tomorrowKey = toLocalDateKey(tomorrow)
  const groupDefinitions = groupBy === 'date'
    ? [
        ['overdue', 'Overdue', 'text-red-600'],
        ['today', `Today · ${today.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`, 'text-teal-700'],
        ['tomorrow', `Tomorrow · ${tomorrow.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`, 'text-sky-700'],
        ['upcoming', 'Upcoming', 'text-slate-800'],
        ['no_date', 'No date', 'text-slate-700']
      ]
    : groupBy === 'priority'
    ? [['high', 'High priority', 'text-red-600'], ['medium', 'Medium priority', 'text-amber-700'], ['low', 'Low priority', 'text-emerald-700'], ['none', 'No priority', 'text-slate-600']]
    : groupBy === 'status'
    ? [['todo', 'To Do', 'text-blue-700'], ['in_progress', 'In Progress', 'text-amber-700'], ['waiting', 'Waiting', 'text-violet-700'], ['completed', 'Completed', 'text-emerald-700']]
    : groupBy === 'project'
    ? [...(projects || []).map(project => [String(project.id), project.title, 'text-slate-800']), ['none', 'No project', 'text-slate-600']]
    : []

  const getGroupKey = task => {
    if (groupBy === 'date') {
      const dateKey = task.scheduled_date ? String(task.scheduled_date).slice(0, 10) : ''
      if (!dateKey) return 'no_date'
      if (dateKey < todayKey) return 'overdue'
      if (dateKey === todayKey) return 'today'
      if (dateKey === tomorrowKey) return 'tomorrow'
      return 'upcoming'
    }
    if (groupBy === 'priority') return task.priority || 'none'
    if (groupBy === 'status') return task.status || 'todo'
    if (groupBy === 'project') return task.project_id == null ? 'none' : String(task.project_id)
    return 'all'
  }

  const taskGroups = groupBy === 'none'
    ? [{ key: 'all', label: null, tone: '', tasks: orderedTasks }]
    : groupDefinitions
        .map(([key, label, tone]) => ({ key, label, tone, tasks: orderedTasks.filter(task => getGroupKey(task) === key) }))
        .filter(group => group.tasks.length > 0)

  const updateField = (task, field, value) => {
    if (value !== task[field]) onUpdateTask({ ...task, [field]: value })
  }

  const beginTitleEdit = (task) => {
    setEditingTaskId(task.id)
    setTitleDraft(task.title || '')
  }

  const saveTitle = (task) => {
    const nextTitle = titleDraft.trim()
    setEditingTaskId(null)
    if (nextTitle && nextTitle !== task.title) updateField(task, 'title', nextTitle)
    setTitleDraft('')
  }

  const cancelTitleEdit = () => {
    setEditingTaskId(null)
    setTitleDraft('')
  }

  return (
    <div className="min-h-0 min-w-0 flex flex-1 overflow-x-auto overflow-y-hidden bg-transparent p-4">
      <div className="mx-auto flex h-full w-full min-w-[760px] max-w-[1100px] flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_18px_rgba(15,23,42,0.07)]">
        {onQuickAddTask && <QuickAddRow projects={projects} onQuickAddTask={onQuickAddTask} />}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 no-scrollbar">
        {taskGroups.map(group => (
          <section key={group.key} className="mb-4 last:mb-0">
            {group.label && (
              <div className="mb-1.5 flex items-center gap-2 border-b border-slate-200 px-1 pb-1.5">
                <h3 className={`text-xs font-bold ${group.tone}`}>{group.label}</h3>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">{String(group.tasks.length).padStart(2, '0')}</span>
              </div>
            )}
            <div className={group.label ? 'overflow-visible rounded-xl border border-slate-200' : ''}>
            {group.tasks.map(task => {
          const isRunning = runningActivity?.reference_id === task.id && runningActivity?.reference_type === 'task'
          const overdue = task.scheduled_date && isOverdue(task.scheduled_date) && task.status !== 'completed'
          return (
            <div
              key={task.id}
              onClick={event => {
                if (event.target.closest('[data-list-title], [data-list-actions]')) return
                onEdit?.(task)
              }}
              className="group flex min-h-11 cursor-pointer items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 transition-colors duration-200 last:border-b-0 hover:bg-slate-50/80"
            >
              <span data-list-actions className="relative h-4 w-4 flex-none">
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() => updateField(task, 'status', task.status === 'completed' ? 'todo' : 'completed')}
                  className={`peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-full border-2 bg-white transition-colors checked:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 ${priorityCheckboxTone(task.priority)}`}
                  aria-label={task.status === 'completed' ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
                  title={`${task.priority || 'Medium'} priority`}
                />
                <Check className="pointer-events-none absolute left-0.5 top-0.5 hidden h-3 w-3 text-white peer-checked:block" strokeWidth={3} />
              </span>

              <div data-list-title className="flex min-w-[180px] max-w-[380px] flex-1 items-center">
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={event => setTitleDraft(event.target.value)}
                    onBlur={() => saveTitle(task)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        event.currentTarget.blur()
                      } else if (event.key === 'Escape') {
                        event.preventDefault()
                        cancelTitleEdit()
                      }
                    }}
                    className="min-w-0 w-full rounded-md border border-sky-300 bg-white px-1.5 py-0.5 text-sm font-semibold leading-5 text-slate-900 outline-none ring-2 ring-sky-100"
                    aria-label={`Edit title for ${task.title}`}
                    autoFocus
                  />
                ) : (
                  <button type="button" onClick={() => beginTitleEdit(task)} className={`min-w-0 w-full truncate px-0.5 text-left text-sm font-semibold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`} title={task.title}>
                    {task.title}
                  </button>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-hidden">
                <span className={`inline-flex h-6 flex-none items-center rounded-full border px-2.5 text-[11px] font-semibold leading-none ${getTaskStatusBadge(task.status)}`}>
                  {statuses.find(([value]) => value === task.status)?.[1] || task.status}
                </span>
                <span className={`inline-flex h-6 min-w-0 max-w-[130px] flex-none items-center gap-1 border-l border-slate-200 pl-2 text-xs font-medium ${overdue ? 'text-red-700' : 'text-slate-600'}`}>
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{task.scheduled_date ? formatDate(task.scheduled_date) : 'No date'}</span>
                </span>
                <div className="inline-flex h-6 min-w-0 max-w-[140px] flex-none items-center border-l border-slate-200 pl-2 text-slate-600">
                  <span className="max-w-[116px] truncate text-xs font-medium leading-none">{projects?.find(project => String(project.id) === String(task.project_id))?.title || 'No project'}</span>
                </div>
                {(task.is_recurring === 1 || task.is_recurring === true) && (
                  <span className="inline-flex h-6 flex-none items-center gap-1 border-l border-slate-200 pl-2 text-xs font-medium text-slate-600">
                    <RotateCcw className="h-3.5 w-3.5" />
                    {task.recurrence_type === 'daily' ? 'Daily' : task.recurrence_type === 'weekly' ? 'Weekly' : task.recurrence_type === 'bi_weekly' ? 'Bi-weekly' : task.recurrence_type === 'weekdays_only' ? 'Weekdays' : task.recurrence_type === 'monthly' ? 'Monthly' : 'Recurring'}
                  </span>
                )}
              </div>

              <TaskActions task={task} isRunning={isRunning} onEdit={onEdit} onLinkPage={onLinkPage} onDelete={onDelete} onAddToToday={onAddToToday} onStartActivity={onStartActivity} onStopActivity={onStopActivity} />
            </div>
          )
            })}
            </div>
          </section>
        ))}
      {orderedTasks.length === 0 && (
        <div className="flex min-h-40 items-center justify-center px-4 py-8 text-center">
          <div>
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
              <Filter className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {hasActiveFilters ? 'No tasks match these filters' : 'No tasks to show'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {hasActiveFilters ? 'Try changing or clearing the active filters.' : 'Completed tasks may be hidden.'}
            </p>
            {hasActiveFilters && onClearFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="mt-3 inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}

export default TaskListView
