use serde::{Deserialize, Serialize};
use tauri::State;

use crate::database::{
    create_project as db_create_project, delete_project as db_delete_project,
    get_all_projects as db_get_all_projects, get_project_by_id as db_get_project_by_id,
    update_project as db_update_project, CreateProjectRequest, Project, UpdateProjectRequest,
    create_task as db_create_task,
    update_task as db_update_task, delete_task as db_delete_task, get_all_tasks as db_get_all_tasks, CreateTaskRequest, Task, UpdateTaskRequest,
    // TODO: TaskView and occurrence-related imports removed during final cleanup
    // Frontend now uses Task struct directly
    create_meeting as db_create_meeting, delete_meeting as db_delete_meeting,
    get_all_meetings as db_get_all_meetings, get_meeting_by_id as db_get_meeting_by_id,
    get_meetings_by_date as db_get_meetings_by_date,
    get_meeting_by_outlook_id as db_get_meeting_by_outlook_id,
    update_meeting as db_update_meeting, update_meeting_url as db_update_meeting_url,
    CreateMeetingRequest, Meeting, UpdateMeetingRequest, UpdateMeetingUrlRequest,
    create_note as db_create_note, delete_note as db_delete_note,
    get_all_notes as db_get_all_notes, get_note_by_id as db_get_note_by_id,
    get_notes_by_project as db_get_notes_by_project,
    update_note as db_update_note, CreateNoteRequest, Note, UpdateNoteRequest,
    create_activity as db_create_activity, delete_activity as db_delete_activity,
    get_activities as db_get_activities, get_activity_by_id as db_get_activity_by_id,
    get_activities_by_reference as db_get_activities_by_reference,
    get_running_activity as db_get_running_activity,
    update_activity as db_update_activity, Activity, CreateActivityRequest, UpdateActivityRequest,
    create_habit as db_create_habit, delete_habit as db_delete_habit,
    get_all_habits as db_get_all_habits,
    get_habit_with_stats as db_get_habit_with_stats,
    update_habit as db_update_habit, CreateHabitRequest, Habit, UpdateHabitRequest,
    create_habit_log as db_create_habit_log,
    get_habit_logs_by_habit as db_get_habit_logs_by_habit,
    get_habit_log_by_date as db_get_habit_log_by_date,
    update_habit_log as db_update_habit_log, HabitLog, CreateHabitLogRequest, UpdateHabitLogRequest,
};

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
