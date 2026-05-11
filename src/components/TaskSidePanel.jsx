import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Clock, Star, MoreVertical, CheckSquare, Plus, Trash2, Calendar, CalendarDays, Timer, Target, Loader2, Check, User, FileText } from 'lucide-react'
import Dropdown from './ui/Dropdown'
import DateTimePicker from './DateTimePicker'

function TaskSidePanel({ 
  isOpen, 
  onClose, 
  task = null, 
  onSave, 
  onUpdateTask,
  onCreateTask,
  mode = 'create',
  projects = [],
  onRefreshProjects = null,
  onDelete = null
}) {
  const panelKey = `${mode}-${task?.id || 'new'}`
  
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: task?.title || '',
        description: task?.description || '',
        priority: task?.priority || 'medium',
        project_id: task?.project_id || null,
        status: task?.status || 'todo',
        due_date: task?.due_date || '',
        scheduled_date: task?.scheduled_date || '',
        is_recurring: task?.is_recurring === 1 || false,
        recurrence_type: task?.recurrence_type || '',
        recurrence_interval: task?.recurrence_interval || 1,
        estimated_minutes: task?.estimated_minutes || 0,
        actual_minutes: task?.actual_minutes || 0,
      })
      setChecklist(task?.checklist || [])
      setErrors({})
    }
  }, [panelKey, isOpen])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    project_id: null,
    status: 'todo',
    due_date: '',
    scheduled_date: '',
    is_recurring: false,
    recurrence_type: '',
    recurrence_interval: 1,
    estimated_minutes: 0,
    actual_minutes: 0,
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('activity')
  const [showDueDatePicker, setShowDueDatePicker] = useState(false)
  const [showScheduledDatePicker, setShowScheduledDatePicker] = useState(false)
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false)
  const [datePickerPosition, setDatePickerPosition] = useState({ top: 0, left: 0 })
  const [checklist, setChecklist] = useState(task?.checklist || [])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const titleInputRef = useRef(null)
  const dueDateButtonRef = useRef(null)
  const scheduledDateButtonRef = useRef(null)
  const checklistInputRef = useRef(null)

  // Focus title input when panel opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus()
      // Place cursor at the end
      const length = titleInputRef.current.value.length
      titleInputRef.current.setSelectionRange(length, length)
    }
  }, [isOpen])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is inside any dropdown container OR inside DateTimePicker portal
      const dropdowns = document.querySelectorAll('.dropdown-container')
      const dateTimePickers = document.querySelectorAll('[class*="fixed bg-white rounded-xl shadow-2xl"]')
      
      let clickedInside = false
      
      // Check dropdown containers
      dropdowns.forEach(dropdown => {
        if (dropdown.contains(e.target)) {
          clickedInside = true
        }
      })
      
      // Check DateTimePicker portals
      dateTimePickers.forEach(picker => {
        if (picker.contains(e.target)) {
          clickedInside = true
        }
      })
      
      if (!clickedInside) {
        // Add small delay to prevent immediate closing after opening
        setTimeout(() => {
          setShowDueDatePicker(false)
          setShowScheduledDatePicker(false)
          setShowRecurrenceEndDatePicker(false)
        }, 10)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDueDatePicker, showScheduledDatePicker, showRecurrenceEndDatePicker])

  const calculateDropdownPosition = (buttonRef) => {
    if (!buttonRef?.current) return { top: 200, left: 200 }
    
    const rect = buttonRef.current.getBoundingClientRect()
    
    // Simple positioning - just place it below the button
    let top = rect.bottom + window.scrollY + 5
    let left = rect.left + window.scrollX
    
    // Simple adjustments to keep it in viewport
    if (left + 320 > window.innerWidth) {
      left = window.innerWidth - 330
    }
    if (left < 10) left = 10
    
    if (top + 320 > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - 330
    }
    if (top < window.scrollY + 10) top = window.scrollY + 10
    
    return { top, left }
  }

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
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      if (mode === 'create') {
        const response = await onCreateTask(buildTaskPayload())
        if (response.success) {
          onSave(response.data)
          onClose()
        } else {
          setErrors({ submit: response.error })
        }
      } else {
        // Update task with shared payload builder
        const taskPayload = {
          id: task.task_id || task.id,
          ...buildTaskPayload(),
          checklist: checklist,
        }
        const response = await onUpdateTask(taskPayload)
        if (!response.success) {
          setErrors({ submit: response.error })
          setIsLoading(false)
          return
        }

        if (response.success) {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getPriorityLabel = (priority) => {
    const labels = { high: 'High', medium: 'Medium', low: 'Low' }
    return labels[priority] || 'Medium'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status) => {
    const labels = { pending: 'To Do', in_progress: 'In Progress', completed: 'Done' }
    return labels[status] || 'To Do'
  }

  const getSelectedProject = () => {
    return projects.find(p => p.id === formData.project_id)
  }

  const formatDate = (dateString) => {
    // Handle null, undefined, empty string, and '0' values
    if (!dateString || dateString === '0' || dateString === '') return 'Not set'
    
    try {
      const date = new Date(dateString)
      // Check if date is invalid
      if (isNaN(date.getTime())) return 'Invalid date'
      
      // Format the date safely
      const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      return formatted
    } catch (error) {
      return 'Invalid date'
    }
  }

  const handleDelete = async () => {
    if (task && onDelete) {
      if (window.confirm('Are you sure you want to delete this task?')) {
        await onDelete(task.id)
        onClose()
      }
    }
  }

  // Checklist functions
  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false
      }
      setChecklist([...checklist, newItem])
      setNewChecklistItem('')
    }
  }

  const toggleChecklistItem = (id) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const deleteChecklistItem = (id) => {
    setChecklist(checklist.filter(item => item.id !== id))
  }

  const updateChecklistItem = (id, text) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, text } : item
    ))
  }

  const handleChecklistKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addChecklistItem()
    }
  }

  if (!isOpen) return null

  const selectedProject = getSelectedProject()

  return (
    <React.Fragment>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-[55] transition-opacity"
        onClick={onClose}
      />
      
      {/* Center Panel - Floating with rounded corners */}
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[90vh] bg-white shadow-2xl z-[60] flex flex-col border border-gray-200 rounded-2xl overflow-hidden animate-scale-in">
{/* Header */}
<div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white flex-shrink-0">
  {/* Left Section */}
  <div className="flex items-center gap-1">
    <button
      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="Star task"
    >
      <Star className="w-4 h-4" />
    </button>

    <button
      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="More options"
    >
      <MoreVertical className="w-4 h-4" />
    </button>
  </div>

  {/* Right Section */}
  <button
    onClick={onClose}
    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 rounded-lg transition-colors"
    aria-label="Close panel"
  >
    <X className="w-4 h-4" />
  </button>
</div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-4 px-4 py-4 h-full">
{/* Left Column - Task Details */}
<div className="w-[520px] flex flex-col gap-5 min-h-0">
  {/* Task Title */}
  <div className="flex-shrink-0">
    <input
      ref={titleInputRef}
      type="text"
      value={formData.title}
      onChange={(e) => handleChange('title', e.target.value)}
      placeholder="Task name"
      className="w-full text-2xl font-bold text-gray-900 placeholder-gray-400 bg-transparent border-none focus:outline-none focus:ring-0 pb-1 border-b border-transparent hover:border-gray-300 focus:border-gray-900 transition-colors"
    />

    {errors.title && (
      <p className="mt-1.5 text-sm text-red-500">{errors.title}</p>
    )}
  </div>

  {/* Description */}
  <div className="flex-shrink-0 space-y-2">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-50 rounded-lg  flex items-center justify-center">
        <FileText className="w-4 h-4 text-gray-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        Description
      </h3>
    </div>

    <textarea
      value={formData.description}
      onChange={(e) => handleChange('description', e.target.value)}
      placeholder="Add detailed description..."
      rows={4}
      className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
    />
  </div>

  {/* Checklist Section */}
  <div className="flex-1 flex flex-col min-h-0 space-y-3">
    {/* Header */}
    <div className="flex items-center justify-between flex-shrink-0">
      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
        <CheckSquare className="w-4 h-4 text-black-600" />
      </div>

        Checklist ({checklist.filter(item => item.completed).length}/{checklist.length})
      </h3>
    </div>

    {/* Add new checklist item */}
    <div className="flex gap-2 flex-shrink-0">
      <input
        ref={checklistInputRef}
        type="text"
        value={newChecklistItem}
        onChange={(e) => setNewChecklistItem(e.target.value)}
        onKeyDown={handleChecklistKeyDown}
        placeholder="Add checklist item..."
        className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />

      <button
        onClick={addChecklistItem}
        disabled={!newChecklistItem.trim()}
        className="w-9 h-9 bg-gray-900 text-white rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        title="Add checklist item"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>

    {/* Checklist items */}
    <div className="flex-1 overflow-y-auto min-h-0 pr-1">
      <div className="space-y-2">
        {checklist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-lg">
            <CheckSquare className="w-6 h-6 mb-2 text-gray-400" />
            <p className="text-sm">No checklist items yet</p>
          </div>
        ) : (
          checklist.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => toggleChecklistItem(item.id)}
                className="flex-shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900 accent-gray-900"
              />

              <input
                type="text"
                value={item.text}
                onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                className={`flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm p-0 ${
                  item.completed
                    ? 'line-through text-gray-400'
                    : 'text-gray-900'
                }`}
              />

              <button
                onClick={() => deleteChecklistItem(item.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
</div>

            {/* Right Column - Properties */}
            <div className="w-[400px] space-y-3">
              {/* Created Time */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Created Time</div>
                </div>
                <div className="text-sm text-gray-600">
                  {task?.created_at ? formatDate(task.created_at) : formatDate(new Date().toISOString())}
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Status</div>
                </div>
                <div className="relative dropdown-container">
                  <Dropdown
                    trigger={
                      <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors w-full"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          formData.status === 'todo' ? 'bg-blue-500' :
                          formData.status === 'in_progress' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></span>
                        {getStatusLabel(formData.status)}
                      </button>
                    }
                    align="right"
                    className="w-[140px]"
                  >
                    {[
                      { value: 'todo', label: 'To Do', color: 'bg-blue-500', bgColor: 'bg-blue-50 text-blue-600' },
                      { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500', bgColor: 'bg-yellow-50 text-yellow-600' },
                      { value: 'completed', label: 'Done', color: 'bg-green-500', bgColor: 'bg-green-50 text-green-600' }
                    ].map((status) => (
                      <button
                        key={status.value}
                        onClick={() => {
                          handleChange('status', status.value)
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.color}`}></span>
                        <span className="text-gray-900">{status.label}</span>
                      </button>
                    ))}
                  </Dropdown>
                </div>
              </div>

              {/* Priority */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Priority</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[
                    { value: 'high', label: 'High', color: 'bg-red-500', bgColor: 'bg-red-50 text-red-600', borderColor: 'border-red-500' },
                    { value: 'medium', label: 'Medium', color: 'bg-yellow-500', bgColor: 'bg-yellow-50 text-yellow-600', borderColor: 'border-yellow-500' },
                    { value: 'low', label: 'Low', color: 'bg-blue-500', bgColor: 'bg-blue-50 text-blue-600', borderColor: 'border-blue-500' }
                  ].map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => handleChange('priority', priority.value)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium transition-colors border ${
                        formData.priority === priority.value
                          ? `${priority.bgColor} ${priority.borderColor}`
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full ${priority.color}`}></span>
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Project</div>
                </div>
                <div className="relative dropdown-container">
                  <Dropdown
                    trigger={
                      <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors w-full"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
                        {selectedProject ? selectedProject.title : 'No Project'}
                      </button>
                    }
                    align="right"
                    className="w-[180px]"
                  >
                    <button
                      onClick={() => {
                        handleChange('project_id', null)
                      }}
                      className={`w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 ${
                        !formData.project_id ? 'bg-gray-200 text-gray-900' : 'text-gray-900'
                      }`}
                    >
                      No Project
                    </button>
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          handleChange('project_id', project.id)
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 ${
                          formData.project_id === project.id ? 'bg-gray-200 text-gray-900' : 'text-gray-900'
                        }`}
                      >
                        {project.title}
                      </button>
                    ))}
                  </Dropdown>
                </div>
              </div>

              {/* Due Date */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Due Date</div>
                </div>
                <div className="relative dropdown-container">
                  <button
                    ref={dueDateButtonRef}
                    onClick={() => {
                      setDatePickerPosition(calculateDropdownPosition(dueDateButtonRef))
                      setShowDueDatePicker(!showDueDatePicker)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors w-full"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {formData.due_date && formData.due_date !== '0' ? formatDate(formData.due_date) : 'Not set'}
                  </button>
                  {showDueDatePicker && createPortal(
                    <div>
                      <DateTimePicker
                        value={formData.due_date}
                        onChange={(date) => {
                          handleChange('due_date', date)
                          setShowDueDatePicker(false)
                        }}
                        onClose={() => setShowDueDatePicker(false)}
                        position={datePickerPosition}
                      />
                    </div>,
                    document.body
                  )}
                </div>
              </div>

              {/* Scheduled Date with Recurrence */}
              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">Scheduled</div>
                </div>
                <div className="space-y-2">
                  <div className="relative dropdown-container">
                    <button
                      ref={scheduledDateButtonRef}
                      onClick={() => {
                        setDatePickerPosition(calculateDropdownPosition(scheduledDateButtonRef))
                        setShowScheduledDatePicker(!showScheduledDatePicker)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors w-full"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {formData.scheduled_date && formData.scheduled_date !== '0' ? formatDate(formData.scheduled_date) : 'Not set'}
                    </button>
                    {showScheduledDatePicker && createPortal(
                      <div>
                        <DateTimePicker
                          value={formData.scheduled_date}
                          onChange={(date) => {
                            handleChange('scheduled_date', date)
                            setShowScheduledDatePicker(false)
                          }}
                          onClose={() => setShowScheduledDatePicker(false)}
                          position={datePickerPosition}
                        />
                      </div>,
                      document.body
                    )}
                  </div>

                  {/* Recurring Toggle & Options */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Timer className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">Repeat</div>
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
                          formData.is_recurring ? 'bg-gray-900' : 'bg-gray-300'
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
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors w-full"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                      <Timer className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">Estimated Time</div>
                  </div>
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
                      className="w-16 px-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-600">minutes</span>
                  </div>
                </div>
                
                {mode === 'edit' && (
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Timer className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">Actual Time</div>
                    </div>
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
                        className="w-16 px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button - Floating */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mode === 'edit' && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-red-600 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Task
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
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
