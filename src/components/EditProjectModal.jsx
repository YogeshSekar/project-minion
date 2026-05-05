import React, { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { X, ChevronDown, Calendar, Flag, FolderOpen, Plus, AlignLeft, Target, Check, Trash2, Edit2, Save, Play, Pause, TrendingUp, Star } from 'lucide-react'
import DateTimePicker from './DateTimePicker'

function EditProjectModal({ 
  isOpen, 
  onClose, 
  project = null, 
  onSave,
  onDelete = null
}) {
  const modalRef = useRef(null)
  
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        start_date: project.start_date || new Date().toISOString().split('T')[0],
        deadline: project.deadline || '',
        priority: project.priority || 'medium',
        progress: project.progress || 0,
        status: project.status || 'planning'
      })
      setErrors({})
      // Focus on title input when modal opens
      setTimeout(() => {
        const titleInput = document.getElementById('edit-project-title-input')
        if (titleInput) titleInput.focus()
      }, 100)
    }
  }, [isOpen, project])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    deadline: '',
    priority: 'medium',
    progress: 0,
    team_members: [],
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
      const response = await invoke('update_project', {
        request: { ...formData, id: project.id }
      })
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
    if (!onDelete) return
    
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

  const isOverdue = () => {
    if (!formData.deadline || formData.status === 'completed') return false
    const deadline = new Date(formData.deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    deadline.setHours(0, 0, 0, 0)
    return deadline < today
  }

  const getProjectHealth = () => {
    if (formData.status === 'completed') return { color: 'green', label: 'Completed' }
    if (isOverdue()) return { color: 'red', label: 'Overdue' }
    return { color: 'orange', label: 'Needs Attention' }
  }

  if (!isOpen || !project) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Side Panel - Floating with rounded corners */}
      <div className="fixed right-4 top-4 bottom-4 w-[520px] bg-white shadow-2xl z-50 flex flex-col border border-gray-200 rounded-2xl overflow-hidden animate-slide-in-right">
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
              <Star className="w-4 h-4" />
            </button>
            {onDelete && (
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
              id="edit-project-title-input"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Project name"
              className="w-full text-2xl font-semibold text-gray-900 placeholder-gray-400 bg-transparent border-none focus:outline-none focus:ring-0"
            />
            {errors.title && (
              <p className="mt-2 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Properties List */}
          <div className="px-6 pb-6 space-y-4">
            {/* Description */}
            <div className="flex items-start">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 placeholder-gray-400 resize-none transition-colors"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Check className="w-4 h-4" />
                <span>Status</span>
              </div>
              <div className="flex-1 relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    formData.status === 'planning' ? 'bg-blue-500' : 
                    formData.status === 'in_progress' ? 'bg-yellow-500' : 
                    formData.status === 'on_hold' ? 'bg-orange-500' : 
                    'bg-green-500'
                  }`}></span>
                  {getStatusLabel(formData.status)}
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 py-2 min-w-[160px] overflow-hidden">
                    {[
                      { value: 'planning', label: 'Planning', color: 'bg-blue-500' },
                      { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
                      { value: 'on_hold', label: 'On Hold', color: 'bg-orange-500' },
                      { value: 'completed', label: 'Completed', color: 'bg-green-500' }
                    ].map((status) => (
                      <button
                        key={status.value}
                        type="button"
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

            {/* Start Date */}
            <div className="flex items-center">
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Start Date</span>
              </div>
              <div className="flex-1 relative">
                <button
                  type="button"
                  onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors text-left"
                >
                  {formData.start_date ? new Date(formData.start_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Select date'}
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
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Target className="w-4 h-4" />
                <span>Deadline</span>
              </div>
              <div className="flex-1 relative">
                <button
                  type="button"
                  onClick={() => setShowDeadlinePicker(!showDeadlinePicker)}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors text-left"
                >
                  {formData.deadline ? new Date(formData.deadline).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Select date'}
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
              <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                <Flag className="w-4 h-4" />
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
                    type="button"
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !formData.title.trim() || !formData.start_date || !formData.deadline}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete "{project.title}"? This will permanently remove the project and all its associated tasks and data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default EditProjectModal
