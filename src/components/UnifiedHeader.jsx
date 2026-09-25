import React, { useState, useEffect, useMemo, useRef } from 'react'
import { CalendarDays, CheckSquare, ChevronDown, Clock3, FileText, FolderKanban, Loader2, Minus, Pause, Play, RotateCcw, Search, Square, X, XCircle, ListTodo } from 'lucide-react'
import { getActivities } from '../services/api'

const UnifiedHeader = ({
  pageTitle,
  searchQuery,
  setSearchQuery,
  isTimerOpen,
  setIsTimerOpen,
  elapsedTime,
  isTimerRunning,
  trackedTask,
  setTrackedTask,
  showTaskSelector,
  setShowTaskSelector,
  todayTasks,
  startTimer,
  pauseTimer,
  resetTimer,
  setElapsedTime,
  getCurrentDateTime,
  formatTime,
  onSettingsClick,
  searchTasks = [],
  searchPages = [],
  searchMeetings = [],
  projects = [],
  onOpenSearchTask,
  onOpenSearchPage,
  onOpenSearchProject,
  onOpenSearchMeeting
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const headerRef = useRef(null)
  const [showTaskDropdown, setShowTaskDropdown] = useState(false)
  const [recentTaskIds, setRecentTaskIds] = useState([])
  const [timerBusy, setTimerBusy] = useState(false)
  const [timerError, setTimerError] = useState('')
  const [showCompletedSearchResults, setShowCompletedSearchResults] = useState(() => localStorage.getItem('search.showCompleted') === 'true')
  const searchInputRef = useRef(null)
  const searchContainerRef = useRef(null)
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const taskSearchResults = useMemo(() => {
    if (!normalizedSearchQuery) return []
    return searchTasks
      .filter(task => {
        if (!showCompletedSearchResults && task.status === 'completed') return false
        const description = String(task.description || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
        return `${task.title || ''} ${description}`.toLowerCase().includes(normalizedSearchQuery)
      })
      .sort((left, right) => Number(left.status === 'completed') - Number(right.status === 'completed'))
      .slice(0, 8)
  }, [normalizedSearchQuery, searchTasks, showCompletedSearchResults])
  const pageSearchResults = useMemo(() => normalizedSearchQuery ? searchPages.filter(page => String(page.title || '').toLowerCase().includes(normalizedSearchQuery)).slice(0, 5) : [], [normalizedSearchQuery, searchPages])
  const projectSearchResults = useMemo(() => normalizedSearchQuery ? projects.filter(project => String(project.title || '').toLowerCase().includes(normalizedSearchQuery)).slice(0, 5) : [], [normalizedSearchQuery, projects])
  const meetingSearchResults = useMemo(() => normalizedSearchQuery ? searchMeetings.filter(meeting => String(meeting.title || '').toLowerCase().includes(normalizedSearchQuery)).slice(0, 5) : [], [normalizedSearchQuery, searchMeetings])
  const totalSearchResults = taskSearchResults.length + pageSearchResults.length + projectSearchResults.length + meetingSearchResults.length
  const recentTasks = useMemo(() => {
    const recent = recentTaskIds.map(id => searchTasks.find(task => String(task.id) === String(id))).filter(task => task && task.status !== 'completed')
    const fallback = todayTasks.filter(task => task.status !== 'completed' && !recent.some(item => String(item.id) === String(task.id)))
    return [...recent, ...fallback].slice(0, 6)
  }, [recentTaskIds, searchTasks, todayTasks])

  useEffect(() => {
    if (!isTimerOpen) return
    getActivities().then(response => {
      if (!response.success) return
      const ids = []
      for (const activity of response.data || []) {
        if (activity.reference_type !== 'task' || activity.reference_id == null || ids.some(id => String(id) === String(activity.reference_id))) continue
        ids.push(activity.reference_id)
        if (ids.length === 8) break
      }
      setRecentTaskIds(ids)
    }).catch(() => {})
  }, [isTimerOpen, isTimerRunning])

  const runTimerAction = async action => {
    if (timerBusy) return
    setTimerBusy(true)
    setTimerError('')
    const response = await action()
    if (response?.success === false) setTimerError(response.error || 'Could not update the timer.')
    setTimerBusy(false)
    return response
  }

  const startTask = task => runTimerAction(async () => {
    const response = await startTimer(task)
    if (response?.success) setShowTaskDropdown(false)
    return response
  })

  const toggleCompletedSearchResults = () => {
    setShowCompletedSearchResults(current => {
      const next = !current
      localStorage.setItem('search.showCompleted', String(next))
      return next
    })
  }

  const openTaskResult = task => {
    setIsSearchFocused(false)
    setSearchQuery('')
    searchInputRef.current?.blur()
    onOpenSearchTask?.(task)
  }

  const openSearchResult = (handler, item) => {
    setIsSearchFocused(false)
    setSearchQuery('')
    searchInputRef.current?.blur()
    handler?.(item)
  }

  useEffect(() => {
    if (!isSearchFocused) return undefined
    const closeSearch = event => {
      if (!searchContainerRef.current?.contains(event.target)) setIsSearchFocused(false)
    }
    document.addEventListener('mousedown', closeSearch)
    return () => document.removeEventListener('mousedown', closeSearch)
  }, [isSearchFocused])

  // Custom drag handling - only drag when holding and moving
  const handleMouseDown = (e) => {
    if (e.button === 0 && !e.target.closest('[data-tauri-drag-region="false"]')) { // Left click and not on interactive elements
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = Math.abs(e.clientX - dragStart.x)
      const deltaY = Math.abs(e.clientY - dragStart.y)
      
      // Only start dragging if moved more than 5px (to avoid accidental drags)
      if (deltaX > 5 || deltaY > 5) {
        import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
          getCurrentWindow().startDragging()
        }).catch(console.error)
        setIsDragging(false) // Stop tracking after starting drag
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus search globally with Alt+F, including from other inputs.
      if (e.key.toLowerCase() === 'f' && e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setIsSearchFocused(true)
        searchInputRef.current?.focus()
      }
      // Close search on Escape without discarding the current query.
      if (e.key === 'Escape' && isSearchFocused) {
        setIsSearchFocused(false)
        searchInputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSearchFocused, setSearchQuery])

  // Window control functions
  const handleMinimize = async () => {
    console.log('Minimize clicked')
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      await window.minimize()
    } catch (error) {
      console.error('Failed to minimize:', error)
    }
  }

  const handleMaximize = async () => {
    console.log('Maximize clicked')
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      await window.toggleMaximize()
    } catch (error) {
      console.error('Failed to maximize:', error)
    }
  }

  const handleClose = async () => {
    console.log('Close clicked')
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      await window.close()
    } catch (error) {
      console.error('Failed to close:', error)
    }
  }

  return (
    <div className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div 
        ref={headerRef}
        className="flex h-14 items-center justify-between select-none"
        onMouseDown={handleMouseDown}
      >

        {/* Left - Current page */}
        <div className="flex h-14 flex-none items-center" data-tauri-drag-region="false">
          <div className="flex h-14 w-16 flex-none items-center justify-center bg-slate-900">
            <CheckSquare className="h-6 w-6 text-accent-text" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="flex h-10 min-w-[180px] items-center px-4">
            <span className="whitespace-nowrap text-lg font-semibold leading-6 text-slate-800">{pageTitle}</span>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 flex items-center justify-center px-4" data-tauri-drag-region="false">
          <div ref={searchContainerRef} className="relative w-full max-w-lg">
            <div className={`
              flex items-center gap-3 rounded-full
              h-9 bg-slate-50 border border-slate-200 px-3
                hover:bg-white hover:border-accent-border
                focus-within:bg-white focus-within:border-accent-focus focus-within:ring-2 focus-within:ring-accent-focus/30
              transition-all duration-200
                ${isSearchFocused ? 'bg-white border-accent-focus ring-2 ring-accent-focus/30' : ''}
            `}>
              <Search className={`h-4 w-4 flex-shrink-0 transition-colors ${isSearchFocused ? 'text-accent-text' : 'text-slate-400'}`} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search tasks, projects, pages, and meetings"
                className="
                  flex-1 bg-transparent text-sm text-slate-800
                  placeholder:text-slate-400 focus:outline-none
                "
                data-tauri-drag-region="false"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  title="Clear search"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
              <span className="cursor-default rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Alt+F</span>
            </div>
            {isSearchFocused && (
              <div className="absolute left-0 right-0 z-[70] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-700">Global search</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Search across your workspace from one place.</p>
                </div>
                {!normalizedSearchQuery ? (
                  <div className="px-4 py-8 text-center">
                    <Search className="mx-auto h-6 w-6 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">Start typing to search</p>
                    <p className="mt-1 text-xs text-slate-400">Search tasks, pages, projects, and saved meetings.</p>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto p-2">
                    <div className="flex items-center justify-between gap-3 px-2 py-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tasks</span>
                      <div className="flex items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-500">
                          <span>Completed</span>
                          <button type="button" role="switch" aria-checked={showCompletedSearchResults} onClick={toggleCompletedSearchResults} className={`relative inline-flex h-4 w-7 rounded-full transition-colors ${showCompletedSearchResults ? 'bg-accent-solid' : 'bg-slate-300'}`}>
                            <span className={`mt-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${showCompletedSearchResults ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </button>
                        </label>
                        <span className="text-[11px] tabular-nums text-slate-400">{taskSearchResults.length} result{taskSearchResults.length === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                    {taskSearchResults.map(task => {
                      const project = projects.find(item => String(item.id) === String(task.project_id))
                      const status = task.status === 'completed' ? 'Completed' : task.status === 'in_progress' ? 'In progress' : task.status === 'waiting' ? 'Waiting' : 'To do'
                            return <button key={task.id} type="button" onClick={() => openTaskResult(task)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent-surface focus:bg-accent-surface focus:outline-none">
                              <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-accent-text'}`}><ListTodo className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1"><span className={`block truncate text-sm font-semibold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</span><span className="mt-0.5 block truncate text-xs text-slate-400">{status}{project ? ` · ${project.title}` : ''}</span></span>
                        <span className="flex-none rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-500">{task.priority || 'medium'}</span>
                      </button>
                    })}

                      {pageSearchResults.length > 0 && <div className="mt-1 border-t border-slate-100 pt-1"><div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pages</div>{pageSearchResults.map(page => { const project = projects.find(item => String(item.id) === String(page.project_id)); return <button key={page.id} type="button" onClick={() => openSearchResult(onOpenSearchPage, page)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent-surface"><span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-violet-50 text-violet-600"><FileText className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{page.title}</span><span className="mt-0.5 block truncate text-xs text-slate-400">Page{project ? ` · ${project.title}` : ' · No project'}</span></span></button>})}</div>}
                      {projectSearchResults.length > 0 && <div className="mt-1 border-t border-slate-100 pt-1"><div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Projects</div>{projectSearchResults.map(project => <button key={project.id} type="button" onClick={() => openSearchResult(onOpenSearchProject, project)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent-surface"><span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-sky-50 text-sky-600"><FolderKanban className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{project.title}</span><span className="mt-0.5 block truncate text-xs capitalize text-slate-400">Project · {project.status || 'active'}</span></span></button>)}</div>}
                      {meetingSearchResults.length > 0 && <div className="mt-1 border-t border-slate-100 pt-1"><div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Saved meetings</div>{meetingSearchResults.map(meeting => <button key={meeting.id} type="button" onClick={() => openSearchResult(onOpenSearchMeeting, meeting)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent-surface"><span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-amber-50 text-amber-600"><CalendarDays className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{meeting.title}</span><span className="mt-0.5 block truncate text-xs text-slate-400">{meeting.date}{meeting.start_time ? ` · ${meeting.start_time}` : ''}</span></span></button>)}</div>}
                    {totalSearchResults === 0 && <div className="px-4 py-8 text-center"><Search className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">No workspace matches</p><p className="mt-1 text-xs text-slate-400">Try a different title or task description.</p></div>}
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-400">
                  <span><kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-semibold text-slate-500">Esc</kbd> close</span>
                    {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus() }} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-accent-text"><XCircle className="h-3.5 w-3.5" />Clear query</button>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right - Actions & Controls */}
        <div className="ml-auto flex items-center gap-3 pr-3" data-tauri-drag-region="false">

          {/* Task Timer */}
          <div className="relative" id="timer-dropdown">
            <div className={`flex h-9 items-center overflow-hidden rounded-full border bg-white transition-colors ${isTimerRunning ? 'border-emerald-200 bg-emerald-50/70' : trackedTask ? 'border-accent-border' : 'border-slate-200'}`}>
              <button type="button" onClick={() => setIsTimerOpen(!isTimerOpen)} className="flex h-full min-w-0 items-center gap-2 px-3 text-left hover:bg-slate-50/80" title="Open task timer">
                <span className={`relative grid h-6 w-6 flex-none place-items-center rounded-full ${isTimerRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-accent-surface text-accent-text'}`}><Clock3 className="h-3.5 w-3.5" />{isTimerRunning && <span className="absolute right-0 top-0 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}</span>
                {trackedTask && <span className="max-w-32 truncate text-xs font-semibold text-slate-700">{trackedTask.title}</span>}
                <span className={`text-xs font-semibold tabular-nums ${isTimerRunning ? 'text-emerald-700' : 'text-slate-500'}`}>{formatTime(elapsedTime)}</span>
                <ChevronDown className={`h-3.5 w-3.5 flex-none text-slate-400 transition-transform ${isTimerOpen ? 'rotate-180' : ''}`} />
              </button>
              <span className="h-5 w-px bg-slate-200" />
              <button type="button" onClick={() => runTimerAction(() => isTimerRunning ? pauseTimer() : startTimer())} disabled={timerBusy || (!isTimerRunning && !trackedTask)} className={`grid h-full w-9 flex-none place-items-center transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${isTimerRunning ? 'text-emerald-700 hover:bg-emerald-100' : 'text-accent-text hover:bg-accent-surface'}`} title={isTimerRunning ? 'Pause tracking' : trackedTask ? 'Resume tracking' : 'Choose a task to start'}>{timerBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : isTimerRunning ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}</button>
            </div>

            {isTimerOpen && (
              <div className="absolute right-0 z-[100] mt-2 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h3 className="text-sm font-semibold text-slate-800">Task timer</h3><p className="mt-0.5 text-[11px] text-slate-400">Track focused work against a task.</p></div><button type="button" onClick={() => setIsTimerOpen(false)} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close timer"><X className="h-4 w-4" /></button></div>

                <div className="p-4">
                  <div className={`rounded-xl border p-3 ${isTimerRunning ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/70'}`}>
                  <div className="flex items-center gap-3"><span className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${isTimerRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-accent-surface text-accent-text shadow-sm'}`}>{isTimerRunning ? <Pause className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{trackedTask?.title || 'No task selected'}</p><p className={`mt-0.5 text-[11px] font-medium ${isTimerRunning ? 'text-emerald-700' : 'text-slate-500'}`}>{isTimerRunning ? 'Tracking now' : trackedTask ? 'Paused' : 'Choose a recent task below'}</p></div><span className="text-xl font-semibold tabular-nums text-slate-800">{formatTime(elapsedTime)}</span></div>
                  <div className="mt-3 flex gap-2"><button type="button" onClick={() => runTimerAction(() => isTimerRunning ? pauseTimer() : startTimer())} disabled={timerBusy || (!isTimerRunning && !trackedTask)} className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isTimerRunning ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-accent-solid text-accent-foreground hover:bg-accent-solid-hover'}`}>{timerBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}{isTimerRunning ? 'Pause' : trackedTask && elapsedTime > 0 ? 'Resume' : 'Start'}</button><button type="button" onClick={() => runTimerAction(resetTimer)} disabled={timerBusy || (!trackedTask && !isTimerRunning)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Reset</button></div>
                  </div>

                  {timerError && <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{timerError}</p>}

                  <div className="mt-4 flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recent tasks</p><button type="button" onClick={() => setShowTaskDropdown(!showTaskDropdown)} className="text-[11px] font-semibold text-accent-text hover:underline">{showTaskDropdown ? 'Hide all' : 'Choose another'}</button></div>
                  <div className="mt-1 divide-y divide-slate-100">
                    {(showTaskDropdown ? searchTasks.filter(task => task.status !== 'completed').slice(0, 10) : recentTasks).map(task => { const project = projects.find(item => String(item.id) === String(task.project_id)); const active = String(trackedTask?.id) === String(task.id); return <div key={task.id} className={`group flex min-h-12 items-center gap-3 rounded-lg px-2 py-2 ${active ? 'bg-accent-surface/70' : 'hover:bg-slate-50'}`}><span className={`grid h-7 w-7 flex-none place-items-center rounded-lg ${active ? 'bg-accent-muted text-accent-text' : 'bg-slate-100 text-slate-500'}`}><ListTodo className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-800">{task.title}</span><span className="mt-0.5 block truncate text-[11px] text-slate-400">{project?.title || 'No project'}</span></span><button type="button" onClick={() => startTask(task)} disabled={timerBusy || (isTimerRunning && active)} className={`inline-flex h-7 flex-none items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold transition-colors disabled:cursor-default ${isTimerRunning && active ? 'bg-emerald-100 text-emerald-700' : 'border border-slate-200 bg-white text-accent-text hover:border-accent-border hover:bg-accent-surface'}`}>{isTimerRunning && active ? 'Running' : <><Play className="h-3 w-3 fill-current" />Start</>}</button></div> })}
                    {!recentTasks.length && !showTaskDropdown && <p className="py-6 text-center text-xs text-slate-400">No recently tracked tasks yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Window Controls */}
          <div className="ml-2 flex items-center gap-0.5 border-l border-slate-200 pl-2">
            <button
              onClick={handleMinimize}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleMaximize}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnifiedHeader
