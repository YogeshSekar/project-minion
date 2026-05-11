use sqlx::{Pool, Sqlite};
use crate::database::models::task_completion_log::{TaskCompletionLog, CreateTaskCompletionLogRequest, UpdateTaskCompletionLogRequest};

pub async fn create_task_completion_log(
    pool: &Pool<Sqlite>,
    req: CreateTaskCompletionLogRequest,
) -> Result<TaskCompletionLog, sqlx::Error> {
    let log = sqlx::query_as::<_, TaskCompletionLog>(
        r#"
        INSERT INTO task_completion_logs (task_id, occurrence_date, completed_at, actual_minutes, notes)
        VALUES (?1, ?2, ?3, ?4, ?5)
        RETURNING *
        "#,
    )
    .bind(req.task_id)
    .bind(&req.occurrence_date)
    .bind(&req.completed_at)
    .bind(req.actual_minutes)
    .bind(&req.notes)
    .fetch_one(pool)
    .await?;

    Ok(log)
}

pub async fn update_task_completion_log(
    pool: &Pool<Sqlite>,
    req: UpdateTaskCompletionLogRequest,
) -> Result<TaskCompletionLog, sqlx::Error> {
    let log = sqlx::query_as::<_, TaskCompletionLog>(
        r#"
        UPDATE task_completion_logs 
        SET task_id = ?1, occurrence_date = ?2, completed_at = ?3, 
            actual_minutes = ?4, notes = ?5, is_undone = ?6
        WHERE id = ?7
        RETURNING *
        "#,
    )
    .bind(req.task_id)
    .bind(&req.occurrence_date)
    .bind(&req.completed_at)
    .bind(req.actual_minutes)
    .bind(&req.notes)
    .bind(req.is_undone.unwrap_or(0))
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(log)
}

pub async fn get_task_completion_logs_by_task(
    pool: &Pool<Sqlite>,
    task_id: i64,
) -> Result<Vec<TaskCompletionLog>, sqlx::Error> {
    let logs = sqlx::query_as::<_, TaskCompletionLog>(
        r#"
        SELECT * FROM task_completion_logs 
        WHERE task_id = ?1 
        ORDER BY occurrence_date DESC, completed_at DESC
        "#,
    )
    .bind(task_id)
    .fetch_all(pool)
    .await?;

    Ok(logs)
}

pub async fn get_task_completion_log_by_id(
    pool: &Pool<Sqlite>,
    id: i64,
) -> Result<Option<TaskCompletionLog>, sqlx::Error> {
    let log = sqlx::query_as::<_, TaskCompletionLog>(
        r#"
        SELECT * FROM task_completion_logs 
        WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(log)
}

pub async fn delete_task_completion_log(
    pool: &Pool<Sqlite>,
    id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM task_completion_logs WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn mark_completion_log_undone(
    pool: &Pool<Sqlite>,
    id: i64,
) -> Result<TaskCompletionLog, sqlx::Error> {
    let log = sqlx::query_as::<_, TaskCompletionLog>(
        r#"
        UPDATE task_completion_logs 
        SET is_undone = 1
        WHERE id = ?1
        RETURNING *
        "#,
    )
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(log)
}

pub async fn get_completion_logs_by_date_range(
    pool: &Pool<Sqlite>,
    start_date: &str,
    end_date: &str,
) -> Result<Vec<TaskCompletionLog>, sqlx::Error> {
    let logs = sqlx::query_as::<_, TaskCompletionLog>(
        r#"
        SELECT * FROM task_completion_logs 
        WHERE occurrence_date BETWEEN ?1 AND ?2 
        ORDER BY occurrence_date DESC, completed_at DESC
        "#,
    )
    .bind(start_date)
    .bind(end_date)
    .fetch_all(pool)
    .await?;

    Ok(logs)
}
