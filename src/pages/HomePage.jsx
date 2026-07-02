import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Plus, AlertCircle, CheckCircle, List, LayoutGrid, Filter, ArrowUpDown, Circle, CheckSquare, Square, Video, Play, Clock, Hash, FileText, X, Trash2, Copy } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import HorizontalTimeline from '../components/HorizontalTimeline'
import TaskCard from '../components/TaskCard'
import TipTapEditor from '../components/TipTapEditor'
import { startActivity, stopCurrentActivity } from '../services/activityService'
import { getRunningActivity } from '../services/api'
import { getNotes, createNote as createNoteService, updateNote as updateNoteService, deleteNote as deleteNoteService } from '../services/noteService'
import useTasks from '../hooks/useTasks'
import useProjects from '../hooks/useProjects'
import { formatDateLabel, getWeekDays } from '../utils/helpers'

function HomePage({ openTaskModal, taskRefreshTrigger = 0, onActivityStarted, onActivityStopped, runningActivity: propRunningActivity }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [quickNotes, setQuickNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [selectedQuickNote, setSelectedQuickNote] = useState(null)
  const [selectedQuickNoteContent, setSelectedQuickNoteContent] = useState('')

  // Use hooks for data management
  const { tasks, loading: tasksLoading, updateTask, deleteTask, loadTasks } = useTasks()
  const { projects, loading: projectsLoading } = useProjects()

  // Use running activity from props if provided, otherwise track locally
  const runningActivity = propRunningActivity !== undefined ? propRunningActivity : localRunningActivity
  const [localRunningActivity, setLocalRunningActivity] = useState(null)

  // Load running activity on mount (only if not provided via props)
  useEffect(() => {
    if (propRunningActivity === undefined) {
      loadRunningActivity()
    }
  }, [])

  // Reload tasks when taskRefreshTrigger changes
  useEffect(() => {
    loadTasks()
  }, [taskRefreshTrigger, loadTasks])

  const loadRunningActivity = async () => {
    try {
      const response = await getRunningActivity()
      if (response.success) {
        setLocalRunningActivity(response.data || null)
      }
    } catch (error) {
      console.error('Error loading running activity:', error)
    }
  }

  const handleStartTaskActivity = async (task) => {
    try {
      const response = await startActivity({
        title: task.title,
        activity_type: 'focus_session',
        source: 'manual',
        reference_type: 'task',
        reference_id: task.id,
        project_id: task.project_id
      })
      if (response.success) {
        // Update local state
        if (propRunningActivity === undefined) {
          await loadRunningActivity()
        }
        // Notify parent to sync header timer
        if (onActivityStarted) {
          onActivityStarted(response.data, task)
        }
      }
    } catch (error) {
      console.error('Error starting task activity:', error)
    }
  }

  const handleStopTaskActivity = async () => {
    try {
      const response = await stopCurrentActivity()
      if (response.success) {
        // Update local state
        if (propRunningActivity === undefined) {
          setLocalRunningActivity(null)
        }
        // Notify parent to sync header timer
        if (onActivityStopped) {
          onActivityStopped()
        }
      }
    } catch (error) {
      console.error('Error stopping task activity:', error)
    }
  }

  // Date navigator handlers
  const weekDays = getWeekDays(selectedDate)
  
  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString()
  }

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const handleEditTask = (task) => {
    // Open task modal with existing task data in edit mode
    if (openTaskModal) {
      openTaskModal(task, 'edit')
    }
  }

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    await updateTask({ ...task, status: newStatus })
  }

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId)
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    const content = newNote.trim()
    const title = content.split('\n')[0] || 'Quick Note'
    const today = new Date().toISOString().split('T')[0]

    try {
      const response = await createNoteService({
        title,
        content,
        project_id: null,
        note_type: 'quick',
        created_date: today
      })

      if (response.success) {
        setNewNote('')
        await loadQuickNotes()
      } else {
        console.error('Error creating quick note:', response.error)
      }
    } catch (error) {
      console.error('Error creating quick note:', error)
    }
  }

  const handleDeleteNote = async (id) => {
    try {
      const response = await deleteNoteService(id)
      if (response.success) {
        setQuickNotes((currentNotes) => currentNotes.filter((note) => note.id !== id))
        if (selectedQuickNote?.id === id) {
          setSelectedQuickNote(null)
        }
      } else {
        console.error('Error deleting quick note:', response.error)
      }
    } catch (error) {
      console.error('Error deleting quick note:', error)
    }
  }

  const loadQuickNotes = async () => {
    try {
      const response = await getNotes()
      if (response.success) {
        const quickNotesResponse = response.data?.filter((note) => note.note_type === 'quick') || []
        setQuickNotes(quickNotesResponse)
      }
    } catch (error) {
      console.error('Error loading quick notes:', error)
    }
  }

  const getPlainTextFromHTML = (html = '') => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }

  const getFirstLineFromHTML = (html = '') => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const blockTags = new Set(['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'])

    for (const node of Array.from(doc.body.childNodes)) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node
        if (blockTags.has(element.tagName)) {
          return element.textContent.trim() || ''
        }
        if (element.tagName === 'BR') {
          continue
        }
      }
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        if (text) {
          return text.split(/\r?\n/)[0].trim()
        }
      }
    }

    return (doc.body.textContent || '').trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0] || ''
  }

  useEffect(() => {
    loadQuickNotes()
  }, [])

  const handleCopyNote = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopyMessage('Copied to clipboard')
      window.setTimeout(() => setCopyMessage(''), 2500)
    } catch (error) {
      console.error('Failed to copy note text:', error)
      setCopyMessage('Copy failed')
      window.setTimeout(() => setCopyMessage(''), 2500)
    }
  }

  const handleOpenQuickNote = (note) => {
    setSelectedQuickNote(note)
    setSelectedQuickNoteContent(note.content || '')
  }

  const handleCloseQuickNote = () => {
    setSelectedQuickNote(null)
    setSelectedQuickNoteContent('')
  }

  const handleSaveQuickNote = async () => {
    if (!selectedQuickNote) return

    const updatedContent = selectedQuickNoteContent.trim()
    const updatedTitle = getFirstLineFromHTML(updatedContent) || 'Quick Note'

    try {
      const response = await updateNoteService({
        id: selectedQuickNote.id,
        title: updatedTitle,
        content: updatedContent,
        project_id: null,
        note_type: 'quick'
      })

      if (response.success) {
        await loadQuickNotes()
        setSelectedQuickNote(response.data)
        setSelectedQuickNoteContent(response.data.content || '')
      } else {
        console.error('Error updating quick note:', response.error)
      }
    } catch (error) {
      console.error('Error updating quick note:', error)
    }
  }

  const handleTimelineTaskClick = (task) => {
    if (openTaskModal) {
      openTaskModal(task, 'edit')
    }
  }

  // Get tasks for selected date by status
  const getTasksForDateByStatus = (date) => {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const inProgressTasks = tasks.filter(task => {
      if (task.status !== 'in_progress') return false
      if (!task.scheduled_date) return false
      const taskDate = new Date(task.scheduled_date)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() === targetDate.getTime()
    })

    const todoTasks = tasks.filter(task => {
      if (task.status !== 'todo') return false
      if (!task.scheduled_date) return false
      const taskDate = new Date(task.scheduled_date)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() === targetDate.getTime()
    })

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const sortTasks = (taskList) => {
      return [...taskList].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    }

    return {
      inProgressItems: sortTasks(inProgressTasks),
      todoItems: sortTasks(todoTasks)
    }
  }

  // Get overdue tasks
  const getOverdueTasks = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return tasks.filter(task => {
      if (task.status === 'completed') return false
      if (!task.scheduled_date) return false
      const taskDate = new Date(task.scheduled_date)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() < today.getTime()
    }).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
  }


    
  return (
    <div className="h-full bg-gray-60 flex gap-4 p-4 items-stretch">
      {/* Main Content Area */}
      {/* Left Column - Date Navigation with Task List */}
        <div className="w-[450px] flex flex-col overflow-hidden">
          <div className="w-full h-full rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col">
            {/* Fixed Date Navigation Header */}
            <div className="bg-white p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center w-48 justify-between">
                  <button
                    onClick={handlePrevDay}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-medium text-gray-900 text-center flex-1">
                    {formatDateLabel(selectedDate)}
                  </span>
                  <button
                    onClick={handleNextDay}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <button
                  onClick={handleToday}
                  className={`px-4 py-2 rounded-full transition-colors text-sm font-medium ${
                    selectedDate.toDateString() === new Date().toDateString()
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>
            {/* Scrollable Task List */}
            <div className="flex-1 overflow-auto no-scrollbar p-4">
              {tasksLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="space-y-6">
                        {/* Overdue Tasks */}
                        {getOverdueTasks().length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
                              Overdue
                            </div>
                            <div className="space-y-2">
                              {getOverdueTasks().map((task) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  projects={projects}
                                  onToggleComplete={handleToggleComplete}
                                  onEdit={handleEditTask}
                                  onStartActivity={handleStartTaskActivity}
                                  onStopActivity={handleStopTaskActivity}
                                  runningActivity={runningActivity}
                                  onDelete={handleDeleteTask}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* In Progress Tasks */}
                        {(() => {
                          const { inProgressItems } = getTasksForDateByStatus(selectedDate)
                          return inProgressItems.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
                                In Progress
                              </div>
                              <div className="space-y-2">
                                {inProgressItems.map((task) => (
                                  <TaskCard
                                    key={task.id}
                                    task={task}
                                    projects={projects}
                                    onToggleComplete={handleToggleComplete}
                                    onEdit={handleEditTask}
                                    onStartActivity={handleStartTaskActivity}
                                    onStopActivity={handleStopTaskActivity}
                                    runningActivity={runningActivity}
                                    onDelete={handleDeleteTask}
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        })()}

                        {/* To Do Tasks */}
                        {(() => {
                          const { todoItems } = getTasksForDateByStatus(selectedDate)
                          return todoItems.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
                                To Do
                              </div>
                              <div className="space-y-2">
                                {todoItems.map((task) => (
                                  <TaskCard
                                    key={task.id}
                                    task={task}
                                    projects={projects}
                                    onToggleComplete={handleToggleComplete}
                                    onEdit={handleEditTask}
                                    onStartActivity={handleStartTaskActivity}
                                    onStopActivity={handleStopTaskActivity}
                                    runningActivity={runningActivity}
                                    onDelete={handleDeleteTask}
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        })()}

                        {/* No Tasks State */}
                        {getOverdueTasks().length === 0 && 
                         getTasksForDateByStatus(selectedDate).inProgressItems.length === 0 && 
                         getTasksForDateByStatus(selectedDate).todoItems.length === 0 && (
                          <div className="text-center py-12">
                            <Circle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No tasks scheduled</p>
                          </div>
                        )}
                      </div>
                    )}
              </div>
            </div>
         
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content - Quick Notes and Timeline */}
          <div className="flex-1 overflow-auto">
            {/* Quick Notes Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span>Quick Notes</span>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {quickNotes.length}
                    </span>
                  </h3>
                </div>
                <div className="flex items-center gap-3 min-h-[24px]">
                  <span className={`text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full transition-opacity duration-200 ${copyMessage ? 'opacity-100' : 'opacity-0 invisible'}`} aria-live="polite">
                    {copyMessage || 'Copied'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add a quick note..."
                  className="flex-1 px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  onClick={handleAddNote}
                  className="w-10 h-10 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-auto">
                {quickNotes.length > 0 ? (
                  quickNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => handleOpenQuickNote(note)}
                      className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm group cursor-pointer transition hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-1">{getFirstLineFromHTML(note.content)}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyNote(getPlainTextFromHTML(note.content)) }}
                            className="text-gray-400 hover:text-gray-900 transition-colors"
                            aria-label="Copy quick note"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id) }}
                            className="text-gray-400 hover:text-gray-900 transition-colors"
                            aria-label="Delete quick note"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notes yet</p>
                  </div>
                )}
              </div>
            </div>

            {selectedQuickNote && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-500">Note created on {new Date(selectedQuickNote.created_at).toLocaleString()}</p>
                    <button
                      onClick={handleCloseQuickNote}
                      className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      aria-label="Close quick note"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-5 h-[360px]">
                    <TipTapEditor
                      content={selectedQuickNoteContent}
                      onChange={setSelectedQuickNoteContent}
                      onSave={handleSaveQuickNote}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleCopyNote(getPlainTextFromHTML(selectedQuickNoteContent))}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteNote(selectedQuickNote.id)
                        handleCloseQuickNote()
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Horizontal Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <HorizontalTimeline selectedDate={selectedDate} tasks={tasks} onTaskClick={handleTimelineTaskClick} />
            </div>
          </div>
        </div>
    </div>
  )
}

export default HomePage
