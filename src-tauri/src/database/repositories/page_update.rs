use crate::database::models::page_update::{
    CreatePageUpdateRequest, PageUpdate, UpdatePageUpdateRequest,
};
use sqlx::{Pool, Sqlite};

pub async fn get_page_updates(
    pool: &Pool<Sqlite>,
    page_id: i64,
) -> Result<Vec<PageUpdate>, sqlx::Error> {
    sqlx::query_as::<_, PageUpdate>(
        "SELECT * FROM page_updates WHERE page_id = ?1 ORDER BY created_at ASC, id ASC",
    )
    .bind(page_id)
    .fetch_all(pool)
    .await
}

pub async fn create_page_update(
    pool: &Pool<Sqlite>,
    request: CreatePageUpdateRequest,
) -> Result<PageUpdate, sqlx::Error> {
    sqlx::query_as::<_, PageUpdate>(
        "INSERT INTO page_updates (page_id, update_date, content) VALUES (?1, ?2, ?3) RETURNING *",
    )
    .bind(request.page_id)
    .bind(request.update_date)
    .bind(request.content)
    .fetch_one(pool)
    .await
}

pub async fn update_page_update(
    pool: &Pool<Sqlite>,
    request: UpdatePageUpdateRequest,
) -> Result<PageUpdate, sqlx::Error> {
    sqlx::query_as::<_, PageUpdate>(
        "UPDATE page_updates SET content = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2 RETURNING *"
    )
    .bind(request.content)
    .bind(request.id)
    .fetch_one(pool)
    .await
}

pub async fn delete_page_update(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query_scalar::<_, i64>("DELETE FROM page_updates WHERE id = ?1 RETURNING id")
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(())
}
