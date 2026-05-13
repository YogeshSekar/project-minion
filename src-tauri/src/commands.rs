use serde::{Deserialize, Serialize};
use tauri::State;

// Import models from the new modular structure
use crate::database::models::{
    CreateProjectRequest, Project, UpdateProjectRequest,
    CreateTaskRequest, Task, UpdateTaskRequest,
    CreateMeetingRequest, Meeting, UpdateMeetingRequest, UpdateMeetingUrlRequest,
    CreateNoteRequest, Note, UpdateNoteRequest,
    CreateActivityRequest, Activity, UpdateActivityRequest,
    CreateHabitRequest, Habit, UpdateHabitRequest,
    CreateHabitLogRequest, HabitLog, UpdateHabitLogRequest,
    CreateTaskCompletionLogRequest, TaskCompletionLog, UpdateTaskCompletionLogRequest,
    CreateTaskChecklistItemRequest, TaskChecklistItem, UpdateTaskChecklistItemRequest,
};

// Import repository functions from the new modular structure
use crate::database::repositories::{
    create_project as db_create_project, delete_project as db_delete_project,
    get_all_projects as db_get_all_projects, get_project_by_id as db_get_project_by_id,
    update_project as db_update_project,
    create_task as db_create_task,
    update_task as db_update_task, delete_task as db_delete_task, get_all_tasks as db_get_all_tasks,
    create_meeting as db_create_meeting, delete_meeting as db_delete_meeting,
    get_all_meetings as db_get_all_meetings, get_meeting_by_id as db_get_meeting_by_id,
    get_meetings_by_date as db_get_meetings_by_date,
    get_meeting_by_outlook_id as db_get_meeting_by_outlook_id,
    update_meeting as db_update_meeting, update_meeting_url as db_update_meeting_url,
    create_note as db_create_note, delete_note as db_delete_note,
    get_all_notes as db_get_all_notes, get_note_by_id as db_get_note_by_id,
    get_notes_by_project as db_get_notes_by_project,
    update_note as db_update_note,
    create_activity as db_create_activity, delete_activity as db_delete_activity,
    get_activities as db_get_activities, get_activity_by_id as db_get_activity_by_id,
    get_activities_by_reference as db_get_activities_by_reference,
    get_running_activity as db_get_running_activity,
    update_activity as db_update_activity,
    create_habit as db_create_habit, delete_habit as db_delete_habit,
    get_all_habits as db_get_all_habits,
    update_habit as db_update_habit,
    create_habit_log as db_create_habit_log,
    get_habit_logs_by_habit as db_get_habit_logs_by_habit,
    get_habit_log_by_date as db_get_habit_log_by_date,
    update_habit_log as db_update_habit_log,
    create_task_completion_log as db_create_task_completion_log,
    update_task_completion_log as db_update_task_completion_log,
    get_task_completion_logs_by_task as db_get_task_completion_logs_by_task,
    get_task_completion_log_by_id as db_get_task_completion_log_by_id,
    delete_task_completion_log as db_delete_task_completion_log,
    mark_completion_log_undone as db_mark_completion_log_undone,
    get_completion_logs_by_date_range as db_get_completion_logs_by_date_range,
    create_checklist_item as db_create_checklist_item,
    get_checklist_items_by_task as db_get_checklist_items_by_task,
    update_checklist_item as db_update_checklist_item,
    delete_checklist_item as db_delete_checklist_item,
    get_checklist_item_by_id as db_get_checklist_item_by_id,
};

// Import habit stats function from habit repository
use crate::database::repositories::get_habit_with_stats as db_get_habit_with_stats;
use crate::services::recurrence_service::complete_recurring_task;

