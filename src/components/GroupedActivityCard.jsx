import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Clock3, CalendarDays, TimerReset, Pencil, Trash2 } from 'lucide-react'

export default function GroupedActivityCard({ group, getTaskTitle, getProjectTitle, getMeetingTitle, openEditModal, openDeleteConfirm }) {
  const [isOpen, setIsOpen] = useState(true)
  const title = group.task_id ? getTaskTitle(group.task_id) : group.meeting_id ? getMeetingTitle(group.meeting_id) : (group.project_id ? getProjectTitle(group.project_id) : 'General activity')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-3 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
            title={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">{title}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span>{group.activities.length} {group.meeting_id ? 'meeting sessions' : 'activities'}</span>
              <span>•</span>
              <span>{group.totalMinutes}m</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded" title="Group actions">
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-2">
          {group.activities.map(activity => (
            <div key={activity.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50">
              <div className="min-w-0 pr-2">
                <div className="text-sm text-gray-900 truncate">{activity.title}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(activity.start_time).toLocaleString()}</span>
                  {activity.end_time && (
                    <span className="flex items-center gap-1"><TimerReset className="w-3 h-3" />{new Date(activity.end_time).toLocaleString()}</span>
                  )}
                  <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{activity.duration_seconds == null && activity.duration_minutes === null ? 'Running' : activity.duration_seconds != null && activity.duration_seconds < 60 ? `${activity.duration_seconds}s` : `${Math.round((activity.duration_seconds ?? activity.duration_minutes * 60) / 60)}m`}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-3">
                <button onClick={() => openEditModal(activity)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => openDeleteConfirm(activity)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
