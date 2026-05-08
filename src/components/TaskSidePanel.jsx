import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, Hash, Calendar, Clock, Paperclip, Star, MoreVertical, Loader2, Check, FolderOpen } from 'lucide-react'
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
        // TODO: Occurrence fields removed during frontend simplification
        // Now using single-task CRUD architecture
      })
      setErrors({})
    }
  }, [isOpen, task, mode])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    project_id: null,
    status: 'todo',
    due_date: '',
    scheduled_date: '',
    // TODO: Occurrence fields removed during frontend simplification
    // Now using single-task CRUD architecture
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('activity')
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showDueDatePicker, setShowDueDatePicker] = useState(false)
  const [showScheduledDatePicker, setShowScheduledDatePicker] = useState(false)
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const titleInputRef = useRef(null)

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
      const dropdowns = document.querySelectorAll('.dropdown-container')
      let clickedInside = false
      dropdowns.forEach(dropdown => {
        if (dropdown.contains(e.target)) {
          clickedInside = true
        }
      })
      if (!clickedInside) {
        setShowProjectDropdown(false)
        setShowDueDatePicker(false)
        setShowScheduledDatePicker(false)
        setShowRecurrenceEndDatePicker(false)
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProjectDropdown, showDueDatePicker, showScheduledDatePicker, showRecurrenceEndDatePicker, showStatusDropdown])

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
        const response = await onCreateTask(formData)
        if (response.success) {
          onSave(response.data)
          onClose()
        } else {
          setErrors({ submit: response.error })
        }
      } else {
        // TODO: Occurrence split logic removed during frontend simplification
        // Now using single-task CRUD architecture
        const taskPayload = {
          id: task.task_id || task.id,
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date || null,
          scheduled_date: formData.scheduled_date || null,
          project_id: formData.project_id || null
        }
        // Update task
        const response = await onUpdateTask(taskPayload)
        if (!response.success) {
          setErrors({ submit: response.error })
          setIsLoading(false)
          return
        }

        // TODO: Occurrence update logic removed during frontend simplification
        // Now using single-task CRUD architecture
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
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const handleDelete = async () => {
    if (task && onDelete) {
      if (window.confirm('Are you sure you want to delete this task?')) {
        await onDelete(task.id)
        onClose()
      }
    }
  }

  if (!isOpen) return null

  const selectedProject = getSelectedProject()

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-[55] transition-opacity"
        onClick={onClose}
      />
      
      {/* Side Panel - Floating with rounded corners */}
      <div className="fixed right-4 top-4 bottom-4 w-[520px] bg-white shadow-2xl z-[60] flex flex-col border border-gray-200 rounded-2xl overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Clock className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Star className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Task Title */}
          <div className="px-6 py-5">
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Task name"
              className="w-full text-2xl font-semibold text-gray-900 placeholder-gray-400 bg-transparent border-none focus:outline-none focus:ring-0"
            />
            {errors.title && (
              <p className="mt-2 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Properties List */}
          <div className="px-6 space-y-4">
            {/* Created Time */}
            <div className="flex items-center">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Created time</span>
              </div>
              <div className="flex-1 text-sm text-gray-700">
                {task?.created_at ? formatDate(task.created_at) : formatDate(new Date().toISOString())}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4" />
                <span>Status</span>
              </div>
              <div className="flex-1 relative dropdown-container">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    formData.status === 'todo' ? 'bg-blue-500' :
                    formData.status === 'in_progress' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></span>
                  {getStatusLabel(formData.status)}
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 py-2 min-w-[160px] overflow-hidden">
                    {[
                      { value: 'todo', label: 'To Do', color: 'bg-blue-500', bgColor: 'bg-blue-50 text-blue-600' },
                      { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500', bgColor: 'bg-yellow-50 text-yellow-600' },
                      { value: 'completed', label: 'Done', color: 'bg-green-500', bgColor: 'bg-green-50 text-green-600' }
                    ].map((status) => (
                      <button
                        key={status.value}
                        onClick={() => {
                          handleChange('status', status.value)
                          setShowStatusDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.color}`}></span>
                        <span className="text-gray-700">{status.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Check className="w-4 h-4" />
                <span>Priority</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                {[
                  { value: 'high', label: 'High', color: 'bg-red-500', bgColor: 'bg-red-50 text-red-600', borderColor: 'border-red-500' },
                  { value: 'medium', label: 'Medium', color: 'bg-yellow-500', bgColor: 'bg-yellow-50 text-yellow-600', borderColor: 'border-yellow-500' },
                  { value: 'low', label: 'Low', color: 'bg-green-500', bgColor: 'bg-green-50 text-green-600', borderColor: 'border-green-500' }
                ].map((priority) => (
                  <button
                    key={priority.value}
                    onClick={() => handleChange('priority', priority.value)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                      formData.priority === priority.value
                        ? `${priority.bgColor} ${priority.borderColor}`
                        : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${priority.color}`}></span>
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project */}
            <div className="flex items-center">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <FolderOpen className="w-4 h-4" />
                <span>Project</span>
              </div>
              <div className="flex-1 relative dropdown-container">
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
                  {selectedProject ? selectedProject.title : 'No Project'}
                </button>
                {showProjectDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 py-2 min-w-[200px] overflow-hidden">
                    <button
                      onClick={() => {
                        handleChange('project_id', null)
                        setShowProjectDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                        !formData.project_id ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      No Project
                    </button>
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          handleChange('project_id', project.id)
                          setShowProjectDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                        formData.project_id === project.id ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
                      }`}
                      >
                        {project.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Due Date</span>
              </div>
              <div className="flex-1 relative dropdown-container">
                <button
                  onClick={() => setShowDueDatePicker(!showDueDatePicker)}
                  className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  {formData.due_date ? formatDate(formData.due_date) : 'Not set'}
                </button>
                {showDueDatePicker && (
                  <div className="absolute top-full left-0 mt-2 z-20">
                    <DateTimePicker
                      value={formData.due_date}
                      onChange={(date) => {
                        handleChange('due_date', date)
                        setShowDueDatePicker(false)
                      }}
                      onClose={() => setShowDueDatePicker(false)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Scheduled Date */}
            <div className="flex items-center">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Scheduled</span>
              </div>
              <div className="flex-1 relative dropdown-container">
                <button
                  onClick={() => setShowScheduledDatePicker(!showScheduledDatePicker)}
                  className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  {formData.scheduled_date ? formatDate(formData.scheduled_date) : 'Not set'}
                </button>
                {showScheduledDatePicker && (
                  <div className="absolute top-full left-0 mt-2 z-20">
                    <DateTimePicker
                      value={formData.scheduled_date}
                      onChange={(date) => {
                        handleChange('scheduled_date', date)
                        setShowScheduledDatePicker(false)
                      }}
                      onClose={() => setShowScheduledDatePicker(false)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Estimated Minutes */}
            <div className="flex items-center">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Est. Time</span>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={formData.estimated_minutes}
                  onChange={(e) => handleChange('estimated_minutes', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className="w-24 px-3 py-1 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-500">minutes</span>
              </div>
            </div>

            {/* Actual Minutes */}
            {mode === 'edit' && (
              <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Actual Time</span>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.actual_minutes}
                    onChange={(e) => handleChange('actual_minutes', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    className="w-24 px-3 py-1 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-500">minutes</span>
                </div>
              </div>
            )}

            {/* Recurring Toggle */}
            <div className="flex items-center">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4" />
                <span>Recurring</span>
              </div>
              <div className="flex-1">
                <button
                  onClick={() => handleChange('is_recurring', formData.is_recurring ? 0 : 1)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_recurring ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_recurring ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Recurrence Rule */}
            {formData.is_recurring && (
              <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4" />
                  <span>Repeat</span>
                </div>
                <div className="flex-1">
                  <select
                    value={formData.recurrence_rule}
                    onChange={(e) => handleChange('recurrence_rule', e.target.value)}
                    className="w-full px-3 py-1 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select pattern</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            )}

            {/* Recurrence End Date */}
            {formData.is_recurring && (
              <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Repeat Until</span>
                </div>
                <div className="flex-1 relative dropdown-container">
                  <button
                    onClick={() => setShowRecurrenceEndDatePicker(!showRecurrenceEndDatePicker)}
                    className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    {formData.recurrence_end_date ? formatDate(formData.recurrence_end_date) : 'No end date'}
                  </button>
                  {showRecurrenceEndDatePicker && (
                    <div className="absolute top-full left-0 mt-2 z-20">
                      <DateTimePicker
                        value={formData.recurrence_end_date}
                        onChange={(date) => {
                          handleChange('recurrence_end_date', date)
                          setShowRecurrenceEndDatePicker(false)
                        }}
                        onClose={() => setShowRecurrenceEndDatePicker(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description Card */}
          <div className="px-6 mt-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Add a description for this task..."
                rows={4}
                className="w-full text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 resize-none placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Save Button - Floating */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full border border-gray-900 hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}

export default TaskSidePanel
