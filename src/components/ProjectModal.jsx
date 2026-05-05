import React, { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { X, ChevronDown, Calendar, Flag, AlignLeft, Target, Check, Trash2, Star } from 'lucide-react'
import DateTimePicker from './DateTimePicker'

function ProjectModal({ 
  isOpen, 
  onClose, 
  project = null,
  mode = 'create', // 'create' | 'edit'
  onSave,
  onDelete = null
}) {
  const modalRef = useRef(null)
  const isEditMode = mode === 'edit'
  
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && project) {
        setFormData({
          title: project.title || '',
          description: project.description || '',
          start_date: project.start_date || new Date().toISOString().split('T')[0],
          deadline: project.deadline || '',
          priority: project.priority || 'medium',
          progress: project.progress || 0,
          status: project.status || 'planning'
        })
      } else {
        setFormData({
          title: '',
          description: '',
          start_date: new Date().toISOString().split('T')[0],
          deadline: '',
          priority: 'medium',
          progress: 0,
          status: 'planning'
        })
        // Focus on title input when modal opens in create mode
        setTimeout(() => {
          const titleInput = document.getElementById('project-title-input')
          if (titleInput) titleInput.focus()
        }, 100)
      }
      setErrors({})
    }
  }, [isOpen, project, isEditMode])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    deadline: '',
    priority: 'medium',
    progress: 0,
    status: 'planning'
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowPriorityDropdown(false)
        setShowStartDatePicker(false)
        setShowDeadlinePicker(false)
        setShowStatusDropdown(false)
        setShowDeleteConfirm(false)
      }
    }
    
    if (showPriorityDropdown || showStartDatePicker || showDeadlinePicker || showStatusDropdown || showDeleteConfirm) {
      document.addEventListener('mousedown', handleClickOutside, true)
      return () => document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [showPriorityDropdown, showStartDatePicker, showDeadlinePicker, showStatusDropdown, showDeleteConfirm])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required'
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required'
    }
    if (formData.start_date && formData.deadline) {
      if (new Date(formData.start_date) > new Date(formData.deadline)) {
        newErrors.deadline = 'Deadline must be after start date'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = isEditMode
        ? await invoke('update_project', { request: { ...formData, id: project.id } })
        : await invoke('create_project', { request: formData })
        
      if (response.success) {
        onSave(response.data)
        onClose()
      } else {
        setErrors({ submit: response.error })
      }
    } catch (error) {
      setErrors({ submit: error.toString() })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !project) return
    
    setIsLoading(true)
    try {
      const response = await invoke('delete_project', { id: project.id })
      if (response.success) {
        onDelete(project.id)
        onClose()
      } else {
        setErrors({ submit: response.error })
      }
    } catch (error) {
      setErrors({ submit: error.toString() })
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleStatus = () => {
    const statusFlow = {
      'planning': 'in_progress',
      'in_progress': 'on_hold',
      'on_hold': 'completed',
      'completed': 'planning'
    }
    const newStatus = statusFlow[formData.status] || 'planning'
    handleChange('status', newStatus)
  }

  const getPriorityLabel = (priority) => {
    const labels = { high: 'High', medium: 'Medium', low: 'Low' }
    return labels[priority] || 'Medium'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-500 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      default: return 'text-gray-400 border-gray-300'
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700'
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700'
      case 'on_hold':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      'planning': 'Planning',
      'in_progress': 'In Progress',
      'on_hold': 'On Hold',
      'completed': 'Completed'
    }
    return labels[status] || 'Planning'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleQuickAdd = (type) => {
    switch (type) {
      case 'week':
        const weekFromNow = new Date()
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        handleChange('deadline', weekFromNow.toISOString().split('T')[0])
        break
      case 'month':
        const monthFromNow = new Date()
        monthFromNow.setMonth(monthFromNow.getMonth() + 1)
        handleChange('deadline', monthFromNow.toISOString().split('T')[0])
        break
      case 'quarter':
        const quarterFromNow = new Date()
        quarterFromNow.setMonth(quarterFromNow.getMonth() + 3)
        handleChange('deadline', quarterFromNow.toISOString().split('T')[0])
        break
      case 'high':
        handleChange('priority', 'high')
        break
      case 'low':
        handleChange('priority', 'low')
        break
    }
  }

  if (!isOpen || (isEditMode && !project)) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Side Panel - Floating with rounded corners */}
      <div ref={modalRef} className="fixed right-4 top-4 bottom-4 w-[520px] bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden animate-slide-in-right">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <button type="button" className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Star className="w-4 h-4" />
              </button>
              {isEditMode && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Project Title */}
            <div className="px-6 py-5">
              <input
                id="project-title-input"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Project name"
                className="w-full text-2xl font-semibold text-gray-900 dark:text-white placeholder-gray-400 bg-transparent border-none focus:outline-none focus:ring-0"
              />
              {errors.title && (
                <p className="mt-2 text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Properties List */}
            <div className="px-6 pb-6 space-y-4">
              {/* Description */}
              <div className="flex items-start">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <AlignLeft className="w-4 h-4" />
                  <span>Description</span>
                </div>
                <div className="flex-1">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe the project..."
                    rows={5}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-gray-900 text-gray-900 dark:text-white placeholder-gray-400 resize-none transition-colors"
                  />
                </div>
              </div>

              {/* Status - Edit Mode Only */}
              {isEditMode && (
                <div className="flex items-center">
                  <div className="w-32 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Check className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                  <div className="flex-1 relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-xl transition-colors ${getStatusBadge(formData.status)}`}
                    >
                      {getStatusLabel(formData.status)}
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                        {['planning', 'in_progress', 'on_hold', 'completed'].map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => { handleChange('status', status); setShowStatusDropdown(false); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${formData.status === status ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                          >
                            {getStatusLabel(status)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Start Date */}
              <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Start Date</span>
                </div>
                <div className="flex-1 relative">
                  <button
                    type="button"
                    onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    {formData.start_date ? formatDate(formData.start_date) : 'Select date'}
                  </button>
                  {showStartDatePicker && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-2 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DateTimePicker
                        value={formData.start_date}
                        onChange={(date) => {
                          handleChange('start_date', date)
                          setShowStartDatePicker(false)
                        }}
                        onClose={() => setShowStartDatePicker(false)}
                      />
                    </div>
                  )}
                  {errors.start_date && (
                    <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>
                  )}
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Target className="w-4 h-4" />
                  <span>Deadline</span>
                </div>
                <div className="flex-1 relative">
                  <button
                    type="button"
                    onClick={() => setShowDeadlinePicker(!showDeadlinePicker)}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    {formData.deadline ? formatDate(formData.deadline) : 'Select date'}
                  </button>
                  {showDeadlinePicker && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-2 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DateTimePicker
                        value={formData.deadline}
                        onChange={(date) => {
                          handleChange('deadline', date)
                          setShowDeadlinePicker(false)
                        }}
                        onClose={() => setShowDeadlinePicker(false)}
                      />
                    </div>
                  )}
                  {errors.deadline && (
                    <p className="mt-1 text-xs text-red-500">{errors.deadline}</p>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Flag className="w-4 h-4" />
                  <span>Priority</span>
                </div>
                <div className="flex-1 relative dropdown-container">
                  <button
                    type="button"
                    onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-xl transition-colors ${getPriorityColor(formData.priority)}`}
                  >
                    {getPriorityLabel(formData.priority)}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPriorityDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showPriorityDropdown && (
                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                      {['high', 'medium', 'low'].map(priority => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => { handleChange('priority', priority); setShowPriorityDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${formData.priority === priority ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          {getPriorityLabel(priority)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Add Buttons - Create Mode Only */}
              {!isEditMode && (
                <div className="flex items-center gap-2 pt-4">
                  <span className="text-xs text-gray-400">Quick set:</span>
                  <button type="button" onClick={() => handleQuickAdd('week')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+1 week</button>
                  <button type="button" onClick={() => handleQuickAdd('month')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+1 month</button>
                  <button type="button" onClick={() => handleQuickAdd('quarter')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+3 months</button>
                  <button type="button" onClick={() => handleQuickAdd('high')} className="px-2 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded">High priority</button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            {errors.submit && (
              <p className="text-sm text-red-500">{errors.submit}</p>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-[400px]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Project?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{project?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProjectModal
