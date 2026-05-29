import { Play, Square, Trash2, Calendar, RotateCcw, Clock } from 'lucide-react'
import { formatDate, isOverdue, getPriorityBgColor, getTaskStatusBadge, getTaskStatusLabel } from '../utils/helpers'

function TaskCard({ 
  task, 
  projects, 
  onToggleComplete, 
  onEdit, 
  onStartActivity, 
  onStopActivity, 
  runningActivity,
  onDelete,
  onAddToToday,
  onMouseDown,
  isDragging
}) {

  return (
    <div
      onClick={(e) => {
        if (!isDragging) {
          onEdit(task)
        }
      }}
      onMouseDown={(e) => onMouseDown?.(e, task.id, { title: task.title, status: task.status })}
      className={`
        bg-white rounded-2xl border border-gray-250 p-4 hover:shadow-md transition-all
        ${isDragging ? 'opacity-40 cursor-grabbing' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={(e) => {
            e.stopPropagation()
            onToggleComplete(task)
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-900 text-gray-900 focus:ring-gray-900 accent-gray-900"
        />
        <h3 className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </h3>
        {task.is_recurring === 1 && (
          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            <RotateCcw className="w-3 h-3" />
            <span>
              {task.recurrence_type === 'daily' ? `Every ${task.recurrence_interval || 1} day${(task.recurrence_interval || 1) > 1 ? 's' : ''}` :
               task.recurrence_type === 'weekly' ? `Every ${task.recurrence_interval || 1} week${(task.recurrence_interval || 1) > 1 ? 's' : ''}` :
               task.recurrence_type === 'monthly' ? `Every ${task.recurrence_interval || 1} month${(task.recurrence_interval || 1) > 1 ? 's' : ''}` :
               'Recurring'}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`w-2 h-2 rounded-full ${getPriorityBgColor(task.priority)}`}
          ></div>
          {task.project_id && projects?.find(p => p.id === task.project_id) ? (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full inline-flex items-center h-5">
              {projects.find(p => p.id === task.project_id)?.title}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full inline-flex items-center h-5">
              No Project
            </span>
          )}
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border inline-flex items-center h-5 ${getTaskStatusBadge(task.status)}`}>
            {getTaskStatusLabel(task.status)}
          </span>
          {task.scheduled_date && (
            <span className={`text-xs ${isOverdue(task.scheduled_date) && (task.status === 'todo' || task.status === 'in_progress') ? 'text-red-500' : 'text-gray-600'}`}>
              {formatDate(task.scheduled_date)}
            </span>
          )}
          {task.estimated_minutes > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.estimated_minutes}m
            </span>
          )}
          {task.actual_minutes > 0 && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.actual_minutes}m
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Activity Tracking Button */}
          {runningActivity && runningActivity.reference_id === task.id && runningActivity.reference_type === 'task' ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStopActivity()
              }}
              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
              title="Stop tracking"
            >
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <Square className="w-4 h-4" />
              </div>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartActivity(task)
              }}
              className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="Start tracking"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {onAddToToday && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToToday(task)
              }}
              className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="Add to Today"
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                console.log('[DEBUG] TaskCard delete button clicked, passing task.id:', task.id)
                onDelete(task.id)
              }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskCard


