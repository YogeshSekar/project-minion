import { useState } from 'react'

function useModalState() {
  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Task modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskModalMode, setTaskModalMode] = useState('create') // 'create' or 'edit'
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null)

  // Note modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)

  // Project modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [projectModalMode, setProjectModalMode] = useState('create')
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null)

  // Settings modal functions
  const openSettings = () => setIsSettingsOpen(true)
  const closeSettings = () => setIsSettingsOpen(false)

  // Task modal functions
  const openTaskModal = (task = null, mode = 'create') => {
    setSelectedTaskForEdit(task)
    setTaskModalMode(mode)
    setIsTaskModalOpen(true)
  }

  const closeTaskModal = () => {
    setIsTaskModalOpen(false)
    setSelectedTaskForEdit(null)
    setTaskModalMode('create')
  }

  // Note modal functions
  const openNoteModal = () => setIsNoteModalOpen(true)
  const closeNoteModal = () => setIsNoteModalOpen(false)

  // Project modal functions
  const openProjectModal = (project = null, mode = 'create') => {
    setSelectedProjectForEdit(project)
    setProjectModalMode(mode)
    setIsProjectModalOpen(true)
  }

  const closeProjectModal = () => {
    setIsProjectModalOpen(false)
    setSelectedProjectForEdit(null)
    setProjectModalMode('create')
  }

  return {
    // Settings
    isSettingsOpen,
    openSettings,
    closeSettings,

    // Task
    isTaskModalOpen,
    taskModalMode,
    selectedTaskForEdit,
    openTaskModal,
    closeTaskModal,

    // Note
    isNoteModalOpen,
    openNoteModal,
    closeNoteModal,

    // Project
    isProjectModalOpen,
    projectModalMode,
    selectedProjectForEdit,
    openProjectModal,
    closeProjectModal
  }
}

export default useModalState
