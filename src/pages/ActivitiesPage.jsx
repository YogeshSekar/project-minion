import { useState, useEffect } from 'react'
import {
  Play,
  Square,
  Clock3,
  PlusCircle,
  Activity,
  CalendarDays,
  TimerReset,
  ChevronDown,
  Pencil,
  Trash2
} from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import useActivityTracker from '../hooks/useActivityTracker'
import useTasks from '../hooks/useTasks'
import useProjects from '../hooks/useProjects'
import useClickOutside from '../hooks/useClickOutside'
import ConfirmModal from '../components/ConfirmModal'
import GroupedActivityCard from '../components/GroupedActivityCard'

function ActivitiesPage() {
  const {
    activities,
    runningActivity,
    loading,
    error,
    handleStartActivity,
    handleStopActivity,
    handleCreateManualActivity,
    handleUpdateActivity,
    handleDeleteActivity
  } = useActivityTracker()

  // Use hooks for reference data
  const { tasks } = useTasks()
  const { projects } = useProjects()

  // Quick start form state
  const [quickTitle, setQuickTitle] = useState('')
  const [quickSelectedTask, setQuickSelectedTask] = useState(null)
  const [quickSelectedProject, setQuickSelectedProject] = useState(null)

  // Manual form state
  const [manualTitle, setManualTitle] = useState('')
  const [manualStart, setManualStart] = useState('')
  const [manualEnd, setManualEnd] = useState('')
  const [manualSelectedTask, setManualSelectedTask] = useState(null)
  const [manualSelectedProject, setManualSelectedProject] = useState(null)

  // Use click-outside hooks for dropdowns
  const quickTaskDropdown = useClickOutside()
  const quickProjectDropdown = useClickOutside()
  const manualTaskDropdown = useClickOutside()
  const manualProjectDropdown = useClickOutside()

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editSelectedTask, setEditSelectedTask] = useState(null)
  const [editSelectedProject, setEditSelectedProject] = useState(null)

  // Use click-outside hooks for edit dropdowns
  const editTaskDropdown = useClickOutside()
  const editProjectDropdown = useClickOutside()

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState(null)

  const formatDateTime = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleString()
  }

  const formatDuration = (minutes) => {
    if (minutes === null) return 'Running'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getTaskTitle = (id) => {
    const task = tasks.find(t => t.id === id)
    return task ? task.title : 'Unknown Task'
  }

  const getProjectTitle = (id) => {
    const project = projects.find(p => p.id === id)
    return project ? project.title : 'Unknown Project'
  }

  const groupActivities = (list) => {
    const map = new Map()
    list.forEach(a => {
      const key = a.reference_type === 'task' && a.reference_id ? `task:${a.reference_id}` : (a.project_id ? `project:${a.project_id}` : 'no_group')
      if (!map.has(key)) {
        map.set(key, {
          key,
          task_id: a.reference_type === 'task' ? a.reference_id : null,
          project_id: a.project_id || null,
          activities: []
        })
      }
      map.get(key).activities.push(a)
    })
    return Array.from(map.values()).map(g => ({
      ...g,
      totalMinutes: g.activities.reduce((s, it) => s + (it.duration_minutes || 0), 0)
    }))
  }

  const onQuickStart = async () => {
    if (!quickTitle.trim()) return
    const response = await handleStartActivity({
      title: quickTitle,
      activity_type: 'focus_session',
      source: 'manual',
      reference_type: quickSelectedTask ? 'task' : null,
      reference_id: quickSelectedTask,
      project_id: quickSelectedProject
    })
    if (response.success) {
      setQuickTitle('')
      setQuickSelectedTask(null)
      setQuickSelectedProject(null)
    }
  }

  const onManualCreate = async () => {
    if (!manualTitle.trim() || !manualStart || !manualEnd) return
    const response = await handleCreateManualActivity({
      title: manualTitle,
      activity_type: 'manual_log',
      start_time: manualStart,
      end_time: manualEnd,
      source: 'manual',
      reference_type: manualSelectedTask ? 'task' : null,
      reference_id: manualSelectedTask,
      project_id: manualSelectedProject
    })
    if (response.success) {
      setManualTitle('')
      setManualStart('')
      setManualEnd('')
      setManualSelectedTask(null)
      setManualSelectedProject(null)
    }
  }

  const openEditModal = (activity) => {
    setEditingActivity(activity)
    setEditTitle(activity.title)
    setEditStart(activity.start_time.slice(0, 16))
    setEditEnd(activity.end_time ? activity.end_time.slice(0, 16) : '')
    setEditSelectedTask(activity.reference_id)
    setEditSelectedProject(activity.project_id)
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingActivity(null)
    setEditTitle('')
    setEditStart('')
    setEditEnd('')
    setEditSelectedTask(null)
    setEditSelectedProject(null)
    editTaskDropdown.setIsOpen(false)
    editProjectDropdown.setIsOpen(false)
  }

  const onEditSave = async () => {
    if (!editingActivity || !editTitle.trim()) return
    const response = await handleUpdateActivity({
      ...editingActivity,
      title: editTitle,
      start_time: editStart,
      end_time: editEnd || null,
      reference_type: editSelectedTask ? 'task' : null,
      reference_id: editSelectedTask,
      project_id: editSelectedProject
    })
    if (response.success) {
      closeEditModal()
    }
  }

  const openDeleteConfirm = (activity) => {
    setActivityToDelete(activity)
    setDeleteConfirmOpen(true)
  }

  const onDeleteConfirm = async () => {
    if (!activityToDelete) return
    const response = await handleDeleteActivity(activityToDelete.id)
    if (response.success) {
      setDeleteConfirmOpen(false)
      setActivityToDelete(null)
    }
  }

  return (
    <div className="h-full flex justify-center p-4 overflow-auto">
      <div className="w-full max-w-6xl flex flex-col gap-4">
        {/* Quick Start Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            {/* Running Indicator */}
            <div className="flex-shrink-0">
              {runningActivity ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">{runningActivity.title}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-sm">No session</span>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1" />

            {/* Project Selector */}
            <div ref={quickProjectDropdown.ref} className="relative">
              <button
                onClick={() => quickProjectDropdown.setIsOpen(!quickProjectDropdown.isOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {quickSelectedProject ? getProjectTitle(quickSelectedProject) : 'No Project'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {quickProjectDropdown.isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10 max-h-48 overflow-y-auto">
                  <div
                    onClick={() => { setQuickSelectedProject(null); quickProjectDropdown.setIsOpen(false) }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${!quickSelectedProject ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                  >
                    No Project
                  </div>
                  {projects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => { setQuickSelectedProject(project.id); quickProjectDropdown.setIsOpen(false) }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${quickSelectedProject === project.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                    >
                      {project.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task Selector */}
            <div ref={quickTaskDropdown.ref} className="relative">
              <button
                onClick={() => quickTaskDropdown.setIsOpen(!quickTaskDropdown.isOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {quickSelectedTask ? getTaskTitle(quickSelectedTask) : 'No Task'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {quickTaskDropdown.isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10 max-h-48 overflow-y-auto">
                  <div
                    onClick={() => { setQuickSelectedTask(null); quickTaskDropdown.setIsOpen(false) }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${!quickSelectedTask ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                  >
                    No Task
                  </div>
                  {tasks
                    .filter(task => task.status === 'todo' || task.status === 'in_progress' || task.status === 'waiting')
                    .filter(task => !quickSelectedProject || task.project_id === quickSelectedProject)
                    .map(task => (
                    <div
                      key={task.id}
                      onClick={() => { setQuickSelectedTask(task.id); quickTaskDropdown.setIsOpen(false) }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 truncate ${quickSelectedTask === task.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1" />

            {/* Title Input */}
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Activity title..."
              className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />

            {/* Stop Button if running */}
            {runningActivity && (
              <button
                onClick={handleStopActivity}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            )}

            {/* Start Button */}
            <button
              onClick={onQuickStart}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              <Play className="w-3 h-3" />
              Start
            </button>
          </div>
        </div>

        {/* Manual Entry Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Manual Entry</h2>
          </div>

          <div className="space-y-3">
            {/* Selectors Row */}
            <div className="flex items-center gap-3">
              {/* Project Selector */}
              <div ref={manualProjectDropdown.ref} className="relative">
                <button
                  onClick={() => manualProjectDropdown.setIsOpen(!manualProjectDropdown.isOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {manualSelectedProject ? getProjectTitle(manualSelectedProject) : 'No Project'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {manualProjectDropdown.isOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10 max-h-48 overflow-y-auto">
                    <div
                      onClick={() => { setManualSelectedProject(null); manualProjectDropdown.setIsOpen(false) }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${!manualSelectedProject ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                    >
                      No Project
                    </div>
                    {projects.map(project => (
                      <div
                        key={project.id}
                        onClick={() => { setManualSelectedProject(project.id); manualProjectDropdown.setIsOpen(false) }}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 truncate ${manualSelectedProject === project.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                      >
                        {project.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Selector */}
              <div ref={manualTaskDropdown.ref} className="relative">
                <button
                  onClick={() => manualTaskDropdown.setIsOpen(!manualTaskDropdown.isOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {manualSelectedTask ? getTaskTitle(manualSelectedTask) : 'No Task'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {manualTaskDropdown.isOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10 max-h-48 overflow-y-auto">
                    <div
                      onClick={() => { setManualSelectedTask(null); manualTaskDropdown.setIsOpen(false) }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${!manualSelectedTask ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                    >
                      No Task
                    </div>
                    {tasks
                      .filter(task => (task.status === 'todo' || task.status === 'in_progress' || task.status === 'waiting'))
                      .filter(task => (!manualSelectedProject || task.project_id === manualSelectedProject))
                      .map(task => (
                      <div
                        key={task.id}
                        onClick={() => { setManualSelectedTask(task.id); manualTaskDropdown.setIsOpen(false) }}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 truncate ${manualSelectedTask === task.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Activity title"
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <input
                type="datetime-local"
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <input
                type="datetime-local"
                value={manualEnd}
                onChange={(e) => setManualEnd(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            <button
              onClick={onManualCreate}
              className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              <PlusCircle className="w-3 h-3" />
              Create Entry
            </button>
          </div>
        </div>

        {/* Recent Activities (grouped) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock3 className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Recent Activities</h2>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500 py-4 text-center">Loading activities...</div>
          ) : error ? (
            <div className="text-sm text-red-500 py-4 text-center">{error}</div>
          ) : (
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">No activities recorded yet</div>
              ) : (
                groupActivities(activities).map(group => (
                  <GroupedActivityCard
                    key={group.key}
                    group={group}
                    getTaskTitle={getTaskTitle}
                    getProjectTitle={getProjectTitle}
                    openEditModal={openEditModal}
                    openDeleteConfirm={openDeleteConfirm}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Activity</h3>

              <div className="space-y-4">
                {/* Selectors */}
                <div className="flex items-center gap-3">
                  <div ref={editTaskDropdown.ref} className="relative">
                    <button
                      onClick={() => editTaskDropdown.setIsOpen(!editTaskDropdown.isOpen)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {editSelectedTask ? getTaskTitle(editSelectedTask) : 'No Task'}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {editTaskDropdown.isOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-20 max-h-48 overflow-y-auto">
                        <div
                          onClick={() => { setEditSelectedTask(null); editTaskDropdown.setIsOpen(false) }}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${!editSelectedTask ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                        >
                          No Task
                        </div>
                        {tasks.map(task => (
                          <div
                            key={task.id}
                            onClick={() => { setEditSelectedTask(task.id); editTaskDropdown.setIsOpen(false) }}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 truncate ${editSelectedTask === task.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={editProjectDropdown.ref} className="relative">
                    <button
                      onClick={() => editProjectDropdown.setIsOpen(!editProjectDropdown.isOpen)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {editSelectedProject ? getProjectTitle(editSelectedProject) : 'No Project'}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {editProjectDropdown.isOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-20 max-h-48 overflow-y-auto">
                        <div
                          onClick={() => { setEditSelectedProject(null); editProjectDropdown.setIsOpen(false) }}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${!editSelectedProject ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                        >
                          No Project
                        </div>
                        {projects.map(project => (
                          <div
                            key={project.id}
                            onClick={() => { setEditSelectedProject(project.id); editProjectDropdown.setIsOpen(false) }}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 truncate ${editSelectedProject === project.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                          >
                            {project.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Activity title"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="datetime-local"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <input
                    type="datetime-local"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onEditSave}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Activity"
        message={activityToDelete ? `Are you sure you want to delete "${activityToDelete.title}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={onDeleteConfirm}
        onCancel={() => { setDeleteConfirmOpen(false); setActivityToDelete(null) }}
      />
    </div>
  )
}

export default ActivitiesPage
