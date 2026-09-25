import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  Link2,
  ListTodo,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X
} from 'lucide-react'
import TipTapEditor from '../components/TipTapEditor'
import Select from '../components/ui/Select'
import useAreas from '../hooks/useAreas'
import usePages from '../hooks/usePages'
import useProjects from '../hooks/useProjects'
import useTasks from '../hooks/useTasks'
import useClickOutside from '../hooks/useClickOutside'
import { getTaskIdsForPage, linkTaskToPage, unlinkTaskFromPage } from '../services/pageTaskService'
import { getPageUpdates, createPageUpdate, updatePageUpdate, deletePageUpdate } from '../services/pageUpdateService'
import { getPagePins, createPagePin, deletePagePin } from '../services/pagePinService'
import { hasUpdateContent, sanitizeUpdateHtml } from '../utils/updateContent'

const pageStatuses = [
  ['draft', 'Draft'],
  ['active', 'Active'],
  ['blocked', 'Blocked'],
  ['completed', 'Completed'],
  ['archived', 'Archived']
]

const pageTypes = [
  ['general', 'General'],
  ['meeting', 'Meeting'],
  ['plan', 'Plan'],
  ['decision', 'Decision'],
  ['research', 'Research'],
  ['status_update', 'Status update']
]

const statusStyles = {
  draft: 'border-slate-200 bg-slate-50 text-slate-600',
  active: 'border-sky-200 bg-sky-50 text-sky-700',
  blocked: 'border-red-200 bg-red-50 text-red-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  archived: 'border-stone-200 bg-stone-100 text-stone-600'
}

