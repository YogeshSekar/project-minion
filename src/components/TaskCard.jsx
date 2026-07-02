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
  isDragging,
  hideStatus = false
}) {
  const project = task.project_id && projects?.find(p => p.id === task.project_id)
  const dueDateText = task.scheduled_date ? formatDate(task.scheduled_date) : null
  const overdue = task.scheduled_date && isOverdue(task.scheduled_date) && (task.status === 'todo' || task.status === 'in_progress')

  return (
    <div
      onClick={(e) => {
        if (!isDragging) {
          onEdit(task)
        }
      }}
      onMouseDown={(e) => onMouseDown?.(e, task.id, { title: task.title, status: task.status })}
      className={`group bg-white rounded-2xl p-3 border border-gray-200 shadow-sm transition-all duration-200 ease-out
        ${isDragging ? 'opacity-40 cursor-grabbing' : 'cursor-pointer'}
        ${runningActivity && runningActivity.reference_id === task.id && runningActivity.reference_type === 'task' ? 'border-green-500 shadow-lg' : 'hover:-translate-y-0.5 hover:shadow-lg'}
      `}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-1">
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={(e) => {
              e.stopPropagation()
              onToggleComplete(task)
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 accent-gray-900"
          />
        </div>
        <div className="min-w-0">
          <h3 className={`text-[15px] font-semibold leading-6 ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-950'}`}>
            {task.title}
          </h3>
          {task.is_recurring === 1 && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50/80 px-2 py-0.5 text-[11px] font-medium text-blue-700">
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
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {project && (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 font-medium text-gray-700">
            <span className={`h-2.5 w-2.5 rounded-full ${getPriorityBgColor(task.priority)}`}></span>
            {project.title}
          </span>
        )}
        {dueDateText && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${overdue ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
            <Calendar className="w-3 h-3" />
            {dueDateText}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        {!hideStatus && (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getTaskStatusBadge(task.status)}`}>
            {getTaskStatusLabel(task.status)}
          </span>
        )}

        <div className={`flex items-center gap-2 opacity-60 transition-opacity duration-200 group-hover:opacity-100 ${hideStatus ? 'ml-auto' : ''}`}>
          {onStartActivity && onStopActivity && (
            runningActivity && runningActivity.reference_id === task.id && runningActivity.reference_type === 'task' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onStopActivity()
                }}
                className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
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
                className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Start tracking"
              >
                <Play className="w-4 h-4" />
              </button>
            )
          )}
          {onAddToToday && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToToday(task)
              }}
              className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
              className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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


