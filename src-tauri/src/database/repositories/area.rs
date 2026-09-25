use crate::database::models::area::{Area, CreateAreaRequest, UpdateAreaRequest};
use sqlx::{Pool, Sqlite};

pub async fn create_area(pool: &Pool<Sqlite>, req: CreateAreaRequest) -> Result<Area, sqlx::Error> {
    sqlx::query_as::<_, Area>(
        r#"
        INSERT INTO areas (project_id, title, description, sort_order)
        VALUES (?1, ?2, ?3, ?4)
        RETURNING *
        "#,
    )
    .bind(req.project_id)
    .bind(req.title.trim())
    .bind(&req.description)
    .bind(req.sort_order.unwrap_or(0))
    .fetch_one(pool)
    .await
}

pub async fn get_all_areas(pool: &Pool<Sqlite>) -> Result<Vec<Area>, sqlx::Error> {
    sqlx::query_as::<_, Area>(
        "SELECT * FROM areas ORDER BY project_id, sort_order, title COLLATE NOCASE",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_areas_by_project(
    pool: &Pool<Sqlite>,
    project_id: i64,
) -> Result<Vec<Area>, sqlx::Error> {
    sqlx::query_as::<_, Area>(
        "SELECT * FROM areas WHERE project_id = ?1 ORDER BY sort_order, title COLLATE NOCASE",
    )
    .bind(project_id)
    .fetch_all(pool)
    .await
}

pub async fn get_area_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<Area>, sqlx::Error> {
    sqlx::query_as::<_, Area>("SELECT * FROM areas WHERE id = ?1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn update_area(pool: &Pool<Sqlite>, req: UpdateAreaRequest) -> Result<Area, sqlx::Error> {
    sqlx::query_as::<_, Area>(
        r#"
        UPDATE areas
        SET project_id = ?1, title = ?2, description = ?3, sort_order = ?4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?5
        RETURNING *
        "#,
    )
    .bind(req.project_id)
    .bind(req.title.trim())
    .bind(&req.description)
    .bind(req.sort_order)
    .bind(req.id)
    .fetch_one(pool)
    .await
}

pub async fn delete_area(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM areas WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
