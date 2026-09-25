use sqlx::{Pool, Sqlite};

pub async fn get_task_ids_for_page(
    pool: &Pool<Sqlite>,
    page_id: i64,
) -> Result<Vec<i64>, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        "SELECT task_id FROM page_tasks WHERE page_id = ?1 ORDER BY sort_order, created_at",
    )
    .bind(page_id)
    .fetch_all(pool)
    .await
}

pub async fn get_page_ids_for_task(
    pool: &Pool<Sqlite>,
    task_id: i64,
) -> Result<Vec<i64>, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        "SELECT page_id FROM page_tasks WHERE task_id = ?1 ORDER BY created_at",
    )
    .bind(task_id)
    .fetch_all(pool)
    .await
}

pub async fn link_task_to_page(
    pool: &Pool<Sqlite>,
    page_id: i64,
    task_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT OR IGNORE INTO page_tasks (page_id, task_id) VALUES (?1, ?2)")
        .bind(page_id)
        .bind(task_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn unlink_task_from_page(
    pool: &Pool<Sqlite>,
    page_id: i64,
    task_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM page_tasks WHERE page_id = ?1 AND task_id = ?2")
        .bind(page_id)
        .bind(task_id)
        .execute(pool)
        .await?;
    Ok(())
}
