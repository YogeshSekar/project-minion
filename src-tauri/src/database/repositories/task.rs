use sqlx::{Pool, Sqlite};
use crate::database::models::task::{Task, CreateTaskRequest, UpdateTaskRequest};

pub async fn create_task(
    pool: &Pool<Sqlite>,
    req: CreateTaskRequest,
) -> Result<Task, sqlx::Error> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        INSERT INTO tasks (title, description, status, priority, due_date, scheduled_date, project_id, is_recurring, recurrence_type, recurrence_interval)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
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
    .bind(req.is_recurring.unwrap_or(0))
    .bind(&req.recurrence_type)
    .bind(req.recurrence_interval.unwrap_or(1))
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
            due_date = ?5, scheduled_date = ?6, project_id = ?7, 
            is_recurring = ?8, recurrence_type = ?9, recurrence_interval = ?10, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?11
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
    .bind(req.is_recurring.unwrap_or(0))
    .bind(&req.recurrence_type)
    .bind(req.recurrence_interval.unwrap_or(1))
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(task)
}

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
