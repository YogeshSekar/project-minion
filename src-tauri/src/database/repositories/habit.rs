use sqlx::{Pool, Sqlite};
use crate::database::models::habit::{Habit, CreateHabitRequest, UpdateHabitRequest};
use chrono::{Utc, NaiveDate};

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

/// Helper function to get habit with calculated stats
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
    let _today = Utc::now().format("%Y-%m-%d").to_string();

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
    let mut current_date = Utc::now().naive_utc().date();

    for (date_str, ) in logs {
        let log_date = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
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
    let mut prev_date: Option<NaiveDate> = None;

    for (date_str, ) in logs {
        let log_date = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
            .unwrap_or_else(|_| Utc::now().naive_utc().date());

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
