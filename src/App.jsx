import React, { useState, useEffect, useRef } from 'react'
import { getCurrentDateTime } from './utils/helpers'
import useTimer from './hooks/useTimer'
import useTheme from './hooks/useTheme'
import useModalState from './hooks/useModalState'
import useTasks from './hooks/useTasks'
import useProjects from './hooks/useProjects'
import Sidebar from './components/Sidebar'
import UnifiedHeader from './components/UnifiedHeader'
import SettingsModal from './components/SettingsModal'
import TaskSidePanel from './components/TaskSidePanel'
import CreateProjectModal from './components/CreateProjectModal'
import EditProjectModal from './components/EditProjectModal'
import HomePage from './pages/HomePage'
import TasksPage from './pages/TasksPage'
import ProjectsPage from './pages/ProjectsPage'
import MeetingsPage from './pages/MeetingsPage'
import MeetingView from './components/MeetingView'
import NotesPage from './pages/NotesPage'
import CreateNoteModal from './components/CreateNoteModal'
import QuickAddTask from './components/QuickAddTask'
import HabitsPage from './pages/HabitsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AppsPage from './pages/AppsPage'
import ActivitiesPage from './pages/ActivitiesPage'
import './App.css'

function App() {
  const [activeItem, setActiveItem] = useState('home')
  const [currentView, setCurrentView] = useState('main') // 'main' or 'meeting-view'
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Use hooks
  const { theme, setTheme, font, setFont } = useTheme()
  const {
    isSettingsOpen,
    openSettings,
    closeSettings,
    isTaskModalOpen,
    taskModalMode,
    selectedTaskForEdit,
    openTaskModal,
    closeTaskModal,
    isNoteModalOpen,
    openNoteModal,
    closeNoteModal,
    isProjectModalOpen,
    projectModalMode,
    selectedProjectForEdit,
    openProjectModal,
    closeProjectModal
  } = useModalState()
  
  // Use timer hook for task tracking
  const {
    elapsedTime,
    isTimerRunning,
    trackedTask,
    setTrackedTask,
    runningActivity,
    isTimerOpen,
    setIsTimerOpen,
    showTaskSelector,
    setShowTaskSelector,
    startTimer,
    pauseTimer,
    resetTimer,
    formatTime,
    syncActivityStarted,
    syncActivityStopped
  } = useTimer()
  
  // New button dropdown state
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false)
  const [dropdownTimeout, setDropdownTimeout] = useState(null)
  
  // Data hooks
  const { tasks, createTask, updateTask, deleteTask } = useTasks()
  const { projects, createProject, updateProject, deleteProject } = useProjects()
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)
  const projectsPageRef = useRef(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Quick Add Task state
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false)

  // Filter tasks due today
  const todayTasks = tasks.filter(task => {
    if (!task.occurrence_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const occurrenceDate = new Date(task.occurrence_date)
    occurrenceDate.setHours(0, 0, 0, 0)
    return occurrenceDate.getTime() === today.getTime()
  })

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const timerDropdown = document.getElementById('timer-dropdown')
      const newDropdown = document.getElementById('new-dropdown')
      
      if (timerDropdown && !timerDropdown.contains(event.target)) {
        setIsTimerOpen(false)
      }
      
      if (newDropdown && !newDropdown.contains(event.target)) {
        setIsNewDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleNewAction = (action) => {
    setIsNewDropdownOpen(false)
    const page = action || activeItem
    if (page === 'task' || page === 'tasks') openTaskModal()
    else if (page === 'note' || page === 'notes') openNoteModal()
    else if (page === 'project' || page === 'projects') openProjectModal()
  }

  const handleCloseTaskModal = () => {
    closeTaskModal()
    setTaskRefreshTrigger(prev => prev + 1)
  }

  const handleSaveTask = () => setTaskRefreshTrigger(prev => prev + 1)
  const handleSaveProject = () => {}

  const navigateToMeeting = (meeting) => {
    setSelectedMeeting(meeting)
    setCurrentView('meeting-view')
  }

  const exitMeetingView = () => {
    setSelectedMeeting(null)
    setCurrentView('main')
    setActiveItem('meetings')
  }

  const renderContent = () => {
    const homeStats = {
      tasksCompleted: 3,
      totalTasks: 8,
      meetingsToday: 2,
      totalMeetings: 4,
      projectsActive: 3,
      totalProjects: 5,
      timeTracked: '4h 30m'
    }

    // Handle meeting view
    if (currentView === 'meeting-view') {
      return <MeetingView meeting={selectedMeeting} onClose={exitMeetingView} />
    }

    // Regular page content
    switch (activeItem) {
      case 'home':
        return (
          <HomePage
            stats={homeStats}
            openTaskModal={openTaskModal}
            taskRefreshTrigger={taskRefreshTrigger}
            triggerTaskRefresh={() => setTaskRefreshTrigger(prev => prev + 1)}
            onActivityStarted={(activity, task) => {
              syncActivityStarted(activity, task)
              setIsTimerOpen(false)
            }}
            onActivityStopped={syncActivityStopped}
            runningActivity={runningActivity}
          />
        )
      case 'tasks':
        return (
          <TasksPage
            taskRefreshTrigger={taskRefreshTrigger}
            openTaskModal={openTaskModal}
            onActivityStarted={(activity, task) => {
              syncActivityStarted(activity, task)
              setIsTimerOpen(false)
            }}
            onActivityStopped={syncActivityStopped}
            runningActivity={runningActivity}
          />
        )
      case 'projects':
        return (
          <ProjectsPage
            onActivityStarted={(activity, task) => {
              syncActivityStarted(activity, task)
              setIsTimerOpen(false)
            }}
            onActivityStopped={syncActivityStopped}
            runningActivity={runningActivity}
          />
        )
      case 'meetings':
        return <MeetingsPage openMeetingView={navigateToMeeting} />
      case 'notes':
        return <NotesPage />
      case 'activities':
        return <ActivitiesPage />
      case 'habits':
        return <HabitsPage />
      case 'analytics':
        return <AnalyticsPage />
      case 'apps':
        return <AppsPage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-800">
      {/* Unified Header - Fixed */}
      <UnifiedHeader
        activeItem={activeItem}
        onNewAction={handleNewAction}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isNewDropdownOpen={isNewDropdownOpen}
        setIsNewDropdownOpen={setIsNewDropdownOpen}
        dropdownTimeout={dropdownTimeout}
        setDropdownTimeout={setDropdownTimeout}
        isTimerOpen={isTimerOpen}
        setIsTimerOpen={setIsTimerOpen}
        elapsedTime={elapsedTime}
        isTimerRunning={isTimerRunning}
        trackedTask={trackedTask}
        setTrackedTask={setTrackedTask}
        showTaskSelector={showTaskSelector}
        setShowTaskSelector={setShowTaskSelector}
        todayTasks={todayTasks}
        startTimer={startTimer}
        pauseTimer={pauseTimer}
        resetTimer={resetTimer}
        formatTime={formatTime}
        getCurrentDateTime={getCurrentDateTime}
        onSettingsClick={openSettings}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed */}
        <Sidebar
          activeItem={activeItem}
          onItemSelect={setActiveItem}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onAddTask={openTaskModal}
          onAddProject={openProjectModal}
        />

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* 🔧 Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        theme={theme}
        setTheme={setTheme}
        font={font}
        setFont={setFont}
      />
      
      {/* 📝 Task Side Panel (Create/Edit) */}
      <TaskSidePanel
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        task={selectedTaskForEdit}
        onSave={handleSaveTask}
        onUpdateTask={updateTask}
        onCreateTask={createTask}
        mode={taskModalMode}
        projects={projects}
        onDelete={async (taskId) => {
          await deleteTask(taskId)
          // Trigger refresh for TasksPage
          setTaskRefreshTrigger(prev => prev + 1)
        }}
      />

      {/* 📁 Create Project Modal */}
      <CreateProjectModal
        isOpen={isProjectModalOpen && projectModalMode === 'create'}
        onClose={closeProjectModal}
        onSave={handleSaveProject}
      />
      
      {/* ✏️ Edit Project Modal */}
      <EditProjectModal
        isOpen={isProjectModalOpen && projectModalMode === 'edit'}
        onClose={closeProjectModal}
        project={selectedProjectForEdit}
        onSave={handleSaveProject}
        onDelete={async (projectId) => {
          await deleteProject(projectId)
        }}
      />

      {/* 📝 Create Note Modal */}
      <CreateNoteModal
        isOpen={isNoteModalOpen}
        onClose={closeNoteModal}
        onNoteCreated={() => {
          // Optional: Refresh notes list if on notes page
          // or show a success notification
        }}
      />

      {/* ⚡ Quick Add Task - Available everywhere */}
      <QuickAddTask
        onCreateTask={createTask}
        isExpanded={isQuickAddExpanded}
        setIsExpanded={setIsQuickAddExpanded}
        onTaskCreated={() => setTaskRefreshTrigger(prev => prev + 1)}
      />
    </div>
  )
}

export default App