pub struct DbState {
    pub pool: sqlx::Pool<sqlx::Sqlite>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn create_project(
    state: State<'_, DbState>,
    request: CreateProjectRequest,
) -> Result<ApiResponse<Project>, String> {
    match db_create_project(&state.pool, request).await {
        Ok(project) => Ok(ApiResponse {
            success: true,
            data: Some(project),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_all_projects(
    state: State<'_, DbState>,
) -> Result<ApiResponse<Vec<Project>>, String> {
    match db_get_all_projects(&state.pool).await {
        Ok(projects) => Ok(ApiResponse {
            success: true,
            data: Some(projects),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_project(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<Project>, String> {
    match db_get_project_by_id(&state.pool, id).await {
        Ok(Some(project)) => Ok(ApiResponse {
            success: true,
            data: Some(project),
            error: None,
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Project not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn update_project(
    state: State<'_, DbState>,
    request: UpdateProjectRequest,
) -> Result<ApiResponse<Project>, String> {
    match db_update_project(&state.pool, request).await {
        Ok(project) => Ok(ApiResponse {
            success: true,
            data: Some(project),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn delete_project(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_delete_project(&state.pool, id).await {
        Ok(_) => Ok(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

// Task commands
#[tauri::command]
pub async fn create_task(
    state: State<'_, DbState>,
    request: CreateTaskRequest,
) -> Result<ApiResponse<Task>, String> {
    match db_create_task(&state.pool, request).await {
        Ok(task) => Ok(ApiResponse {
            success: true,
            data: Some(task),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

// TODO: TaskView commands removed during final cleanup
// Frontend now uses Task struct directly

#[tauri::command]
pub async fn get_all_tasks(
    state: State<'_, DbState>,
) -> Result<ApiResponse<Vec<Task>>, String> {
    match db_get_all_tasks(&state.pool).await {
        Ok(tasks) => Ok(ApiResponse {
            success: true,
            data: Some(tasks),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn update_task(
    state: State<'_, DbState>,
    request: UpdateTaskRequest,
) -> Result<ApiResponse<Task>, String> {
    // First, fetch current task from database to get accurate recurring state
    let current_task = match db_get_all_tasks(&state.pool).await {
        Ok(tasks) => {
            if let Some(task) = tasks.iter().find(|t| t.id == request.id) {
                Some(task.clone())
            } else {
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some("Task not found".to_string()),
                });
            }
        }
        Err(e) => {
            return Ok(ApiResponse {
                success: false,
                data: None,
                error: Some(format!("Failed to fetch current task: {}", e)),
            });
        }
    };

    // Use CURRENT DATABASE TASK STATE for recurring detection
    let is_recurring_completion = current_task.as_ref()
        .map(|task| {
            task.is_recurring == 1 
                && task.recurrence_type.is_some()
                && request.status == "completed"
        })
        .unwrap_or(false);

    // Minimal debug logs
    if let Some(ref task) = current_task {
        println!("DEBUG: task_id: {}, DB is_recurring: {}, request.status: {}, routing: {}", 
                 task.id, task.is_recurring, request.status, 
                 if is_recurring_completion { "RECURRING" } else { "NORMAL" });
    }

    if is_recurring_completion {
        // For recurring tasks, use the fetched current task and recurrence service
        if let Some(ref task) = current_task {
            // Add debug log
            println!("DEBUG: recurring task completion - task_id: {}, title: {}", task.id, task.title);
            
            match complete_recurring_task(&state.pool, task).await {
                Ok(_completion_log) => {
                    // Return updated task after recurrence processing
                    match db_get_all_tasks(&state.pool).await {
                        Ok(updated_tasks) => {
                            if let Some(updated_task) = updated_tasks.iter().find(|t| t.id == request.id) {
                                println!("DEBUG: Recurrence metadata after update - is_recurring: {}, new scheduled_date: {:?}", 
                                         updated_task.is_recurring, updated_task.scheduled_date);
                                Ok(ApiResponse {
                                    success: true,
                                    data: Some(updated_task.clone()),
                                    error: None,
                                })
                            } else {
                                Ok(ApiResponse {
                                    success: false,
                                    data: None,
                                    error: Some("Failed to retrieve updated task after recurrence processing".to_string()),
                                })
                            }
                        }
                        Err(e) => Ok(ApiResponse {
                            success: false,
                            data: None,
                            error: Some(format!("Failed to retrieve updated task: {}", e)),
                        })
                    }
                }
                Err(e) => Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(format!("Recurring task completion failed: {}", e)),
                })
            }
        } else {
            Ok(ApiResponse {
                success: false,
                data: None,
                error: Some("Task not found for recurrence processing".to_string()),
            })
        }
    } else {
        // For normal tasks, use existing logic
        println!("DEBUG: NORMAL PATH - task_id: {}, status: {}, is_recurring: {:?}", request.id, request.status, request.is_recurring);
        
        match db_update_task(&state.pool, request).await {
            Ok(task) => Ok(ApiResponse {
                success: true,
                data: Some(task),
                error: None,
            }),
            Err(e) => Ok(ApiResponse {
                success: false,
                data: None,
                error: Some(e.to_string()),
            }),
        }
    }
}

#[tauri::command]
pub async fn delete_task(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_delete_task(&state.pool, id).await {
        Ok(_) => Ok(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

// TODO: TaskOccurrence commands removed during final cleanup
// No longer using occurrence-based architecture

// TODO: TaskReminder commands removed during final cleanup
// No longer using occurrence-based reminder system

// Meeting commands
#[tauri::command]
pub async fn create_meeting(
    state: State<'_, DbState>,
    request: CreateMeetingRequest,
) -> Result<ApiResponse<Meeting>, String> {
    match db_create_meeting(&state.pool, request).await {
        Ok(meeting) => Ok(ApiResponse {
            success: true,
            data: Some(meeting),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_all_meetings(
    state: State<'_, DbState>,
) -> Result<ApiResponse<Vec<Meeting>>, String> {
    match db_get_all_meetings(&state.pool).await {
        Ok(meetings) => Ok(ApiResponse {
            success: true,
            data: Some(meetings),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_meetings_by_date(
    state: State<'_, DbState>,
    date: String,
) -> Result<ApiResponse<Vec<Meeting>>, String> {
    match db_get_meetings_by_date(&state.pool, date).await {
        Ok(meetings) => Ok(ApiResponse {
            success: true,
            data: Some(meetings),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_meeting(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<Meeting>, String> {
    match db_get_meeting_by_id(&state.pool, id).await {
        Ok(Some(meeting)) => Ok(ApiResponse {
            success: true,
            data: Some(meeting),
            error: None,
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Meeting not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn update_meeting(
    state: State<'_, DbState>,
    request: UpdateMeetingRequest,
) -> Result<ApiResponse<Meeting>, String> {
    match db_update_meeting(&state.pool, request).await {
        Ok(meeting) => Ok(ApiResponse {
            success: true,
            data: Some(meeting),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn delete_meeting(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_delete_meeting(&state.pool, id).await {
        Ok(_) => Ok(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_meeting_by_outlook_id(
    state: State<'_, DbState>,
    outlook_id: String,
) -> Result<ApiResponse<Meeting>, String> {
    match db_get_meeting_by_outlook_id(&state.pool, outlook_id).await {
        Ok(Some(meeting)) => Ok(ApiResponse {
            success: true,
            data: Some(meeting),
            error: None,
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Meeting not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn update_meeting_url(
    state: State<'_, DbState>,
    request: UpdateMeetingUrlRequest,
) -> Result<ApiResponse<Meeting>, String> {
    match db_update_meeting_url(&state.pool, request).await {
        Ok(meeting) => Ok(ApiResponse {
            success: true,
            data: Some(meeting),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

// Note commands
#[tauri::command]
pub async fn create_note(
    state: State<'_, DbState>,
    request: CreateNoteRequest,
) -> Result<ApiResponse<Note>, String> {
    match db_create_note(&state.pool, request).await {
        Ok(note) => Ok(ApiResponse {
            success: true,
            data: Some(note),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_all_notes(
    state: State<'_, DbState>,
) -> Result<ApiResponse<Vec<Note>>, String> {
    match db_get_all_notes(&state.pool).await {
        Ok(notes) => Ok(ApiResponse {
            success: true,
            data: Some(notes),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_notes_by_project(
    state: State<'_, DbState>,
    project_id: i64,
) -> Result<ApiResponse<Vec<Note>>, String> {
    match db_get_notes_by_project(&state.pool, project_id).await {
        Ok(notes) => Ok(ApiResponse {
            success: true,
            data: Some(notes),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_note(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<Note>, String> {
    match db_get_note_by_id(&state.pool, id).await {
        Ok(Some(note)) => Ok(ApiResponse {
            success: true,
            data: Some(note),
            error: None,
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Note not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn update_note(
    state: State<'_, DbState>,
    request: UpdateNoteRequest,
) -> Result<ApiResponse<Note>, String> {
    match db_update_note(&state.pool, request).await {
        Ok(note) => Ok(ApiResponse {
            success: true,
            data: Some(note),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn delete_note(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_delete_note(&state.pool, id).await {
        Ok(_) => Ok(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

// Activity commands
#[tauri::command]
pub async fn create_activity(
    state: State<'_, DbState>,
    request: CreateActivityRequest,
) -> Result<ApiResponse<Activity>, String> {
    match db_create_activity(&state.pool, request).await {
        Ok(activity) => Ok(ApiResponse {
            success: true,
            data: Some(activity),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_activities(
    state: State<'_, DbState>,
) -> Result<ApiResponse<Vec<Activity>>, String> {
    match db_get_activities(&state.pool).await {
        Ok(activities) => Ok(ApiResponse {
            success: true,
            data: Some(activities),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_activity_by_id(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<Option<Activity>>, String> {
    match db_get_activity_by_id(&state.pool, id).await {
        Ok(activity) => Ok(ApiResponse {
            success: true,
            data: Some(activity),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn update_activity(
    state: State<'_, DbState>,
    request: UpdateActivityRequest,
) -> Result<ApiResponse<Activity>, String> {
    match db_update_activity(&state.pool, request).await {
        Ok(activity) => Ok(ApiResponse {
            success: true,
            data: Some(activity),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn delete_activity(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_delete_activity(&state.pool, id).await {
        Ok(_) => Ok(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_activities_by_reference(
    state: State<'_, DbState>,
    reference_type: String,
    reference_id: i64,
) -> Result<ApiResponse<Vec<Activity>>, String> {
    match db_get_activities_by_reference(&state.pool, reference_type, reference_id).await {
        Ok(activities) => Ok(ApiResponse {
            success: true,
            data: Some(activities),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_running_activity(
    state: State<'_, DbState>,
) -> Result<ApiResponse<Option<Activity>>, String> {
    match db_get_running_activity(&state.pool).await {
        Ok(activity) => Ok(ApiResponse {
            success: true,
            data: Some(activity),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

// Habit commands
#[tauri::command]
pub async fn create_habit(
    state: State<'_, DbState>,
    request: CreateHabitRequest,
) -> Result<ApiResponse<Habit>, String> {
    match db_create_habit(&state.pool, request).await {
        Ok(habit) => Ok(ApiResponse {
            success: true,
            data: Some(habit),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

#[tauri::command]
pub async fn get_all_habits(
    state: State<'_, DbState>,
) -> Result<ApiResponse<Vec<Habit>>, String> {
    match db_get_all_habits(&state.pool).await {
        Ok(habits) => Ok(ApiResponse {
            success: true,
            data: Some(habits),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

#[tauri::command]
pub async fn get_habit(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<Habit>, String> {
    match db_get_habit_with_stats(&state.pool, id).await {
        Ok(Some(habit)) => Ok(ApiResponse {
            success: true,
            data: Some(habit),
            error: None,
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Habit not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

#[tauri::command]
pub async fn update_habit(
    state: State<'_, DbState>,
    request: UpdateHabitRequest,
) -> Result<ApiResponse<Habit>, String> {
    match db_update_habit(&state.pool, request).await {
        Ok(habit) => Ok(ApiResponse {
            success: true,
            data: Some(habit),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

#[tauri::command]
pub async fn delete_habit(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_delete_habit(&state.pool, id).await {
        Ok(_) => Ok(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

#[tauri::command]
pub async fn toggle_habit_completion(
    state: State<'_, DbState>,
    habit_id: i64,
    date: String,
) -> Result<ApiResponse<HabitLog>, String> {
    // Check if log exists for this date
    match db_get_habit_log_by_date(&state.pool, habit_id, date.clone()).await {
        Ok(Some(existing_log)) => {
            // Toggle completion
            let new_completed = if existing_log.completed == 1 { 0 } else { 1 };
            let update_req = UpdateHabitLogRequest {
                id: existing_log.id,
                habit_id,
                date,
                completed: new_completed,
            };
            match db_update_habit_log(&state.pool, update_req).await {
                Ok(log) => Ok(ApiResponse {
                    success: true,
                    data: Some(log),
                    error: None,
                }),
                Err(e) => Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(format!("{}", e)),
                }),
            }
        }
        Ok(None) => {
            // Create new log with completed = 1
            let create_req = CreateHabitLogRequest {
                habit_id,
                date,
                completed: 1,
            };
            match db_create_habit_log(&state.pool, create_req).await {
                Ok(log) => Ok(ApiResponse {
                    success: true,
                    data: Some(log),
                    error: None,
                }),
                Err(e) => Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(format!("{}", e)),
                }),
            }
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

#[tauri::command]
pub async fn get_habit_logs(
    state: State<'_, DbState>,
    habit_id: i64,
) -> Result<ApiResponse<Vec<HabitLog>>, String> {
    match db_get_habit_logs_by_habit(&state.pool, habit_id).await {
        Ok(logs) => Ok(ApiResponse {
            success: true,
            data: Some(logs),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

// Checklist Commands
#[tauri::command]
pub async fn create_checklist_item(
    state: State<'_, DbState>,
    req: CreateTaskChecklistItemRequest,
) -> Result<ApiResponse<TaskChecklistItem>, String> {
    match db_create_checklist_item(&state.pool, req).await {
        Ok(item) => Ok(ApiResponse {
            success: true,
            data: Some(item),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

#[tauri::command]
pub async fn get_checklist_items_by_task(
    state: State<'_, DbState>,
    task_id: i64,
) -> Result<ApiResponse<Vec<TaskChecklistItem>>, String> {
    match db_get_checklist_items_by_task(&state.pool, task_id).await {
        Ok(items) => Ok(ApiResponse {
            success: true,
            data: Some(items),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

#[tauri::command]
pub async fn update_checklist_item(
    state: State<'_, DbState>,
    req: UpdateTaskChecklistItemRequest,
) -> Result<ApiResponse<TaskChecklistItem>, String> {
    match db_update_checklist_item(&state.pool, req).await {
        Ok(item) => Ok(ApiResponse {
            success: true,
            data: Some(item),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

#[tauri::command]
pub async fn delete_checklist_item(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<String>, String> {
    match db_delete_checklist_item(&state.pool, id).await {
        Ok(_) => Ok(ApiResponse {
            success: true,
            data: Some("Checklist item deleted successfully".to_string()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(format!("{}", e)),
        }),
    }
}

