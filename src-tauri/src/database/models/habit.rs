use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
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
