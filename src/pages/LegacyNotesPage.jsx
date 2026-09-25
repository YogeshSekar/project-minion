import { useMemo, useState } from 'react'
import { FileText, Search } from 'lucide-react'
import TipTapEditor from '../components/TipTapEditor'
import useNotes from '../hooks/useNotes'
import useProjects from '../hooks/useProjects'

export default function LegacyNotesPage() {
  const { notes, loading, error } = useNotes()
  const { projects } = useProjects()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase()
    return notes.filter(note => !query || `${note.title} ${note.content}`.toLowerCase().includes(query))
  }, [notes, search])
  const selectedNote = filteredNotes.find(note => note.id === selectedId) || filteredNotes[0]
  const projectTitle = selectedNote?.project_id == null
    ? 'No project'
    : projects.find(project => project.id === selectedNote.project_id)?.title || 'Project'

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(to_bottom_right,_#f8fafc,_#eef1f6)] p-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <div className="flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white via-white to-indigo-50/30 px-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Previous notes</h1>
            <p className="text-xs text-slate-500">Read-only preview of notes from the earlier version</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">{notes.length} notes</span>
        </div>
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-72 flex-none flex-col border-r border-slate-200 bg-slate-50/70">
            <div className="relative border-b border-slate-200 p-3">
              <Search className="pointer-events-none absolute left-6 top-5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search previous notes" className="h-9 w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? <p className="p-4 text-sm text-slate-500">Loading notes…</p> : error ? <p className="p-4 text-sm text-red-600">{error}</p> : filteredNotes.length ? filteredNotes.map(note => (
                <button key={note.id} type="button" onClick={() => setSelectedId(note.id)} className={`flex w-full items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-left text-sm transition-colors ${selectedNote?.id === note.id ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-700 hover:bg-white'}`}>
                  <span className="min-w-0 truncate">{note.title}</span>
                  <span className="flex-none rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500">{note.note_type || 'general'}</span>
                </button>
              )) : <p className="p-4 text-sm text-slate-500">{search ? 'No matching notes.' : 'No previous notes found.'}</p>}
            </div>
          </aside>
          <main className="flex min-w-0 flex-1 flex-col bg-slate-100/60">
            {selectedNote ? (
              <>
                <div className="flex-none border-b border-slate-200 bg-white px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">{selectedNote.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{projectTitle} · {selectedNote.note_type || 'general'} · {selectedNote.created_date}</p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="mx-auto min-h-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-[#fffefa] shadow-sm">
                    <TipTapEditor key={selectedNote.id} content={selectedNote.content || ''} editable={false} showToolbar={false} />
                  </div>
                </div>
              </>
            ) : <div className="flex flex-1 flex-col items-center justify-center text-slate-400"><FileText className="h-8 w-8" /><p className="mt-3 text-sm">Select a previous note to preview it.</p></div>}
          </main>
        </div>
      </div>
    </div>
  )
}
