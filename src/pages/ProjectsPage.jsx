import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, CheckCircle2, Circle, Clock3, Edit3, FileText, Flag, FolderKanban, Link2, ListTodo, Plus, Trash2, Unlink2, X } from 'lucide-react'
import ProjectModal from '../components/ProjectModal'
import ConfirmModal from '../components/ConfirmModal'
import TaskSidePanel from '../components/TaskSidePanel'
import Select from '../components/ui/Select'
import useProjects from '../hooks/useProjects'
import useTasks from '../hooks/useTasks'
import usePages from '../hooks/usePages'
import { formatDate, isOverdue } from '../utils/helpers'

const STATUS = {
  planning: ['Planning', 'bg-violet-500'],
  in_progress: ['In progress', 'bg-blue-500'], on_hold: ['On hold', 'bg-amber-500'],
  completed: ['Completed', 'bg-emerald-500']
}
const PRIORITY = {
  high: ['High', 'bg-rose-500'], medium: ['Medium', 'bg-amber-500'], low: ['Low', 'bg-emerald-500']
}

function ProjectsPage({ runningActivity, onActivityStarted, onActivityStopped, onOpenPage, onOpenPages }) {
  const { projects, loading, updateProject, deleteProject, loadProjects, upsertProject } = useProjects()
  const { tasks, createTask, updateTask, deleteTask } = useTasks()
  const { pages, loading: pagesLoading, updatePage } = usePages()
  const [selectedId, setSelectedId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('open')
  const [tab, setTab] = useState('overview')
  const [taskFilter, setTaskFilter] = useState('open')
  const [selectedPageId, setSelectedPageId] = useState(null)
  const [pagePickerOpen, setPagePickerOpen] = useState(false)
  const [pageSearch, setPageSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [projectModal, setProjectModal] = useState({ open: false, mode: 'create', project: null })
  const [taskPanel, setTaskPanel] = useState({ open: false, task: null, mode: 'create' })
  const [confirm, setConfirm] = useState({ open: false })

  const filteredProjects = useMemo(() => projects
    .filter(project => statusFilter === 'all' || (statusFilter === 'open' ? project.status !== 'completed' : project.status === statusFilter))
    .sort((a, b) => a.status === 'completed' ? 1 : b.status === 'completed' ? -1 : (a.title || '').localeCompare(b.title || '')), [projects, statusFilter])

  useEffect(() => {
    if (!selectedId && filteredProjects.length) setSelectedId(filteredProjects[0].id)
    else if (selectedId && !projects.some(project => project.id === selectedId)) setSelectedId(filteredProjects[0]?.id || null)
  }, [filteredProjects, projects, selectedId])

  const selected = projects.find(project => project.id === selectedId) || null
  const projectTasks = selected ? tasks.filter(task => task.project_id === selected.id) : []
  const linkedPages = selected ? pages.filter(page => page.project_id === selected.id && page.status !== 'archived') : []
  const selectedPage = linkedPages.find(page => page.id === selectedPageId) || linkedPages[0] || null
  const completedTasks = projectTasks.filter(task => task.status === 'completed').length
  const progress = projectTasks.length ? Math.round(completedTasks / projectTasks.length * 100) : Number(selected?.progress || 0)
  const visibleTasks = projectTasks.filter(task => taskFilter === 'all' || (taskFilter === 'open' ? task.status !== 'completed' : task.status === taskFilter))
  const availablePages = pages.filter(page => page.project_id == null && page.status !== 'archived' && page.title.toLowerCase().includes(pageSearch.toLowerCase())).slice(0, 12)

  useEffect(() => { setTab('overview'); setSelectedPageId(null); setPagePickerOpen(false); setActionError('') }, [selectedId])

  const runAction = async action => {
    if (busy) return
    setBusy(true); setActionError('')
    try { await action() } catch (error) { setActionError(error?.message || 'Could not complete the action') }
    finally { setBusy(false) }
  }
  const savePageProject = (page, projectId) => updatePage({ id: page.id, project_id: projectId, area_id: page.area_id, title: page.title, content: page.content, page_type: page.page_type, status: page.status, sort_order: page.sort_order, meeting_id: page.meeting_id })
  const linkPage = page => runAction(async () => {
    const response = await savePageProject(page, selected.id)
    if (!response.success) throw new Error(response.error || 'Could not link page')
    setSelectedPageId(page.id); setPagePickerOpen(false); setPageSearch('')
  })
  const unlinkPage = page => runAction(async () => {
    const response = await savePageProject(page, null)
    if (!response.success) throw new Error(response.error || 'Could not unlink page')
    setSelectedPageId(null)
  })
  const openPagesForProject = () => {
    if (selected) localStorage.setItem('pages.selectedProjectId', String(selected.id))
    onOpenPages?.()
  }
  const askDelete = (kind, item, action) => setConfirm({ open: true, title: `Delete ${kind}?`, message: `“${item.title}” will be permanently deleted.`, confirmText: `Delete ${kind}`, cancelText: 'Cancel', type: 'danger', onConfirm: async () => { await action(); setConfirm({ open: false }) } })
  const toggleTask = task => updateTask({ ...task, status: task.status === 'completed' ? 'todo' : 'completed' })

  return <div className="flex h-full min-h-0 min-w-0 flex-col bg-slate-100 text-slate-900">
    <div className="relative z-30 flex h-16 flex-none items-center border-b border-slate-200 bg-white">
      <div className="flex h-16 w-72 flex-none items-center gap-2 border-r border-slate-200 px-3">
        <button onClick={() => setProjectModal({ open: true, mode: 'create', project: null })} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> New project</button>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-5">
        {selected ? <><div className="flex min-w-0 items-center gap-2"><span className={`h-2.5 w-2.5 flex-none rounded-full ${(STATUS[selected.status] || STATUS.planning)[1]}`} /><h1 className="truncate text-lg font-semibold tracking-tight">{selected.title}</h1><span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 sm:inline">{(STATUS[selected.status] || STATUS.planning)[0]}</span><button onClick={() => setProjectModal({ open: true, mode: 'edit', project: selected })} className="grid h-8 w-8 flex-none place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-700" title="Edit project"><Edit3 className="h-3.5 w-3.5" /></button></div><div className="flex flex-none items-center gap-2">{selected.status !== 'completed' ? <button onClick={() => updateProject({ ...selected, status: 'completed' })} className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Complete</button> : <button onClick={() => updateProject({ ...selected, status: 'in_progress' })} className="h-9 rounded-full border border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700">Reopen</button>}<button onClick={() => askDelete('project', selected, async () => { await deleteProject(selected.id); setSelectedId(null) })} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600" title="Delete project"><Trash2 className="h-4 w-4" /></button></div></> : <span className="text-sm text-slate-500">Select or create a project</span>}
      </div>
    </div>

    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[288px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-b border-slate-200 bg-white lg:border-b-0 lg:border-r" aria-label="Projects">
        <div className="flex h-12 items-center justify-between gap-2 border-b border-slate-200 px-3"><Select value={statusFilter} onChange={setStatusFilter} options={[{ value: 'open', label: 'Open projects' }, { value: 'all', label: 'All projects' }, { value: 'planning', label: 'Planning' }, { value: 'in_progress', label: 'In progress' }, { value: 'on_hold', label: 'On hold' }, { value: 'completed', label: 'Completed' }]} ariaLabel="Filter projects" className="min-w-0 flex-1" triggerClassName="h-8 text-xs font-semibold" menuClassName="w-44" /><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{filteredProjects.length}</span></div>
        {loading ? <p className="p-5 text-center text-sm text-slate-500">Loading projects…</p> : filteredProjects.length ? <div className="divide-y divide-slate-100">{filteredProjects.map(project => {
          const ownTasks = tasks.filter(task => task.project_id === project.id), done = ownTasks.filter(task => task.status === 'completed').length
          const projectProgress = ownTasks.length ? Math.round(done / ownTasks.length * 100) : Number(project.progress || 0)
          return <button key={project.id} onClick={() => setSelectedId(project.id)} className={`relative flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors ${selectedId === project.id ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`}>{selectedId === project.id && <span className="absolute inset-y-0 left-0 w-0.5 bg-indigo-500" />}<span className={`line-clamp-2 text-sm font-semibold ${selectedId === project.id ? 'text-indigo-800' : 'text-slate-800'}`}>{project.title}</span><span className="flex items-center gap-2 text-xs text-slate-500"><span className={`h-2 w-2 rounded-full ${(STATUS[project.status] || STATUS.planning)[1]}`} />{(STATUS[project.status] || STATUS.planning)[0]}<span className="ml-auto">{projectProgress}%</span></span><span className="h-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(projectProgress, 100)}%` }} /></span></button>
        })}</div> : <p className="px-4 py-8 text-center text-sm text-slate-500">No projects in this view.</p>}
      </aside>

      <main className="flex min-h-0 min-w-0 flex-col">
        {!selected ? <div className="flex flex-1 flex-col items-center justify-center text-center"><FolderKanban className="h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No project selected</p><p className="mt-1 text-xs text-slate-500">Choose a project or create a new one.</p></div> : <>
          <div className="flex flex-none flex-wrap items-center gap-x-7 gap-y-2 border-b border-slate-200 bg-white px-5 py-3 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-600"><Flag className="h-4 w-4 text-indigo-600" />{(PRIORITY[selected.priority] || PRIORITY.medium)[0]}</span>
            <span className={`inline-flex items-center gap-2 ${selected.deadline && selected.status !== 'completed' && isOverdue(selected.deadline) ? 'font-semibold text-rose-600' : 'text-slate-600'}`}><CalendarDays className="h-4 w-4 text-indigo-600" />{selected.deadline ? formatDate(selected.deadline) : 'No deadline'}</span>
            <span className="inline-flex items-center gap-2 text-slate-600"><Clock3 className="h-4 w-4 text-indigo-600" />{projectTasks.length - completedTasks} open tasks</span>
            <div className="ml-auto flex w-48 items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(progress, 100)}%` }} /></span><span className="text-xs font-semibold text-indigo-700">{progress}%</span></div>
          </div>
          {actionError && <p className="mx-5 mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{actionError}</p>}
          <div className="flex h-12 flex-none items-end gap-1 border-b border-slate-200 bg-white px-5">{[['overview', 'Overview', Circle, null], ['tasks', 'Tasks', ListTodo, projectTasks.length], ['pages', 'Pages', FileText, linkedPages.length]].map(([value, label, Icon, count]) => <button key={value} onClick={() => setTab(value)} className={`relative inline-flex h-12 items-center gap-2 px-3 text-sm font-medium ${tab === value ? 'text-indigo-700' : 'text-slate-700 hover:text-slate-900'}`}><Icon className="h-4 w-4" />{label}{count != null && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === value ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100'}`}>{count}</span>}{tab === value && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-500" />}</button>)}</div>
          <section className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4">
            {tab === 'overview' && <Overview project={selected} tasks={projectTasks} pages={linkedPages} onEdit={() => setProjectModal({ open: true, mode: 'edit', project: selected })} onAddTask={() => setTaskPanel({ open: true, task: null, mode: 'create' })} onOpenTask={task => setTaskPanel({ open: true, task, mode: 'edit' })} onToggleTask={toggleTask} onTasks={() => setTab('tasks')} onPages={() => setTab('pages')} />}
            {tab === 'tasks' && <TasksPanel tasks={visibleTasks} filter={taskFilter} setFilter={setTaskFilter} onAdd={() => setTaskPanel({ open: true, task: null, mode: 'create' })} onOpen={task => setTaskPanel({ open: true, task, mode: 'edit' })} onToggle={toggleTask} onDelete={task => askDelete('task', task, () => deleteTask(task.id))} />}
            {tab === 'pages' && <PagesPanel pages={linkedPages} selectedPage={selectedPage} setSelectedPageId={setSelectedPageId} pagesLoading={pagesLoading} pickerOpen={pagePickerOpen} setPickerOpen={setPagePickerOpen} pageSearch={pageSearch} setPageSearch={setPageSearch} availablePages={availablePages} busy={busy} onLink={linkPage} onUnlink={unlinkPage} onOpen={page => onOpenPage?.(page)} onNew={openPagesForProject} />}
          </section>
        </>}
      </main>
    </div>

    <ProjectModal isOpen={projectModal.open} mode={projectModal.mode} project={projectModal.project} onClose={() => setProjectModal(v => ({ ...v, open: false }))} onSave={savedProject => { upsertProject(savedProject); setSelectedId(savedProject.id) }} onDelete={projectModal.mode === 'edit' ? id => { if (selectedId === id) setSelectedId(null); loadProjects() } : null} />
    <TaskSidePanel isOpen={taskPanel.open} onClose={() => setTaskPanel(v => ({ ...v, open: false }))} task={taskPanel.task} mode={taskPanel.mode} projects={projects} initialProjectId={selected?.id} onSave={() => setTaskPanel(v => ({ ...v, open: false }))} onUpdateTask={updateTask} onCreateTask={createTask} onDelete={deleteTask} runningActivity={runningActivity} onActivityStarted={onActivityStarted} onActivityStopped={onActivityStopped} />
    <ConfirmModal isOpen={!!confirm.open} {...confirm} onCancel={() => setConfirm({ open: false })} />
  </div>
}

function Overview({ project, tasks, pages, onEdit, onAddTask, onOpenTask, onToggleTask, onTasks, onPages }) {
  const open = tasks.filter(task => task.status !== 'completed')
  return <div className="mx-auto grid max-w-6xl gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-4"><div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><h2 className="text-sm font-semibold">Project brief</h2><button onClick={onEdit} className="text-xs font-semibold text-indigo-700">Edit</button></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{project.description || 'Add a short description that defines the outcome, scope, and what done looks like.'}</p></div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div><h2 className="text-sm font-semibold">Next actions</h2><p className="text-xs text-slate-500">The work that moves this project forward.</p></div><button onClick={onAddTask} className="inline-flex h-8 items-center gap-1 rounded-full bg-indigo-600 px-3 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Add task</button></div>{open.slice(0, 5).map(task => <TaskRow key={task.id} task={task} onToggle={onToggleTask} onOpen={() => onOpenTask(task)} />)}{!open.length && <Empty icon={CheckCircle2} title="No open tasks" copy="Add the next action for this project." />}{open.length > 5 && <button onClick={onTasks} className="m-4 text-xs font-semibold text-indigo-700">View all open tasks →</button>}</div></div><aside className="overflow-hidden rounded-xl border border-slate-200 bg-white self-start"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div><h2 className="text-sm font-semibold">Linked pages</h2><p className="text-xs text-slate-500">Plans, notes, and decisions</p></div><button onClick={onPages} className="text-xs font-semibold text-indigo-700">Manage</button></div>{pages.slice(0, 5).map(page => <button key={page.id} onClick={onPages} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"><FileText className="h-4 w-4 text-indigo-500" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{page.title}</span></button>)}{!pages.length && <Empty icon={FileText} title="No linked pages" copy="Connect project notes and plans here." />}</aside></div>
}

function TasksPanel({ tasks, filter, setFilter, onAdd, onOpen, onToggle, onDelete }) { return <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"><div className="flex gap-1">{[['open', 'Open'], ['todo', 'To do'], ['in_progress', 'In progress'], ['completed', 'Completed'], ['all', 'All']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === value ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>{label}</button>)}</div><button onClick={onAdd} className="inline-flex h-8 items-center gap-1 rounded-full bg-indigo-600 px-3 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Add task</button></div>{tasks.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} onOpen={() => onOpen(task)} onDelete={() => onDelete(task)} />)}{!tasks.length && <Empty icon={ListTodo} title="No tasks in this view" copy="Add a task or choose another filter." />}</div> }

function PagesPanel({ pages, pagesLoading, pickerOpen, setPickerOpen, pageSearch, setPageSearch, availablePages, busy, onLink, onUnlink, onOpen, onNew }) {
  return <div className="mx-auto max-w-5xl overflow-visible rounded-xl border border-slate-200 bg-white">
    <div className="relative z-10 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <div><h2 className="text-sm font-semibold text-slate-900">Linked pages</h2><p className="mt-0.5 text-xs text-slate-500">{pages.length} {pages.length === 1 ? 'page' : 'pages'} connected to this project</p></div>
      <div className="flex items-center gap-2">
        <button onClick={onNew} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" /> New in Pages</button>
        <div className="relative"><button onClick={() => setPickerOpen(!pickerOpen)} disabled={busy} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"><Link2 className="h-3.5 w-3.5" /> Link page</button>{pickerOpen && <div className="absolute right-0 top-10 z-30 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><div className="flex items-center gap-2"><input value={pageSearch} onChange={e => setPageSearch(e.target.value)} placeholder="Find an unassigned page" autoFocus className="h-9 min-w-0 flex-1 rounded-full border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400" /><button onClick={() => setPickerOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100"><X className="h-4 w-4" /></button></div><div className="mt-2 max-h-64 overflow-y-auto">{pagesLoading ? <p className="p-3 text-xs text-slate-500">Loading pages…</p> : availablePages.length ? availablePages.map(page => <button key={page.id} onClick={() => onLink(page)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-indigo-50"><FileText className="h-4 w-4 text-slate-400" /><span className="truncate">{page.title}</span></button>) : <p className="p-3 text-xs text-slate-500">No unassigned pages found.</p>}</div></div>}</div>
      </div>
    </div>
    {pages.length ? <div className="divide-y divide-slate-100">{pages.map(page => <div key={page.id} className="group flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-slate-50"><span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-indigo-50 text-indigo-600"><FileText className="h-4 w-4" /></span><button onClick={() => onOpen(page)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold text-slate-800 group-hover:text-indigo-700">{page.title}</span><span className="mt-0.5 block text-xs capitalize text-slate-500">{(page.page_type || 'general').replace('_', ' ')} · {(page.status || 'active').replace('_', ' ')}</span></button><span className="hidden text-xs text-slate-400 sm:block">Updated {new Date(page.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><button onClick={() => onOpen(page)} className="h-8 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-600 opacity-0 transition-opacity hover:border-indigo-200 hover:text-indigo-700 group-hover:opacity-100 group-focus-within:opacity-100">Open</button><button onClick={() => onUnlink(page)} disabled={busy} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 group-focus-within:opacity-100" title="Unlink page"><Unlink2 className="h-3.5 w-3.5" /></button></div>)}</div> : <div className="flex min-h-52 flex-col items-center justify-center text-center"><FileText className="h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No linked pages</p><p className="mt-1 max-w-sm text-xs text-slate-500">Create project notes in Pages, or link an existing unassigned page.</p></div>}
  </div>
}

function TaskRow({ task, onToggle, onOpen, onDelete }) { const priority = PRIORITY[task.priority] || PRIORITY.medium; return <div className="group flex min-h-14 items-center gap-3 border-b border-slate-100 px-4 py-2 last:border-0 hover:bg-slate-50"><button onClick={() => onToggle(task)} className={`grid h-5 w-5 place-items-center rounded-full border ${task.status === 'completed' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-3 w-3" /></button><button onClick={onOpen} className={`min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-indigo-700 ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</button><span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><span className={`h-2 w-2 rounded-full ${priority[1]}`} />{priority[0]}</span>{task.due_date && <span className="hidden text-xs text-slate-500 sm:inline">{formatDate(task.due_date)}</span>}{onDelete && <button onClick={onDelete} className="rounded-full p-1.5 text-slate-300 opacity-0 hover:text-rose-600 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>}</div> }
function Empty({ icon: Icon, title, copy }) { return <div className="flex min-h-40 flex-col items-center justify-center px-5 py-7 text-center"><Icon className="h-6 w-6 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">{title}</p><p className="mt-1 text-xs text-slate-500">{copy}</p></div> }

export default ProjectsPage
