import { useState, useEffect, useRef } from 'react'
import { ArrowUpDown, Plus, Trash2, Calendar, Filter, Save, Maximize2, Minimize2, Users, FileText } from 'lucide-react'
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
  
  // Inline editing in note list
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  
  // Filters
  const [noteTypeFilter, setNoteTypeFilter] = useState('general')
  const [sortOption, setSortOption] = useState('created_date')
  const [selectedProjects, setSelectedProjects] = useState([])
  
  // Use hooks for data management
  const { notes, loading: notesLoading, updateNote, deleteNote, createNote } = useNotes()
  const { projects, loading: projectsLoading } = useProjects()
  
  // Use click-outside hooks for dropdowns
  const sortDropdown = useClickOutside()
  const projectDropdown = useClickOutside()
  
  const titleInputRef = useRef(null)

  // Combined loading state
  const loading = notesLoading || projectsLoading

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save
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
  }, [selectedNote, editedTitle, editedContent, editedProjectId])


  const getFilteredAndSortedNotes = () => {
    let filtered = notes
    
    // Filter by type
    filtered = filtered.filter(note => {
      if (noteTypeFilter === 'meeting' && note.note_type !== 'meeting') return false
      if (noteTypeFilter === 'general' && note.note_type !== 'general') return false
      return true
    })
    
    // Filter by project
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(note => selectedProjects.includes(note.project_id))
    }
    
    // Sort
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
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

  const groupNotesByDate = (notes) => {
    const grouped = {}
    notes.forEach(note => {
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
    const note = notes.find(n => n.id === noteId)
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

  const handleCancelEdit = () => {
    if (selectedNote) {
      setEditedContent(selectedNote.content || '')
      setEditedTitle(selectedNote.title || '')
      setEditedProjectId(selectedNote.project_id)
    }
    setIsFullScreen(false)
    projectDropdown.setIsOpen(false)
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
      // Auto-select the new note
      const newNote = response.data
      setSelectedNote(newNote)
      setEditedTitle(newNote.title || '')
      setEditedContent(newNote.content || '')
      // Focus title input after a short delay to ensure the note is rendered
      setTimeout(() => {
        titleInputRef.current?.focus()
        titleInputRef.current?.select()
      }, 100)
    } else {
      console.error('Error creating note:', response.error)
    }
  }

  return (
    <div className="h-full bg-gray-60 flex gap-4 p-4 overflow-hidden">
      {/* Right Sidebar - Controls */}
      <div className="w-64 flex flex-col overflow-hidden">
        <div className="h-full bg-white rounded-2xl border border-gray-200 flex flex-col p-4 gap-4 overflow-hidden">
          {/* Type Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setNoteTypeFilter('general')}
              className={`flex-1 px-3 py-2 rounded-full transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
                noteTypeFilter === 'general'
                  ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
              title="General Notes"
            >
              <FileText className="w-4 h-4" />
              General
            </button>
            <button
              onClick={() => setNoteTypeFilter('meeting')}
              className={`flex-1 px-3 py-2 rounded-full transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
                noteTypeFilter === 'meeting'
                  ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Meeting Notes"
            >
              <Users className="w-4 h-4" />
              Meeting
            </button>
          </div>

        {/* Sort Button */}
        <div ref={sortDropdown.ref} className="relative">
          <button
            onClick={() => sortDropdown.setIsOpen(!sortDropdown.isOpen)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full border transition-colors text-sm font-medium ${
              sortDropdown.isOpen || sortOption !== 'created_date'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Sort</span>
            {sortOption !== 'created_date' && (
              <span className="text-xs bg-white/20 rounded px-1.5">
                {sortOption === 'title' ? 'Title' : 'Date'}
              </span>
            )}
          </button>
          {sortDropdown.isOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl border border-gray-200 z-10">
              <div className="p-3">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 mb-2">Sort By</div>
                <div className="space-y-1">
                  <button
                    onClick={() => setSortOption('created_date')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-full transition-colors ${
                      sortOption === 'created_date'
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Created Date
                  </button>
                  <button
                    onClick={() => setSortOption('title')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-full transition-colors ${
                      sortOption === 'title'
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Title
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Filter */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Projects</div>
          <div className="flex-1 overflow-auto space-y-1">
            <label className={`flex items-center justify-between px-3 py-2 rounded-full cursor-pointer transition-colors ${
              selectedProjects.length === 0
                ? 'bg-gray-200 text-gray-900 border-2 border-gray-900'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
              <span className="text-sm font-medium">All Projects</span>
              <input
                type="checkbox"
                checked={selectedProjects.length === 0}
                onChange={() => setSelectedProjects([])}
                className="rounded border-gray-900 text-gray-900 focus:ring-gray-900 accent-gray-900"
              />
            </label>
            {projects.map(project => (
              <label key={project.id} className={`flex items-center justify-between px-3 py-2 rounded-full cursor-pointer transition-colors ${
                selectedProjects.includes(project.id)
                  ? 'bg-gray-200 text-gray-900 border-2 border-gray-900'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
                <span className="text-sm font-medium truncate">{project.title}</span>
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(project.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProjects([...selectedProjects, project.id])
                    } else {
                      setSelectedProjects(selectedProjects.filter(id => id !== project.id))
                    }
                  }}
                  className="rounded border-gray-900 text-gray-900 focus:ring-gray-900 accent-gray-900"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Left Main Content */}
      <div className="w-96 flex flex-col overflow-hidden relative">
        <div className="h-full flex flex-col">
          {/* Notes List - Main Content */}
          <div className="w-full h-full flex flex-col">
            {/* Notes List */}
            <div className="flex-1 overflow-auto">
              <div className="w-full h-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="bg-white p-4 border-b border-gray-200">
                  <button
                    onClick={handleCreateNote}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Note</span>
                  </button>
                </div>
                <div className="p-4">
                  {getFilteredAndSortedNotes().length > 0 ? (
                    groupNotesByDate(getFilteredAndSortedNotes()).map(([date, dateNotes]) => (
                      <div key={date} className="mb-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          {formatDateHeader(date)}
                        </div>
                        <div className="space-y-2">
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
                              className={`
                                p-3 bg-white rounded-2xl border border-gray-100
                                hover:border-gray-300 cursor-pointer transition-all duration-200 group
                                ${selectedNote?.id === note.id 
                                  ? 'border-gray-900 bg-gray-100 ring-1 ring-gray-900/20' 
                                  : 'hover:bg-gray-50'}
                              `}
                            >
                              <div className="flex items-center gap-2">
                                {editingNoteId === note.id ? (
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={() => handleInlineTitleSave(note.id)}
                                    onKeyDown={(e) => handleInlineTitleKeyDown(e, note.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 text-sm font-medium text-gray-900 bg-white border border-gray-900 rounded px-2 py-1 focus:outline-none"
                                    autoFocus
                                  />
                                ) : (
                                  <>
                                    <h4
                                      className="flex-1 text-sm font-medium text-gray-900 truncate"
                                      onDoubleClick={(e) => {
                                        e.stopPropagation()
                                        handleInlineTitleEdit(note)
                                      }}
                                    >
                                      {note.title}
                                    </h4>
                                    {note.project_id && projects.find(p => p.id === note.project_id) && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 truncate max-w-24 font-medium border border-gray-200">
                                        {projects.find(p => p.id === note.project_id)?.title}
                                      </span>
                                    )}
                                    <button
                                      onClick={(e) => handleDeleteNoteInline(e, note.id)}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="mb-4">
                        <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-sm">No notes found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Note Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Note Editor */}
          {selectedNote ? (
            <div className="h-full flex flex-col">
              {/* Sticky Header with Title Input */}
              <div className="flex-none px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full text-xl font-semibold text-gray-900 bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-gray-900 focus:outline-none px-0 py-1 transition-colors placeholder-gray-400"
                      placeholder="Note title..."
                    />
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(selectedNote.created_date)}
                      </span>
                      {/* Note Type */}
                      <span className={`px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600`}>
                        {selectedNote.note_type === 'meeting' ? 'Meeting' : 'General'}
                      </span>
                      {/* Project Selector */}
                      <div className="relative" ref={projectDropdown.ref}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            projectDropdown.setIsOpen(!projectDropdown.isOpen)
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-2xl bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors font-medium"
                        >
                          <span className="w-2 h-2 rounded-full bg-gray-900"></span>
                          {editedProjectId && projects.find(p => p.id === editedProjectId)
                            ? projects.find(p => p.id === editedProjectId)?.title
                            : 'No Project'}
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {projectDropdown.isOpen && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-2xl border border-gray-200 z-20 py-1">
                            <button
                              onClick={() => {
                                setEditedProjectId(null)
                                projectDropdown.setIsOpen(false)
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                                !editedProjectId ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              No Project
                            </button>
                            {projects.map(project => (
                              <button
                                key={project.id}
                                onClick={() => {
                                  setEditedProjectId(project.id)
                                  projectDropdown.setIsOpen(false)
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                                  editedProjectId === project.id ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
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
                      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                    >
                      {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <button
                      onClick={handleDeleteNote}
                      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Rich Text Editor */}
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
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-lg font-medium">Select a note to edit</p>
            </div>
          )}
        </div>
      </div>

    {/* Full Screen Editor Overlay */}
    {isFullScreen && selectedNote && (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-xl font-semibold text-gray-900 bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-gray-900 focus:outline-none px-0 py-1 transition-colors placeholder-gray-400"
                placeholder="Note title..."
              />
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {formatDate(selectedNote.created_date)}
                </span>
                {/* Note Type */}
                <span className={`px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600`}>
                  {selectedNote.note_type === 'meeting' ? 'Meeting' : 'General'}
                </span>
                {/* Project Selector */}
                <div className="relative" ref={projectDropdown.ref}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      projectDropdown.setIsOpen(!projectDropdown.isOpen)
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-2xl bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-900"></span>
                    {editedProjectId && projects.find(p => p.id === editedProjectId)
                      ? projects.find(p => p.id === editedProjectId)?.title
                      : 'No Project'}
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {projectDropdown.isOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-2xl border border-gray-200 z-20 py-1">
                      <button
                        onClick={() => {
                          setEditedProjectId(null)
                          projectDropdown.setIsOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                          !editedProjectId ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        No Project
                      </button>
                      {projects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => {
                            setEditedProjectId(project.id)
                            projectDropdown.setIsOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                            editedProjectId === project.id ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
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
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exit Full Screen"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-200"></div>
              <button
                onClick={handleDeleteNote}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Editor */}
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
