// TODO: Recurring task grouping logic removed during final cleanup
// No longer using occurrence-based architecture
export function groupCompletedTasks(completedTasks) {
  // Return all tasks as one-time tasks since we're not using occurrence-based architecture
  return { 
    oneTimeTasks: completedTasks, 
    groupedRecurring: [] 
  }
}