const typeStyles = {
  general: 'border-slate-200 bg-slate-50 text-slate-600',
  meeting: 'border-amber-200 bg-amber-50 text-amber-700',
  plan: 'border-blue-200 bg-blue-50 text-blue-700',
  decision: 'border-violet-200 bg-violet-50 text-violet-700',
  research: 'border-teal-200 bg-teal-50 text-teal-700',
  status_update: 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

const plainText = html => (html || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim()

const selectedProjectStorageKey = 'pages.selectedProjectId'
const areaStorageKey = projectId => `pages.selectedAreaId.${projectId}`
const savedAreaForProject = projectId => localStorage.getItem(areaStorageKey(projectId)) || 'all'
const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const formatUpdateDay = value => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const formatUpdateTime = value => new Date(`${value.replace(' ', 'T')}Z`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
const pageToDraft = page => ({
  title: page.title,
  content: page.content,
  status: page.status,
  page_type: page.page_type,
  project_id: page.project_id,
  area_id: page.area_id
})

function NotesPage({ pageToOpen, onPageOpened, openTaskModal, taskRefreshTrigger = 0 }) {
  const { projects, loading: projectsLoading } = useProjects()
  const { areas, loading: areasLoading, error: areasError, createArea, deleteArea } = useAreas()
  const { pages, loading: pagesLoading, error: pagesError, loadPages, createPage, updatePage, deletePage } = usePages()
  const { tasks, loading: tasksLoading, createTask, updateTask, loadTasks } = useTasks()

  const [selectedProjectId, setSelectedProjectId] = useState(() => pageToOpen ? (pageToOpen.project_id == null ? 'unassigned' : String(pageToOpen.project_id)) : null)
  const [selectedAreaId, setSelectedAreaId] = useState('all')
  const [selectedPageId, setSelectedPageId] = useState(null)
  const [search, setSearch] = useState('')
  const [isAddingArea, setIsAddingArea] = useState(false)
  const [newAreaTitle, setNewAreaTitle] = useState('')
  const [savingArea, setSavingArea] = useState(false)
  const [savingPage, setSavingPage] = useState(false)
  const [actionError, setActionError] = useState('')
  const { ref: propertiesMenuRef, isOpen: propertiesMenuOpen, setIsOpen: setPropertiesMenuOpen } = useClickOutside()
  const [draft, setDraft] = useState(null)
  const [pageView, setPageView] = useState('content')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [linkedTaskIds, setLinkedTaskIds] = useState([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [taskActionBusy, setTaskActionBusy] = useState(false)
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const [taskSearch, setTaskSearch] = useState('')
  const [updates, setUpdates] = useState([])
  const [updatesLoading, setUpdatesLoading] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateDraft, setUpdateDraft] = useState('')
  const [editingUpdateId, setEditingUpdateId] = useState(null)
  const [updateBusy, setUpdateBusy] = useState(false)
  const [pagePins, setPagePins] = useState([])
  const [pinsLoading, setPinsLoading] = useState(false)
  const [pinBusy, setPinBusy] = useState(false)
  const activePageIdRef = useRef(null)
  const updateTimelineRef = useRef(null)
  const titleRef = useRef(null)
  const areaInputRef = useRef(null)
  const sectionRailRef = useRef(null)
  const sectionTabRefs = useRef(new Map())
  const [sectionIndicator, setSectionIndicator] = useState({ left: 0, width: 0, visible: false })

  const selectAreaForProject = (projectId, areaId) => {
    setSelectedAreaId(areaId)
    localStorage.setItem(areaStorageKey(projectId), areaId)
  }

  useEffect(() => {
    if (projectsLoading) return
    const savedProjectId = localStorage.getItem(selectedProjectStorageKey)
    const fallbackProjectId = projects.length ? String(projects[0].id) : 'unassigned'
    const isAvailable = id => id === 'unassigned' || projects.some(project => String(project.id) === id)
    if (selectedProjectId === null) {
      const nextProjectId = savedProjectId && isAvailable(savedProjectId) ? savedProjectId : fallbackProjectId
      setSelectedProjectId(nextProjectId)
      setSelectedAreaId(savedAreaForProject(nextProjectId))
      localStorage.setItem(selectedProjectStorageKey, nextProjectId)
    } else if (!isAvailable(selectedProjectId)) {
      setSelectedProjectId(fallbackProjectId)
      setSelectedAreaId(savedAreaForProject(fallbackProjectId))
      setSelectedPageId(null)
      setDraft(null)
      localStorage.setItem(selectedProjectStorageKey, fallbackProjectId)
    }
  }, [projects, projectsLoading, selectedProjectId])

  const selectedProject = projects.find(project => String(project.id) === selectedProjectId)
  const projectAreas = useMemo(
    () => areas.filter(area => String(area.project_id) === selectedProjectId),
    [areas, selectedProjectId]
  )
  const draftProjectAreas = useMemo(
    () => areas.filter(area => String(area.project_id) === String(draft?.project_id)),
    [areas, draft?.project_id]
  )

  useEffect(() => {
    if (areasLoading || !selectedProjectId) return
    if (selectedAreaId !== 'all' && selectedAreaId !== 'unfiled' && !projectAreas.some(area => String(area.id) === selectedAreaId)) {
      selectAreaForProject(selectedProjectId, 'all')
    }
  }, [areasLoading, selectedProjectId, selectedAreaId, projectAreas])

  useLayoutEffect(() => {
    const rail = sectionRailRef.current
    const activeTab = sectionTabRefs.current.get(selectedAreaId)
    if (!rail || !activeTab) {
      setSectionIndicator(current => ({ ...current, visible: false }))
      return undefined
    }

    const updateIndicator = () => {
      setSectionIndicator({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
        visible: true
      })
    }

    updateIndicator()
    const resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(rail)
    resizeObserver.observe(activeTab)
    return () => resizeObserver.disconnect()
  }, [selectedAreaId, projectAreas, isAddingArea])

  const visiblePages = useMemo(() => {
    const query = search.trim().toLowerCase()
    return pages.filter(page => {
      const inProject = selectedProjectId === 'unassigned'
        ? page.project_id == null
        : String(page.project_id) === selectedProjectId
      if (!inProject) return false
      if (selectedAreaId === 'unfiled' && page.area_id != null) return false
      if (selectedAreaId !== 'all' && selectedAreaId !== 'unfiled' && String(page.area_id) !== selectedAreaId) return false
      if (query && !`${page.title} ${plainText(page.content)}`.toLowerCase().includes(query)) return false
      return true
    })
  }, [pages, search, selectedAreaId, selectedProjectId])

  useEffect(() => {
    if (!pageToOpen || pagesLoading) return
    const page = pages.find(item => String(item.id) === String(pageToOpen.id))
    if (page) {
      const projectId = page.project_id == null ? 'unassigned' : String(page.project_id)
      setSelectedProjectId(projectId)
      localStorage.setItem(selectedProjectStorageKey, projectId)
      selectAreaForProject(projectId, page.area_id == null ? 'unfiled' : String(page.area_id))
      setSearch('')
      setSelectedPageId(page.id)
      setDraft(pageToDraft(page))
      setPageView('content')
    }
    onPageOpened?.()
  }, [pageToOpen, pagesLoading, pages, onPageOpened])

  const selectedPage = pages.find(page => page.id === selectedPageId) || null
  activePageIdRef.current = selectedPageId
  const linkedTasks = tasks.filter(task => linkedTaskIds.includes(task.id))
  const linkCandidates = tasks
    .filter(task => !linkedTaskIds.includes(task.id) && task.title.toLowerCase().includes(taskSearch.toLowerCase()))
    .sort((a, b) => Number(b.project_id === selectedPage?.project_id) - Number(a.project_id === selectedPage?.project_id))
    .slice(0, 8)

  useEffect(() => { loadTasks() }, [taskRefreshTrigger, loadTasks])
  useEffect(() => {
    if (!selectedPageId) { setLinkedTaskIds([]); return }
    let current = true
    setLinksLoading(true)
    setLinkedTaskIds([])
    getTaskIdsForPage(selectedPageId).then(response => {
      if (!current) return
      if (response.success) setLinkedTaskIds(response.data || [])
      else setActionError(response.error || 'Could not load linked tasks')
      setLinksLoading(false)
    })
    return () => { current = false }
  }, [selectedPageId, taskRefreshTrigger])

  useEffect(() => {
    setUpdates([])
    setUpdateDraft('')
    setEditingUpdateId(null)
    setUpdateError('')
    if (!selectedPageId) return
    let current = true
    setUpdatesLoading(true)
    getPageUpdates(selectedPageId).then(response => {
      if (!current) return
      if (response.success) setUpdates(response.data || [])
      else setUpdateError(response.error || 'Could not load updates')
      setUpdatesLoading(false)
    })
    return () => { current = false }
  }, [selectedPageId])

  useEffect(() => {
    setPagePins([])
    if (!selectedPageId) { setPinsLoading(false); return }
    let current = true
    setPinsLoading(true)
    getPagePins(selectedPageId).then(response => {
      if (!current) return
      if (response.success) setPagePins(response.data || [])
      else setActionError(response.error || 'Could not load pins')
      setPinsLoading(false)
    })
    return () => { current = false }
  }, [selectedPageId])

  useEffect(() => {
    if (pageView !== 'updates' || updatesLoading) return
    const timeline = updateTimelineRef.current
    if (timeline) timeline.scrollTop = timeline.scrollHeight
  }, [pageView, selectedPageId, updates.length, updatesLoading])
  const dirty = Boolean(selectedPage && draft && (
    draft.title !== selectedPage.title ||
    draft.content !== selectedPage.content ||
    draft.status !== selectedPage.status ||
    draft.page_type !== selectedPage.page_type ||
    draft.project_id !== selectedPage.project_id ||
    draft.area_id !== selectedPage.area_id
  ))

  useEffect(() => {
    if (pageToOpen) return
    if (selectedPageId && !visiblePages.some(page => page.id === selectedPageId)) {
      setSelectedPageId(null)
      setDraft(null)
    }
  }, [selectedPageId, visiblePages, pageToOpen])

  useEffect(() => {
    if (pageToOpen) return
    if (!selectedPageId && visiblePages.length) {
      const page = visiblePages[0]
      setSelectedPageId(page.id)
      setDraft(pageToDraft(page))
    }
  }, [selectedPageId, visiblePages, pageToOpen])

  useEffect(() => {
    if (isAddingArea) setTimeout(() => areaInputRef.current?.focus(), 0)
  }, [isAddingArea])

  const selectPage = page => {
    if (dirty && !window.confirm('Discard the unsaved changes to this page?')) return
    setSelectedPageId(page.id)
    setPageView('content')
    setDraft(pageToDraft(page))
    setActionError('')
  }

  const openLinkedPage = id => {
    const page = pages.find(item => item.id === id)
    if (!page) { setActionError('Linked page is no longer available'); return }
    if (dirty && !window.confirm('Discard the unsaved changes to this page?')) return
    const projectId = page.project_id == null ? 'unassigned' : String(page.project_id)
    setSelectedProjectId(projectId)
    localStorage.setItem(selectedProjectStorageKey, projectId)
    selectAreaForProject(projectId, page.area_id == null ? 'unfiled' : String(page.area_id))
    setSearch('')
    setSelectedPageId(page.id)
    setDraft(pageToDraft(page))
    setPageView('content')
    setActionError('')
  }

  const addTextPin = async text => {
    if (!selectedPage || pinBusy) return
    setPinBusy(true)
    const response = await createPagePin({ page_id: selectedPage.id, kind: 'text', text, linked_page_id: null })
    if (response.success && activePageIdRef.current === selectedPage.id) setPagePins(current => [...current, response.data])
    else if (!response.success) setActionError(response.error || 'Could not pin text')
    setPinBusy(false)
  }

  const addPagePin = async page => {
    if (!selectedPage || pinBusy || pagePins.some(pin => pin.kind === 'page' && pin.linked_page_id === page.id)) return
    setPinBusy(true)
    const response = await createPagePin({ page_id: selectedPage.id, kind: 'page', text: page.title, linked_page_id: page.id })
    if (response.success && activePageIdRef.current === selectedPage.id) setPagePins(current => [...current, response.data])
    else if (!response.success) setActionError(response.error || 'Could not pin page')
    setPinBusy(false)
  }

  const removePagePin = async pin => {
    if (pinBusy) return
    const pageId = selectedPage?.id
    setPinBusy(true)
    const response = await deletePagePin(pin.id)
    if (activePageIdRef.current === pageId) {
      if (response.success) setPagePins(current => current.filter(item => item.id !== pin.id))
      else setActionError(response.error || 'Could not remove pin')
    }
    setPinBusy(false)
  }

  const changeProject = nextProjectId => {
    if (dirty && !window.confirm('Discard the unsaved changes to this page?')) return
    setSelectedProjectId(nextProjectId)
    localStorage.setItem(selectedProjectStorageKey, nextProjectId)
    setSelectedAreaId(savedAreaForProject(nextProjectId))
    setSelectedPageId(null)
    setDraft(null)
    setSearch('')
    setActionError('')
  }

  const changeArea = areaId => {
    if (dirty && !window.confirm('Discard the unsaved changes to this page?')) return
    selectAreaForProject(selectedProjectId, areaId)
    setSelectedPageId(null)
    setDraft(null)
    setActionError('')
  }

  const handleCreateArea = async () => {
    const title = newAreaTitle.trim()
    if (!title || !selectedProject || savingArea) return
    setSavingArea(true)
    setActionError('')
    const response = await createArea({
      project_id: selectedProject.id,
      title,
      description: null,
      sort_order: projectAreas.length
    })
    setSavingArea(false)
    if (response.success) {
      setNewAreaTitle('')
      setIsAddingArea(false)
      selectAreaForProject(selectedProjectId, String(response.data.id))
      setSelectedPageId(null)
      setDraft(null)
    } else {
      setActionError(response.error || 'Could not create section')
    }
  }

  const handleDeleteArea = async area => {
    if (!window.confirm(`Delete “${area.title}”? Its pages will move to No section.`)) return
    const response = await deleteArea(area.id)
    if (response.success) {
      if (selectedAreaId === String(area.id)) selectAreaForProject(selectedProjectId, 'unfiled')
      await loadPages()
    } else {
      setActionError(response.error || 'Could not delete section')
    }
  }

  const handleCreatePage = async () => {
    setActionError('')
    const areaId = selectedAreaId !== 'all' && selectedAreaId !== 'unfiled'
      ? Number(selectedAreaId)
      : null
    const response = await createPage({
      project_id: selectedProject?.id || null,
      area_id: areaId,
      title: 'Untitled Page',
      content: '',
      page_type: 'general',
      status: 'active',
      sort_order: 0,
      meeting_id: null
    })
    if (response.success) {
      const page = response.data
      setSelectedPageId(page.id)
      setPageView('content')
      setDraft(pageToDraft(page))
      setTimeout(() => {
        titleRef.current?.focus()
        titleRef.current?.select()
      }, 0)
    } else {
      setActionError(response.error || 'Could not create page')
    }
  }

  const handleSavePage = async () => {
    if (!selectedPage || !draft?.title.trim() || savingPage) return
    setSavingPage(true)
    setActionError('')
    const response = await updatePage({
      id: selectedPage.id,
      project_id: draft.project_id,
      area_id: draft.area_id,
      title: draft.title.trim(),
      content: draft.content,
      page_type: draft.page_type,
      status: draft.status,
      sort_order: selectedPage.sort_order,
      meeting_id: selectedPage.meeting_id
    })
    setSavingPage(false)
    if (response.success) {
      const page = response.data
      const nextProjectId = page.project_id == null ? 'unassigned' : String(page.project_id)
      setSelectedProjectId(nextProjectId)
      localStorage.setItem(selectedProjectStorageKey, nextProjectId)
      selectAreaForProject(nextProjectId, 'all')
      setDraft(pageToDraft(page))
    } else {
      setActionError(response.error || 'Could not save page')
    }
  }

  const handleDeletePage = async () => {
    if (!selectedPage || !window.confirm(`Delete “${selectedPage.title}”?`)) return
    const response = await deletePage(selectedPage.id)
    if (response.success) {
      setSelectedPageId(null)
      setDraft(null)
    } else {
      setActionError(response.error || 'Could not delete page')
    }
  }

  const addPageTask = async () => {
    const title = newTaskTitle.trim()
    if (!title || !selectedPage || taskActionBusy) return
    setTaskActionBusy(true)
    setActionError('')
    const created = await createTask({
      title, description: null, status: 'todo', priority: 'medium',
      due_date: null, scheduled_date: null, project_id: selectedPage.project_id,
      is_recurring: 0, recurrence_type: null, recurrence_interval: 1, meeting_id: null
    })
    if (created.success && created.data) {
      setNewTaskTitle('')
      const linked = await linkTaskToPage(selectedPage.id, created.data.id)
      if (linked.success) {
        setLinkedTaskIds(current => [...current, created.data.id])
      } else setActionError(`Task created, but could not link it: ${linked.error}`)
    } else setActionError(created.error || 'Could not create task')
    setTaskActionBusy(false)
  }

  const linkExistingTask = async task => {
    if (!selectedPage || taskActionBusy) return
    setTaskActionBusy(true)
    const response = await linkTaskToPage(selectedPage.id, task.id)
    if (response.success) {
      setLinkedTaskIds(current => [...current, task.id])
      setTaskSearch('')
      setShowTaskPicker(false)
    } else setActionError(response.error || 'Could not link task')
    setTaskActionBusy(false)
  }

  const unlinkPageTask = async taskId => {
    if (!selectedPage || taskActionBusy) return
    setTaskActionBusy(true)
    const response = await unlinkTaskFromPage(selectedPage.id, taskId)
    if (response.success) setLinkedTaskIds(current => current.filter(id => id !== taskId))
    else setActionError(response.error || 'Could not unlink task')
    setTaskActionBusy(false)
  }

  const togglePageTask = async task => {
    if (taskActionBusy) return
    setTaskActionBusy(true)
    const response = await updateTask({ ...task, status: task.status === 'completed' ? 'todo' : 'completed' })
    if (!response.success) setActionError(response.error || 'Could not update task')
    setTaskActionBusy(false)
  }

  const saveUpdate = async () => {
    if (!selectedPage || updateBusy) return
    const content = sanitizeUpdateHtml(updateDraft)
    if (!hasUpdateContent(content)) {
      setUpdateError('Write an update or add an image first.')
      return
    }
    const pageId = selectedPage.id
    setUpdateBusy(true)
    setUpdateError('')
    const response = editingUpdateId
      ? await updatePageUpdate({ id: editingUpdateId, content })
      : await createPageUpdate({ page_id: pageId, update_date: localDateKey(), content })
    if (response.success && activePageIdRef.current === pageId) {
      setUpdates(current => editingUpdateId
        ? current.map(item => item.id === response.data.id ? response.data : item)
        : [...current, response.data])
      setUpdateDraft('')
      setEditingUpdateId(null)
    } else if (!response.success && activePageIdRef.current === pageId) {
      setUpdateError(response.error || 'Could not save update.')
    }
    setUpdateBusy(false)
  }

  const startEditingUpdate = item => {
    if (hasUpdateContent(updateDraft) && !window.confirm('Discard the current draft?')) return
    setEditingUpdateId(item.id)
    setUpdateDraft(item.content)
    setUpdateError('')
  }

  const stopEditingUpdate = () => {
    setEditingUpdateId(null)
    setUpdateDraft('')
    setUpdateError('')
  }

  const removeUpdate = async item => {
    if (updateBusy || !window.confirm('Delete this update?')) return
    const pageId = selectedPage?.id
    setUpdateBusy(true)
    setUpdateError('')
    const response = await deletePageUpdate(item.id)
    if (activePageIdRef.current === pageId) {
      if (response.success) {
        setUpdates(current => current.filter(update => update.id !== item.id))
        if (editingUpdateId === item.id) stopEditingUpdate()
      } else setUpdateError(response.error || 'Could not delete update.')
    }
    setUpdateBusy(false)
  }

  useEffect(() => {
    const handleKeyDown = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleSavePage()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [draft, selectedPage, savingPage])

  const loading = projectsLoading || areasLoading || pagesLoading

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="relative z-30 flex-none overflow-visible border-b border-slate-200 bg-white">
        <div className="flex h-16 min-w-0 items-center">
          <div className="flex h-16 w-72 flex-none items-center justify-between gap-2 border-r border-slate-200 bg-white px-3">
          <button type="button" onClick={handleCreatePage} className="inline-flex h-9 min-w-[110px] flex-none items-center justify-center gap-2 rounded-full border border-accent-solid bg-accent-solid px-4 text-sm font-semibold text-accent-foreground transition-colors duration-200 hover:border-accent-solid-hover hover:bg-accent-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus" title="Create page">
              <Plus className="h-4 w-4" /> New page
            </button>
            <span className="text-xs font-medium tabular-nums text-slate-500" aria-live="polite">{visiblePages.length} {visiblePages.length === 1 ? 'page' : 'pages'}</span>
          </div>

          <div className="flex h-16 min-w-0 flex-1 items-center gap-3 px-3">
          <div className="relative w-48 flex-none">
            <FolderOpen className="pointer-events-none absolute left-3 top-2.5 z-10 h-4 w-4 text-accent-text" />
            <Select value={selectedProjectId || ''} onChange={changeProject} options={[...projects.map(project => ({ value: String(project.id), label: project.title })), { value: 'unassigned', label: 'Unassigned pages' }]} ariaLabel="Select project" triggerClassName="border-accent-border bg-accent-surface pl-9 pr-3 font-semibold text-accent-text hover:border-accent-focus hover:bg-accent-surface-hover" menuClassName="w-64" />
          </div>
          <div ref={sectionRailRef} className="relative flex h-10 min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full border border-slate-200 bg-slate-50 p-1 no-scrollbar" aria-label="Sections">
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-1 left-0 z-0 rounded-full border border-slate-200 bg-white transition-[transform,width,opacity] duration-300 ease-out ${sectionIndicator.visible ? 'opacity-100' : 'opacity-0'}`}
            style={{ width: sectionIndicator.width, transform: `translateX(${sectionIndicator.left}px)` }}
          />
              <button ref={element => { if (element) sectionTabRefs.current.set('all', element); else sectionTabRefs.current.delete('all') }} type="button" onClick={() => changeArea('all')} className={`relative z-10 h-8 flex-none rounded-full px-3.5 text-sm font-medium transition-colors duration-300 ${selectedAreaId === 'all' ? 'text-accent-text' : 'text-slate-700 hover:text-slate-900'}`}>
            All pages
          </button>
          {projectAreas.map(area => (
                <div ref={element => { const key = String(area.id); if (element) sectionTabRefs.current.set(key, element); else sectionTabRefs.current.delete(key) }} key={area.id} className={`group/tab relative z-10 flex h-8 flex-none items-center rounded-full transition-colors duration-300 ${selectedAreaId === String(area.id) ? 'text-accent-text' : 'text-slate-700 hover:text-slate-900'}`}>
              <button type="button" onClick={() => changeArea(String(area.id))} className="h-full max-w-[180px] truncate pl-4 pr-2 text-sm font-medium" title={area.title}>{area.title}</button>
              <button type="button" onClick={() => handleDeleteArea(area)} className="mr-1 grid h-6 w-6 place-items-center rounded-md opacity-0 transition-opacity hover:bg-slate-100 group-hover/tab:opacity-100 focus:opacity-100" title={`Delete ${area.title}`} aria-label={`Delete ${area.title}`}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
              <button ref={element => { if (element) sectionTabRefs.current.set('unfiled', element); else sectionTabRefs.current.delete('unfiled') }} type="button" onClick={() => changeArea('unfiled')} className={`relative z-10 h-8 flex-none rounded-full px-3.5 text-sm font-medium transition-colors duration-300 ${selectedAreaId === 'unfiled' ? 'text-accent-text' : 'text-slate-700 hover:text-slate-900'}`}>
            No section
          </button>
          {selectedProject && (isAddingArea ? (
                <div className="flex h-8 flex-none items-center rounded-full border border-accent-border bg-white px-1">
              <input
                ref={areaInputRef}
                value={newAreaTitle}
                onChange={event => setNewAreaTitle(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') handleCreateArea()
                  if (event.key === 'Escape') { setIsAddingArea(false); setNewAreaTitle('') }
                }}
                placeholder="Section name"
                className="w-28 bg-transparent px-1.5 text-sm font-semibold text-slate-800 outline-none"
              />
                  <button type="button" onClick={handleCreateArea} disabled={!newAreaTitle.trim() || savingArea} className="grid h-6 w-6 place-items-center rounded-md text-accent-text hover:bg-accent-surface disabled:opacity-40">
                {savingArea ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => { setIsAddingArea(false); setNewAreaTitle('') }} className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
                <button type="button" onClick={() => setIsAddingArea(true)} className="inline-flex h-8 flex-none items-center gap-1.5 rounded-full px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white/70 hover:text-accent-text">
              <Plus className="h-3.5 w-3.5" /> Section
            </button>
          ))}
          </div>
          </div>
        </div>
      </div>

      {(actionError || areasError || pagesError) && (
        <div className="flex flex-none items-center gap-2 border-x border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          <AlertCircle className="h-4 w-4" />
          {actionError || areasError || pagesError}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden bg-white">
        <aside className="flex w-72 flex-none flex-col border-r border-slate-200 bg-white">
          <div className="flex h-[61px] flex-none items-center justify-between gap-2 border-b border-slate-200 bg-white px-4">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search pages" className="h-9 w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/30" />
            </div>
          </div>

          <div key={`${selectedProjectId}-${selectedAreaId}`} className="page-panel-transition min-h-0 flex-1 overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="space-y-2 p-1">{[1, 2, 3].map(item => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : visiblePages.length ? visiblePages.map(page => (
              <button
                key={page.id}
                type="button"
                onClick={() => selectPage(page)}
                className={`relative flex h-11 w-full items-center gap-2 border-b border-slate-200 px-4 text-left text-sm font-medium transition-colors last:border-b-0 ${
                  selectedPageId === page.id
                        ? 'bg-accent-surface font-semibold text-accent-text'
                    : 'text-slate-700 hover:bg-white/90 hover:text-slate-900'
                }`}
                title={page.title}
              >
                    {selectedPageId === page.id && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-accent-solid" />}
                <span className="min-w-0 flex-1 truncate">{page.title}</span>
                <span className={`inline-flex h-5 flex-none items-center rounded-full border px-2 text-[10px] font-semibold ${typeStyles[page.page_type] || typeStyles.general}`}>
                  {page.page_type === 'status_update' ? 'Update' : pageTypes.find(([value]) => value === page.page_type)?.[1] || page.page_type}
                </span>
              </button>
            )) : (
              <div className="flex h-full min-h-48 flex-col items-center justify-center px-5 text-center">
                <FolderOpen className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">No pages here</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Create a page in this {selectedAreaId === 'unfiled' ? 'project' : 'section'} to begin.</p>
              </div>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-slate-100">
          {selectedPage && draft ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="relative z-20 flex-none overflow-visible border-b border-slate-200 bg-white px-5 py-3">
                <div className="flex min-w-[720px] items-center gap-3">
                  <input ref={titleRef} value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} className="min-w-[220px] flex-1 truncate bg-transparent text-lg font-semibold text-slate-900 outline-none placeholder:text-slate-300" placeholder="Page title" />
                  <div className="h-6 w-px flex-none bg-slate-200" />
                  <div className="flex flex-none items-center gap-2">
                      <Select value={draft.status} onChange={value => setDraft(current => ({ ...current, status: value }))} options={pageStatuses.map(([value, label]) => ({ value, label }))} ariaLabel="Page status" className="w-28" triggerClassName={`text-xs font-semibold ${statusStyles[draft.status] || statusStyles.draft}`} />
                      <span className="text-xs text-slate-600">Updated {new Date(selectedPage.updated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      {dirty && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved</span>}
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <button type="button" onClick={handleDeletePage} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600" title="Delete page" aria-label="Delete page"><Trash2 className="h-4 w-4" /></button>
                    <div ref={propertiesMenuRef} className="relative"><button type="button" onClick={() => setPropertiesMenuOpen(!propertiesMenuOpen)} className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${propertiesMenuOpen ? 'border-accent-border bg-accent-surface text-accent-text' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} title="Page properties" aria-label="Page properties" aria-expanded={propertiesMenuOpen}><MoreHorizontal className="h-4 w-4" /></button>{propertiesMenuOpen && <div className="absolute right-0 top-11 z-[90] w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"><div className="mb-3"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Page type</p><Select value={draft.page_type} onChange={value => setDraft(current => ({ ...current, page_type: value }))} options={pageTypes.map(([value, label]) => ({ value, label }))} ariaLabel="Page type" /></div><div className="mb-3"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Project</p><Select value={draft.project_id == null ? '' : String(draft.project_id)} onChange={value => setDraft(current => ({ ...current, project_id: value ? Number(value) : null, area_id: null }))} options={[{ value: '', label: 'No project' }, ...projects.map(project => ({ value: String(project.id), label: project.title }))]} ariaLabel="Page project" menuClassName="right-0 left-auto w-full" /></div><div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Section</p><Select value={draft.area_id == null ? '' : String(draft.area_id)} onChange={value => setDraft(current => ({ ...current, area_id: value ? Number(value) : null }))} options={[{ value: '', label: 'No section' }, ...draftProjectAreas.map(area => ({ value: String(area.id), label: area.title }))]} ariaLabel="Page section" disabled={draft.project_id == null} menuClassName="bottom-full top-auto mb-1 mt-0 w-full" /></div></div>}</div>
                    <button type="button" onClick={handleSavePage} disabled={!dirty || !draft.title.trim() || savingPage} className="inline-flex h-9 min-w-[88px] items-center justify-center gap-2 rounded-full bg-accent-solid px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-solid-hover disabled:cursor-not-allowed disabled:opacity-40">
                      {savingPage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex h-12 flex-none items-end gap-1 border-b border-slate-200 bg-white px-5" role="tablist" aria-label="Page sections">
                {[
                  ['content', 'Content', FileText, null],
                  ['tasks', 'Tasks', ListTodo, linkedTaskIds.length],
                  ['updates', 'Updates', MessageSquareText, updates.length]
                ].map(([value, label, Icon, count]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={pageView === value}
                    onClick={() => setPageView(value)}
                        className={`relative inline-flex h-12 items-center gap-2 px-3 text-sm font-medium transition-colors ${pageView === value ? 'text-accent-text' : 'text-slate-700 hover:text-slate-900'}`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                        {count !== null && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${pageView === value ? 'bg-accent-muted text-accent-text' : 'bg-slate-100 text-slate-700'}`}>{count}</span>}
                        {pageView === value && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent-solid" />}
                  </button>
                ))}
              </div>

              {pageView === 'content' ? (
                <div key="content" className="page-panel-transition min-h-0 flex-1 bg-slate-100 p-3">
                  <div className="mx-auto h-full max-w-5xl rounded-xl border border-slate-200 bg-[#fffefa]">
                    <TipTapEditor key={selectedPage.id} content={draft.content} onChange={content => setDraft(current => ({ ...current, content }))} onPinSelection={addTextPin} pinnedItems={pagePins.map(pin => ({ ...pin, displayText: pin.linked_page_id ? pages.find(page => page.id === pin.linked_page_id)?.title || pin.text : pin.text }))} onUnpin={removePagePin} pinBusy={pinBusy || pinsLoading} pageLinkOptions={pages.filter(page => page.id !== selectedPage.id)} onPinPageLink={addPagePin} onOpenPageLink={openLinkedPage} />
                  </div>
                </div>
              ) : pageView === 'tasks' ? (
                <div key="tasks" className="page-panel-transition min-h-0 flex-1 overflow-y-auto bg-slate-100 p-5 no-scrollbar">
                  <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Linked tasks</h3>
                        <p className="mt-0.5 text-xs text-slate-400">{linkedTasks.filter(task => task.status === 'completed').length} of {linkedTasks.length} completed</p>
                      </div>
                      <button type="button" onClick={() => setShowTaskPicker(value => !value)} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50" aria-expanded={showTaskPicker}>
                        <Link2 className="h-3.5 w-3.5" /> Link existing
                      </button>
                    </div>
                    {showTaskPicker && <div className="border-b border-slate-200 bg-slate-50 p-3">
                            <input value={taskSearch} onChange={event => setTaskSearch(event.target.value)} placeholder="Search existing tasks" autoFocus className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-accent-focus" />
                      <div className="mt-2 max-h-48 overflow-y-auto no-scrollbar">
                              {tasksLoading ? <p className="px-2 py-2 text-xs text-slate-500">Loading tasks…</p> : linkCandidates.length ? linkCandidates.map(task => <button key={task.id} type="button" disabled={taskActionBusy} onClick={() => linkExistingTask(task)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-accent-surface disabled:opacity-50"><Plus className="h-3.5 w-3.5 text-accent-text" /><span className="truncate">{task.title}</span></button>) : <p className="px-2 py-2 text-xs text-slate-500">No available tasks</p>}
                      </div>
                    </div>}
                    <div className="flex items-center gap-2 border-b border-slate-200 bg-sky-50/70 px-4 py-3">
                        <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-accent-muted text-accent-text"><Plus className="h-4 w-4" /></span>
                      <input
                        value={newTaskTitle}
                        onChange={event => setNewTaskTitle(event.target.value)}
                        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addPageTask() } }}
                        placeholder="Add a task to this page…"
                        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                      />
                        <button type="button" onClick={addPageTask} disabled={!newTaskTitle.trim() || taskActionBusy} className="h-8 rounded-full border border-accent-border bg-accent-surface px-4 text-xs font-semibold text-accent-text transition-colors hover:bg-accent-surface-hover disabled:opacity-40">{taskActionBusy ? 'Adding…' : 'Add'}</button>
                    </div>
                    <div>
                      {linksLoading || tasksLoading ? <p className="px-4 py-6 text-center text-sm text-slate-500">Loading linked tasks…</p> : linkedTasks.length ? linkedTasks.map(task => (
                        <div key={task.id} className="group flex min-h-12 items-center gap-3 border-b border-slate-200 px-4 py-2 last:border-b-0 hover:bg-slate-50/80">
                          <button
                            type="button"
                            onClick={() => togglePageTask(task)}
                            disabled={taskActionBusy}
                            className={`grid h-4 w-4 flex-none place-items-center rounded-full border ${task.status === 'completed' ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-400 bg-white text-transparent'}`}
                            aria-label={task.status === 'completed' ? 'Mark incomplete' : 'Mark completed'}
                          >
                            {task.status === 'completed' && <Check className="h-3 w-3" strokeWidth={3} />}
                          </button>
                              <button type="button" onClick={() => openTaskModal?.(task, 'edit')} className={`min-w-0 flex-1 truncate text-left text-sm font-semibold hover:text-accent-text ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</button>
                          <span className={`inline-flex h-6 flex-none items-center rounded-full border px-2.5 text-[11px] font-semibold ${task.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : task.status === 'in_progress' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                            {task.status === 'completed' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'To Do'}
                          </span>
                          <span className="inline-flex h-6 flex-none items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-600">
                            <span className={`h-2 w-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            {task.priority[0].toUpperCase() + task.priority.slice(1)}
                          </span>
                          <span className="inline-flex h-6 flex-none items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-600">
                            <CalendarDays className="h-3.5 w-3.5" /> {task.scheduled_date || task.due_date || 'No date'}
                          </span>
                          <button type="button" onClick={() => unlinkPageTask(task.id)} disabled={taskActionBusy} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Unlink task from page" aria-label={`Unlink ${task.title}`}><X className="h-3.5 w-3.5" /></button>
                        </div>
                      )) : <p className="px-4 py-7 text-center text-sm text-slate-500">No tasks linked yet. Add a task or link an existing one.</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div key="updates" className="page-panel-transition flex min-h-0 flex-1 flex-col bg-slate-100">
                  <div ref={updateTimelineRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-6" role="log" aria-label="Page updates">
                    <div className="mx-auto max-w-3xl">
                      {updatesLoading ? (
                        <p className="py-8 text-center text-sm text-slate-500">Loading updates…</p>
                      ) : updates.length ? (
                        <div className="space-y-5 pb-4">
                          {updates.map(item => (
                            <article key={item.id} className="group flex items-start gap-3">
                            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-accent-muted text-xs font-bold text-accent-text">U</span>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-500">
                                  <span className="font-semibold text-slate-800">Update</span>
                                  <span>{formatUpdateDay(item.update_date)} · {formatUpdateTime(item.created_at)}</span>
                                  {item.updated_at !== item.created_at && <span>· Edited</span>}
                                </div>
                                <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                              <div className="prose prose-sm max-w-none break-words text-slate-800 prose-p:my-1 prose-a:text-accent-text prose-a:underline prose-img:max-w-full prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: sanitizeUpdateHtml(item.content) }} />
                                </div>
                                <div className="mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                                <button type="button" onClick={() => startEditingUpdate(item)} disabled={updateBusy} className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-slate-500 hover:text-accent-text disabled:opacity-40" title="Edit update"><Pencil className="h-3 w-3" /> Edit</button>
                                  <button type="button" onClick={() => removeUpdate(item)} disabled={updateBusy} className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-slate-500 hover:text-red-600 disabled:opacity-40" title="Delete update"><Trash2 className="h-3 w-3" /> Delete</button>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-surface text-accent-text"><MessageSquareText className="h-5 w-5" /></span>
                          <p className="mt-3 text-sm font-semibold text-slate-700">No updates yet</p>
                          <p className="mt-1 text-xs text-slate-500">Start the conversation about this page below.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-none border-t border-slate-200 bg-white px-5 py-3">
                    <div className="mx-auto max-w-3xl">
                  {editingUpdateId && <div className="mb-2 flex items-center justify-between text-xs font-medium text-accent-text"><span>Editing update</span><button type="button" onClick={stopEditingUpdate} className="text-slate-500 hover:text-slate-800">Cancel edit</button></div>}
                  <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm transition-colors focus-within:border-accent-focus focus-within:ring-2 focus-within:ring-accent-focus/30" onKeyDownCapture={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); saveUpdate() } }}>
                        <TipTapEditor key={`${selectedPage.id}-${editingUpdateId || 'new'}`} content={updateDraft} onChange={setUpdateDraft} compact maxImageBytes={5 * 1024 * 1024} onImageError={setUpdateError} />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className={`min-w-0 text-xs ${updateError ? 'text-red-600' : 'text-slate-400'}`}>{updateError || 'Enter for a new line · Ctrl+Enter to post · Images up to 5 MB'}</p>
                      <button type="button" onClick={saveUpdate} disabled={updateBusy || !hasUpdateContent(updateDraft)} className="inline-flex h-8 flex-none items-center gap-1.5 rounded-full bg-accent-solid px-4 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-solid-hover disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-3.5 w-3.5" />{updateBusy ? 'Saving…' : editingUpdateId ? 'Save changes' : 'Post update'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-300"><FileText className="h-6 w-6" /></div>
              <p className="mt-4 text-sm font-semibold text-slate-600">Select a page to open it</p>
              <p className="mt-1 text-xs text-slate-400">Or create a new page in the selected section.</p>
            </div>
          )}
        </main>
      </div>
      </div>
    </div>
  )
}

export default NotesPage
