use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
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
