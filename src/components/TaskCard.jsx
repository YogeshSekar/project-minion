import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, CalendarPlus, Check, CirclePlay, GripVertical, Link2, MoreHorizontal, Pencil, Play, RotateCcw, Square, Trash2, X } from 'lucide-react'
import { formatDate, isOverdue, getPriorityBgColor, getTaskStatusBadge, getTaskStatusLabel } from '../utils/helpers'

function TaskCard({ 
  task, 
  projects, 
  onUpdate,
  onToggleComplete, 
  onEdit, 
  onLinkPage,
  onStartActivity, 
  onStopActivity, 
  runningActivity,
  onDelete,
  onAddToToday,
  onMouseDown,
  isDragging,
  hideStatus = false,
  compact = false,
  accent = false,
  autoEditTitle = false,
  onAutoEditComplete,
  isDraft = false,
  onDraftSave,
  onDraftCancel,
  draftSaving = false,
  draftError = ''
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [isEditingTitle, setIsEditingTitle] = useState(isDraft)
  const [titleDraft, setTitleDraft] = useState(task.title || '')
  const menuRef = useRef(null)
  const menuPopupRef = useRef(null)
  const cardRef = useRef(null)
  const titleInputRef = useRef(null)
  const project = task.project_id && projects?.find(p => p.id === task.project_id)
  const dueDateText = task.scheduled_date ? formatDate(task.scheduled_date) : null
  const overdue = task.scheduled_date && isOverdue(task.scheduled_date) && (task.status === 'todo' || task.status === 'in_progress')
  const isRunning = runningActivity && runningActivity.reference_id === task.id && runningActivity.reference_type === 'task'

  const priorityBadge = {
    high: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
    medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    low: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
  }[String(task.priority || 'medium').toLowerCase()] || 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'

  useEffect(() => {
    if (!menuOpen) return undefined

    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target) && !menuPopupRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const closeOnScroll = () => setMenuOpen(false)

    document.addEventListener('pointerdown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('scroll', closeOnScroll, true)
    window.addEventListener('resize', closeOnScroll)
    return () => {
      document.removeEventListener('pointerdown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('scroll', closeOnScroll, true)
      window.removeEventListener('resize', closeOnScroll)
    }
  }, [menuOpen])

  const toggleMenu = event => {
    if (!menuOpen) {
      const rect = event.currentTarget.getBoundingClientRect()
      const width = 152
      const height = 12 + 30 * (1 + Number(Boolean(onLinkPage)) + Number(Boolean(onDelete)))
      setMenuPosition({
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
        top: rect.bottom + height + 6 > window.innerHeight - 8
          ? Math.max(8, rect.top - height - 6)
          : rect.bottom + 6
      })
    }
    setMenuOpen(open => !open)
  }

  useEffect(() => {
    if (!isEditingTitle && !isDraft) setTitleDraft(task.title || '')
  }, [task.title, isEditingTitle, isDraft])

  useEffect(() => {
    if (!isEditingTitle || !titleInputRef.current) return

    titleInputRef.current.focus()
    const caretPosition = titleInputRef.current.value.length
    titleInputRef.current.setSelectionRange(caretPosition, caretPosition)
  }, [isEditingTitle])

  useEffect(() => {
    if (!compact || !autoEditTitle) return

    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    cardRef.current?.focus({ preventScroll: true })
    onAutoEditComplete?.()
  }, [autoEditTitle, compact, onAutoEditComplete])

  useEffect(() => {
    if (!compact || !isDraft) return
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    setIsEditingTitle(true)
  }, [compact, isDraft])

  const saveTitle = async () => {
    if (isDraft) return
    const nextTitle = titleDraft.trim()
    setIsEditingTitle(false)

    if (!nextTitle || nextTitle === task.title) {
      setTitleDraft(task.title || '')
      return
    }

    await onUpdate?.({ ...task, title: nextTitle })
  }

  const cancelTitleEdit = () => {
    setTitleDraft(task.title || '')
    setIsEditingTitle(false)
  }

  if (compact) {
    const badgeClass = 'inline-flex h-6 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold leading-none'

    return (
      <div
        ref={cardRef}
        tabIndex={-1}
        onClick={() => {
          if (isDraft) {
            setIsEditingTitle(true)
            return
          }
          if (!isDragging) onEdit(task)
        }}
        className={`group relative rounded-xl border bg-white p-3 shadow-sm transition-all duration-200 ease-out dark:bg-slate-900 dark:shadow-none
          ${isDragging ? 'cursor-grabbing opacity-40' : 'cursor-pointer'}
        ${isDraft ? 'border-sky-300 ring-2 ring-sky-100 shadow-md dark:border-sky-700 dark:ring-sky-900' : isRunning ? 'border-emerald-400 ring-1 ring-emerald-100 shadow-md dark:ring-emerald-900' : accent ? 'border-accent-border bg-accent-surface/60 hover:-translate-y-0.5 hover:border-accent-focus hover:bg-accent-surface hover:shadow-md' : 'border-slate-200/90 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:hover:border-slate-600'}
        `}
      >
        {/* Primary row */}
        <div className="flex items-start gap-2">
          {onMouseDown && !isDraft && (
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => onMouseDown(e, task.id, { title: task.title, status: task.status })}
              className="-ml-1 grid h-5 w-4 flex-none cursor-grab place-items-center rounded text-slate-300 opacity-50 transition-colors hover:bg-slate-100 hover:text-slate-600 hover:opacity-100 active:cursor-grabbing group-hover:opacity-100"
              title="Drag task"
              aria-label={`Drag ${task.title}`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          <span className="relative mt-0.5 h-4 w-4 flex-none">
            <input
              type="checkbox"
              checked={task.status === 'completed'}
              onChange={(e) => {
                e.stopPropagation()
                if (!isDraft) onToggleComplete(task)
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-full border border-slate-400 bg-slate-50 transition-colors hover:border-slate-500 checked:border-slate-900 checked:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
              aria-label={task.status === 'completed' ? 'Mark task incomplete' : 'Mark task complete'}
              disabled={isDraft}
            />
            <Check className="pointer-events-none absolute left-0.5 top-0.5 hidden h-3 w-3 text-white peer-checked:block" strokeWidth={3} />
          </span>

          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onBlur={() => {
                if (!isDraft) saveTitle()
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (isDraft) {
                    const nextTitle = titleDraft.trim()
                    if (nextTitle && !draftSaving) onDraftSave?.(nextTitle)
                  } else {
                    e.currentTarget.blur()
                  }
                }
                if (e.key === 'Escape') {
                  if (isDraft) onDraftCancel?.()
                  else cancelTitleEdit()
                }
              }}
              className="min-w-0 flex-1 rounded-md border border-sky-300 bg-white px-1.5 py-0.5 text-sm font-semibold leading-5 text-slate-900 outline-none ring-2 ring-sky-100"
              aria-label="Edit task title"
              placeholder={isDraft ? 'Task title' : ''}
              disabled={draftSaving}
              autoFocus
            />
          ) : (
            <h3
              onClick={(e) => {
                e.stopPropagation()
                setTitleDraft(task.title || '')
                setIsEditingTitle(true)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`min-w-0 flex-1 break-words rounded px-0.5 text-sm font-semibold leading-5 transition-colors hover:bg-sky-50 ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}
              title="Click to edit title"
            >
              {task.title}
            </h3>
          )}

          {isDraft ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation()
                onDraftCancel?.()
              }}
              className="grid h-6 w-6 flex-none place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title="Discard draft"
              aria-label="Discard draft"
            >
              {draftSaving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /> : <X className="h-4 w-4" />}
            </button>
          ) : <div ref={menuRef} className="relative flex-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleMenu(e)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`grid h-6 w-6 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 ${menuOpen ? 'bg-slate-100 text-slate-700' : ''}`}
              title="More task actions"
              aria-label="More task actions"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && createPortal(
              <div
                ref={menuPopupRef}
                className="fixed z-[100] w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                style={menuPosition}
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit(task)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit task
                </button>
                {onLinkPage && (
              <button type="button" onClick={() => onLinkPage(task)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-accent-surface hover:text-accent-text">
                    <Link2 className="h-3.5 w-3.5" />
                    Link page
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete(task.id)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>,
              document.body
            )}
          </div>}
        </div>

        {/* Badges stay visible; quick actions join the same footer on hover. */}
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2">
          <div className="no-scrollbar flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto">
            <span className={`${badgeClass} flex-none ${priorityBadge}`}>
              {task.priority ? `${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)}` : 'Medium'}
            </span>

            {project && (
              <span className="inline-flex min-w-0 flex-none items-center border-l border-slate-200 pl-2 text-xs font-medium text-slate-600" title={`Project: ${project.title}`}>
                <span className="truncate">{project.title}</span>
              </span>
            )}

            {dueDateText && (
              <span className={`inline-flex flex-none items-center gap-1 border-l border-slate-200 pl-2 text-xs font-medium ${overdue ? 'text-red-700' : 'text-slate-600'}`} title={overdue ? 'Overdue' : 'Scheduled date'}>
                <Calendar className="h-3.5 w-3.5 flex-none" />
                {dueDateText}
              </span>
            )}

            {task.is_recurring === 1 && (
              <span className="inline-flex flex-none items-center gap-1 border-l border-slate-200 pl-2 text-xs font-medium text-slate-600" title="Recurring task">
                <RotateCcw className="h-3.5 w-3.5 flex-none" />
                {task.recurrence_type === 'daily' ? 'Daily' : task.recurrence_type === 'weekly' ? 'Weekly' : task.recurrence_type === 'monthly' ? 'Monthly' : 'Recurring'}
              </span>
            )}

            {!hideStatus && (
              <span className={`${badgeClass} flex-none border-transparent ${getTaskStatusBadge(task.status)}`}>
                {getTaskStatusLabel(task.status)}
              </span>
            )}
          </div>

          {!isDraft && (onStartActivity || onAddToToday) && (
          <div className="flex max-w-0 flex-none items-center justify-end gap-1 overflow-hidden opacity-0 transition-all duration-200 ease-out group-hover:max-w-20 group-hover:opacity-100 group-focus-within:max-w-20 group-focus-within:opacity-100">
            {onStartActivity && onStopActivity && (
              isRunning ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStopActivity()
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="relative grid h-7 w-7 place-items-center rounded-md bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                  title="Stop time tracking"
                  aria-label="Stop time tracking"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartActivity(task)
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  title="Start time tracking"
                  aria-label="Start time tracking"
                >
                  <CirclePlay className="h-4 w-4" />
                </button>
              )
            )}

            {onAddToToday && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToToday(task)
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700"
                title="Add task to Today"
                aria-label="Add task to Today"
              >
                <CalendarPlus className="h-4 w-4" />
              </button>
            )}
          </div>
          )}
        </div>
        {isDraft && (
          <div className="mt-2 text-[10px] text-slate-400">
            {draftError ? <span className="font-medium text-red-600">{draftError}</span> : 'Press Enter to save · Esc to discard'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={(e) => {
        if (!isDragging) {
          onEdit(task)
        }
      }}
      onMouseDown={(e) => onMouseDown?.(e, task.id, { title: task.title, status: task.status })}
      className={`group relative overflow-hidden bg-white border border-slate-200/90 shadow-sm transition-all duration-200 ease-out
        ${compact ? 'rounded-xl p-2.5' : 'rounded-2xl p-3'}
        ${isDragging ? 'opacity-40 cursor-grabbing' : 'cursor-pointer'}
        ${runningActivity && runningActivity.reference_id === task.id && runningActivity.reference_type === 'task' ? 'border-emerald-400 ring-1 ring-emerald-100 shadow-md' : 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'}
      `}
    >
      {compact && (
        <span className={`absolute inset-y-0 left-0 w-1 ${getPriorityBgColor(task.priority)}`} aria-hidden="true" />
      )}

      <div className={`flex items-start ${compact ? 'gap-2 pl-0.5' : 'gap-2'}`}>
        <div className={`flex-shrink-0 ${compact ? 'mt-0.5' : 'mt-1'}`}>
          <span className="relative block h-4 w-4">
            <input
              type="checkbox"
              checked={task.status === 'completed'}
              onChange={(e) => {
                e.stopPropagation()
                onToggleComplete(task)
              }}
              onClick={(e) => e.stopPropagation()}
              className="peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 bg-white transition-colors checked:border-gray-900 checked:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1"
              aria-label={task.status === 'completed' ? 'Mark task incomplete' : 'Mark task complete'}
            />
            <Check className="pointer-events-none absolute left-0.5 top-0.5 hidden h-3 w-3 text-white peer-checked:block" strokeWidth={3} />
          </span>
        </div>
        <div className="min-w-0">
          <h3 className={`${compact ? 'text-sm leading-5' : 'text-[15px] leading-6'} break-words font-semibold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-slate-900'}`}>
            {task.title}
          </h3>
          {task.is_recurring === 1 && (
            <div className={`mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50/80 font-medium text-blue-700 ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'}`}>
              <RotateCcw className="w-3 h-3" />
              <span>
                {task.recurrence_type === 'daily' ? `Every ${task.recurrence_interval || 1} day${(task.recurrence_interval || 1) > 1 ? 's' : ''}` :
                 task.recurrence_type === 'weekly' ? `Every ${task.recurrence_interval || 1} week${(task.recurrence_interval || 1) > 1 ? 's' : ''}` :
                 task.recurrence_type === 'monthly' ? `Every ${task.recurrence_interval || 1} month${(task.recurrence_interval || 1) > 1 ? 's' : ''}` :
                 'Recurring'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={`${compact ? 'mt-1.5 gap-1.5 pl-0.5 text-[11px]' : 'mt-2 gap-2 text-xs'} flex flex-wrap items-center text-gray-500`}>
        {project && (
          <span className={`inline-flex min-w-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 font-medium text-slate-600 ${compact ? 'max-w-full px-1.5 py-0.5' : 'px-2.5 py-1'}`}>
            {!compact && <span className={`h-2.5 w-2.5 flex-none rounded-full ${getPriorityBgColor(task.priority)}`}></span>}
            <span className="truncate">{project.title}</span>
          </span>
        )}
        {dueDateText && (
          <span className={`inline-flex items-center gap-1 rounded-full ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} ${overdue ? 'bg-red-50 font-medium text-red-600' : 'bg-slate-50 text-slate-600'}`}>
            <Calendar className="w-3 h-3" />
            {dueDateText}
          </span>
        )}
      </div>

      <div className={`${compact ? 'mt-1.5 min-h-6' : 'mt-2'} flex items-center justify-between gap-3`}>
        {!hideStatus && (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getTaskStatusBadge(task.status)}`}>
            {getTaskStatusLabel(task.status)}
          </span>
        )}

        <div className={`flex items-center ${compact ? 'gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100' : 'gap-2 opacity-60 group-hover:opacity-100'} transition-opacity duration-200 ${hideStatus ? 'ml-auto' : ''}`}>
          {onStartActivity && onStopActivity && (
            runningActivity && runningActivity.reference_id === task.id && runningActivity.reference_type === 'task' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onStopActivity()
                }}
                className="rounded p-1 text-gray-500 transition-colors hover:bg-green-50 hover:text-green-600 focus-visible:opacity-100"
                title="Stop tracking"
              >
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <Square className="w-4 h-4" />
                </div>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onStartActivity(task)
                }}
                className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:opacity-100"
                title="Start tracking"
              >
                <Play className="w-4 h-4" />
              </button>
            )
          )}
          {onAddToToday && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToToday(task)
              }}
              className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:opacity-100"
              title="Add to Today"
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                console.log('[DEBUG] TaskCard delete button clicked, passing task.id:', task.id)
                onDelete(task.id)
              }}
              className="rounded p-1 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskCard


