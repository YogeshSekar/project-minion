use sqlx::{Pool, Sqlite};
use crate::database::models::activity::{Activity, CreateActivityRequest, UpdateActivityRequest};

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
