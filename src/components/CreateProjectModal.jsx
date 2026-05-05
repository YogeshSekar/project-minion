import React, { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { X, ChevronDown, Calendar, Flag, FolderOpen, Plus, AlignLeft, Target, Star } from 'lucide-react'
import DateTimePicker from './DateTimePicker'

function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onSave
}) {
  const modalRef = useRef(null)
  
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        deadline: '',
        priority: 'medium',
        progress: 0,
      })
      setErrors({})
      // Focus on title input when modal opens
      setTimeout(() => {
        const titleInput = document.getElementById('project-title-input')
        if (titleInput) titleInput.focus()
      }, 100)
    }
  }, [isOpen])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    deadline: '',
    priority: 'medium',
    progress: 0,
    team_members: []
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowPriorityDropdown(false)
        setShowStartDatePicker(false)
        setShowDeadlinePicker(false)
      }
    }
    
    if (showPriorityDropdown || showStartDatePicker || showDeadlinePicker) {
      document.addEventListener('mousedown', handleClickOutside, true)
      return () => document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [showPriorityDropdown, showStartDatePicker, showDeadlinePicker])

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
      const response = await invoke('create_project', { request: formData })
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
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

  if (!isOpen) return null

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
            {isLoading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </>
  )
}

export default CreateProjectModal
