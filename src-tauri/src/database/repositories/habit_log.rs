use sqlx::{Pool, Sqlite};
use crate::database::models::habit_log::{HabitLog, CreateHabitLogRequest, UpdateHabitLogRequest};

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
