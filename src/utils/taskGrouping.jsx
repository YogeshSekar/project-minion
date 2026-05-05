// Group completed tasks by parent task for recurring tasks
export function groupCompletedTasks(completedTasks) {
  const oneTimeTasks = []
  const recurringGroups = new Map()

  completedTasks.forEach(task => {
    if (task.is_recurring === 1 && task.task_id) {
      // This is a recurring task occurrence
      if (!recurringGroups.has(task.task_id)) {
        recurringGroups.set(task.task_id, {
          task_id: task.task_id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          project_id: task.project_id,
          estimated_minutes: task.estimated_minutes,
          recurrence_rule: task.recurrence_rule,
          occurrences: [],
          last_completed_date: null,
          completed_count: 0
        })
      }
      const group = recurringGroups.get(task.task_id)
      group.occurrences.push(task)
      group.completed_count++

      // Track last completed date
      if (task.occurrence_date) {
        const taskDate = new Date(task.occurrence_date)
        if (!group.last_completed_date || taskDate > new Date(group.last_completed_date)) {
          group.last_completed_date = task.occurrence_date
        }
      }
    } else {
      // One-time task
      oneTimeTasks.push(task)
    }
  })

  // Convert Map to array and sort by last completed date
  const groupedRecurring = Array.from(recurringGroups.values()).sort((a, b) => {
    if (!a.last_completed_date && !b.last_completed_date) return 0
    if (!a.last_completed_date) return 1
    if (!b.last_completed_date) return -1
    return new Date(b.last_completed_date) - new Date(a.last_completed_date)
  })

  return {
    oneTimeTasks,
    groupedRecurring
  }
}
