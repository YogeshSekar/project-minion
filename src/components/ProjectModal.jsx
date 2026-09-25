import { useEffect, useRef, useState } from 'react'
import { Check, Trash2, X } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import DatePickerField from './DatePickerField'

const blank = () => ({ title: '', description: '', start_date: new Date().toISOString().split('T')[0], deadline: '', priority: 'medium', progress: 0, status: 'planning' })
const statuses = [['planning', 'Planning', 'bg-violet-500'], ['in_progress', 'In progress', 'bg-blue-500'], ['on_hold', 'On hold', 'bg-amber-500'], ['completed', 'Completed', 'bg-emerald-500']]
const priorities = [['high', 'High', 'bg-rose-500'], ['medium', 'Medium', 'bg-amber-500'], ['low', 'Low', 'bg-emerald-500']]

function ProjectModal({ isOpen, onClose, project = null, mode = 'create', onSave, onDelete }) {
  const isEdit = mode === 'edit'
  const titleRef = useRef(null)
  const [form, setForm] = useState(blank)
  const [snapshot, setSnapshot] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const next = isEdit && project ? { title: project.title || '', description: project.description || '', start_date: project.start_date || new Date().toISOString().split('T')[0], deadline: project.deadline || '', priority: project.priority || 'medium', progress: project.progress || 0, status: project.status || 'planning' } : blank()
    setForm(next); setSnapshot(JSON.stringify(next)); setErrors({}); setConfirmDelete(false)
    setTimeout(() => { titleRef.current?.focus(); if (!isEdit) titleRef.current?.select() }, 0)
  }, [isOpen, isEdit, project])

  const dirty = JSON.stringify(form) !== snapshot
  const change = (field, value) => { setForm(current => ({ ...current, [field]: value })); if (errors[field]) setErrors(current => ({ ...current, [field]: '' })) }
  const validate = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Project name is required'
    if (!form.start_date) next.start_date = 'Start date is required'
    if (!form.deadline) next.deadline = 'Deadline is required'
    if (form.start_date && form.deadline && new Date(form.start_date) > new Date(form.deadline)) next.deadline = 'Deadline must be after the start date'
    setErrors(next); return !Object.keys(next).length
  }
  const submit = async event => {
    event?.preventDefault()
    if (!validate() || saving) return
    setSaving(true)
    try {
      const request = { ...form, title: form.title.trim(), ...(isEdit ? { id: project.id } : {}) }
      const response = await invoke(isEdit ? 'update_project' : 'create_project', { request })
      if (!response.success) setErrors({ submit: response.error || 'Could not save project' })
      else { onSave?.(response.data); window.dispatchEvent(new CustomEvent('projects-change', { detail: response.data })); onClose() }
    } catch (error) { setErrors({ submit: error?.toString?.() || 'Could not save project' }) }
    finally { setSaving(false) }
  }
  const remove = async () => {
    if (!project || !onDelete || deleting) return
    setDeleting(true)
    try {
      const response = await invoke('delete_project', { id: project.id })
      if (!response.success) setErrors({ submit: response.error || 'Could not delete project' })
      else { onDelete(project.id); onClose() }
    } catch (error) { setErrors({ submit: error?.toString?.() || 'Could not delete project' }) }
    finally { setDeleting(false); setConfirmDelete(false) }
  }

  useEffect(() => {
    if (!isOpen) return undefined
    const keydown = event => { if (event.key === 'Escape' && !confirmDelete) onClose(); if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submit(event) }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [isOpen, form, confirmDelete, saving])

  if (!isOpen || (isEdit && !project)) return null
  return <>
    <div className="fixed inset-0 z-[55] bg-slate-950/35" onClick={onClose} />
    <form onSubmit={submit} className="fixed left-1/2 top-1/2 z-[60] flex h-[min(640px,calc(100vh-32px))] w-[780px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-scale-in">
      <header className="flex-none border-b border-slate-200 px-6 py-3">
        <div className="flex items-start gap-4"><div className="min-w-0 flex-1"><div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{isEdit ? 'Project details' : 'New project'}</div><input ref={titleRef} id="project-title-input" value={form.title} onChange={event => change('title', event.target.value)} placeholder="Project name" className="w-full border-none bg-transparent text-xl font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0" />{errors.title && <p className="mt-1 text-xs font-medium text-red-500">{errors.title}</p>}</div><button type="button" onClick={onClose} className="grid h-8 w-8 flex-none place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close panel"><X className="h-4 w-4" /></button></div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5"><span className="mr-1 text-[11px] font-semibold text-slate-400">Quick set</span><QuickButton onClick={() => { const date = new Date(); date.setDate(date.getDate() + 7); change('deadline', date.toISOString().split('T')[0]) }}>+1 week</QuickButton><QuickButton onClick={() => { const date = new Date(); date.setMonth(date.getMonth() + 1); change('deadline', date.toISOString().split('T')[0]) }}>+1 month</QuickButton><button type="button" onClick={() => change('priority', 'high')} className="h-7 rounded-full border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">High priority</button></div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-6 py-4"><div className="flex h-full min-h-0">
        <div className="flex min-h-0 w-[56%] flex-col pr-6"><label className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</label><textarea value={form.description} onChange={event => change('description', event.target.value)} placeholder="Describe the outcome, scope, and what done looks like…" className="min-h-[240px] flex-1 resize-none rounded-xl border border-slate-200 bg-[#fffefa] p-4 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/30" /></div>
        <div className="no-scrollbar min-h-0 w-[44%] overflow-y-auto border-l border-slate-200 pl-6 pr-1"><div className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Properties</div>
          <Property label="Status"><div className="grid grid-cols-2 gap-1.5">{statuses.map(([value, label, dot]) => <Choice key={value} active={form.status === value} onClick={() => change('status', value)} dot={dot}>{label}</Choice>)}</div></Property>
          <Property label="Priority"><div className="flex flex-wrap gap-1.5">{priorities.map(([value, label, dot]) => <Choice key={value} active={form.priority === value} onClick={() => change('priority', value)} dot={dot}>{label}</Choice>)}</div></Property>
          <Property label="Start date"><DatePickerField value={form.start_date} onChange={date => change('start_date', date)} placeholder="Select date" ariaLabel="Project start date" compact className="w-full" />{errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>}</Property>
          <Property label="Deadline"><DatePickerField value={form.deadline} onChange={date => change('deadline', date)} placeholder="Select date" ariaLabel="Project deadline" compact className="w-full" />{errors.deadline && <p className="mt-1 text-xs text-red-500">{errors.deadline}</p>}</Property>
          {isEdit && <Property label="Progress"><div className="flex items-center gap-3"><input type="range" min="0" max="100" step="5" value={form.progress} onChange={event => change('progress', Number(event.target.value))} className="min-w-0 flex-1 accent-accent-solid" /><span className="w-10 text-right text-xs font-semibold text-slate-600">{form.progress}%</span></div></Property>}
        </div>
      </div></div>

      <footer className="flex-none border-t border-slate-200 px-6 py-3">{errors.submit && <p className="mb-2 text-right text-xs font-medium text-red-600">{errors.submit}</p>}<div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3">{isEdit && onDelete && <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 px-3.5 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Delete</button>}{dirty && <span className="text-xs font-medium text-amber-600">Unsaved changes</span>}</div><div className="flex items-center gap-2"><button type="button" onClick={onClose} className="h-9 rounded-full border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving || (isEdit && !dirty)} className="inline-flex h-9 min-w-[132px] items-center justify-center gap-1.5 rounded-full bg-accent-solid px-4 text-xs font-semibold text-accent-foreground hover:bg-accent-solid-hover disabled:bg-slate-200 disabled:text-slate-400">{saving ? 'Saving…' : <><Check className="h-4 w-4" />{isEdit ? 'Save changes' : 'Create project'}</>}</button></div></div></footer>
    </form>
    {confirmDelete && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" onClick={() => setConfirmDelete(false)}><div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl" onClick={event => event.stopPropagation()}><h3 className="text-base font-semibold">Delete project?</h3><p className="mt-2 text-sm leading-5 text-slate-600">“{project?.title}” will be permanently deleted. Its tasks and pages will remain.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setConfirmDelete(false)} className="h-9 rounded-full border border-slate-200 px-4 text-xs font-semibold text-slate-600">Cancel</button><button onClick={remove} disabled={deleting} className="h-9 rounded-full bg-red-600 px-4 text-xs font-semibold text-white disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete project'}</button></div></div></div>}
  </>
}

function Property({ label, children }) { return <div className="border-b border-slate-200 px-1 py-3 last:border-0"><div className="mb-2 text-xs font-semibold text-slate-500">{label}</div>{children}</div> }
function Choice({ active, onClick, dot, children }) { return <button type="button" onClick={onClick} className={`flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${active ? 'border-accent-border bg-accent-surface text-accent-text' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><span className={`h-2 w-2 rounded-full ${dot}`} />{children}</button> }
function QuickButton({ onClick, children }) { return <button type="button" onClick={onClick} className="h-7 rounded-full border border-accent-border bg-accent-surface px-2.5 text-xs font-semibold text-accent-text hover:bg-accent-surface-hover">{children}</button> }

export default ProjectModal
