use chrono::{DateTime, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

// Import models from the new modular structure
use crate::database::models::{
    Activity, ActivityAnalytics, Area, CreateActivityRequest, CreateAreaRequest,
    CreateMeetingRequest, CreateNoteRequest, CreatePagePinRequest, CreatePageRequest,
    CreatePageUpdateRequest, CreateProjectRequest, CreateTaskChecklistItemRequest,
    CreateTaskCompletionLogRequest, CreateTaskRequest, Meeting, Note, Page, PagePin, PageUpdate,
    Project, Task, TaskChecklistItem, TaskCompletionLog, UpdateActivityRequest, UpdateAreaRequest,
    UpdateMeetingRequest, UpdateMeetingUrlRequest, UpdateNoteRequest, UpdatePageRequest,
    UpdatePageUpdateRequest, UpdateProjectRequest, UpdateTaskChecklistItemRequest,
    UpdateTaskCompletionLogRequest, UpdateTaskRequest,
};

// Import repository functions from the new modular structure
use crate::database::repositories::{
    create_activity as db_create_activity, create_area as db_create_area,
    create_checklist_item as db_create_checklist_item, create_meeting as db_create_meeting,
    create_note as db_create_note, create_page as db_create_page,
    create_page_pin as db_create_page_pin, create_page_update as db_create_page_update,
    create_project as db_create_project, create_task as db_create_task,
    create_task_completion_log as db_create_task_completion_log,
    delete_activity as db_delete_activity, delete_area as db_delete_area,
    delete_checklist_item as db_delete_checklist_item, delete_meeting as db_delete_meeting,
    delete_note as db_delete_note, delete_page as db_delete_page,
    delete_page_pin as db_delete_page_pin, delete_page_update as db_delete_page_update,
    delete_project as db_delete_project, delete_task as db_delete_task,
    delete_task_completion_log as db_delete_task_completion_log,
    get_activities as db_get_activities,
    get_activities_by_reference as db_get_activities_by_reference,
    get_activity_analytics as db_get_activity_analytics,
    get_activity_by_id as db_get_activity_by_id, get_all_areas as db_get_all_areas,
    get_all_meetings as db_get_all_meetings, get_all_notes as db_get_all_notes,
    get_all_pages as db_get_all_pages, get_all_projects as db_get_all_projects,
    get_all_tasks as db_get_all_tasks, get_area_by_id as db_get_area_by_id,
    get_areas_by_project as db_get_areas_by_project,
    get_checklist_item_by_id as db_get_checklist_item_by_id,
    get_checklist_items_by_task as db_get_checklist_items_by_task,
    get_completion_logs_by_date_range as db_get_completion_logs_by_date_range,
    get_meeting_by_id as db_get_meeting_by_id,
    get_meeting_by_outlook_id as db_get_meeting_by_outlook_id,
    get_meetings_by_date as db_get_meetings_by_date, get_note_by_id as db_get_note_by_id,
    get_notes_by_project as db_get_notes_by_project, get_page_by_id as db_get_page_by_id,
    get_page_ids_for_task as db_get_page_ids_for_task, get_page_pins as db_get_page_pins,
    get_page_updates as db_get_page_updates, get_pages_by_area as db_get_pages_by_area,
    get_pages_by_project as db_get_pages_by_project,
    get_pages_for_meeting as db_get_pages_for_meeting, get_project_by_id as db_get_project_by_id,
    get_running_activity as db_get_running_activity,
    get_task_completion_log_by_id as db_get_task_completion_log_by_id,
    get_task_completion_logs_by_task as db_get_task_completion_logs_by_task,
    get_task_ids_for_page as db_get_task_ids_for_page,
    has_overlapping_activity as db_has_overlapping_activity,
    link_page_to_meeting as db_link_page_to_meeting, link_task_to_page as db_link_task_to_page,
    mark_completion_log_undone as db_mark_completion_log_undone,
    set_meeting_project as db_set_meeting_project,
    unlink_page_from_meeting as db_unlink_page_from_meeting,
    unlink_task_from_page as db_unlink_task_from_page, update_activity as db_update_activity,
    update_area as db_update_area, update_checklist_item as db_update_checklist_item,
    update_meeting as db_update_meeting, update_meeting_url as db_update_meeting_url,
    update_note as db_update_note, update_page as db_update_page,
    update_page_update as db_update_page_update, update_project as db_update_project,
    update_task as db_update_task, update_task_completion_log as db_update_task_completion_log,
};

use crate::services::recurrence_service::complete_recurring_task;

pub struct DbState {
    pub pool: sqlx::Pool<sqlx::Sqlite>,
}

#[tauri::command]
pub async fn backup_database(
    state: State<'_, DbState>,
    destination_dir: String,
) -> Result<String, String> {
    let destination_dir = destination_dir.trim();
    if destination_dir.is_empty() {
        return Err("Choose a backup location first.".to_string());
    }

    let directory = PathBuf::from(destination_dir);
    std::fs::create_dir_all(&directory)
        .map_err(|error| format!("Could not create the backup folder: {error}"))?;
    if !directory.is_dir() {
        return Err("The selected backup location is not a folder.".to_string());
    }

    let file_name = format!(
        "project-minion-backup-{}.db",
        chrono::Local::now().format("%Y-%m-%d-%H%M%S-%3f")
    );
    let backup_path = directory.join(file_name);
    let escaped_path = backup_path.to_string_lossy().replace('\'', "''");
    sqlx::query(&format!("VACUUM INTO '{}';", escaped_path))
        .execute(&state.pool)
        .await
        .map_err(|error| format!("Backup failed: {error}"))?;

    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn delete_all_data(state: State<'_, DbState>) -> Result<(), String> {
    let mut transaction = state
        .pool
        .begin()
        .await
        .map_err(|error| error.to_string())?;
    let tables = [
        "page_pins",
        "page_updates",
        "page_tasks",
        "meeting_pages",
        "task_checklist_items",
        "task_completion_logs",
        "activities",
        "pages",
        "areas",
        "notes",
        "meetings",
        "tasks",
        "projects",
    ];

    for table in tables {
        sqlx::query(&format!("DELETE FROM {table}"))
            .execute(&mut *transaction)
            .await
            .map_err(|error| format!("Could not clear {table}: {error}"))?;
    }
    sqlx::query("DELETE FROM sqlite_sequence")
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("Could not reset database counters: {error}"))?;
    transaction
        .commit()
        .await
        .map_err(|error| error.to_string())
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
pub async fn delete_project(state: State<'_, DbState>, id: i64) -> Result<ApiResponse<()>, String> {
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
pub async fn get_all_tasks(state: State<'_, DbState>) -> Result<ApiResponse<Vec<Task>>, String> {
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
    let is_recurring_completion = current_task
        .as_ref()
        .map(|task| {
            task.is_recurring == 1
                && task.recurrence_type.is_some()
                && request.status == "completed"
        })
        .unwrap_or(false);

    // Minimal debug logs
    if let Some(ref task) = current_task {
        println!(
            "DEBUG: task_id: {}, DB is_recurring: {}, request.status: {}, routing: {}",
            task.id,
            task.is_recurring,
            request.status,
            if is_recurring_completion {
                "RECURRING"
            } else {
                "NORMAL"
            }
        );
    }

    if is_recurring_completion {
        // For recurring tasks, use the fetched current task and recurrence service
        if let Some(ref task) = current_task {
            // Add debug log
            println!(
                "DEBUG: recurring task completion - task_id: {}, title: {}",
                task.id, task.title
            );

            match complete_recurring_task(&state.pool, task).await {
                Ok(_completion_log) => {
                    // Return updated task after recurrence processing
                    match db_get_all_tasks(&state.pool).await {
                        Ok(updated_tasks) => {
                            if let Some(updated_task) =
                                updated_tasks.iter().find(|t| t.id == request.id)
                            {
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
                        }),
                    }
                }
                Err(e) => Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(format!("Recurring task completion failed: {}", e)),
                }),
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
        println!(
            "DEBUG: NORMAL PATH - task_id: {}, status: {}, is_recurring: {:?}",
            request.id, request.status, request.is_recurring
        );

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
pub async fn delete_task(state: State<'_, DbState>, id: i64) -> Result<ApiResponse<()>, String> {
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
pub async fn delete_meeting(state: State<'_, DbState>, id: i64) -> Result<ApiResponse<()>, String> {
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
pub async fn get_all_notes(state: State<'_, DbState>) -> Result<ApiResponse<Vec<Note>>, String> {
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
pub async fn get_note(state: State<'_, DbState>, id: i64) -> Result<ApiResponse<Note>, String> {
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
pub async fn delete_note(state: State<'_, DbState>, id: i64) -> Result<ApiResponse<()>, String> {
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

#[tauri::command]
pub async fn set_meeting_project(
    state: State<'_, DbState>,
    outlook_id: String,
    project_id: Option<i64>,
) -> Result<ApiResponse<Meeting>, String> {
    match db_set_meeting_project(&state.pool, outlook_id, project_id).await {
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
pub async fn get_pages_for_meeting(
    state: State<'_, DbState>,
    meeting_id: i64,
) -> Result<ApiResponse<Vec<Page>>, String> {
    match db_get_pages_for_meeting(&state.pool, meeting_id).await {
        Ok(pages) => Ok(ApiResponse {
            success: true,
            data: Some(pages),
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
pub async fn link_page_to_meeting(
    state: State<'_, DbState>,
    meeting_id: i64,
    page_id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_link_page_to_meeting(&state.pool, meeting_id, page_id).await {
        Ok(()) => Ok(ApiResponse {
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
pub async fn unlink_page_from_meeting(
    state: State<'_, DbState>,
    meeting_id: i64,
    page_id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_unlink_page_from_meeting(&state.pool, meeting_id, page_id).await {
        Ok(()) => Ok(ApiResponse {
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

// Area commands
#[tauri::command]
pub async fn create_area(
    state: State<'_, DbState>,
    request: CreateAreaRequest,
) -> Result<ApiResponse<Area>, String> {
    if request.title.trim().is_empty() {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Area title is required".to_string()),
        });
    }
    match db_create_area(&state.pool, request).await {
        Ok(area) => Ok(ApiResponse {
            success: true,
            data: Some(area),
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
pub async fn get_all_areas(state: State<'_, DbState>) -> Result<ApiResponse<Vec<Area>>, String> {
    match db_get_all_areas(&state.pool).await {
        Ok(areas) => Ok(ApiResponse {
            success: true,
            data: Some(areas),
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
pub async fn get_areas_by_project(
    state: State<'_, DbState>,
    project_id: i64,
) -> Result<ApiResponse<Vec<Area>>, String> {
    match db_get_areas_by_project(&state.pool, project_id).await {
        Ok(areas) => Ok(ApiResponse {
            success: true,
            data: Some(areas),
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
pub async fn get_area(state: State<'_, DbState>, id: i64) -> Result<ApiResponse<Area>, String> {
    match db_get_area_by_id(&state.pool, id).await {
        Ok(Some(area)) => Ok(ApiResponse {
            success: true,
            data: Some(area),
            error: None,
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Area not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn update_area(
    state: State<'_, DbState>,
    request: UpdateAreaRequest,
) -> Result<ApiResponse<Area>, String> {
    if request.title.trim().is_empty() {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Area title is required".to_string()),
        });
    }
    match db_update_area(&state.pool, request).await {
        Ok(area) => Ok(ApiResponse {
            success: true,
            data: Some(area),
            error: None,
        }),
        Err(sqlx::Error::RowNotFound) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Area not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn delete_area(state: State<'_, DbState>, id: i64) -> Result<ApiResponse<()>, String> {
    match db_delete_area(&state.pool, id).await {
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

// Page commands
#[tauri::command]
pub async fn get_task_ids_for_page(
    state: State<'_, DbState>,
    page_id: i64,
) -> Result<ApiResponse<Vec<i64>>, String> {
    match db_get_task_ids_for_page(&state.pool, page_id).await {
        Ok(ids) => Ok(ApiResponse {
            success: true,
            data: Some(ids),
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
pub async fn get_page_ids_for_task(
    state: State<'_, DbState>,
    task_id: i64,
) -> Result<ApiResponse<Vec<i64>>, String> {
    match db_get_page_ids_for_task(&state.pool, task_id).await {
        Ok(ids) => Ok(ApiResponse {
            success: true,
            data: Some(ids),
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
pub async fn link_task_to_page(
    state: State<'_, DbState>,
    page_id: i64,
    task_id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_link_task_to_page(&state.pool, page_id, task_id).await {
        Ok(()) => Ok(ApiResponse {
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
pub async fn unlink_task_from_page(
    state: State<'_, DbState>,
    page_id: i64,
    task_id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_unlink_task_from_page(&state.pool, page_id, task_id).await {
        Ok(()) => Ok(ApiResponse {
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
pub async fn create_page(
    state: State<'_, DbState>,
    request: CreatePageRequest,
) -> Result<ApiResponse<Page>, String> {
    if request.title.trim().is_empty() {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Page title is required".to_string()),
        });
    }
    match db_create_page(&state.pool, request).await {
        Ok(page) => Ok(ApiResponse {
            success: true,
            data: Some(page),
            error: None,
        }),
        Err(sqlx::Error::RowNotFound) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Area not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_all_pages(state: State<'_, DbState>) -> Result<ApiResponse<Vec<Page>>, String> {
    match db_get_all_pages(&state.pool).await {
        Ok(pages) => Ok(ApiResponse {
            success: true,
            data: Some(pages),
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
pub async fn get_pages_by_project(
    state: State<'_, DbState>,
    project_id: i64,
) -> Result<ApiResponse<Vec<Page>>, String> {
    match db_get_pages_by_project(&state.pool, project_id).await {
        Ok(pages) => Ok(ApiResponse {
            success: true,
            data: Some(pages),
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
pub async fn get_pages_by_area(
    state: State<'_, DbState>,
    area_id: i64,
) -> Result<ApiResponse<Vec<Page>>, String> {
    match db_get_pages_by_area(&state.pool, area_id).await {
        Ok(pages) => Ok(ApiResponse {
            success: true,
            data: Some(pages),
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
pub async fn get_page(state: State<'_, DbState>, id: i64) -> Result<ApiResponse<Page>, String> {
    match db_get_page_by_id(&state.pool, id).await {
        Ok(Some(page)) => Ok(ApiResponse {
            success: true,
            data: Some(page),
            error: None,
        }),
        Ok(None) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Page not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn update_page(
    state: State<'_, DbState>,
    request: UpdatePageRequest,
) -> Result<ApiResponse<Page>, String> {
    if request.title.trim().is_empty() {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Page title is required".to_string()),
        });
    }
    match db_update_page(&state.pool, request).await {
        Ok(page) => Ok(ApiResponse {
            success: true,
            data: Some(page),
            error: None,
        }),
        Err(sqlx::Error::RowNotFound) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Page or area not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn delete_page(state: State<'_, DbState>, id: i64) -> Result<ApiResponse<()>, String> {
    match db_delete_page(&state.pool, id).await {
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
pub async fn get_page_updates(
    state: State<'_, DbState>,
    page_id: i64,
) -> Result<ApiResponse<Vec<PageUpdate>>, String> {
    match db_get_page_updates(&state.pool, page_id).await {
        Ok(updates) => Ok(ApiResponse {
            success: true,
            data: Some(updates),
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
pub async fn create_page_update(
    state: State<'_, DbState>,
    request: CreatePageUpdateRequest,
) -> Result<ApiResponse<PageUpdate>, String> {
    if request.content.trim().is_empty() {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Update content is required".to_string()),
        });
    }
    match db_create_page_update(&state.pool, request).await {
        Ok(update) => Ok(ApiResponse {
            success: true,
            data: Some(update),
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
pub async fn update_page_update(
    state: State<'_, DbState>,
    request: UpdatePageUpdateRequest,
) -> Result<ApiResponse<PageUpdate>, String> {
    if request.content.trim().is_empty() {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Update content is required".to_string()),
        });
    }
    match db_update_page_update(&state.pool, request).await {
        Ok(update) => Ok(ApiResponse {
            success: true,
            data: Some(update),
            error: None,
        }),
        Err(sqlx::Error::RowNotFound) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Update not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn delete_page_update(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_delete_page_update(&state.pool, id).await {
        Ok(()) => Ok(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(sqlx::Error::RowNotFound) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Update not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn get_page_pins(
    state: State<'_, DbState>,
    page_id: i64,
) -> Result<ApiResponse<Vec<PagePin>>, String> {
    match db_get_page_pins(&state.pool, page_id).await {
        Ok(pins) => Ok(ApiResponse {
            success: true,
            data: Some(pins),
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
pub async fn create_page_pin(
    state: State<'_, DbState>,
    request: CreatePagePinRequest,
) -> Result<ApiResponse<PagePin>, String> {
    let valid = match request.kind.as_str() {
        "text" => !request.text.trim().is_empty() && request.linked_page_id.is_none(),
        "page" => request.linked_page_id.is_some(),
        _ => false,
    };
    if !valid {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Invalid pin".to_string()),
        });
    }
    match db_create_page_pin(&state.pool, request).await {
        Ok(pin) => Ok(ApiResponse {
            success: true,
            data: Some(pin),
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
pub async fn delete_page_pin(
    state: State<'_, DbState>,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    match db_delete_page_pin(&state.pool, id).await {
        Ok(()) => Ok(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }),
        Err(sqlx::Error::RowNotFound) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Pin not found".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

fn parse_activity_time(value: &str) -> Result<DateTime<Utc>, String> {
    DateTime::parse_from_rfc3339(value)
        .map(|value| value.with_timezone(&Utc))
        .or_else(|_| {
            NaiveDateTime::parse_from_str(value, "%Y-%m-%dT%H:%M").map(|value| value.and_utc())
        })
        .map_err(|_| "Activity times must be valid ISO date-time values".to_string())
}

fn normalize_activity_reference(
    reference_type: &mut Option<String>,
    reference_id: Option<i64>,
) -> Result<(), String> {
    *reference_type = reference_type
        .as_ref()
        .map(|value| value.trim().to_lowercase())
        .filter(|value| !value.is_empty());
    if let Some(kind) = reference_type.as_deref() {
        if !matches!(kind, "task" | "project" | "meeting" | "general") {
            return Err(
                "Activity reference type must be task, project, meeting, or general".to_string(),
            );
        }
        if matches!(kind, "task" | "meeting") && reference_id.is_none() {
            return Err(format!("A {kind} activity must include a reference ID"));
        }
    }
    Ok(())
}

fn normalize_create_activity(request: &mut CreateActivityRequest) -> Result<(), String> {
    request.title = request.title.trim().to_string();
    if request.title.is_empty() {
        return Err("Activity title is required".to_string());
    }
    normalize_activity_reference(&mut request.reference_type, request.reference_id)?;
    let start = parse_activity_time(&request.start_time)?;
    let status = request.status.as_deref().unwrap_or("completed");
    if !matches!(status, "running" | "completed") {
        return Err("Activity status must be running or completed".to_string());
    }
    if status == "running" && request.end_time.is_some() {
        return Err("A running activity cannot have an end time".to_string());
    }
    if status == "completed" && request.end_time.is_none() {
        return Err("A completed activity requires an end time".to_string());
    }
    if let Some(end_value) = request.end_time.as_deref() {
        let end = parse_activity_time(end_value)?;
        if end <= start {
            return Err("Activity end time must be after its start time".to_string());
        }
        let seconds = (end - start).num_seconds();
        request.duration_seconds = Some(seconds);
        request.duration_minutes = Some((seconds + 30) / 60);
    } else {
        request.duration_seconds = None;
        request.duration_minutes = None;
    }
    Ok(())
}

fn normalize_update_activity(request: &mut UpdateActivityRequest) -> Result<(), String> {
    request.title = request.title.trim().to_string();
    if request.title.is_empty() {
        return Err("Activity title is required".to_string());
    }
    normalize_activity_reference(&mut request.reference_type, request.reference_id)?;
    let start = parse_activity_time(&request.start_time)?;
    if !matches!(request.status.as_str(), "running" | "completed") {
        return Err("Activity status must be running or completed".to_string());
    }
    if request.status == "running" && request.end_time.is_some() {
        return Err("A running activity cannot have an end time".to_string());
    }
    if request.status == "completed" && request.end_time.is_none() {
        return Err("A completed activity requires an end time".to_string());
    }
    if let Some(end_value) = request.end_time.as_deref() {
        let end = parse_activity_time(end_value)?;
        if end <= start {
            return Err("Activity end time must be after its start time".to_string());
        }
        let seconds = (end - start).num_seconds();
        request.duration_seconds = Some(seconds);
        request.duration_minutes = Some((seconds + 30) / 60);
    } else {
        request.duration_seconds = None;
        request.duration_minutes = None;
    }
    Ok(())
}

// Activity commands
#[tauri::command]
pub async fn create_activity(
    state: State<'_, DbState>,
    mut request: CreateActivityRequest,
) -> Result<ApiResponse<Activity>, String> {
    if let Err(error) = normalize_create_activity(&mut request) {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(error),
        });
    }
    if request.reference_type.as_deref() == Some("meeting") {
        request.activity_type = "meeting".to_string();
        match db_get_meeting_by_id(&state.pool, request.reference_id.unwrap()).await {
            Ok(Some(meeting)) => request.project_id = meeting.project_id,
            Ok(None) => {
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some("Referenced meeting was not found".to_string()),
                })
            }
            Err(error) => {
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(error.to_string()),
                })
            }
        }
    }
    if let Some(end_time) = request.end_time.as_deref() {
        match db_has_overlapping_activity(&state.pool, &request.start_time, end_time, None).await {
            Ok(true) => {
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some("This time entry overlaps an existing activity".to_string()),
                })
            }
            Err(error) => {
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(error.to_string()),
                })
            }
            Ok(false) => {}
        }
    }
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
pub async fn get_activity_analytics(
    state: State<'_, DbState>,
    start_time: String,
    end_time: String,
) -> Result<ApiResponse<ActivityAnalytics>, String> {
    let start = match parse_activity_time(&start_time) {
        Ok(value) => value,
        Err(error) => {
            return Ok(ApiResponse {
                success: false,
                data: None,
                error: Some(error),
            });
        }
    };
    let end = match parse_activity_time(&end_time) {
        Ok(value) => value,
        Err(error) => {
            return Ok(ApiResponse {
                success: false,
                data: None,
                error: Some(error),
            });
        }
    };
    if end <= start {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some("Analytics end time must be after its start time".to_string()),
        });
    }

    match db_get_activity_analytics(&state.pool, &start.to_rfc3339(), &end.to_rfc3339()).await {
        Ok(analytics) => Ok(ApiResponse {
            success: true,
            data: Some(analytics),
            error: None,
        }),
        Err(error) => Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(error.to_string()),
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
    mut request: UpdateActivityRequest,
) -> Result<ApiResponse<Activity>, String> {
    if let Err(error) = normalize_update_activity(&mut request) {
        return Ok(ApiResponse {
            success: false,
            data: None,
            error: Some(error),
        });
    }
    if request.reference_type.as_deref() == Some("meeting") {
        request.activity_type = "meeting".to_string();
        match db_get_meeting_by_id(&state.pool, request.reference_id.unwrap()).await {
            Ok(Some(meeting)) => request.project_id = meeting.project_id,
            Ok(None) => {
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some("Referenced meeting was not found".to_string()),
                })
            }
            Err(error) => {
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(error.to_string()),
                })
            }
        }
    }
    if let Some(end_time) = request.end_time.as_deref() {
        match db_has_overlapping_activity(
            &state.pool,
            &request.start_time,
            end_time,
            Some(request.id),
        )
        .await
        {
            Ok(true) => {
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some("This time entry overlaps an existing activity".to_string()),
                })
            }
            Err(error) => {
                return Ok(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(error.to_string()),
                })
            }
            Ok(false) => {}
        }
    }
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
