import { useState, useEffect, useRef } from 'react'
import { X, Maximize2, Minimize2, Trash2, Folder } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import TipTapEditor from './TipTapEditor'
import Dropdown from './ui/Dropdown'

function CreateNoteModal({ isOpen, onClose, onNoteCreated, note = null }) {
  const [title, setTitle] = useState('Untitled Note')
  const [content, setContent] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [projectId, setProjectId] = useState(null)
  const [projects, setProjects] = useState([])
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const projectDropdownRef = useRef(null)
  const modalRef = useRef(null)

  // Load projects when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProjects()
      if (note) {
        // Edit mode: pre-fill form with note data
        setTitle(note.title || 'Untitled Note')
        setContent(note.content || '')
        setNoteType(note.note_type || 'general')
        setProjectId(note.project_id || null)
      } else {
        // Create mode: reset form
        setTitle('Untitled Note')
        setContent('')
        setNoteType('general')
        setProjectId(null)
        setIsFullScreen(false)
      }
    }
  }, [isOpen, note])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false)
      }
    }

    if (showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProjectDropdown])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Escape to close (if not fullscreen)
      if (e.key === 'Escape' && !isFullScreen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, title, content, noteType, projectId, isFullScreen])

  const loadProjects = async () => {
    try {
      const response = await invoke('get_all_projects')
      if (response.success) {
        setProjects(response.data || [])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      let response

      if (note) {
        // Edit mode: update existing note
        response = await invoke('update_note', {
          request: {
            id: note.id,
            title: title || 'Untitled Note',
            content: content,
            note_type: noteType,
            project_id: projectId,
            updated_date: today
          }
        })
      } else {
        // Create mode: create new note
        response = await invoke('create_note', {
          request: {
            title: title || 'Untitled Note',
            content: content,
            note_type: noteType,
            project_id: projectId,
            created_date: today,
            updated_date: today
          }
        })
      }

      if (response.success) {
        onNoteCreated?.(response.data)
        onClose()
      }
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 flex-1"
          placeholder="Note title..."
        />
        <div className="flex items-center gap-2">
          {/* Type Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1 mr-2">
            <button
              onClick={() => setNoteType('general')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                noteType === 'general'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setNoteType('meeting')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                noteType === 'meeting'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Meeting
            </button>
          </div>

          {/* Project Selector */}
          <div className="relative dropdown-container">
            <Dropdown
              trigger={
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors w-full"
                >
                  <Folder className="w-4 h-4" />
                  <span className="truncate">
                    {projectId ? projects.find(p => p.id === projectId)?.title || 'Select Project' : 'No Project'}
                  </span>
                </button>
              }
              align="right"
              className="w-[180px]"
            >
              <button
                onClick={() => { setProjectId(null); setShowProjectDropdown(false) }}
                className={`w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 ${
                  !projectId ? 'bg-gray-200 text-gray-900' : 'text-gray-900'
                }`}
              >
                No Project
              </button>
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => { setProjectId(project.id); setShowProjectDropdown(false) }}
                  className={`w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 ${
                    projectId === project.id ? 'bg-gray-200 text-gray-900' : 'text-gray-900'
                  }`}
                >
                  {project.title}
                </button>
              ))}
            </Dropdown>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 text-gray-700 hover:bg-gray-200 rounded-2xl transition-colors"
            title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-2xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-[300px] overflow-hidden">
        <TipTapEditor
          content={content}
          onChange={setContent}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-white"></div>
                Saving...
              </>
            ) : (
              <>
                Save Note
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  if (isFullScreen) {
    return (
      <div ref={modalRef} className="fixed inset-0 z-[60] bg-white">
        {modalContent}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div ref={modalRef} className="w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {modalContent}
      </div>
    </div>
  )
}

export default CreateNoteModal
