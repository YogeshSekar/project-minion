import React, { useState, useEffect, useRef } from 'react'
import { X, Trash2, Check, Link2 } from 'lucide-react'
import Dropdown from './ui/Dropdown'
import DatePickerField from './DatePickerField'
import TipTapEditor from './TipTapEditor'
import { getPages } from '../services/pageService'
import { getPageIdsForTask, linkTaskToPage, unlinkTaskFromPage } from '../services/pageTaskService'
import { formatDate } from '../utils/helpers'

function TaskSidePanel({ 
  isOpen, 
  onClose, 
  task = null, 
  initialOpenPages = false,
  onSave, 
  onUpdateTask,
  onCreateTask,
  mode = 'create',
  projects = [],
  initialProjectId = null,
  onRefreshProjects = null,
  onDelete = null
}) {
  const panelKey = `${mode}-${task?.id || 'new'}`
  
  useEffect(() => {
    if (isOpen) {
      const nextFormData = {
        title: task?.title || '',
        description: task?.description || '',
        priority: task?.priority || 'medium',
        project_id: task?.project_id || (mode === 'create' ? initialProjectId : null),
        status: task?.status || 'todo',
        due_date: task?.due_date || '',
        scheduled_date: task?.scheduled_date || '',
        is_recurring: task?.is_recurring === 1 || task?.is_recurring === true,
        recurrence_type: task?.recurrence_type || 'daily',
        recurrence_interval: task?.recurrence_interval || 1,
        estimated_minutes: task?.estimated_minutes || 0,
        actual_minutes: task?.actual_minutes || 0,
      }
      setFormData(nextFormData)
      initialFormSnapshotRef.current = JSON.stringify(nextFormData)
      setErrors({})
      
    }
  }, [panelKey, isOpen, initialProjectId, mode])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    project_id: null,
    status: 'todo',
    due_date: '',
    scheduled_date: '',
    is_recurring: false,
    recurrence_type: 'daily',
    recurrence_interval: 1,
    estimated_minutes: 0,
    actual_minutes: 0,
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [recentProjectIds, setRecentProjectIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tasks.recentProjectIds') || '[]')
    } catch {
      return []
    }
  })
  const [pages, setPages] = useState([])
  const [linkedPageIds, setLinkedPageIds] = useState([])
  const [pagesLoading, setPagesLoading] = useState(false)
  const [showPagePicker, setShowPagePicker] = useState(false)
  const [pageSearch, setPageSearch] = useState('')
  const originalPageIdsRef = useRef([])
  const createdTaskRef = useRef(null)
  const titleInputRef = useRef(null)
  const initialFormSnapshotRef = useRef(JSON.stringify(formData))
  const formDirty = JSON.stringify(formData) !== initialFormSnapshotRef.current
  const linksDirty = [...linkedPageIds].sort().join(',') !== [...originalPageIdsRef.current].sort().join(',')
  const isDirty = formDirty || linksDirty
  const canSave = formData.title.trim() && (mode === 'create' || isDirty) && !isLoading && !isDeleting && !pagesLoading

  useEffect(() => {
    if (!isOpen) return
    let current = true
    setPagesLoading(true)
    setShowPagePicker(initialOpenPages)
    setPageSearch('')
    setPages([])
    setLinkedPageIds([])
    originalPageIdsRef.current = []
    createdTaskRef.current = null
    Promise.all([getPages(), mode === 'edit' && task?.id ? getPageIdsForTask(task.id) : Promise.resolve({ success: true, data: [] })])
      .then(([pageResponse, linksResponse]) => {
        if (!current) return
        if (pageResponse.success) setPages(pageResponse.data || [])
        else setErrors(previous => ({ ...previous, pages: pageResponse.error || 'Could not load pages' }))
        if (linksResponse.success) {
          const ids = linksResponse.data || []
          setLinkedPageIds(ids)
          originalPageIdsRef.current = ids
        } else setErrors(previous => ({ ...previous, pages: linksResponse.error || 'Could not load linked pages' }))
        setPagesLoading(false)
      })
    return () => { current = false }
  }, [isOpen, panelKey])

  const savePageLinks = async taskId => {
    const original = originalPageIdsRef.current
    for (const pageId of linkedPageIds.filter(id => !original.includes(id))) {
      const response = await linkTaskToPage(pageId, taskId)
      if (!response.success) throw new Error(response.error || 'Could not link page')
    }
    for (const pageId of original.filter(id => !linkedPageIds.includes(id))) {
      const response = await unlinkTaskFromPage(pageId, taskId)
      if (!response.success) throw new Error(response.error || 'Could not unlink page')
    }
    originalPageIdsRef.current = linkedPageIds
  }

  // Focus title input when panel opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus()
      // Place cursor at the end
      const length = titleInputRef.current.value.length
      titleInputRef.current.setSelectionRange(length, length)
    }
  }, [isOpen])

  const buildTaskPayload = () => {
    return {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date || null,
      scheduled_date: formData.scheduled_date || null,
      project_id: formData.project_id || null,
      is_recurring: formData.is_recurring ? 1 : 0,
      recurrence_type: formData.recurrence_type || null,
      recurrence_interval: formData.recurrence_interval || 1,
      estimated_minutes: formData.estimated_minutes || 0,
      actual_minutes: formData.actual_minutes || 0,
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (mode === 'edit' && !isDirty) return
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      if (mode === 'create') {
        const response = createdTaskRef.current || await onCreateTask(buildTaskPayload())
        if (response.success) {
          createdTaskRef.current = response
          await savePageLinks(response.data.id)
          onSave(response.data)
          onClose()
        } else {
          setErrors({ submit: response.error })
        }
      } else {
        // Update task with shared payload builder
        const taskPayload = {
          id: task.id,
          ...buildTaskPayload(),
        }
        const response = formDirty ? await onUpdateTask(taskPayload) : { success: true, data: task }
        if (!response.success) {
          setErrors({ submit: response.error })
          setIsLoading(false)
          return
        }

        if (response.success) {
          await savePageLinks(task.id)
          onSave(response.data)
          onClose()
        } else {
          setErrors({ submit: response.error })
        }
      }
    } catch (error) {
      setErrors({ submit: error.toString() })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleProjectChange = (projectId) => {
    handleChange('project_id', projectId)
    if (!projectId) return
    setRecentProjectIds(previous => {
      const next = [projectId, ...previous.filter(id => id !== projectId)].slice(0, 5)
      localStorage.setItem('tasks.recentProjectIds', JSON.stringify(next))
      return next
    })
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-700'
      case 'medium': return 'border-amber-200 bg-amber-50 text-amber-700'
      case 'low': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
      default: return 'border-slate-200 bg-slate-50 text-slate-600'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'border-emerald-200 bg-emerald-50 text-emerald-700'
      case 'in_progress': return 'border-amber-200 bg-amber-50 text-amber-700'
      case 'waiting': return 'border-violet-200 bg-violet-50 text-violet-700'
      default: return 'border-sky-200 bg-sky-50 text-sky-700'
    }
  }

  const getStatusLabel = (status) => {
    const labels = { todo: 'To Do', pending: 'To Do', in_progress: 'In Progress', waiting: 'Waiting', completed: 'Done' }
    return labels[status] || 'To Do'
  }

  const getSelectedProject = () => {
    return projects.find(p => p.id === formData.project_id)
  }

  const handleDelete = async () => {
    if (!task || !onDelete || isDeleting) return
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return
    setIsDeleting(true)
    setErrors(previous => ({ ...previous, submit: '' }))
    try {
      const response = await onDelete(task.id)
      if (response?.success === false) throw new Error(response.error || 'Could not delete task')
      onClose()
    } catch (error) {
      setErrors(previous => ({ ...previous, submit: error.toString() }))
      setIsDeleting(false)
    }
  }

  const requestClose = () => {
    if (isLoading || isDeleting) return
    if (isDirty && !window.confirm('Discard your unsaved changes?')) return
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyboardShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        if (canSave) handleSubmit()
      } else if (event.key === 'Escape' && !document.querySelector('[data-date-picker]')) {
        requestClose()
      }
    }
    document.addEventListener('keydown', handleKeyboardShortcut)
    return () => document.removeEventListener('keydown', handleKeyboardShortcut)
  }, [isOpen, canSave, isDirty, isLoading, isDeleting])

  if (!isOpen) return null

  const selectedProject = getSelectedProject()
  const linkedPages = pages.filter(page => linkedPageIds.includes(page.id))
  const matchingPages = pages.filter(page => page.title.toLowerCase().includes(pageSearch.toLowerCase()))
    .sort((a, b) => Number(b.project_id === formData.project_id) - Number(a.project_id === formData.project_id))
  const recentProjects = recentProjectIds.map(projectId => projects.find(project => project.id === projectId)).filter(Boolean)
  const quickProjects = [selectedProject, ...recentProjects, ...projects]
    .filter((project, index, list) => project && list.findIndex(item => item?.id === project.id) === index)
    .slice(0, 3)
  const toDateInput = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const todayDate = new Date()
  const tomorrowDate = new Date(todayDate)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const descriptionIsEmpty = !formData.description || !formData.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

  return (
    <React.Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-slate-950/35 transition-opacity"
        onClick={requestClose}
      />
      
      {/* Wide workspace; height stays unchanged. */}
      <div className="fixed left-1/2 top-1/2 z-[60] flex h-[min(760px,calc(100vh-32px))] w-[1100px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-scale-in">
        <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <span>{mode === 'create' ? 'New task' : 'Task details'}</span>
                {mode === 'edit' && task?.created_at && <span className="font-normal normal-case tracking-normal text-slate-400">· Created {formatDate(task.created_at)}</span>}
              </div>
              <input
                ref={titleInputRef}
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Task name"
                className="w-full border-none bg-transparent text-xl font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
              />
              {errors.title && <p className="mt-1 text-xs font-medium text-red-500">{errors.title}</p>}
            </div>
            <button onClick={requestClose} className="grid h-8 w-8 flex-none place-items-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900" aria-label="Close panel" title="Close"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold text-slate-400">Quick set</span>
            <button type="button" onClick={() => handleChange('scheduled_date', toDateInput(todayDate))} className="h-7 rounded-full border border-accent-border bg-accent-surface px-2.5 text-xs font-semibold text-accent-text transition-colors hover:bg-accent-surface-hover">Today</button>
            <button type="button" onClick={() => handleChange('scheduled_date', toDateInput(tomorrowDate))} className="h-7 rounded-full border border-accent-border bg-accent-surface px-2.5 text-xs font-semibold text-accent-text transition-colors hover:bg-accent-surface-hover">Tomorrow</button>
            {quickProjects.map(project => (
              <button key={project.id} type="button" onClick={() => handleProjectChange(project.id)} className={`h-7 max-w-[160px] truncate rounded-full border px-2.5 text-xs font-semibold transition-colors ${formData.project_id === project.id ? 'border-accent-border bg-accent-surface text-accent-text' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} title={project.title}>
                {project.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 gap-0 px-6 py-4">
{/* Left Column - Task Details */}
<div className="flex min-h-0 w-[58%] min-w-0 flex-col pr-6">
  {/* Description */}
  <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-[220px] w-full flex-1 overflow-hidden rounded-xl border border-slate-200 bg-[#fffefa] focus-within:border-accent-focus focus-within:ring-2 focus-within:ring-accent-focus/30">
      {descriptionIsEmpty && <span className="pointer-events-none absolute left-6 top-5 z-10 text-sm font-medium text-slate-400">Description</span>}
      <TipTapEditor
        content={formData.description}
        onChange={(content) => handleChange('description', content)}
        editable={true}
        showToolbar={false}
        hideScrollbar={true}
      />
    </div>
  </div>

</div>

            {/* Right Column - Properties */}
            <div className="no-scrollbar min-h-0 w-[42%] min-w-0 space-y-1 overflow-y-auto border-l border-slate-200 pl-6 pr-1">
              <div className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Properties</div>

              {/* Status */}
              <div className="grid min-h-10 grid-cols-[112px_1fr] items-center gap-3 border-b border-slate-200 px-1 py-1.5">
                <div className="text-xs font-semibold text-slate-500">Status</div>
                <div className="relative dropdown-container">
                  <Dropdown
                    trigger={
                      <button
                        className={`flex h-7 w-full items-center gap-2 rounded-full border px-2.5 text-xs font-semibold transition-colors ${getStatusColor(formData.status)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          formData.status === 'todo' ? 'bg-blue-500' :
                          formData.status === 'in_progress' ? 'bg-yellow-500' :
                          formData.status === 'waiting' ? 'bg-purple-500' :
                          'bg-green-500'
                        }`}></span>
                        {getStatusLabel(formData.status)}
                      </button>
                    }
                    align="right"
                    className="w-[160px]"
                  >
                    {[
                      { value: 'todo', label: 'To Do', color: 'bg-blue-500', bgColor: 'bg-blue-50 text-blue-600' },
                      { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500', bgColor: 'bg-yellow-50 text-yellow-600' },
                      { value: 'waiting', label: 'Waiting', color: 'bg-purple-500', bgColor: 'bg-purple-50 text-purple-600' },
                      { value: 'completed', label: 'Done', color: 'bg-green-500', bgColor: 'bg-green-50 text-green-600' }
                    ].map((status) => (
                      <button
                        key={status.value}
                        onClick={() => {
                          handleChange('status', status.value)
                        }}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm transition-colors ${formData.status === status.value ? 'bg-accent-surface text-accent-text' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.color}`}></span>
                        <span>{status.label}</span>
                      </button>
                    ))}
                  </Dropdown>
                </div>
              </div>

              {/* Priority */}
              <div className="grid min-h-10 grid-cols-[112px_1fr] items-center gap-3 border-b border-slate-200 px-1 py-1.5">
                <div className="text-xs font-semibold text-slate-500">Priority</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { value: 'high', label: 'High', color: 'bg-red-500' },
                    { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
                    { value: 'low', label: 'Low', color: 'bg-emerald-500' }
                  ].map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => handleChange('priority', priority.value)}
                      className={`flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors ${
                        formData.priority === priority.value
                          ? getPriorityColor(priority.value)
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${priority.color}`}></span>
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project */}
              <div className="grid min-h-10 grid-cols-[112px_1fr] items-center gap-3 border-b border-slate-200 px-1 py-1.5">
                <div className="text-xs font-semibold text-slate-500">Project</div>
                <div className="relative dropdown-container">
                  <Dropdown
                    trigger={
                      <button
                        className="flex h-7 w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                        {selectedProject ? selectedProject.title : 'No Project'}
                      </button>
                    }
                    align="right"
                    className="w-[180px]"
                  >
                    <button
                      onClick={() => {
                        handleProjectChange(null)
                      }}
                      className={`w-full text-left px-2 py-1.5 text-sm ${
                                  !formData.project_id ? 'bg-accent-surface text-accent-text' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      No Project
                    </button>
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          handleProjectChange(project.id)
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm ${
                                      formData.project_id === project.id ? 'bg-accent-surface text-accent-text' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {project.title}
                      </button>
                    ))}
                  </Dropdown>
                </div>
              </div>

              {/* Linked pages */}
              <div className="grid min-h-10 grid-cols-[112px_1fr] items-start gap-3 border-b border-slate-200 px-1 py-1.5">
                <div className="pt-1.5 text-xs font-semibold text-slate-500">Pages</div>
                <div className="min-w-0">
                      <button type="button" onClick={() => setShowPagePicker(value => !value)} aria-expanded={showPagePicker} className="flex h-7 w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-left text-xs font-semibold text-slate-600 transition-colors hover:border-accent-border hover:bg-accent-surface">
                        <Link2 className="h-3.5 w-3.5 flex-none text-accent-text" />
                    <span className="truncate">{pagesLoading ? 'Loading pages…' : linkedPages.length === 1 ? linkedPages[0].title : linkedPages.length ? `${linkedPages.length} linked pages` : 'Link a page'}</span>
                  </button>
                  {showPagePicker && <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                          <input value={pageSearch} onChange={event => setPageSearch(event.target.value)} placeholder="Search pages" className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-accent-focus" />
                    <div className="no-scrollbar mt-1 max-h-36 overflow-y-auto">
                            {matchingPages.length ? matchingPages.map(page => <button key={page.id} type="button" onClick={() => setLinkedPageIds(current => current.includes(page.id) ? current.filter(id => id !== page.id) : [...current, page.id])} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs text-slate-700 hover:bg-accent-surface">
                              <span className={`grid h-3.5 w-3.5 flex-none place-items-center rounded border ${linkedPageIds.includes(page.id) ? 'border-accent-solid bg-accent-solid text-accent-foreground' : 'border-slate-300'}`}>{linkedPageIds.includes(page.id) && <Check className="h-2.5 w-2.5" />}</span>
                        <span className="truncate">{page.title}</span>
                      </button>) : <p className="px-2 py-2 text-xs text-slate-500">No matching pages</p>}
                    </div>
                  </div>}
                  {errors.pages && <p className="mt-1 text-xs text-red-600">{errors.pages}</p>}
                </div>
              </div>

              {/* Deadline */}
              <div className="grid min-h-10 grid-cols-[112px_1fr] items-center gap-3 border-b border-slate-200 px-1 py-1.5">
                <div className="text-xs font-semibold text-slate-500" title="The final deadline for completing this task">Deadline</div>
                <DatePickerField value={formData.due_date} onChange={date => handleChange('due_date', date)} placeholder="Not set" ariaLabel="Select task deadline" compact className="w-full" />
              </div>

              {/* Schedule with recurrence */}
              <div className="grid grid-cols-[112px_1fr] items-start gap-3 border-b border-slate-200 px-1 py-2">
                <div className="pt-1.5 text-xs font-semibold text-slate-500" title="When you plan to work on this task">Schedule</div>
                <div className="space-y-2">
                  <DatePickerField value={formData.scheduled_date} onChange={date => handleChange('scheduled_date', date)} placeholder="Not set" ariaLabel="Select task schedule date" compact className="w-full" />

                  {/* Recurring Toggle & Options */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5">
                      <div className="text-xs font-semibold text-slate-500">Repeat</div>
                      <button
                        onClick={() => {
                          const newValue = !formData.is_recurring
                          handleChange('is_recurring', newValue)
                          if (!newValue) {
                            // Reset recurrence fields when disabled
                            handleChange('recurrence_type', '')
                            handleChange('recurrence_interval', 1)
                          }
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  formData.is_recurring ? 'bg-accent-solid' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            formData.is_recurring ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {!!formData.is_recurring && (
                      <div className="relative dropdown-container">
                        <Dropdown
                          trigger={
                            <button
                                  className="flex h-7 w-full items-center gap-2 rounded-full border border-accent-border bg-accent-surface px-2.5 text-xs font-semibold text-accent-text transition-colors hover:bg-accent-surface-hover"
                            >
                                  <span className="h-1.5 w-1.5 rounded-full bg-accent-solid"></span>
                              {formData.recurrence_type ? formData.recurrence_type.charAt(0).toUpperCase() + formData.recurrence_type.slice(1).replace('_', ' ') : 'Pattern'}
                            </button>
                          }
                          align="right"
                          className="w-[140px]"
                        >
                          {[
                            { value: 'daily', label: 'Daily' },
                            { value: 'weekly', label: 'Weekly' },
                            { value: 'bi_weekly', label: 'Bi Weekly' },
                            { value: 'weekdays_only', label: 'Weekdays Only' },
                            { value: 'monthly', label: 'Monthly' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                handleChange('recurrence_type', option.value)
                              }}
                              className={`w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 ${
                                formData.recurrence_type === option.value ? 'bg-gray-200 text-gray-900' : 'text-gray-900'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </Dropdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Tracking */}
              <div className="space-y-1">
                <div className="grid min-h-10 grid-cols-[112px_1fr] items-center gap-3 border-b border-slate-200 px-1 py-1.5">
                  <div className="text-xs font-semibold text-slate-500">Estimated time</div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={formData.estimated_minutes === 0 ? '0' : formData.estimated_minutes || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        handleChange('estimated_minutes', value === '' ? 0 : parseInt(value) || 0)
                      }}
                      placeholder="0"
                      min="0"
                                          className="h-7 w-16 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 outline-none focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/30"
                    />
                    <span className="text-xs text-slate-500">minutes</span>
                  </div>
                </div>
                
                {mode === 'edit' && (
                  <div className="grid min-h-10 grid-cols-[112px_1fr] items-center gap-3 px-1 py-1.5">
                    <div className="text-xs font-semibold text-slate-500">Actual time</div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={formData.actual_minutes === 0 ? '0' : formData.actual_minutes || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          handleChange('actual_minutes', value === '' ? 0 : parseInt(value) || 0)
                        }}
                        placeholder="0"
                        min="0"
                                          className="h-7 w-16 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 outline-none focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/30"
                      />
                      <span className="text-xs text-slate-500">minutes</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-6 py-3">
          {errors.submit && <p className="mb-2 text-right text-xs font-medium text-red-600">{errors.submit}</p>}
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading || isDeleting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 bg-white px-3.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              )}
              {isDirty && <span className="truncate text-xs font-medium text-amber-600">Unsaved changes</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={requestClose}
                disabled={isLoading || isDeleting}
                className="h-9 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSave}
              className="inline-flex h-9 min-w-[124px] items-center justify-center gap-1.5 rounded-full border border-accent-solid bg-accent-solid px-4 text-xs font-semibold text-accent-foreground transition-colors hover:border-accent-solid-hover hover:bg-accent-solid-hover disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
                title="Save task (Ctrl+Enter)"
              >
                {isLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {mode === 'create' ? 'Create Task' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      </React.Fragment>
    )
  }

export default TaskSidePanel
