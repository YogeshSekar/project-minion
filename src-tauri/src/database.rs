use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::path::PathBuf;
use chrono::Datelike;

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
    pub parent_task_id: Option<i64>,
    pub estimated_minutes: Option<i64>,
    pub is_recurring: Option<i64>,
    pub recurrence_rule: Option<String>,
    pub recurrence_end_date: Option<String>,
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
    pub parent_task_id: Option<i64>,
    pub estimated_minutes: Option<i64>,
    pub is_recurring: Option<i64>,
    pub recurrence_rule: Option<String>,
    pub recurrence_end_date: Option<String>,
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
    pub parent_task_id: Option<i64>,
    pub estimated_minutes: Option<i64>,
    pub is_recurring: Option<i64>,
    pub recurrence_rule: Option<String>,
    pub recurrence_end_date: Option<String>,
}

// TaskOccurrence structs
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaskOccurrence {
    pub id: i64,
    pub task_id: i64,
    pub occurrence_date: String,
    pub due_date: Option<String>,
    pub status: String,
    pub actual_minutes: i64,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub reminder_generated: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskOccurrenceRequest {
    pub task_id: i64,
    pub occurrence_date: String,
    pub due_date: Option<String>,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskOccurrenceRequest {
    pub id: i64,
    pub task_id: i64,
    pub occurrence_date: String,
    pub due_date: Option<String>,
    pub status: String,
    pub actual_minutes: i64,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub reminder_generated: i64,
}

// TaskReminder structs
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaskReminder {
    pub id: i64,
    pub occurrence_id: i64,
    pub reminder_time: String,
    pub is_sent: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskReminderRequest {
    pub occurrence_id: i64,
    pub reminder_time: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskReminderRequest {
    pub id: i64,
    pub occurrence_id: i64,
    pub reminder_time: String,
    pub is_sent: i64,
}

// Unified TaskView DTO for frontend consumption
// Combines data from tasks, task_occurrences, and reminder counts
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaskView {
    pub occurrence_id: i64,
    pub task_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub estimated_minutes: Option<i64>,
    pub actual_minutes: i64,
    pub is_recurring: Option<i64>,
    pub recurrence_rule: Option<String>,
    pub recurrence_end_date: Option<String>,
    pub parent_task_id: Option<i64>,
    pub project_id: Option<i64>,
    pub occurrence_date: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub reminder_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

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
            parent_task_id INTEGER,
            estimated_minutes INTEGER DEFAULT 0,
            is_recurring INTEGER DEFAULT 0,
            recurrence_rule TEXT,
            recurrence_end_date TEXT,
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

    // Create task_occurrences table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS task_occurrences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            occurrence_date TEXT NOT NULL,
            due_date TEXT,
            status TEXT NOT NULL DEFAULT 'todo',
            actual_minutes INTEGER DEFAULT 0,
            started_at DATETIME,
            completed_at DATETIME,
            reminder_generated INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(&pool)
    .await?;

    // Create indexes for task_occurrences
    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_task_occurrences_task_id ON task_occurrences(task_id)
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_task_occurrences_occurrence_date ON task_occurrences(occurrence_date)
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_task_occurrences_status ON task_occurrences(status)
        "#,
    )
    .execute(&pool)
    .await?;

    // Create task_reminders table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS task_reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            occurrence_id INTEGER NOT NULL,
            reminder_time TEXT NOT NULL,
            is_sent INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (occurrence_id) REFERENCES task_occurrences(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(&pool)
    .await?;

    // Create index for task_reminders
    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_task_reminders_occurrence_id ON task_reminders(occurrence_id)
        "#,
    )
    .execute(&pool)
    .await?;

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
        INSERT INTO tasks (title, description, status, priority, due_date, scheduled_date, project_id, parent_task_id, estimated_minutes, is_recurring, recurrence_rule, recurrence_end_date)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
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
    .bind(req.parent_task_id)
    .bind(req.estimated_minutes)
    .bind(req.is_recurring)
    .bind(&req.recurrence_rule)
    .bind(&req.recurrence_end_date)
    .fetch_one(pool)
    .await?;

    // Automatically create first occurrence for the task
    let occurrence_date = req.scheduled_date.as_ref().or(req.due_date.as_ref()).cloned().unwrap_or_else(|| {
        chrono::Utc::now().format("%Y-%m-%d").to_string()
    });

    let _occurrence = sqlx::query_as::<_, TaskOccurrence>(
        r#"
        INSERT INTO task_occurrences (task_id, occurrence_date, due_date, status)
        VALUES (?1, ?2, ?3, ?4)
        RETURNING *
        "#,
    )
    .bind(task.id)
    .bind(&occurrence_date)
    .bind(&req.due_date)
    .bind(&req.status)
    .fetch_one(pool)
    .await?;

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
            due_date = ?5, scheduled_date = ?6, project_id = ?7, parent_task_id = ?8,
            estimated_minutes = ?9, is_recurring = ?10, recurrence_rule = ?11, 
            recurrence_end_date = ?12, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?13
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
    .bind(req.parent_task_id)
    .bind(req.estimated_minutes)
    .bind(req.is_recurring)
    .bind(&req.recurrence_rule)
    .bind(&req.recurrence_end_date)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(task)
}

// TaskView functions - return unified flattened task data for frontend
pub async fn get_all_task_views(pool: &Pool<Sqlite>) -> Result<Vec<TaskView>, sqlx::Error> {
    let task_views = sqlx::query_as::<_, TaskView>(
        r#"
        SELECT
            COALESCE(to_occ.id, t.id) as occurrence_id,
            t.id as task_id,
            t.title,
            t.description,
            COALESCE(to_occ.status, t.status) as status,
            t.priority,
            t.due_date,
            t.scheduled_date,
            t.estimated_minutes,
            COALESCE(to_occ.actual_minutes, 0) as actual_minutes,
            t.is_recurring,
            t.recurrence_rule,
            t.recurrence_end_date,
            t.parent_task_id,
            t.project_id,
            COALESCE(to_occ.occurrence_date, t.scheduled_date) as occurrence_date,
            to_occ.started_at,
            to_occ.completed_at,
            COALESCE(COUNT(tr.id), 0) as reminder_count,
            t.created_at,
            t.updated_at
        FROM tasks t
        LEFT JOIN task_occurrences to_occ ON to_occ.task_id = t.id
        LEFT JOIN task_reminders tr ON tr.occurrence_id = to_occ.id
        GROUP BY t.id, to_occ.id
        ORDER BY t.created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    // DEBUG: Log raw SQL query results
    println!("[DEBUG] get_all_task_views: Returned {} task views", task_views.len());
    for (i, tv) in task_views.iter().enumerate() {
        println!("[DEBUG] TaskView[{}]: occurrence_id={}, task_id={}, title='{}', status='{}', occurrence_date='{}'",
            i, tv.occurrence_id, tv.task_id, tv.title, tv.status, tv.occurrence_date);
    }

    Ok(task_views)
}

pub async fn get_task_views_by_project(pool: &Pool<Sqlite>, project_id: i64) -> Result<Vec<TaskView>, sqlx::Error> {
    let task_views = sqlx::query_as::<_, TaskView>(
        r#"
        SELECT
            COALESCE(to_occ.id, t.id) as occurrence_id,
            t.id as task_id,
            t.title,
            t.description,
            COALESCE(to_occ.status, t.status) as status,
            t.priority,
            t.due_date,
            t.scheduled_date,
            t.estimated_minutes,
            COALESCE(to_occ.actual_minutes, 0) as actual_minutes,
            t.is_recurring,
            t.recurrence_rule,
            t.recurrence_end_date,
            t.parent_task_id,
            t.project_id,
            COALESCE(to_occ.occurrence_date, t.scheduled_date) as occurrence_date,
            to_occ.started_at,
            to_occ.completed_at,
            COALESCE(COUNT(tr.id), 0) as reminder_count,
            t.created_at,
            t.updated_at
        FROM tasks t
        LEFT JOIN task_occurrences to_occ ON to_occ.task_id = t.id
        LEFT JOIN task_reminders tr ON tr.occurrence_id = to_occ.id
        WHERE t.project_id = ?1
        GROUP BY t.id, to_occ.id
        ORDER BY t.created_at DESC
        "#,
    )
    .bind(project_id)
    .fetch_all(pool)
    .await?;

    Ok(task_views)
}

pub async fn get_task_view_by_occurrence(pool: &Pool<Sqlite>, occurrence_id: i64) -> Result<Option<TaskView>, sqlx::Error> {
    let task_view = sqlx::query_as::<_, TaskView>(
        r#"
        SELECT
            to.id as occurrence_id,
            t.id as task_id,
            t.title,
            t.description,
            to.status,
            t.priority,
            t.due_date,
            t.scheduled_date,
            t.estimated_minutes,
            to.actual_minutes,
            t.is_recurring,
            t.recurrence_rule,
            t.recurrence_end_date,
            t.parent_task_id,
            t.project_id,
            to.occurrence_date,
            to.started_at,
            to.completed_at,
            COALESCE(COUNT(tr.id), 0) as reminder_count,
            t.created_at,
            t.updated_at
        FROM task_occurrences to
        INNER JOIN tasks t ON to.task_id = t.id
        LEFT JOIN task_reminders tr ON tr.occurrence_id = to.id
        WHERE to.id = ?1
        GROUP BY to.id, t.id
        "#,
    )
    .bind(occurrence_id)
    .fetch_optional(pool)
    .await?;

    Ok(task_view)
}

// Complete a task occurrence and optionally generate next occurrence for recurring tasks
pub async fn complete_task_occurrence(
    pool: &Pool<Sqlite>,
    occurrence_id: i64,
    actual_minutes: i64,
) -> Result<TaskOccurrence, sqlx::Error> {
    // First, get the occurrence to find its task
    let occurrence = sqlx::query_as::<_, TaskOccurrence>(
        r#"
        SELECT * FROM task_occurrences WHERE id = ?1
        "#,
    )
    .bind(occurrence_id)
    .fetch_one(pool)
    .await?;

    // Update the occurrence as completed
    let updated_occurrence = sqlx::query_as::<_, TaskOccurrence>(
        r#"
        UPDATE task_occurrences 
        SET status = 'completed', actual_minutes = ?1, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?2
        RETURNING *
        "#,
    )
    .bind(actual_minutes)
    .bind(occurrence_id)
    .fetch_one(pool)
    .await?;

    // Check if the parent task is recurring and generate next occurrence
    let task = sqlx::query_as::<_, Task>(
        r#"
        SELECT * FROM tasks WHERE id = ?1
        "#,
    )
    .bind(occurrence.task_id)
    .fetch_one(pool)
    .await?;

    if task.is_recurring == Some(1) && task.recurrence_rule.is_some() {
        // Check if recurrence has ended
        if let Some(end_date) = &task.recurrence_end_date {
            let current_date = chrono::Utc::now().format("%Y-%m-%d").to_string();
            if current_date > *end_date {
                return Ok(updated_occurrence);
            }
        }

        // Calculate next occurrence date based on recurrence rule
        let next_date = calculate_next_occurrence(&occurrence.occurrence_date, task.recurrence_rule.as_ref().unwrap())?;

        // Create next occurrence
        let _next_occurrence = sqlx::query_as::<_, TaskOccurrence>(
            r#"
            INSERT INTO task_occurrences (task_id, occurrence_date, due_date, status)
            VALUES (?1, ?2, ?3, 'todo')
            RETURNING *
            "#,
        )
        .bind(task.id)
        .bind(&next_date)
        .bind(&task.due_date)
        .fetch_one(pool)
        .await?;
    }

    Ok(updated_occurrence)
}

// Helper function to calculate next occurrence date based on recurrence rule
fn calculate_next_occurrence(current_date: &str, recurrence_rule: &str) -> Result<String, sqlx::Error> {
    let date = chrono::NaiveDate::parse_from_str(current_date, "%Y-%m-%d")
        .map_err(|e| sqlx::Error::Io(std::io::Error::new(std::io::ErrorKind::InvalidData, e)))?;

    let next_date = match recurrence_rule {
        "daily" => date + chrono::Duration::days(1),
        "weekly" => date + chrono::Duration::weeks(1),
        "biweekly" => date + chrono::Duration::weeks(2),
        "monthly" => {
            // Add one month
            let mut next = date.clone();
            if next.month() == 12 {
                next = date.with_year(next.year() + 1).unwrap();
                next = next.with_month(1).unwrap();
            } else {
                next = next.with_month(next.month() + 1).unwrap();
            }
            next
        }
        _ => return Err(sqlx::Error::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            format!("Unknown recurrence rule: {}", recurrence_rule)
        ))),
    };

    Ok(next_date.format("%Y-%m-%d").to_string())
}

// TaskOccurrence CRUD operations
pub async fn create_task_occurrence(
    pool: &Pool<Sqlite>,
    req: CreateTaskOccurrenceRequest,
) -> Result<TaskOccurrence, sqlx::Error> {
    let occurrence = sqlx::query_as::<_, TaskOccurrence>(
        r#"
        INSERT INTO task_occurrences (task_id, occurrence_date, due_date, status)
        VALUES (?1, ?2, ?3, ?4)
        RETURNING *
        "#,
    )
    .bind(req.task_id)
    .bind(&req.occurrence_date)
    .bind(&req.due_date)
    .bind(&req.status)
    .fetch_one(pool)
    .await?;

    Ok(occurrence)
}

pub async fn get_all_task_occurrences(pool: &Pool<Sqlite>) -> Result<Vec<TaskOccurrence>, sqlx::Error> {
    let occurrences = sqlx::query_as::<_, TaskOccurrence>(
        r#"
        SELECT * FROM task_occurrences ORDER BY occurrence_date DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(occurrences)
}

pub async fn get_task_occurrences_by_task(pool: &Pool<Sqlite>, task_id: i64) -> Result<Vec<TaskOccurrence>, sqlx::Error> {
    let occurrences = sqlx::query_as::<_, TaskOccurrence>(
        r#"
        SELECT * FROM task_occurrences WHERE task_id = ?1 ORDER BY occurrence_date DESC
        "#,
    )
    .bind(task_id)
    .fetch_all(pool)
    .await?;

    Ok(occurrences)
}

pub async fn get_task_occurrence_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<TaskOccurrence>, sqlx::Error> {
    let occurrence = sqlx::query_as::<_, TaskOccurrence>(
        r#"
        SELECT * FROM task_occurrences WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(occurrence)
}

pub async fn update_task_occurrence(
    pool: &Pool<Sqlite>,
    req: UpdateTaskOccurrenceRequest,
) -> Result<TaskOccurrence, sqlx::Error> {
    println!("[DEBUG] update_task_occurrence called with id={}, task_id={}, status={}", req.id, req.task_id, req.status);
    
    // First check if the occurrence exists
    let exists: Option<i64> = sqlx::query_scalar("SELECT id FROM task_occurrences WHERE id = ?1")
        .bind(req.id)
        .fetch_optional(pool)
        .await?;
    
    if exists.is_none() {
        println!("[DEBUG] update_task_occurrence: occurrence id={} not found, creating it", req.id);
        // Occurrence doesn't exist, create it instead (auto-generate ID since it's AUTOINCREMENT)
        let occurrence = sqlx::query_as::<_, TaskOccurrence>(
            r#"
            INSERT INTO task_occurrences (task_id, occurrence_date, due_date, status, actual_minutes, started_at, completed_at, reminder_generated)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            RETURNING *
            "#,
        )
        .bind(req.task_id)
        .bind(&req.occurrence_date)
        .bind(&req.due_date)
        .bind(&req.status)
        .bind(req.actual_minutes)
        .bind(&req.started_at)
        .bind(&req.completed_at)
        .bind(req.reminder_generated)
        .fetch_one(pool)
        .await?;
        println!("[DEBUG] update_task_occurrence created new occurrence id={}", occurrence.id);
        return Ok(occurrence);
    }
    
    let occurrence = sqlx::query_as::<_, TaskOccurrence>(
        r#"
        UPDATE task_occurrences 
        SET task_id = ?1, occurrence_date = ?2, due_date = ?3, status = ?4,
            actual_minutes = ?5, started_at = ?6, completed_at = ?7, 
            reminder_generated = ?8
        WHERE id = ?9
        RETURNING *
        "#,
    )
    .bind(req.task_id)
    .bind(&req.occurrence_date)
    .bind(&req.due_date)
    .bind(&req.status)
    .bind(req.actual_minutes)
    .bind(&req.started_at)
    .bind(&req.completed_at)
    .bind(req.reminder_generated)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    println!("[DEBUG] update_task_occurrence successfully updated occurrence id={}", req.id);
    Ok(occurrence)
}

pub async fn delete_task_occurrence(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM task_occurrences WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

// TaskReminder CRUD operations
pub async fn create_task_reminder(
    pool: &Pool<Sqlite>,
    req: CreateTaskReminderRequest,
) -> Result<TaskReminder, sqlx::Error> {
    let reminder = sqlx::query_as::<_, TaskReminder>(
        r#"
        INSERT INTO task_reminders (occurrence_id, reminder_time)
        VALUES (?1, ?2)
        RETURNING *
        "#,
    )
    .bind(req.occurrence_id)
    .bind(&req.reminder_time)
    .fetch_one(pool)
    .await?;

    Ok(reminder)
}

pub async fn get_all_task_reminders(pool: &Pool<Sqlite>) -> Result<Vec<TaskReminder>, sqlx::Error> {
    let reminders = sqlx::query_as::<_, TaskReminder>(
        r#"
        SELECT * FROM task_reminders ORDER BY reminder_time ASC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(reminders)
}

pub async fn get_task_reminders_by_occurrence(pool: &Pool<Sqlite>, occurrence_id: i64) -> Result<Vec<TaskReminder>, sqlx::Error> {
    let reminders = sqlx::query_as::<_, TaskReminder>(
        r#"
        SELECT * FROM task_reminders WHERE occurrence_id = ?1 ORDER BY reminder_time ASC
        "#,
    )
    .bind(occurrence_id)
    .fetch_all(pool)
    .await?;

    Ok(reminders)
}

pub async fn get_task_reminder_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<TaskReminder>, sqlx::Error> {
    let reminder = sqlx::query_as::<_, TaskReminder>(
        r#"
        SELECT * FROM task_reminders WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(reminder)
}

pub async fn update_task_reminder(
    pool: &Pool<Sqlite>,
    req: UpdateTaskReminderRequest,
) -> Result<TaskReminder, sqlx::Error> {
    let reminder = sqlx::query_as::<_, TaskReminder>(
        r#"
        UPDATE task_reminders 
        SET occurrence_id = ?1, reminder_time = ?2, is_sent = ?3
        WHERE id = ?4
        RETURNING *
        "#,
    )
    .bind(req.occurrence_id)
    .bind(&req.reminder_time)
    .bind(req.is_sent)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(reminder)
}

pub async fn delete_task_reminder(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM task_reminders WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

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
