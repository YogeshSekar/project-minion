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
        .after_connect(|connection, _metadata| {
            Box::pin(async move {
                sqlx::query("PRAGMA foreign_keys = ON")
                    .execute(connection)
                    .await?;
                Ok(())
            })
        })
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
            status TEXT NOT NULL DEFAULT 'planning',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Normalize the legacy project status to the current project workflow.
    sqlx::query("UPDATE projects SET status = 'in_progress' WHERE status = 'active'")
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
            meeting_id TEXT,
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
    .await
    .ok(); // Ignore error if column already exists

    sqlx::query(
        r#"
        ALTER TABLE tasks ADD COLUMN recurrence_type TEXT
        "#,
    )
    .execute(pool)
    .await
    .ok(); // Ignore error if column already exists

    sqlx::query(
        r#"
        ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER DEFAULT 1
        "#,
    )
    .execute(pool)
    .await
    .ok(); // Ignore error if column already exists

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
            project_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    let meeting_columns: Vec<String> =
        sqlx::query_scalar("SELECT name FROM pragma_table_info('meetings')")
            .fetch_all(pool)
            .await?;
    if !meeting_columns.iter().any(|column| column == "project_id") {
        sqlx::query("ALTER TABLE meetings ADD COLUMN project_id INTEGER")
            .execute(pool)
            .await?;
    }

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
            meeting_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Pages workspace. This intentionally lives alongside the legacy notes table
    // until existing notes have been migrated manually.
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            area_id INTEGER,
            title TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            page_type TEXT NOT NULL DEFAULT 'general',
            status TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('draft', 'active', 'blocked', 'completed', 'archived')),
            sort_order INTEGER NOT NULL DEFAULT 0,
            meeting_id TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            archived_at DATETIME,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
            FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Links Pages to the existing tasks table. Removing a Page only removes its
    // links; it never deletes the task itself.
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS page_tasks (
            page_id INTEGER NOT NULL,
            task_id INTEGER NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (page_id, task_id),
            FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS page_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_id INTEGER NOT NULL,
            update_date TEXT NOT NULL,
            content TEXT NOT NULL,
            status_snapshot TEXT,
            progress_snapshot INTEGER
                CHECK (progress_snapshot IS NULL OR progress_snapshot BETWEEN 0 AND 100),
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_areas_project_id ON areas(project_id)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_areas_sort_order ON areas(project_id, sort_order)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_pages_project_id ON pages(project_id)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_pages_area_id ON pages(area_id)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_page_tasks_task_id ON page_tasks(task_id)")
        .execute(pool)
        .await?;

    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS meeting_pages (
            meeting_id INTEGER NOT NULL,
            page_id INTEGER NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (meeting_id, page_id),
            FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
            FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
        )"#,
    )
    .execute(pool)
    .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_meeting_pages_page_id ON meeting_pages(page_id)")
        .execute(pool)
        .await?;
    sqlx::query(
        "INSERT OR IGNORE INTO meeting_pages (meeting_id, page_id) SELECT m.id, p.id FROM pages p JOIN meetings m ON m.outlook_id = p.meeting_id WHERE p.meeting_id IS NOT NULL",
    )
    .execute(pool)
    .await?;
    sqlx::query(
        "UPDATE pages SET meeting_id = NULL WHERE meeting_id IS NOT NULL AND EXISTS (SELECT 1 FROM meetings m JOIN meeting_pages mp ON mp.meeting_id = m.id WHERE m.outlook_id = pages.meeting_id AND mp.page_id = pages.id)",
    )
    .execute(pool)
    .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_page_updates_page_date ON page_updates(page_id, update_date DESC)")
        .execute(pool)
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS page_pins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_id INTEGER NOT NULL,
            kind TEXT NOT NULL CHECK (kind IN ('text', 'page')),
            text TEXT NOT NULL,
            linked_page_id INTEGER,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
            FOREIGN KEY (linked_page_id) REFERENCES pages(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_page_pins_page_id ON page_pins(page_id)")
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
            duration_seconds INTEGER,
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

    let activity_columns: Vec<String> =
        sqlx::query_scalar("SELECT name FROM pragma_table_info('activities')")
            .fetch_all(pool)
            .await?;
    if !activity_columns
        .iter()
        .any(|column| column == "duration_seconds")
    {
        sqlx::query("ALTER TABLE activities ADD COLUMN duration_seconds INTEGER")
            .execute(pool)
            .await?;
    }
    sqlx::query(
        "UPDATE activities SET duration_seconds = duration_minutes * 60 WHERE duration_seconds IS NULL AND duration_minutes IS NOT NULL",
    )
    .execute(pool)
    .await?;
    // Preserve the newest running entry if an older build left multiple sessions open.
    sqlx::query(
        "UPDATE activities SET status = 'completed', end_time = COALESCE(end_time, start_time), duration_minutes = COALESCE(duration_minutes, 0), duration_seconds = COALESCE(duration_seconds, 0) WHERE status = 'running' AND id NOT IN (SELECT id FROM activities WHERE status = 'running' ORDER BY start_time DESC LIMIT 1)",
    )
    .execute(pool)
    .await?;
    sqlx::query("CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_single_running ON activities(status) WHERE status = 'running'")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_activities_reference ON activities(reference_type, reference_id)")
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

    // Add migrations for meeting_id columns
    sqlx::query(
        r#"
        ALTER TABLE tasks ADD COLUMN meeting_id TEXT
        "#,
    )
    .execute(pool)
    .await
    .ok();

    sqlx::query(
        r#"
        ALTER TABLE notes ADD COLUMN meeting_id TEXT
        "#,
    )
    .execute(pool)
    .await
    .ok();

    Ok(())
}
