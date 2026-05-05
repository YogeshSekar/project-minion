import { CheckCircle, RotateCcw, Calendar, Clock } from 'lucide-react'
import { formatDate, getPriorityColor } from '../utils/helpers'

export default function GroupedCompletedTaskCard({ group, projects, onEdit, onDelete, onToggleComplete }) {
  const project = projects?.find(p => p.id === group.project_id)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all group">
      <div className="flex items-start gap-3">
        {/* Completed Checkbox */}
        <button
          onClick={() => onToggleComplete?.(group)}
          className="mt-0.5 flex-shrink-0"
        >
          <CheckCircle className="w-5 h-5 text-green-500" />
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{group.title}</h4>
            <RotateCcw className="w-3 h-3 text-blue-500 flex-shrink-0" title="Recurring task" />
          </div>

          {group.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{group.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {/* Completed Count */}
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {group.completed_count} completed
            </span>

            {/* Last Completed Date */}
            {group.last_completed_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Last: {formatDate(group.last_completed_date)}
              </span>
            )}

            {/* Estimated Time */}
            {group.estimated_minutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {group.estimated_minutes}m
              </span>
            )}

            {/* Project */}
            {project && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {project.title}
              </span>
            )}

            {/* Priority */}
            <span className={`px-2 py-0.5 rounded-full border ${getPriorityColor(group.priority)}`}>
              {group.priority}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
