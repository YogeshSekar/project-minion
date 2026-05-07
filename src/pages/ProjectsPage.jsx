import { useState, useEffect } from 'react'
import { Plus, Edit2, Calendar, Flag, Trash2, CheckSquare, Circle, Star } from 'lucide-react'
import ProjectModal from '../components/ProjectModal'
import ConfirmModal from '../components/ConfirmModal'
import TaskSidePanel from '../components/TaskSidePanel'
import CreateNoteModal from '../components/CreateNoteModal'
import TaskCard from '../components/TaskCard'
import GroupedCompletedTaskCard from '../components/GroupedCompletedTaskCard'
import useProjects from '../hooks/useProjects'
import useTasks from '../hooks/useTasks'
import useNotes from '../hooks/useNotes'
import { startActivity, stopCurrentActivity } from '../services/activityService'
import { getRunningActivity } from '../services/api'
import { formatDate, getStatusColor, getPriorityColor, formatStatusLabel, isOverdue } from '../utils/helpers'
import { groupCompletedTasks } from '../utils/taskGrouping'

function ProjectsPage({ runningActivity: propRunningActivity, onActivityStarted, onActivityStopped }) {
  const [showActive, setShowActive] = useState(true)
  const [showCompleted, setShowCompleted] = useState(true)
  const [showOnHold, setShowOnHold] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [projectForEdit, setProjectForEdit] = useState(null)
  const [projectTasks, setProjectTasks] = useState([])
  const [projectNotes, setProjectNotes] = useState('')
  const [taskFilter, setTaskFilter] = useState('todo')
  const [isTaskSidePanelOpen, setIsTaskSidePanelOpen] = useState(false)
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [noteForEdit, setNoteForEdit] = useState(null)
  const [localRunningActivity, setLocalRunningActivity] = useState(null)
  
  // Use hooks for data management
  const { projects, loading: projectsLoading, updateProject, deleteProject } = useProjects()
  const { tasks, createTask, updateTask, deleteTask, loadTasks } = useTasks()
  const { notes, deleteNote } = useNotes()
  
  // Use running activity from props if provided, otherwise track locally
  const runningActivity = propRunningActivity !== undefined ? propRunningActivity : localRunningActivity
  
  // Load running activity on mount (only if not provided via props)
  useEffect(() => {
    if (propRunningActivity === undefined) {
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
      loadRunningActivity()
    }
  }, [])

  // Confirm modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'confirm',
    onConfirm: () => {},
    onCancel: () => {}
  })

  // Load project tasks when project is selected
  useEffect(() => {
    if (selectedProject) {
      const filteredTasks = tasks.filter(task => task.project_id === selectedProject.id)
      setProjectTasks(filteredTasks)
      // Load notes from localStorage
      const savedNotes = localStorage.getItem(`project_notes_${selectedProject.id}`)
      setProjectNotes(savedNotes || '')
    }
  }, [selectedProject, tasks])

  // Group completed tasks for recurring tasks
  const { oneTimeTasks, groupedRecurring } = groupCompletedTasks(
    projectTasks.filter(t => t.status === 'completed')
  )

  const handleCreateProject = () => {
    setModalMode('create')
    setProjectForEdit(null)
    setIsModalOpen(true)
  }

  const handleEditProject = () => {
    if (!selectedProject) return
    setModalMode('edit')
    setProjectForEdit(selectedProject)
    setIsModalOpen(true)
  }

  const showConfirm = (config) => {
    setConfirmModalConfig({
      ...config,
      onConfirm: () => {
        config.onConfirm()
        setConfirmModalOpen(false)
      },
      onCancel: () => {
        if (config.onCancel) config.onCancel()
        setConfirmModalOpen(false)
      }
    })
    setConfirmModalOpen(true)
  }

  const handleDeleteProject = () => {
    if (!selectedProject) return
    showConfirm({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${selectedProject.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        const response = await deleteProject(selectedProject.id)
        if (response.success) {
          setSelectedProject(null)
        }
      }
    })
  }

  const handleSaveProject = async () => {
    // Hook auto-reloads, nothing to do
  }

  const handleCompleteProject = () => {
    if (!selectedProject) return
    if (selectedProject.status === 'completed') {
      showConfirm({
        title: 'Already Completed',
        message: 'This project is already marked as completed.',
        confirmText: 'OK',
        cancelText: null,
        type: 'success',
        onConfirm: () => {}
      })
      return
    }
    showConfirm({
      title: 'Complete Project',
      message: `Mark "${selectedProject.title}" as complete?`,
      confirmText: 'Mark Complete',
      cancelText: 'Cancel',
      type: 'success',
      onConfirm: async () => {
        const response = await updateProject({
          ...selectedProject,
          status: 'completed'
        })
        if (response.success) {
          setSelectedProject(response.data)
        }
      }
    })
  }

  const handleReactivateProject = () => {
    if (!selectedProject) return
    if (selectedProject.status === 'active') {
      showConfirm({
        title: 'Already Active',
        message: 'This project is already active.',
        confirmText: 'OK',
        cancelText: null,
        type: 'confirm',
        onConfirm: () => {}
      })
      return
    }
    showConfirm({
      title: 'Reactivate Project',
      message: `Reactivate "${selectedProject.title}"?`,
      confirmText: 'Reactivate',
      cancelText: 'Cancel',
      type: 'confirm',
      onConfirm: async () => {
        const response = await updateProject({
          ...selectedProject,
          status: 'active'
        })
        if (response.success) {
          setSelectedProject(response.data)
        }
      }
    })
  }


  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning' || p.status === 'in_progress')
  const completedProjects = projects.filter(p => p.status === 'completed')
  const onHoldProjects = projects.filter(p => p.status === 'on_hold')
  const visibleProjects = [
    ...(showActive ? activeProjects : []),
    ...(showOnHold ? onHoldProjects : []),
    ...(showCompleted ? completedProjects : [])
  ]

  if (projectsLoading) {
    return (
      <div className="h-full bg-[#faf9f7] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span>Loading projects...</span>
        </div>
      </div>
    )
  }

  const handleSelectProject = (project) => {
    setSelectedProject(project)
    setEditForm({
      ...project,
      start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''
    })
  }

  const handleCloseDetails = () => {
    setSelectedProject(null)
    setEditForm(null)
  }

  const handleSaveEdit = async () => {
    if (!editForm) return
    const response = await updateProject(editForm)
    if (response.success) {
      setSelectedProject(editForm)
    }
  }

  const handleUpdateProject = async (updatedProject) => {
    const response = await updateProject(updatedProject)
    if (!response.success) {
      console.error('Error updating project:', response.error)
    }
  }

  const handleDeleteProjectFromCard = async (projectId) => {
    const response = await deleteProject(projectId)
    if (response.success) {
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
        setEditForm(null)
      }
    }
  }

  const handleEditProjectFromCard = (project) => {
    setModalMode('edit')
    setProjectForEdit(project)
    setIsModalOpen(true)
  }

  const handleSaveNotes = () => {
    if (selectedProject) {
      localStorage.setItem(`project_notes_${selectedProject.id}`, projectNotes)
    }
  }

  // Task handlers
  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    const response = await updateTask({
      ...task,
      status: newStatus
    })
    if (!response.success) {
      console.error('Error updating task:', response.error)
    }
  }

  const handleStartTaskActivity = async (task) => {
    try {
      const response = await startActivity({
        title: task.title,
        activity_type: 'focus_session',
        source: 'manual',
        reference_type: 'task',
        reference_id: task.task_id,
        project_id: task.project_id
      })
      if (response.success) {
        if (propRunningActivity === undefined) {
          await loadRunningActivity()
        }
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
        if (propRunningActivity === undefined) {
          setLocalRunningActivity(null)
        }
        if (onActivityStopped) {
          onActivityStopped()
        }
      }
    } catch (error) {
      console.error('Error stopping task activity:', error)
    }
  }

  const handleTaskUpdate = async (updatedTask) => {
    const response = await updateTask(updatedTask)
    if (!response.success) {
      console.error('Error updating task:', response.error)
    }
  }

  const handleTaskDelete = async (taskId) => {
    const response = await deleteTask(taskId)
    if (!response.success) {
      console.error('Error deleting task:', response.error)
    }
  }

  const handleTaskEdit = (task) => {
    setSelectedTaskForEdit(task)
    setIsTaskSidePanelOpen(true)
  }

  const handleTaskSidePanelClose = () => {
    setIsTaskSidePanelOpen(false)
    setSelectedTaskForEdit(null)
  }

  const handleTaskSidePanelSave = async (updatedTask) => {
    handleTaskSidePanelClose()
  }

  const handleTaskDeleteFromSidePanel = async (taskId) => {
    await handleTaskDelete(taskId)
    handleTaskSidePanelClose()
  }

  const handleNoteEdit = (note) => {
    setNoteForEdit(note)
    setIsNoteModalOpen(true)
  }

  const handleNoteDelete = async (noteId) => {
    const response = await deleteNote(noteId)
    if (!response.success) {
      console.error('Error deleting note:', response.error)
    }
  }

  const handleNoteModalClose = () => {
    setIsNoteModalOpen(false)
    setNoteForEdit(null)
  }

  const handleNoteSaved = () => {
    handleNoteModalClose()
  }

  
  return (
    <div className="h-full bg-gray-60 flex gap-4 p-4">
      {/* Left: Project List */}
      <div className="w-96 flex flex-col overflow-hidden relative">
        <div className="h-full flex flex-col">
          {/* Project List */}
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <div className="w-full h-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="bg-white p-4 border-b border-gray-200">
                  <button
                    onClick={handleCreateProject}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Project</span>
                  </button>
                </div>
                <div className="p-4">
                  {visibleProjects.length > 0 ? (
                    visibleProjects.map(project => (
                      <div
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        className={`
                          p-3 bg-white rounded-2xl border border-gray-100
                          hover:border-gray-300 cursor-pointer transition-all duration-200 group mb-2
                          ${selectedProject?.id === project.id 
                            ? 'border-gray-900 bg-gray-100 ring-1 ring-gray-900/20' 
                            : 'hover:bg-gray-50'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="flex-1 text-sm font-medium text-gray-900 truncate">
                            {project.title}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getStatusColor(project.status)}`}>
                            {formatStatusLabel(project.status)}
                          </span>
                        </div>
                        <div className="flex items-center justify-start mt-1">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{project.deadline ? formatDate(project.deadline) : 'No deadline'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Circle className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          No projects to display
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Project Details + Tasks */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedProject ? (
          <div className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors">
                  <Star className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditProject}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Project"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Details Section - Fixed Height */}
            <div className="flex-none border-b border-gray-200">
              {/* Project Title */}
              <div className="px-6 py-5">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedProject.title}
                </h2>
              </div>

              {/* Properties List */}
              <div className="px-6 pb-4 space-y-4">
                {/* Status */}
                <div className="flex items-center">
                  <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                    <Circle className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                  <span className={`px-3 py-1 rounded-2xl text-sm font-medium border ${getStatusColor(selectedProject.status)}`}>
                    {formatStatusLabel(selectedProject.status)}
                  </span>
                </div>
                {/* Priority */}
                <div className="flex items-center">
                  <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                    <Flag className="w-4 h-4" />
                    <span>Priority</span>
                  </div>
                  <span className={`px-3 py-1 rounded-2xl text-sm font-medium border ${getPriorityColor(selectedProject.priority)}`}>
                    {formatStatusLabel(selectedProject.priority)}
                  </span>
                </div>
                {/* Deadline */}
                <div className="flex items-center">
                  <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Deadline</span>
                  </div>
                  <span className="px-3 py-1 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium">
                    {selectedProject.deadline ? formatDate(selectedProject.deadline) : 'Not set'}
                  </span>
                </div>
                {/* Description */}
                <div className="flex items-start">
                  <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                    <Edit2 className="w-4 h-4" />
                    <span>Description</span>
                  </div>
                  <span className="text-sm text-gray-700 flex-1">
                    {selectedProject.description || 'No description'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tasks Section - Scrollable */}
            <div className="flex-1 overflow-auto">
              <div className="px-6 py-4">
                {/* Task Filter Tabs */}
                <div className="flex border-b border-gray-200 mb-4">
                  {['todo', 'in_progress', 'completed'].map((filter) => {
                    let count
                    if (filter === 'completed') {
                      count = oneTimeTasks.length + groupedRecurring.length
                    } else {
                      count = projectTasks.filter(t => t.status === filter).length
                    }
                    const label = filter === 'todo' ? 'Todo' :
                                  filter === 'in_progress' ? 'In Progress' : 'Completed'
                    return (
                      <button
                        key={filter}
                        onClick={() => setTaskFilter(filter)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          taskFilter === filter
                            ? 'text-gray-900 border-b-2 border-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {label} ({count})
                      </button>
                    )
                  })}
                </div>

                {/* Filtered Tasks */}
                {(() => {
                  if (taskFilter === 'completed') {
                    // Show grouped recurring and one-time completed tasks
                    const hasCompleted = oneTimeTasks.length > 0 || groupedRecurring.length > 0
                    return !hasCompleted ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckSquare className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No tasks in this category</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* One-time completed tasks */}
                        {oneTimeTasks.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {oneTimeTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                projects={projects}
                                onToggleComplete={handleToggleComplete}
                                onEdit={handleTaskEdit}
                                onDelete={handleTaskDelete}
                                onStartActivity={handleStartTaskActivity}
                                onStopActivity={handleStopTaskActivity}
                                runningActivity={runningActivity}
                              />
                            ))}
                          </div>
                        )}
                        {/* Grouped recurring completed tasks */}
                        {groupedRecurring.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groupedRecurring.map((group) => (
                              <GroupedCompletedTaskCard
                                key={group.task_id}
                                group={group}
                                projects={projects}
                                onEdit={handleTaskEdit}
                                onDelete={handleTaskDelete}
                                onToggleComplete={handleToggleComplete}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  } else {
                    // Show todo or in-progress tasks normally
                    const filteredTasks = projectTasks.filter(t => t.status === taskFilter)
                    return filteredTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckSquare className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No tasks in this category</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleTaskEdit}
                            onDelete={handleTaskDelete}
                            onStartActivity={handleStartTaskActivity}
                            onStopActivity={handleStopTaskActivity}
                            runningActivity={runningActivity}
                          />
                        ))}
                      </div>
                    )
                  }
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center">
            <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              <p className="text-lg font-medium mb-2 text-gray-900">No project selected</p>
              <p className="text-sm">Select a project from the list to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Notes List */}
      <div className="w-96 flex flex-col overflow-hidden">
        <div className="h-full bg-white rounded-2xl border border-gray-200 flex flex-col p-4 gap-4 overflow-hidden">
          {/* Notes List */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notes</div>
            <div className="flex-1 overflow-auto">
              {selectedProject ? (
                <div className="space-y-2">
                  {notes.filter(note => note.project_id === selectedProject.id).length > 0 ? (
                    notes.filter(note => note.project_id === selectedProject.id).map(note => (
                      <div
                        key={note.id}
                        className="p-3 bg-white rounded-2xl border border-gray-100 hover:border-gray-300 cursor-pointer transition-all duration-200 group relative"
                      >
                        <h4 className="text-sm font-medium text-gray-900 truncate pr-16">
                          {note.title}
                        </h4>
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditNote(note)
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNote(note.id)
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Edit2 className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No notes for this project</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Edit2 className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Select a project to view notes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Modal - Create/Edit */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={projectForEdit}
        mode={modalMode}
        onSave={handleSaveProject}
        onDelete={modalMode === 'edit' ? handleDeleteProjectFromCard : null}
      />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        type={confirmModalConfig.type}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={confirmModalConfig.onCancel}
      />

      {/* Task Side Panel */}
      <TaskSidePanel
        isOpen={isTaskSidePanelOpen}
        onClose={handleTaskSidePanelClose}
        task={selectedTaskForEdit}
        onSave={handleTaskSidePanelSave}
        onUpdateTask={updateTask}
        onCreateTask={createTask}
        mode="edit"
        projects={projects}
        onDelete={handleTaskDeleteFromSidePanel}
      />

      {/* Note Modal */}
      <CreateNoteModal
        isOpen={isNoteModalOpen}
        onClose={handleNoteModalClose}
        onNoteCreated={handleNoteSaved}
        note={noteForEdit}
      />
    </div>
  )
}

export default ProjectsPage
