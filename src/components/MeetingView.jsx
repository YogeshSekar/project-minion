import { useState, useEffect } from 'react'

function MeetingView({ meeting, onClose }) {
  const [isJoined, setIsJoined] = useState(true)
  const [activeTab, setActiveTab] = useState('notes') // 'notes' or 'tasks'
  const [notes, setNotes] = useState([])
  const [tasks, setTasks] = useState([])
  const [newNote, setNewNote] = useState('')
  const [newTask, setNewTask] = useState('')

  // Sample existing notes
  const existingNotes = [
    {
      id: 1,
      content: "Discussed progress on current sprint. John completed authentication module.",
      timestamp: "2024-03-27T09:15:00",
      author: "Sarah"
    },
    {
      id: 2,
      content: "Mike reported blocker in API integration. Emma will help resolve.",
      timestamp: "2024-03-27T09:20:00",
      author: "Mike"
    }
  ]

  // Sample existing tasks
  const existingTasks = [
    {
      id: 1,
      title: "Fix API integration issue",
      assignedTo: "Emma",
      priority: "high",
      status: "in-progress",
      dueDate: "2024-03-28"
    },
    {
      id: 2,
      title: "Complete authentication module testing",
      assignedTo: "John",
      priority: "medium",
      status: "pending",
      dueDate: "2024-03-29"
    }
  ]

  // Initialize with existing data
  useEffect(() => {
    setNotes(existingNotes)
    setTasks(existingTasks)
  }, [])

  // Note: isJoined is always true - auto join on enter


  const handleAddNote = () => {
    if (newNote.trim()) {
      const note = {
        id: notes.length + 1,
        content: newNote,
        timestamp: new Date().toISOString(),
        author: "Current User"
      }
      setNotes([...notes, note])
      setNewNote('')
    }
  }

  const handleAddTask = () => {
    if (newTask.trim()) {
      const task = {
        id: tasks.length + 1,
        title: newTask,
        assignedTo: "Unassigned",
        priority: "medium",
        status: "pending",
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }
      setTasks([...tasks, task])
      setNewTask('')
    }
  }

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(tasks.map(task =>
      task.occurrence_id === taskId ? { ...task, status: newStatus } : task
    ))
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/30 text-todoist-priority-1 dark:text-red-400 border-red-200 dark:border-red-700'
      case 'medium':
        return 'bg-orange-50 dark:bg-orange-900/30 text-todoist-priority-2 dark:text-orange-400 border-orange-200 dark:border-orange-700'
      case 'low':
        return 'bg-blue-50 dark:bg-blue-900/30 text-todoist-priority-3 dark:text-blue-400 border-blue-200 dark:border-blue-700'
      default:
        return 'bg-todoist-sidebar-bg dark:bg-gray-800 text-todoist-text-secondary dark:text-gray-400 border-todoist-border dark:border-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-50 dark:bg-blue-900/30 text-todoist-priority-3 dark:text-blue-400'
      case 'in-progress':
        return 'bg-orange-50 dark:bg-orange-900/30 text-todoist-priority-2 dark:text-orange-400'
      case 'pending':
        return 'bg-todoist-sidebar-bg dark:bg-gray-800 text-todoist-text-secondary dark:text-gray-400'
      default:
        return 'bg-todoist-sidebar-bg dark:bg-gray-800 text-todoist-text-secondary dark:text-gray-400'
    }
  }

  return (
    <div className="h-full bg-todoist-sidebar-bg dark:bg-gray-950 p-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-6 border border-todoist-border dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-todoist-red hover:text-todoist-red-hover transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Meetings
          </button>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-todoist-red-light dark:bg-red-900/30 text-todoist-red dark:text-red-400 rounded-full text-sm font-medium border border-todoist-red dark:border-red-700">
              In Meeting
            </span>
          </div>
        </div>

        {/* Meeting Info */}
        {meeting && (
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-todoist-text-primary dark:text-white mb-2">{meeting.title}</h1>
              <p className="text-todoist-text-secondary dark:text-gray-400 mb-4">{meeting.description}</p>
              <div className="flex items-center gap-4 text-sm text-todoist-text-secondary dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {meeting.startTime} - {meeting.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-1.414.586l-2.829-2.828a1 1 0 010-1.414l2.829-2.829a1 1 0 011.414-1.414l4.243-4.242a1 1 0 011.414 0l4.242 4.242a1 1 0 001.414 1.414l-2.828 2.829a1 1 0 01-1.414 1.414l-2.829 2.828z" />
                  </svg>
                  {meeting.location}
                </span>
                {meeting.project && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="px-2 py-1 bg-todoist-red-light dark:bg-red-900/30 text-todoist-red dark:text-red-400 rounded-full text-xs font-medium border border-todoist-red dark:border-red-700">
                      {meeting.project.name}
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {meeting.attendees?.length || 0} attendees
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {meeting.isRecurring && (
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-todoist-priority-3 dark:text-blue-400 rounded-full text-sm border border-blue-200 dark:border-blue-700">
                  Recurring
                </span>
              )}
              <span className={`px-3 py-1 rounded-full border text-sm ${getPriorityColor(meeting.priority)}`}>
                {meeting.priority}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Always show since auto-joined */}
      <>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Notes Section - takes 3 columns */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border border-todoist-border dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-todoist-text-primary dark:text-white">Meeting Notes</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    activeTab === 'notes'
                      ? 'bg-todoist-red-light dark:bg-red-900/30 text-todoist-red dark:text-red-400 border border-todoist-red dark:border-red-700'
                      : 'bg-todoist-sidebar-bg dark:bg-gray-800 text-todoist-text-secondary dark:text-gray-400 hover:bg-todoist-sidebar-hover dark:hover:bg-gray-700'
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    activeTab === 'tasks'
                      ? 'bg-todoist-red-light dark:bg-red-900/30 text-todoist-red dark:text-red-400 border border-todoist-red dark:border-red-700'
                      : 'bg-todoist-sidebar-bg dark:bg-gray-800 text-todoist-text-secondary dark:text-gray-400 hover:bg-todoist-sidebar-hover dark:hover:bg-gray-700'
                  }`}
                >
                  Tasks
                </button>
              </div>
            </div>

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Add Note */}
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 p-3 bg-todoist-sidebar-bg dark:bg-gray-800 border border-todoist-border dark:border-gray-700 rounded-lg text-todoist-text-primary dark:text-white resize-none focus:ring-2 focus:ring-todoist-red focus:border-transparent"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-todoist-red hover:bg-todoist-red-hover text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notes.map(note => (
                    <div key={note.id} className="p-3 bg-todoist-sidebar-bg dark:bg-gray-800 rounded-lg border border-todoist-border dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-todoist-text-primary dark:text-white">{note.author}</span>
                        <span className="text-xs text-todoist-text-secondary dark:text-gray-400">
                          {new Date(note.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-todoist-text-secondary dark:text-gray-300">{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-center text-todoist-text-secondary dark:text-gray-400 py-8">No notes yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                {/* Add Task */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a task..."
                    className="flex-1 px-3 py-2 bg-todoist-sidebar-bg dark:bg-gray-800 border border-todoist-border dark:border-gray-700 rounded-lg text-todoist-text-primary dark:text-white focus:ring-2 focus:ring-todoist-red focus:border-transparent"
                  />
                  <button
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-todoist-red hover:bg-todoist-red-hover text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Tasks List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tasks.map(task => (
                    <div key={task.occurrence_id} className="p-3 bg-todoist-sidebar-bg dark:bg-gray-800 rounded-lg border border-todoist-border dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-todoist-text-primary dark:text-white">{task.title}</h4>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.occurrence_id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-todoist-text-secondary dark:text-gray-400">
                        <span>Assigned to: {task.assignedTo}</span>
                        <span className={`px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span>Due: {task.dueDate}</span>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-center text-todoist-text-secondary dark:text-gray-400 py-8">No tasks yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions - takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border border-todoist-border dark:border-gray-800">
              <h2 className="text-lg font-semibold text-todoist-text-primary dark:text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-todoist-sidebar-bg dark:bg-gray-800 text-todoist-text-primary dark:text-white rounded-lg hover:bg-todoist-sidebar-hover dark:hover:bg-gray-700 transition-colors text-left border border-todoist-border dark:border-gray-700">
                  📤 Share Meeting Notes
                </button>
                <button className="w-full px-4 py-2 bg-todoist-sidebar-bg dark:bg-gray-800 text-todoist-text-primary dark:text-white rounded-lg hover:bg-todoist-sidebar-hover dark:hover:bg-gray-700 transition-colors text-left border border-todoist-border dark:border-gray-700">
                  📅 Schedule Follow-up
                </button>
                <button className="w-full px-4 py-2 bg-todoist-sidebar-bg dark:bg-gray-800 text-todoist-text-primary dark:text-white rounded-lg hover:bg-todoist-sidebar-hover dark:hover:bg-gray-700 transition-colors text-left border border-todoist-border dark:border-gray-700">
                  📊 Export Summary
                </button>
                <button className="w-full px-4 py-2 bg-todoist-sidebar-bg dark:bg-gray-800 text-todoist-text-primary dark:text-white rounded-lg hover:bg-todoist-sidebar-hover dark:hover:bg-gray-700 transition-colors text-left border border-todoist-border dark:border-gray-700">
                  ⚙️ Meeting Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  )
}

export default MeetingView
