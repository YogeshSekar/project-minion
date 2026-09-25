import React, { useState, useEffect, useRef } from 'react'
import { getCurrentDateTime } from './utils/helpers'
import useTimer from './hooks/useTimer'
import useTheme from './hooks/useTheme'
import useModalState from './hooks/useModalState'
import useTasks from './hooks/useTasks'
import useProjects from './hooks/useProjects'
import usePages from './hooks/usePages'
import useMeetings from './hooks/useMeetings'
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
import NotesPage from './pages/NotesPage'
import CreateNoteModal from './components/CreateNoteModal'
import AppsPage from './pages/AppsPage'
import ActivitiesPage from './pages/ActivitiesPage'
import { startNotificationScheduler } from './services/notificationService'
import { startBackupScheduler } from './services/backupService'
import './App.css'

function App() {
  const [activeItem, setActiveItem] = useState('home')
  const [pageToOpen, setPageToOpen] = useState(null)
  const [meetingToOpen, setMeetingToOpen] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pageTitle = {
    home: 'Home',
    tasks: 'My Task',
    notes: 'Pages',
    meetings: 'Meetings',
    activities: 'Analytics',
    projects: 'Projects',
    apps: 'Apps'
  }[activeItem] || 'Home'
  
  // Use hooks
  const { theme, setTheme, font, setFont, accent, setAccent } = useTheme()
  const {
    isSettingsOpen,
    openSettings,
    closeSettings,
    isTaskModalOpen,
    taskModalMode,
    selectedTaskForEdit,
    taskModalOptions,
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
  
  // Data hooks
  const { tasks, createTask, updateTask, deleteTask } = useTasks()
  const { projects, createProject, updateProject, deleteProject, upsertProject } = useProjects()
  const { pages: searchPages } = usePages()
  const { meetings: searchMeetings } = useMeetings()
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)
  const projectsPageRef = useRef(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  useEffect(() => startNotificationScheduler(), [])
  useEffect(() => startBackupScheduler(), [])

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
      
      if (timerDropdown && !timerDropdown.contains(event.target)) {
        setIsTimerOpen(false)
      }
      
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCloseTaskModal = () => {
    closeTaskModal()
    setTaskRefreshTrigger(prev => prev + 1)
  }

  const handleSaveTask = () => setTaskRefreshTrigger(prev => prev + 1)
  const handleSaveProject = project => {
    upsertProject(project)
    window.dispatchEvent(new CustomEvent('projects-change', { detail: project }))
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
            onOpenPage={page => { setPageToOpen(page); setActiveItem('notes') }}
            onOpenPages={() => setActiveItem('notes')}
            onOpenTasks={() => setActiveItem('tasks')}
            onOpenMeetings={meeting => { setMeetingToOpen(meeting?.entry_id ? meeting : null); setActiveItem('meetings') }}
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
            onOpenPage={page => { setPageToOpen(page); setActiveItem('notes') }}
            onOpenPages={() => { setPageToOpen(null); setActiveItem('notes') }}
          />
        )
      case 'meetings':
        return <MeetingsPage meetingToOpen={meetingToOpen} onMeetingOpened={() => setMeetingToOpen(null)} onOpenPage={page => { setPageToOpen(page); setActiveItem('notes') }} runningActivity={runningActivity} onActivityStarted={(activity, task) => { syncActivityStarted(activity, task); setIsTimerOpen(false) }} onActivityStopped={syncActivityStopped} />
      case 'notes':
        return <NotesPage pageToOpen={pageToOpen} onPageOpened={() => setPageToOpen(null)} openTaskModal={openTaskModal} taskRefreshTrigger={taskRefreshTrigger} />
      case 'activities':
        return <ActivitiesPage runningActivity={runningActivity} onActivityStarted={syncActivityStarted} onActivityStopped={syncActivityStopped} />
      case 'apps':
        return <AppsPage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-gray-800">
      {/* Unified Header - Fixed */}
      <UnifiedHeader
        pageTitle={pageTitle}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
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
        searchTasks={tasks}
        searchPages={searchPages}
        searchMeetings={searchMeetings}
        projects={projects}
        onOpenSearchTask={task => {
          setActiveItem('tasks')
          openTaskModal(task, 'edit')
        }}
        onOpenSearchPage={page => {
          setPageToOpen(page)
          setActiveItem('notes')
        }}
        onOpenSearchProject={project => {
          setActiveItem('projects')
          openProjectModal(project, 'edit')
        }}
        onOpenSearchMeeting={meeting => {
          setMeetingToOpen({
            ...meeting,
            entry_id: meeting.outlook_id || undefined,
            subject: meeting.title,
            start: `${meeting.date}T${meeting.start_time || '00:00:00'}`
          })
          setActiveItem('meetings')
        }}
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
          onSettingsClick={openSettings}
        />

        {/* Main Content - Scrollable */}
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
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
        accent={accent}
        setAccent={setAccent}
      />
      
      {/* 📝 Task Side Panel (Create/Edit) */}
      <TaskSidePanel
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        task={selectedTaskForEdit}
        initialOpenPages={Boolean(taskModalOptions.openPages)}
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

    </div>
  )
}

export default App
