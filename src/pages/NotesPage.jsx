import { useState, useEffect, useRef } from 'react'
import { ArrowUpDown, Plus, Trash2, Calendar, Filter, Maximize2, Minimize2, Users, FileText } from 'lucide-react'
import TipTapEditor from '../components/TipTapEditor'
import useNotes from '../hooks/useNotes'
import useProjects from '../hooks/useProjects'
import useClickOutside from '../hooks/useClickOutside'
import { formatDate, getProjectColor } from '../utils/helpers'

function NotesPage() {
  const [selectedNote, setSelectedNote] = useState(null)
  const [editedContent, setEditedContent] = useState('')
  const [editedTitle, setEditedTitle] = useState('')
  const [editedProjectId, setEditedProjectId] = useState(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [moveCursorToEnd, setMoveCursorToEnd] = useState(false)

  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  const [noteTypeFilter, setNoteTypeFilter] = useState('all')
  const [sortOption, setSortOption] = useState('created_date')
  const [selectedProjects, setSelectedProjects] = useState([])

  const { notes, loading: notesLoading, updateNote, deleteNote, createNote } = useNotes()
  const { projects, loading: projectsLoading } = useProjects()

  const sortDropdown = useClickOutside()
  const projectFilterDropdown = useClickOutside()
  const projectDropdown = useClickOutside()

  const titleInputRef = useRef(null)

  const loading = notesLoading || projectsLoading

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (selectedNote) {
          updateNote({
            id: selectedNote.id,
            title: editedTitle,
            content: editedContent,
            project_id: editedProjectId,
            note_type: selectedNote.note_type
          })
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedNote, editedTitle, editedContent, editedProjectId, updateNote])

  const getFilteredAndSortedNotes = () => {
    let filtered = notes

    filtered = filtered.filter((note) => {
      if (note.note_type === 'quick') return false
      if (noteTypeFilter === 'meeting' && note.note_type !== 'meeting') return false
      if (noteTypeFilter === 'general' && note.note_type !== 'general') return false
      return true
    })

    if (selectedProjects.length > 0) {
      filtered = filtered.filter((note) => selectedProjects.includes(note.project_id))
    }

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'created_date':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'title':
          return (a.title || '').localeCompare(b.title || '')
        default:
          return 0
      }
    })
  }

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const groupNotesByDate = (notesList) => {
    const grouped = {}
    notesList.forEach((note) => {
      const dateKey = note.created_date || new Date().toISOString().split('T')[0]
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(note)
    })
    return Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  }

  const handleInlineTitleEdit = (note) => {
    setEditingNoteId(note.id)
    setEditingTitle(note.title || '')
  }

  const handleInlineTitleSave = async (noteId) => {
    const note = notes.find((n) => n.id === noteId)
    if (note && editingTitle.trim() !== note.title) {
      const response = await updateNote({
        id: noteId,
        title: editingTitle.trim(),
        content: note.content,
        project_id: note.project_id,
        note_type: note.note_type
      })
      if (!response.success) {
        console.error('Error updating note title:', response.error)
      }
    }
    setEditingNoteId(null)
    setEditingTitle('')
  }

  const handleInlineTitleKeyDown = (e, noteId) => {
    if (e.key === 'Enter') {
      handleInlineTitleSave(noteId)
    } else if (e.key === 'Escape') {
      setEditingNoteId(null)
      setEditingTitle('')
    }
  }

  const handleDeleteNoteInline = async (e, noteId) => {
    e.stopPropagation()
    const response = await deleteNote(noteId)
    if (response.success) {
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
      }
    } else {
      console.error('Error deleting note:', response.error)
    }
  }

  const getPreview = (content, maxLength = 100) => {
    if (!content) return ''
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }

  const getProjectBadge = (projectId, noteType) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return null

    const typeColorClasses =
      noteType === 'meeting'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-sky-50 text-sky-700 border-sky-200'

    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium ${typeColorClasses}`}>
        {project.title}
      </span>
    )
  }

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  const handleSaveNote = async () => {
    if (selectedNote) {
      const response = await updateNote({
        id: selectedNote.id,
        title: editedTitle,
        content: editedContent,
        project_id: editedProjectId,
        note_type: selectedNote.note_type
      })
      if (!response.success) {
        console.error('Error saving note:', response.error)
      }
    }
  }

  const handleCreateNote = async () => {
    const today = new Date().toISOString().split('T')[0]
    const response = await createNote({
      title: 'Untitled Note',
      content: '',
      project_id: selectedProjects.length > 0 ? selectedProjects[0] : null,
      note_type: 'general',
      created_date: today
    })
    if (response.success && response.data) {
      const newNote = response.data
      setSelectedNote(newNote)
      setEditedTitle(newNote.title || '')
      setEditedContent(newNote.content || '')
      setEditedProjectId(newNote.project_id)
      setTimeout(() => {
        titleInputRef.current?.focus()
        titleInputRef.current?.select()
      }, 100)
    } else {
      console.error('Error creating note:', response.error)
    }
  }

  const handleDeleteNote = async () => {
    if (selectedNote) {
      const response = await deleteNote(selectedNote.id)
      if (response.success) {
        setSelectedNote(null)
      } else {
        console.error('Error deleting note:', response.error)
      }
    }
  }

  return (
    <div className="h-full bg-gray-60 flex flex-col p-4">
      <div className="relative z-30 mb-4 flex-shrink-0 overflow-visible rounded-2xl border border-gray-200/80 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-start gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setNoteTypeFilter('all')}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition ${
                  noteTypeFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
                title="All Notes"
              >
                All
              </button>
              <button
                onClick={() => setNoteTypeFilter('general')}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition ${
                  noteTypeFilter === 'general'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
                title="General Notes"
              >
                <FileText className="w-4 h-4" />
                General
              </button>
              <button
                onClick={() => setNoteTypeFilter('meeting')}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition ${
                  noteTypeFilter === 'meeting'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
                title="Meeting Notes"
              >
                <Users className="w-4 h-4" />
                Meeting
              </button>
            </div>
            <div className="relative" ref={sortDropdown.ref}>
              <button
                onClick={() => sortDropdown.setIsOpen(!sortDropdown.isOpen)}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition ${
                  sortDropdown.isOpen || sortOption !== 'created_date'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                Sort
                {sortOption !== 'created_date' && (
                  <span className="rounded-full bg-white/20 px-1.5 text-[11px]">
                    {sortOption === 'title' ? 'Title' : 'Date'}
                  </span>
                )}
              </button>
              {sortDropdown.isOpen && (
                <div className="absolute top-full left-0 mt-2 w-52 rounded-2xl border border-gray-200 bg-white shadow-lg">
                  <div className="p-3">
                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Sort by</div>
                    <div className="space-y-1">
                      <button
                        onClick={() => { setSortOption('created_date'); sortDropdown.setIsOpen(false) }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                          sortOption === 'created_date'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Created date
                      </button>
                      <button
                        onClick={() => { setSortOption('title'); sortDropdown.setIsOpen(false) }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                          sortOption === 'title'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Title
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={projectFilterDropdown.ref}>
              <button
                onClick={() => projectFilterDropdown.setIsOpen(!projectFilterDropdown.isOpen)}
                className={`inline-flex h-9 min-w-[180px] items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors ${
                  projectFilterDropdown.isOpen || selectedProjects.length > 0
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Filter className="w-4 h-4" />
                Projects
                {selectedProjects.length > 0 && (
                  <span className="rounded-full bg-white/20 px-1.5 text-[11px]">
                    {selectedProjects.length} selected
                  </span>
                )}
              </button>
              {projectFilterDropdown.isOpen && (
                <div className="absolute top-full left-0 mt-2 w-60 rounded-2xl border border-gray-200 bg-white shadow-lg">
                  <div className="p-3">
                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Project filters</div>
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                      <label className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                        selectedProjects.length === 0 ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedProjects.length === 0}
                          onChange={() => setSelectedProjects([])}
                          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 accent-gray-900"
                        />
                        <span>All projects</span>
                      </label>
                      {projects.map((project) => (
                        <label key={project.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                          selectedProjects.includes(project.id) ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjects([...selectedProjects, project.id])
                              } else {
                                setSelectedProjects(selectedProjects.filter((id) => id !== project.id))
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 accent-gray-900"
                          />
                          <span className="truncate">{project.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNote}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 gap-4 overflow-hidden">
        <div className="w-96 min-w-[24rem] flex flex-col overflow-hidden">
          <div className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <div className="flex items-center gap-2 text-md font-semibold text-gray-900">
                  <span>
                    {noteTypeFilter === 'meeting'
                      ? 'Meeting Notes'
                      : noteTypeFilter === 'general'
                      ? 'General Notes'
                      : 'All Notes'}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                    {getFilteredAndSortedNotes().length}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-[calc(100%-76px)] overflow-auto p-4">
              {getFilteredAndSortedNotes().length > 0 ? (
                groupNotesByDate(getFilteredAndSortedNotes()).map(([date, dateNotes]) => (
                  <div key={date} className="mb-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      {formatDateHeader(date)}
                    </div>
                    <div className="space-y-3">
                      {dateNotes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => {
                            if (editingNoteId !== note.id) {
                              setSelectedNote(note)
                              setEditedTitle(note.title || '')
                              setEditedContent(note.content || '')
                              setEditedProjectId(note.project_id)
                              projectDropdown.setIsOpen(false)
                              setMoveCursorToEnd(true)
                              setTimeout(() => setMoveCursorToEnd(false), 100)
                            }
                          }}
                          className={`group rounded-2xl border px-4 py-3 transition ${
                            selectedNote?.id === note.id
                              ? 'border-gray-900 bg-gray-50 shadow-sm'
                              : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              {editingNoteId === note.id ? (
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={() => handleInlineTitleSave(note.id)}
                                  onKeyDown={(e) => handleInlineTitleKeyDown(e, note.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none"
                                  autoFocus
                                />
                              ) : (
                                <div className="min-w-0">
                                  <h4 className="truncate text-sm font-semibold text-gray-900">{note.title}</h4>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {note.project_id && getProjectBadge(note.project_id, note.note_type)}
                              {!editingNoteId && (
                                <button
                                  onClick={(e) => handleDeleteNoteInline(e, note.id)}
                                  className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-gray-500">
                  <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm">No notes found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="h-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {selectedNote ? (
              <div className="flex h-full flex-col">
                <div className="flex-none border-b border-gray-200 bg-white px-6 py-3">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-centerr lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full border-0 border-b-2 border-transparent bg-transparent px-0 py-1 text-2xl font-semibold text-gray-900 outline-none transition-colors focus:border-gray-900 placeholder-gray-400"
                        placeholder="Note title..."
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(selectedNote.created_date)}
                        </span>
                        <span className={`rounded-full px-2 py-1 font-medium ${
                          selectedNote.note_type === 'meeting'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}>
                          {selectedNote.note_type === 'meeting' ? 'Meeting' : 'General'}
                        </span>
                        <div className="relative" ref={projectDropdown.ref}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              projectDropdown.setIsOpen(!projectDropdown.isOpen)
                            }}
                            className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-200"
                          >
                            <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />
                            {editedProjectId && projects.find((p) => p.id === editedProjectId)
                              ? projects.find((p) => p.id === editedProjectId)?.title
                              : 'No Project'}
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {projectDropdown.isOpen && (
                            <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg">
                              <button
                                onClick={() => {
                                  setEditedProjectId(null)
                                  projectDropdown.setIsOpen(false)
                                }}
                                className={`w-full px-3 py-2 text-left text-sm transition ${
                                  !editedProjectId ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                No Project
                              </button>
                              {projects.map((project) => (
                                <button
                                  key={project.id}
                                  onClick={() => {
                                    setEditedProjectId(project.id)
                                    projectDropdown.setIsOpen(false)
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm transition ${
                                    editedProjectId === project.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {project.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleToggleFullScreen}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                        title={isFullScreen ? 'Exit full screen' : 'Full screen'}
                      >
                        {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={handleDeleteNote}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <TipTapEditor
                    content={editedContent}
                    onChange={setEditedContent}
                    moveCursorToEnd={moveCursorToEnd}
                    onSave={handleSaveNote}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-gray-400">
                <svg className="h-20 w-20 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg font-medium">Select a note to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isFullScreen && selectedNote && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex-none border-b border-gray-200 bg-white px-6 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full border-0 border-b-2 border-transparent bg-transparent px-0 py-1 text-2xl font-semibold text-gray-900 outline-none transition-colors focus:border-gray-900 placeholder-gray-400"
                  placeholder="Note title..."
                />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(selectedNote.created_date)}
                  </span>
                  <span className={`rounded-full px-2 py-1 font-medium ${
                    selectedNote.note_type === 'meeting'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}>
                    {selectedNote.note_type === 'meeting' ? 'Meeting' : 'General'}
                  </span>
                  <div className="relative z-50 z-50" ref={projectDropdown.ref}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        projectDropdown.setIsOpen(!projectDropdown.isOpen)
                      }}
                      className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-900 transition hover:bg-gray-200"
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />
                      {editedProjectId && projects.find((p) => p.id === editedProjectId)
                        ? projects.find((p) => p.id === editedProjectId)?.title
                        : 'No Project'}
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {projectDropdown.isOpen && (
                      <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg">
                        <button
                          onClick={() => {
                            setEditedProjectId(null)
                            projectDropdown.setIsOpen(false)
                          }}
                          className={`w-full px-3 py-2 text-left text-sm transition ${
                            !editedProjectId ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          No Project
                        </button>
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => {
                              setEditedProjectId(project.id)
                              projectDropdown.setIsOpen(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition ${
                              editedProjectId === project.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {project.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleFullScreen}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  title="Exit full screen"
                >
                  <Minimize2 className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDeleteNote}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  title="Delete"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <TipTapEditor
              content={editedContent}
              onChange={setEditedContent}
              moveCursorToEnd={moveCursorToEnd}
              onSave={handleSaveNote}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default NotesPage
