// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use commands::{create_project, delete_project, get_all_projects, get_project, update_project, DbState,
    create_task, update_task,
    get_all_task_views, get_task_views_by_project, get_task_view_by_occurrence,
    create_task_occurrence, delete_task_occurrence, get_all_task_occurrences, get_task_occurrence, get_task_occurrences_by_task, update_task_occurrence, complete_task_occurrence,
    create_task_reminder, delete_task_reminder, get_all_task_reminders, get_task_reminder, get_task_reminders_by_occurrence, update_task_reminder,
    create_meeting, delete_meeting, get_all_meetings, get_meeting, get_meetings_by_date, get_meeting_by_outlook_id, update_meeting, update_meeting_url,
    create_note, delete_note, get_all_notes, get_note, get_notes_by_project, update_note,
    create_activity, delete_activity, get_activities, get_activity_by_id, get_activities_by_reference, get_running_activity, update_activity,
    create_habit, delete_habit, get_all_habits, get_habit, update_habit,
    toggle_habit_completion, get_habit_logs};
use outlook::get_outlook_meetings;
use database::init_db;
use tauri::Manager;

mod commands;
mod database;
mod outlook;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                let app_data_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
                let pool = init_db(app_data_dir).await.expect("Failed to initialize database");
                app.manage(DbState { pool });
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_project,
            get_all_projects,
            get_project,
            update_project,
            delete_project,
            create_task,
            update_task,
            get_all_task_views,
            get_task_views_by_project,
            get_task_view_by_occurrence,
            create_task_occurrence,
            get_all_task_occurrences,
            get_task_occurrence,
            get_task_occurrences_by_task,
            update_task_occurrence,
            delete_task_occurrence,
            complete_task_occurrence,
            create_task_reminder,
            get_all_task_reminders,
            get_task_reminder,
            get_task_reminders_by_occurrence,
            update_task_reminder,
            delete_task_reminder,
            create_meeting,
            get_all_meetings,
            get_meetings_by_date,
            get_meeting,
            get_meeting_by_outlook_id,
            update_meeting,
            update_meeting_url,
            delete_meeting,
            create_note,
            get_all_notes,
            get_notes_by_project,
            get_note,
            update_note,
            delete_note,
            create_activity,
            get_activities,
            get_activity_by_id,
            update_activity,
            delete_activity,
            get_activities_by_reference,
            get_running_activity,
            get_outlook_meetings,
            create_habit,
            get_all_habits,
            get_habit,
            update_habit,
            delete_habit,
            toggle_habit_completion,
            get_habit_logs
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
