import React, { useState, useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Calendar, 
  Activity, 
  BarChart3, 
  PieChart, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Award,
  Flame
} from 'lucide-react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('week')
  
  // Sample analytics data - in real app this would come from your actual data
  const analyticsData = useMemo(() => ({
    productivity: {
      tasksCompleted: 47,
      totalTasks: 62,
      completionRate: 75.8,
      weeklyTrend: 12.5,
      dailyAverage: 6.7
    },
    timeTracking: {
      totalFocusTime: '24h 35m',
      pomodoroSessions: 48,
      averageSessionLength: 25,
      mostProductiveHour: '10:00 AM',
      peakProductivityDay: 'Tuesday'
    },
    projects: {
      activeProjects: 5,
      completedProjects: 12,
      totalProjects: 17,
      averageCompletionTime: '3.2 weeks',
      onTimeDeliveryRate: 85.7
    },
    habits: {
      activeHabits: 8,
      currentStreak: 14,
      longestStreak: 42,
      consistencyRate: 78.5,
      bestPerformingHabit: 'Morning Exercise'
    },
    meetings: {
      totalMeetings: 18,
      attendedMeetings: 16,
      attendanceRate: 88.9,
      averageMeetingDuration: '45 min',
      followUpCompletionRate: 92.3
    },
    weeklyActivity: [
      { day: 'Mon', tasks: 8, focusTime: 4.5, meetings: 2 },
      { day: 'Tue', tasks: 12, focusTime: 6.2, meetings: 1 },
      { day: 'Wed', tasks: 6, focusTime: 3.8, meetings: 3 },
      { day: 'Thu', tasks: 10, focusTime: 5.1, meetings: 2 },
      { day: 'Fri', tasks: 7, focusTime: 4.2, meetings: 1 },
      { day: 'Sat', tasks: 4, focusTime: 2.1, meetings: 0 },
      { day: 'Sun', tasks: 0, focusTime: 0, meetings: 0 }
    ],
    taskDistribution: {
      high: 15,
      medium: 28,
      low: 19
    }
  }), [])

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-todoist-border dark:border-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-todoist-text-secondary dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-todoist-text-primary dark:text-white">{value}</p>
          <p className="text-sm text-todoist-text-secondary dark:text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-todoist-red dark:text-todoist-red" />
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend > 0 ? 'text-todoist-priority-3 dark:text-blue-400' : 'text-todoist-priority-1 dark:text-red-400'
            }`}>
              {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const ActivityBar = ({ day, tasks, focusTime, maxValue }) => (
    <div className="flex-1 text-center">
      <div className="relative h-32 flex items-end justify-center gap-1">
        <div 
          className="w-8 bg-todoist-priority-3 dark:bg-blue-400 rounded-t transition-all hover:bg-blue-600 dark:hover:bg-blue-300"
          style={{ height: `${(tasks / maxValue) * 100}%` }}
          title={`${tasks} tasks`}
        />
        <div 
          className="w-8 bg-todoist-red dark:bg-red-400 rounded-t transition-all hover:bg-todoist-red-hover dark:hover:bg-red-500"
          style={{ height: `${(focusTime / maxValue) * 100}%` }}
          title={`${focusTime}h focus time`}
        />
      </div>
      <p className="text-xs text-todoist-text-secondary dark:text-gray-400 mt-2">{day}</p>
    </div>
  )

  const ProgressRing = ({ percentage, size = 120 }) => {
    const radius = (size - 10) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-todoist-border dark:text-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-todoist-red dark:text-red-400 transition-all duration-500"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-2xl font-bold text-todoist-red dark:text-red-400">
            {percentage}%
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-[#faf9f7] dark:bg-gray-950 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-todoist-text-primary dark:text-white">Analytics</h1>
          <p className="text-todoist-text-secondary dark:text-gray-400 mt-1">Track your productivity and performance</p>
        </div>
        <div className="flex items-center gap-2">
          {['day', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-todoist-red text-white dark:bg-red-500'
                  : 'bg-white dark:bg-gray-800 text-todoist-text-secondary dark:text-gray-300 hover:bg-todoist-sidebar-hover dark:hover:bg-gray-700 border border-todoist-border dark:border-gray-700'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Task Completion"
          value={`${analyticsData.productivity.completionRate}%`}
          subtitle={`${analyticsData.productivity.tasksCompleted}/${analyticsData.productivity.totalTasks} tasks`}
          icon={CheckCircle}
          trend={analyticsData.productivity.weeklyTrend}
        />
        <MetricCard
          title="Focus Time"
          value={analyticsData.timeTracking.totalFocusTime}
          subtitle={`${analyticsData.timeTracking.pomodoroSessions} sessions`}
          icon={Clock}
        />
        <MetricCard
          title="Active Projects"
          value={analyticsData.projects.activeProjects}
          subtitle={`${analyticsData.projects.completedProjects} completed`}
          icon={Target}
        />
        <MetricCard
          title="Current Streak"
          value={`${analyticsData.habits.currentStreak} days`}
          subtitle={`Best: ${analyticsData.habits.longestStreak} days`}
          icon={Flame}
          trend={15.2}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-todoist-border dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-todoist-text-primary dark:text-white">Weekly Activity</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-todoist-priority-3 dark:bg-blue-400 rounded"></div>
                <span className="text-todoist-text-secondary dark:text-gray-400">Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-todoist-red dark:bg-red-400 rounded"></div>
                <span className="text-todoist-text-secondary dark:text-gray-400">Focus Time</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {analyticsData.weeklyActivity.map((day) => (
              <ActivityBar
                key={day.day}
                day={day.day}
                tasks={day.tasks}
                focusTime={day.focusTime}
                maxValue={12}
              />
            ))}
          </div>
        </div>

        {/* Task Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-todoist-border dark:border-gray-800">
          <h2 className="text-lg font-semibold text-todoist-text-primary dark:text-white mb-6">Task Priority Distribution</h2>
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-3 gap-8">
              {Object.entries(analyticsData.taskDistribution).map(([priority, count]) => (
                <div key={priority} className="text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    priority === 'high' ? 'bg-red-50 dark:bg-red-900/30' :
                    priority === 'medium' ? 'bg-orange-50 dark:bg-orange-900/30' :
                    'bg-blue-50 dark:bg-blue-900/30'
                  }`}>
                    <span className={`text-2xl font-bold ${
                      priority === 'high' ? 'text-todoist-priority-1 dark:text-red-400' :
                      priority === 'medium' ? 'text-todoist-priority-2 dark:text-orange-400' :
                      'text-todoist-priority-3 dark:text-blue-400'
                    }`}>
                      {count}
                    </span>
                  </div>
                  <p className="text-sm text-todoist-text-secondary dark:text-gray-400 capitalize">{priority}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Insights */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-todoist-border dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-todoist-priority-3 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-todoist-text-primary dark:text-white">Productivity Insights</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-todoist-priority-3 dark:bg-blue-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-todoist-text-primary dark:text-white">Peak productivity at {analyticsData.timeTracking.mostProductiveHour}</p>
                <p className="text-xs text-todoist-text-secondary dark:text-gray-400">Schedule important tasks during this time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-todoist-red dark:bg-red-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-todoist-text-primary dark:text-white">{analyticsData.timeTracking.peakProductivityDay} is your most productive day</p>
                <p className="text-xs text-todoist-text-secondary dark:text-gray-400">Plan challenging work for Tuesdays</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-todoist-priority-2 dark:bg-orange-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-todoist-text-primary dark:text-white">Average {analyticsData.productivity.dailyAverage} tasks per day</p>
                <p className="text-xs text-todoist-text-secondary dark:text-gray-400">Above target of 5 tasks/day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-todoist-border dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-todoist-red dark:text-red-400" />
            <h2 className="text-lg font-semibold text-todoist-text-primary dark:text-white">Progress Overview</h2>
          </div>
          <div className="flex items-center justify-center mb-4">
            <ProgressRing percentage={analyticsData.productivity.completionRate} />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-sm text-todoist-text-secondary dark:text-gray-400">Overall Completion Rate</p>
            <p className="text-lg font-semibold text-todoist-text-primary dark:text-white">
              {analyticsData.productivity.tasksCompleted} of {analyticsData.productivity.totalTasks} tasks
            </p>
          </div>
        </div>

        {/* Habit Performance */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-todoist-border dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-todoist-priority-2 dark:text-orange-400" />
            <h2 className="text-lg font-semibold text-todoist-text-primary dark:text-white">Habit Performance</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-todoist-text-secondary dark:text-gray-400">Consistency Rate</span>
              <span className="text-sm font-semibold text-todoist-text-primary dark:text-white">{analyticsData.habits.consistencyRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-todoist-text-secondary dark:text-gray-400">Current Streak</span>
              <span className="text-sm font-semibold text-todoist-text-primary dark:text-white">{analyticsData.habits.currentStreak} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-todoist-text-secondary dark:text-gray-400">Best Habit</span>
              <span className="text-sm font-semibold text-todoist-text-primary dark:text-white">{analyticsData.habits.bestPerformingHabit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Metrics */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-todoist-border dark:border-gray-800">
          <h2 className="text-lg font-semibold text-todoist-text-primary dark:text-white mb-4">Project Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-todoist-sidebar-bg dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-todoist-priority-3 dark:text-blue-400">{analyticsData.projects.activeProjects}</p>
              <p className="text-sm text-todoist-text-secondary dark:text-gray-400">Active Projects</p>
            </div>
            <div className="text-center p-4 bg-todoist-sidebar-bg dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-todoist-red dark:text-red-400">{analyticsData.projects.onTimeDeliveryRate}%</p>
              <p className="text-sm text-todoist-text-secondary dark:text-gray-400">On-Time Delivery</p>
            </div>
            <div className="text-center p-4 bg-todoist-sidebar-bg dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-todoist-priority-2 dark:text-orange-400">{analyticsData.projects.averageCompletionTime}</p>
              <p className="text-sm text-todoist-text-secondary dark:text-gray-400">Avg. Completion</p>
            </div>
            <div className="text-center p-4 bg-todoist-sidebar-bg dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-todoist-priority-2 dark:text-orange-400">{analyticsData.projects.completedProjects}</p>
              <p className="text-sm text-todoist-text-secondary dark:text-gray-400">Completed</p>
            </div>
          </div>
        </div>

        {/* Meeting Analytics */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-todoist-border dark:border-gray-800">
          <h2 className="text-lg font-semibold text-todoist-text-primary dark:text-white mb-4">Meeting Analytics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-todoist-text-secondary dark:text-gray-400" />
                <span className="text-sm text-todoist-text-secondary dark:text-gray-400">Attendance Rate</span>
              </div>
              <span className="text-sm font-semibold text-todoist-text-primary dark:text-white">{analyticsData.meetings.attendanceRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-todoist-text-secondary dark:text-gray-400" />
                <span className="text-sm text-todoist-text-secondary dark:text-gray-400">Average Duration</span>
              </div>
              <span className="text-sm font-semibold text-todoist-text-primary dark:text-white">{analyticsData.meetings.averageMeetingDuration}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-todoist-text-secondary dark:text-gray-400" />
                <span className="text-sm text-todoist-text-secondary dark:text-gray-400">Follow-up Completion</span>
              </div>
              <span className="text-sm font-semibold text-todoist-text-primary dark:text-white">{analyticsData.meetings.followUpCompletionRate}%</span>
            </div>
            <div className="mt-4 p-3 bg-todoist-red-light dark:bg-red-900/20 rounded-lg border border-todoist-red dark:border-red-700">
              <p className="text-sm text-todoist-red dark:text-red-300">
                You're spending {analyticsData.meetings.averageMeetingDuration} per meeting - consider shorter meetings for better efficiency
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
