import { invoke } from '@tauri-apps/api/core'

export async function createActivity(request) {
  return await invoke('create_activity', { request })
}

export async function getActivities() {
  return await invoke('get_activities')
}

export async function getActivityById(id) {
  return await invoke('get_activity_by_id', { id })
}

export async function updateActivity(request) {
  return await invoke('update_activity', { request })
}

export async function deleteActivity(id) {
  return await invoke('delete_activity', { id })
}

export async function getActivitiesByReference(referenceType, referenceId) {
  return await invoke('get_activities_by_reference', {
    referenceType,
    referenceId
  })
}

export async function getRunningActivity() {
  return await invoke('get_running_activity')
}

// TODO: TaskView API functions removed during final cleanup
// Frontend now uses Task struct directly

export async function getAllTasks() {
  return await invoke('get_all_tasks')
}

export async function createTask(request) {
  return await invoke('create_task', { request })
}

export async function updateTask(request) {
  return await invoke('update_task', { request })
}

export async function deleteTask(id) {
  return await invoke('delete_task', { id })
}

// TODO: TaskOccurrence API functions removed during final cleanup
// No longer using occurrence-based architecture

// TODO: TaskReminder API functions removed during final cleanup
// No longer using occurrence-based reminder system

export async function getAllProjects() {
  return await invoke('get_all_projects')
}

export async function createProject(request) {
  return await invoke('create_project', { request })
}

export async function updateProject(request) {
  return await invoke('update_project', { request })
}

export async function deleteProject(id) {
  return await invoke('delete_project', { id })
}

// Note API functions
export async function getAllNotes() {
  return await invoke('get_all_notes')
}

export async function createNote(request) {
  return await invoke('create_note', { request })
}

export async function updateNote(request) {
  return await invoke('update_note', { request })
}

export async function deleteNote(id) {
  return await invoke('delete_note', { id })
}

// Meeting API functions
export async function getAllMeetings() {
  return await invoke('get_all_meetings')
}

export async function createMeeting(request) {
  return await invoke('create_meeting', { request })
}

export async function updateMeeting(request) {
  return await invoke('update_meeting', { request })
}

export async function deleteMeeting(id) {
  return await invoke('delete_meeting', { id })
}

export async function getOutlookMeetings(date) {
  return await invoke('get_outlook_meetings', { date })
}

// Habit API functions
export async function getAllHabits() {
  return await invoke('get_all_habits')
}

export async function createHabit(request) {
  return await invoke('create_habit', { request })
}

export async function updateHabit(request) {
  return await invoke('update_habit', { request })
}

export async function deleteHabit(id) {
  return await invoke('delete_habit', { id })
}

export async function toggleHabitCompletion(habitId, date) {
  return await invoke('toggle_habit_completion', { habitId, date })
}

export async function getHabitLogs(habitId) {
  return await invoke('get_habit_logs', { habitId })
}
