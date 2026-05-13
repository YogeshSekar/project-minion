// Database connection and initialization
// TODO: Move database connection logic from database.rs

use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::path::PathBuf;

/// Initialize database connection and create all tables
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

    create_tables(&pool).await?;

    Ok(pool)
}

/// Create all database tables and indexes
async fn create_tables(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // Create projects table
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
    .execute(pool)
    .await?;

    // Create tasks table
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
            is_recurring INTEGER NOT NULL DEFAULT 0,
            recurrence_type TEXT,
            recurrence_interval INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Add migration for recurring columns if they don't exist
    sqlx::query(
        r#"
        ALTER TABLE tasks ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0
        "#,
    )
    .execute(pool)
    .await.ok(); // Ignore error if column already exists

    sqlx::query(
        r#"
        ALTER TABLE tasks ADD COLUMN recurrence_type TEXT
        "#,
    )
    .execute(pool)
    .await.ok(); // Ignore error if column already exists

    sqlx::query(
        r#"
        ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER DEFAULT 1
        "#,
    )
    .execute(pool)
    .await.ok(); // Ignore error if column already exists

    // Create indexes for tasks table
    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date)
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
        "#,
    )
    .execute(pool)
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
    .execute(pool)
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
    .execute(pool)
    .await?;

    // Create activities table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            activity_type TEXT NOT NULL,
            reference_type TEXT,
            reference_id INTEGER,
            session_group_id TEXT,
            start_time TEXT NOT NULL,
            end_time TEXT,
            duration_minutes INTEGER,
            status TEXT NOT NULL DEFAULT 'completed',
            source TEXT NOT NULL DEFAULT 'manual',
            is_auto_tracked INTEGER NOT NULL DEFAULT 0,
            is_locked INTEGER NOT NULL DEFAULT 0,
            project_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create habits table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS habits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            color TEXT NOT NULL,
            icon TEXT NOT NULL,
            target INTEGER NOT NULL,
            streak INTEGER NOT NULL DEFAULT 0,
            best_streak INTEGER NOT NULL DEFAULT 0,
            description TEXT,
            time_preference TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create habit_logs table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS habit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            habit_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            completed INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create task_completion_logs table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS task_completion_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            occurrence_date TEXT NOT NULL,
            completed_at TEXT NOT NULL,
            actual_minutes INTEGER,
            notes TEXT,
            is_undone INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create task_checklist_items table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS task_checklist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            is_completed INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create indexes for task_completion_logs table
    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_completion_task_id ON task_completion_logs(task_id)
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_completion_occurrence_date ON task_completion_logs(occurrence_date)
        "#,
    )
    .execute(pool)
    .await?;

    // Create indexes for task_checklist_items table
    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_checklist_task_id ON task_checklist_items(task_id)
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_checklist_sort_order ON task_checklist_items(sort_order)
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}
