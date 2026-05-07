use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Project {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub start_date: String,
    pub deadline: String,
    pub priority: String,
    pub progress: i64,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProjectRequest {
    pub title: String,
    pub description: Option<String>,
    pub start_date: String,
    pub deadline: String,
    pub priority: String,
    pub progress: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProjectRequest {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub start_date: String,
    pub deadline: String,
    pub priority: String,
    pub progress: i64,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Task {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub project_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub project_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskRequest {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub project_id: Option<i64>,
}

// TODO: TaskOccurrence structs removed during final cleanup
// No longer using occurrence-based architecture

// TODO: TaskReminder structs removed during final cleanup
// No longer using occurrence-based reminder system

// TODO: TaskView compatibility layer removed during final cleanup
// Frontend now uses Task struct directly

// Meeting structs
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Meeting {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub date: String,
    pub start_time: String,
    pub end_time: String,
    pub location: Option<String>,
    pub attendees: Option<String>,
    pub outlook_id: Option<String>,
    pub meeting_url: Option<String>,
    pub meeting_type: Option<String>,
    pub project_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateMeetingRequest {
    pub title: String,
    pub description: Option<String>,
    pub date: String,
    pub start_time: String,
    pub end_time: String,
    pub location: Option<String>,
    pub attendees: Option<String>,
    pub outlook_id: Option<String>,
    pub meeting_url: Option<String>,
    pub meeting_type: Option<String>,
    pub project_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateMeetingRequest {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub date: String,
    pub start_time: String,
    pub end_time: String,
    pub location: Option<String>,
    pub attendees: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateMeetingUrlRequest {
    pub outlook_id: String,
    pub meeting_url: Option<String>,
    pub project_id: Option<i64>,
}

// Note structs
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Note {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub created_date: String,
    pub project_id: Option<i64>,
    pub note_type: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: String,
    pub project_id: Option<i64>,
    pub note_type: String,
    pub created_date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNoteRequest {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub project_id: Option<i64>,
    pub note_type: String,
}

// Activity structs
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Activity {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub activity_type: String,
    pub reference_type: Option<String>,
    pub reference_id: Option<i64>,
    pub session_group_id: Option<String>,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration_minutes: Option<i64>,
    pub status: String,
    pub source: String,
    pub is_auto_tracked: i64,
    pub is_locked: i64,
    pub project_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateActivityRequest {
    pub title: String,
    pub description: Option<String>,
    pub activity_type: String,
    pub reference_type: Option<String>,
    pub reference_id: Option<i64>,
    pub session_group_id: Option<String>,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration_minutes: Option<i64>,
    pub status: Option<String>,
    pub source: Option<String>,
    pub is_auto_tracked: Option<i64>,
    pub is_locked: Option<i64>,
    pub project_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateActivityRequest {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub activity_type: String,
    pub reference_type: Option<String>,
    pub reference_id: Option<i64>,
    pub session_group_id: Option<String>,
    pub start_time: String,
    pub end_time: String,
    pub duration_minutes: i64,
    pub status: String,
    pub source: String,
    pub is_auto_tracked: Option<i64>,
    pub is_locked: Option<i64>,
    pub project_id: Option<i64>,
}

// Habit structs
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Habit {
    pub id: i64,
    pub name: String,
    pub category: String,
    pub color: String,
    pub icon: String,
    pub target: i64,
    pub streak: i64,
    pub best_streak: i64,
    pub description: Option<String>,
    pub time_preference: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateHabitRequest {
    pub name: String,
    pub category: String,
    pub color: String,
    pub icon: String,
    pub target: i64,
    pub description: Option<String>,
    pub time_preference: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateHabitRequest {
    pub id: i64,
    pub name: String,
    pub category: String,
    pub color: String,
    pub icon: String,
    pub target: i64,
    pub description: Option<String>,
    pub time_preference: Option<String>,
}

// HabitLog structs
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct HabitLog {
    pub id: i64,
    pub habit_id: i64,
    pub date: String,
    pub completed: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateHabitLogRequest {
    pub habit_id: i64,
    pub date: String,
    pub completed: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateHabitLogRequest {
    pub id: i64,
    pub habit_id: i64,
    pub date: String,
    pub completed: i64,
}

pub async fn init_db(app_data_dir: PathBuf) -> Result<Pool<Sqlite>, sqlx::Error> {
    // Create the data directory if it doesn't exist
    std::fs::create_dir_all(&app_data_dir).map_err(|e| sqlx::Error::Io(e))?;
    
    let db_path = app_data_dir.join("project_minion.db");
    
    // Use sqlite:file: prefix with absolute path for Windows compatibility
    let database_url = format!("sqlite:file:{}?mode=rwc", db_path.to_string_lossy());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            start_date TEXT NOT NULL,
            deadline TEXT NOT NULL,
            priority TEXT NOT NULL,
            progress INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'todo',
            priority TEXT NOT NULL DEFAULT 'medium',
            due_date TEXT,
            scheduled_date TEXT,
            project_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await?;

    // Create indexes for tasks table
    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date)
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
        "#,
    )
    .execute(&pool)
    .await?;

    // Create meetings table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS meetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            location TEXT,
            attendees TEXT,
            outlook_id TEXT UNIQUE,
            meeting_url TEXT,
            meeting_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await?;

    // TODO: task_occurrences table creation removed during final cleanup
// No longer using occurrence-based architecture

    // TODO: task_reminders table creation removed during final cleanup
// No longer using occurrence-based reminder system

    // Create notes table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_date TEXT NOT NULL,
            project_id INTEGER,
            note_type TEXT NOT NULL DEFAULT 'general',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
        )
        "#,
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}

pub async fn create_project(
    pool: &Pool<Sqlite>,
    req: CreateProjectRequest,
) -> Result<Project, sqlx::Error> {
    let status = if req.progress >= 100 {
        "completed"
    } else {
        "active"
    };

    let project = sqlx::query_as::<_, Project>(
        r#"
        INSERT INTO projects (title, description, start_date, deadline, priority, progress, status)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.start_date)
    .bind(&req.deadline)
    .bind(&req.priority)
    .bind(req.progress)
    .bind(status)
    .fetch_one(pool)
    .await?;

    Ok(project)
}

pub async fn get_all_projects(pool: &Pool<Sqlite>) -> Result<Vec<Project>, sqlx::Error> {
    let projects = sqlx::query_as::<_, Project>(
        r#"
        SELECT * FROM projects ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(projects)
}

pub async fn get_project_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<Project>, sqlx::Error> {
    let project = sqlx::query_as::<_, Project>(
        r#"
        SELECT * FROM projects WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(project)
}

pub async fn update_project(
    pool: &Pool<Sqlite>,
    req: UpdateProjectRequest,
) -> Result<Project, sqlx::Error> {
    let project = sqlx::query_as::<_, Project>(
        r#"
        UPDATE projects 
        SET title = ?1, description = ?2, start_date = ?3, deadline = ?4, 
            priority = ?5, progress = ?6, status = ?7, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?8
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.start_date)
    .bind(&req.deadline)
    .bind(&req.priority)
    .bind(req.progress)
    .bind(&req.status)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(project)
}

pub async fn delete_project(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM projects WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

// Task CRUD operations
pub async fn create_task(
    pool: &Pool<Sqlite>,
    req: CreateTaskRequest,
) -> Result<Task, sqlx::Error> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        INSERT INTO tasks (title, description, status, priority, due_date, scheduled_date, project_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.status)
    .bind(&req.priority)
    .bind(&req.due_date)
    .bind(&req.scheduled_date)
    .bind(req.project_id)
    .fetch_one(pool)
    .await?;

    // TODO: Occurrence generation temporarily removed during CRUD simplification
    // Previously created first occurrence for each task
    // Now using single-task CRUD architecture

    Ok(task)
}

pub async fn update_task(
    pool: &Pool<Sqlite>,
    req: UpdateTaskRequest,
) -> Result<Task, sqlx::Error> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks 
        SET title = ?1, description = ?2, status = ?3, priority = ?4, 
            due_date = ?5, scheduled_date = ?6, project_id = ?7, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?8
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.status)
    .bind(&req.priority)
    .bind(&req.due_date)
    .bind(&req.scheduled_date)
    .bind(req.project_id)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(task)
}

// Simple task CRUD functions
pub async fn get_all_tasks(pool: &Pool<Sqlite>) -> Result<Vec<Task>, sqlx::Error> {
    let tasks = sqlx::query_as::<_, Task>(
        r#"
        SELECT * FROM tasks ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(tasks)
}

pub async fn get_task_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<Task>, sqlx::Error> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        SELECT * FROM tasks WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(task)
}

pub async fn delete_task(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM tasks WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

// TODO: TaskView functions removed during final cleanup
// Frontend now uses Task struct directly

// TODO: complete_task_occurrence function temporarily removed during CRUD simplification
// Previously handled occurrence completion and recurring task generation
// Now using single-task CRUD architecture

// TODO: calculate_next_occurrence function temporarily removed during CRUD simplification
// Previously calculated next occurrence dates for recurring tasks
// Recurrence logic has been removed from Task struct

// TODO: TaskOccurrence CRUD operations removed during final cleanup
// No longer using occurrence-based architecture

// TODO: TaskReminder CRUD operations removed during final cleanup
// No longer using occurrence-based reminder system

// Meeting CRUD operations
pub async fn create_meeting(
    pool: &Pool<Sqlite>,
    req: CreateMeetingRequest,
) -> Result<Meeting, sqlx::Error> {
    let meeting = sqlx::query_as::<_, Meeting>(
        r#"
        INSERT INTO meetings (title, description, date, start_time, end_time, location, attendees, outlook_id, meeting_url, meeting_type, project_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.date)
    .bind(&req.start_time)
    .bind(&req.end_time)
    .bind(&req.location)
    .bind(&req.attendees)
    .bind(&req.outlook_id)
    .bind(&req.meeting_url)
    .bind(&req.meeting_type)
    .bind(&req.project_id)
    .fetch_one(pool)
    .await?;

    Ok(meeting)
}

pub async fn get_all_meetings(pool: &Pool<Sqlite>) -> Result<Vec<Meeting>, sqlx::Error> {
    let meetings = sqlx::query_as::<_, Meeting>(
        r#"
        SELECT * FROM meetings ORDER BY date ASC, start_time ASC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(meetings)
}

pub async fn get_meetings_by_date(
    pool: &Pool<Sqlite>,
    date: String,
) -> Result<Vec<Meeting>, sqlx::Error> {
    let meetings = sqlx::query_as::<_, Meeting>(
        r#"
        SELECT * FROM meetings WHERE date = ?1 ORDER BY start_time ASC
        "#,
    )
    .bind(date)
    .fetch_all(pool)
    .await?;

    Ok(meetings)
}

pub async fn get_meeting_by_outlook_id(
    pool: &Pool<Sqlite>,
    outlook_id: String,
) -> Result<Option<Meeting>, sqlx::Error> {
    let meeting = sqlx::query_as::<_, Meeting>(
        r#"
        SELECT * FROM meetings WHERE outlook_id = ?1
        "#,
    )
    .bind(&outlook_id)
    .fetch_optional(pool)
    .await?;

    Ok(meeting)
}

pub async fn update_meeting_url(
    pool: &Pool<Sqlite>,
    req: UpdateMeetingUrlRequest,
) -> Result<Meeting, sqlx::Error> {
    let meeting = if req.meeting_url.is_some() && req.project_id.is_some() {
        // Update both fields
        sqlx::query_as::<_, Meeting>(
            r#"
            UPDATE meetings 
            SET meeting_url = ?1, project_id = ?2, updated_at = CURRENT_TIMESTAMP
            WHERE outlook_id = ?3
            RETURNING *
            "#,
        )
        .bind(&req.meeting_url)
        .bind(&req.project_id)
        .bind(&req.outlook_id)
        .fetch_one(pool)
        .await?
    } else if req.meeting_url.is_some() {
        // Update only meeting_url
        sqlx::query_as::<_, Meeting>(
            r#"
            UPDATE meetings 
            SET meeting_url = ?1, updated_at = CURRENT_TIMESTAMP
            WHERE outlook_id = ?2
            RETURNING *
            "#,
        )
        .bind(&req.meeting_url)
        .bind(&req.outlook_id)
        .fetch_one(pool)
        .await?
    } else if req.project_id.is_some() {
        // Update only project_id
        sqlx::query_as::<_, Meeting>(
            r#"
            UPDATE meetings 
            SET project_id = ?1, updated_at = CURRENT_TIMESTAMP
            WHERE outlook_id = ?2
            RETURNING *
            "#,
        )
        .bind(&req.project_id)
        .bind(&req.outlook_id)
        .fetch_one(pool)
        .await?
    } else {
        return Err(sqlx::Error::Protocol("No fields to update".to_string()));
    };

    Ok(meeting)
}

pub async fn get_meeting_by_id(
    pool: &Pool<Sqlite>,
    id: i64,
) -> Result<Option<Meeting>, sqlx::Error> {
    let meeting = sqlx::query_as::<_, Meeting>(
        r#"
        SELECT * FROM meetings WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(meeting)
}

pub async fn update_meeting(
    pool: &Pool<Sqlite>,
    req: UpdateMeetingRequest,
) -> Result<Meeting, sqlx::Error> {
    let meeting = sqlx::query_as::<_, Meeting>(
        r#"
        UPDATE meetings 
        SET title = ?1, description = ?2, date = ?3, start_time = ?4, 
            end_time = ?5, location = ?6, attendees = ?7, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?8
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.date)
    .bind(&req.start_time)
    .bind(&req.end_time)
    .bind(&req.location)
    .bind(&req.attendees)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(meeting)
}

pub async fn delete_meeting(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM meetings WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

// Note CRUD operations
pub async fn create_note(
    pool: &Pool<Sqlite>,
    req: CreateNoteRequest,
) -> Result<Note, sqlx::Error> {
    let note = sqlx::query_as::<_, Note>(
        r#"
        INSERT INTO notes (title, content, created_date, project_id, note_type)
        VALUES (?1, ?2, ?3, ?4, ?5)
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.content)
    .bind(&req.created_date)
    .bind(req.project_id)
    .bind(&req.note_type)
    .fetch_one(pool)
    .await?;

    Ok(note)
}

pub async fn get_all_notes(pool: &Pool<Sqlite>) -> Result<Vec<Note>, sqlx::Error> {
    let notes = sqlx::query_as::<_, Note>(
        r#"
        SELECT * FROM notes ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(notes)
}

pub async fn get_notes_by_project(pool: &Pool<Sqlite>, project_id: i64) -> Result<Vec<Note>, sqlx::Error> {
    let notes = sqlx::query_as::<_, Note>(
        r#"
        SELECT * FROM notes WHERE project_id = ?1 ORDER BY created_at DESC
        "#,
    )
    .bind(project_id)
    .fetch_all(pool)
    .await?;

    Ok(notes)
}

pub async fn get_note_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<Note>, sqlx::Error> {
    let note = sqlx::query_as::<_, Note>(
        r#"
        SELECT * FROM notes WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(note)
}

pub async fn update_note(
    pool: &Pool<Sqlite>,
    req: UpdateNoteRequest,
) -> Result<Note, sqlx::Error> {
    let note = sqlx::query_as::<_, Note>(
        r#"
        UPDATE notes
        SET title = ?1, content = ?2, project_id = ?3, note_type = ?4, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?5
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.content)
    .bind(req.project_id)
    .bind(&req.note_type)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(note)
}

pub async fn delete_note(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM notes WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

// Activity CRUD functions
pub async fn create_activity(
    pool: &Pool<Sqlite>,
    req: CreateActivityRequest,
) -> Result<Activity, sqlx::Error> {
    let status = req.status.unwrap_or_else(|| "completed".to_string());
    let source = req.source.unwrap_or_else(|| "manual".to_string());
    let is_auto_tracked = req.is_auto_tracked.unwrap_or(0);
    let is_locked = req.is_locked.unwrap_or(0);

    let activity = sqlx::query_as::<_, Activity>(
        r#"
        INSERT INTO activities (title, description, activity_type, reference_type, reference_id, session_group_id, start_time, end_time, duration_minutes, status, source, is_auto_tracked, is_locked, project_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.activity_type)
    .bind(&req.reference_type)
    .bind(req.reference_id)
    .bind(&req.session_group_id)
    .bind(&req.start_time)
    .bind(&req.end_time)
    .bind(req.duration_minutes)
    .bind(&status)
    .bind(&source)
    .bind(is_auto_tracked)
    .bind(is_locked)
    .bind(req.project_id)
    .fetch_one(pool)
    .await?;

    Ok(activity)
}

pub async fn get_activities(pool: &Pool<Sqlite>) -> Result<Vec<Activity>, sqlx::Error> {
    let activities = sqlx::query_as::<_, Activity>(
        r#"
        SELECT * FROM activities ORDER BY start_time DESC
        "#,
    )
    .fetch_all(pool)
    .await?;
    Ok(activities)
}

pub async fn get_activity_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<Activity>, sqlx::Error> {
    let activity = sqlx::query_as::<_, Activity>(
        r#"
        SELECT * FROM activities WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(activity)
}

pub async fn update_activity(
    pool: &Pool<Sqlite>,
    req: UpdateActivityRequest,
) -> Result<Activity, sqlx::Error> {
    let is_auto_tracked = req.is_auto_tracked.unwrap_or(0);
    let is_locked = req.is_locked.unwrap_or(0);

    let activity = sqlx::query_as::<_, Activity>(
        r#"
        UPDATE activities 
        SET title = ?1, description = ?2, activity_type = ?3, reference_type = ?4, reference_id = ?5, 
            session_group_id = ?6, start_time = ?7, end_time = ?8, duration_minutes = ?9, status = ?10, source = ?11, 
            is_auto_tracked = ?12, is_locked = ?13, project_id = ?14, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?15
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.activity_type)
    .bind(&req.reference_type)
    .bind(req.reference_id)
    .bind(&req.session_group_id)
    .bind(&req.start_time)
    .bind(&req.end_time)
    .bind(req.duration_minutes)
    .bind(&req.status)
    .bind(&req.source)
    .bind(is_auto_tracked)
    .bind(is_locked)
    .bind(req.project_id)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(activity)
}

pub async fn delete_activity(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM activities WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_activities_by_reference(
    pool: &Pool<Sqlite>,
    reference_type: String,
    reference_id: i64,
) -> Result<Vec<Activity>, sqlx::Error> {
    let activities = sqlx::query_as::<_, Activity>(
        r#"
        SELECT * FROM activities WHERE reference_type = ?1 AND reference_id = ?2 ORDER BY start_time DESC
        "#,
    )
    .bind(&reference_type)
    .bind(reference_id)
    .fetch_all(pool)
    .await?;
    Ok(activities)
}

pub async fn get_running_activity(pool: &Pool<Sqlite>) -> Result<Option<Activity>, sqlx::Error> {
    let activity = sqlx::query_as::<_, Activity>(
        r#"
        SELECT * FROM activities WHERE status = 'running' ORDER BY start_time DESC LIMIT 1
        "#,
    )
    .fetch_optional(pool)
    .await?;
    Ok(activity)
}

// Habit CRUD operations
pub async fn create_habit(
    pool: &Pool<Sqlite>,
    req: CreateHabitRequest,
) -> Result<Habit, sqlx::Error> {
    let habit = sqlx::query_as::<_, Habit>(
        r#"
        INSERT INTO habits (name, category, color, icon, target, description, time_preference)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        RETURNING *
        "#,
    )
    .bind(&req.name)
    .bind(&req.category)
    .bind(&req.color)
    .bind(&req.icon)
    .bind(req.target)
    .bind(&req.description)
    .bind(&req.time_preference)
    .fetch_one(pool)
    .await?;

    Ok(habit)
}

pub async fn get_all_habits(pool: &Pool<Sqlite>) -> Result<Vec<Habit>, sqlx::Error> {
    let habits = sqlx::query_as::<_, Habit>(
        r#"
        SELECT * FROM habits ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(habits)
}

pub async fn get_habit_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<Habit>, sqlx::Error> {
    let habit = sqlx::query_as::<_, Habit>(
        r#"
        SELECT * FROM habits WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(habit)
}

pub async fn update_habit(
    pool: &Pool<Sqlite>,
    req: UpdateHabitRequest,
) -> Result<Habit, sqlx::Error> {
    let habit = sqlx::query_as::<_, Habit>(
        r#"
        UPDATE habits
        SET name = ?1, category = ?2, color = ?3, icon = ?4, target = ?5,
            description = ?6, time_preference = ?7, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?8
        RETURNING *
        "#,
    )
    .bind(&req.name)
    .bind(&req.category)
    .bind(&req.color)
    .bind(&req.icon)
    .bind(req.target)
    .bind(&req.description)
    .bind(&req.time_preference)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(habit)
}

pub async fn delete_habit(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM habits WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

// HabitLog CRUD operations
pub async fn create_habit_log(
    pool: &Pool<Sqlite>,
    req: CreateHabitLogRequest,
) -> Result<HabitLog, sqlx::Error> {
    let habit_log = sqlx::query_as::<_, HabitLog>(
        r#"
        INSERT INTO habit_logs (habit_id, date, completed)
        VALUES (?1, ?2, ?3)
        RETURNING *
        "#,
    )
    .bind(req.habit_id)
    .bind(&req.date)
    .bind(req.completed)
    .fetch_one(pool)
    .await?;

    Ok(habit_log)
}

pub async fn get_habit_logs_by_habit(
    pool: &Pool<Sqlite>,
    habit_id: i64,
) -> Result<Vec<HabitLog>, sqlx::Error> {
    let habit_logs = sqlx::query_as::<_, HabitLog>(
        r#"
        SELECT * FROM habit_logs WHERE habit_id = ?1 ORDER BY date DESC
        "#,
    )
    .bind(habit_id)
    .fetch_all(pool)
    .await?;

    Ok(habit_logs)
}

pub async fn get_habit_log_by_date(
    pool: &Pool<Sqlite>,
    habit_id: i64,
    date: String,
) -> Result<Option<HabitLog>, sqlx::Error> {
    let habit_log = sqlx::query_as::<_, HabitLog>(
        r#"
        SELECT * FROM habit_logs WHERE habit_id = ?1 AND date = ?2
        "#,
    )
    .bind(habit_id)
    .bind(&date)
    .fetch_optional(pool)
    .await?;

    Ok(habit_log)
}

pub async fn update_habit_log(
    pool: &Pool<Sqlite>,
    req: UpdateHabitLogRequest,
) -> Result<HabitLog, sqlx::Error> {
    let habit_log = sqlx::query_as::<_, HabitLog>(
        r#"
        UPDATE habit_logs
        SET habit_id = ?1, date = ?2, completed = ?3
        WHERE id = ?4
        RETURNING *
        "#,
    )
    .bind(req.habit_id)
    .bind(&req.date)
    .bind(req.completed)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(habit_log)
}

// Helper function to get habit with calculated stats
pub async fn get_habit_with_stats(
    pool: &Pool<Sqlite>,
    habit_id: i64,
) -> Result<Option<Habit>, sqlx::Error> {
    let habit = get_habit_by_id(pool, habit_id).await?;

    if let Some(mut habit) = habit {
        // Calculate current streak
        let streak = calculate_current_streak(pool, habit_id).await?;
        habit.streak = streak;

        // Calculate best streak
        let best_streak = calculate_best_streak(pool, habit_id).await?;
        habit.best_streak = best_streak;

        Ok(Some(habit))
    } else {
        Ok(None)
    }
}

async fn calculate_current_streak(pool: &Pool<Sqlite>, habit_id: i64) -> Result<i64, sqlx::Error> {
    let _today = chrono::Utc::now().format("%Y-%m-%d").to_string();

    // Get completed dates in descending order
    let logs = sqlx::query_as::<_, (String,)>(
        r#"
        SELECT date FROM habit_logs
        WHERE habit_id = ?1 AND completed = 1
        ORDER BY date DESC
        "#,
    )
    .bind(habit_id)
    .fetch_all(pool)
    .await?;

    if logs.is_empty() {
        return Ok(0);
    }

    let mut streak = 0;
    let mut current_date = chrono::Utc::now().naive_utc().date();

    for (date_str, ) in logs {
        let log_date = chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
            .unwrap_or(current_date);

        let days_diff = (current_date - log_date).num_days();

        if days_diff == 0 || days_diff == 1 {
            streak += 1;
            current_date = log_date;
        } else {
            break;
        }
    }

    Ok(streak)
}

async fn calculate_best_streak(pool: &Pool<Sqlite>, habit_id: i64) -> Result<i64, sqlx::Error> {
    let logs = sqlx::query_as::<_, (String,)>(
        r#"
        SELECT date FROM habit_logs
        WHERE habit_id = ?1 AND completed = 1
        ORDER BY date ASC
        "#,
    )
    .bind(habit_id)
    .fetch_all(pool)
    .await?;

    if logs.is_empty() {
        return Ok(0);
    }

    let mut best_streak = 0;
    let mut current_streak = 0;
    let mut prev_date: Option<chrono::NaiveDate> = None;

    for (date_str, ) in logs {
        let log_date = chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
            .unwrap_or_else(|_| chrono::Utc::now().naive_utc().date());

        if let Some(pd) = prev_date {
            let days_diff = (log_date - pd).num_days();
            if days_diff == 1 {
                current_streak += 1;
            } else {
                best_streak = best_streak.max(current_streak);
                current_streak = 1;
            }
        } else {
            current_streak = 1;
        }

        prev_date = Some(log_date);
    }

    best_streak = best_streak.max(current_streak);
    Ok(best_streak)
}
