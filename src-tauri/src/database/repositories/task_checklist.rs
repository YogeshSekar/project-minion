use sqlx::{Pool, Sqlite};
use crate::database::models::task_checklist::{TaskChecklistItem, CreateTaskChecklistItemRequest, UpdateTaskChecklistItemRequest};

pub async fn create_checklist_item(
    pool: &Pool<Sqlite>,
    req: CreateTaskChecklistItemRequest,
) -> Result<TaskChecklistItem, sqlx::Error> {
    let item = sqlx::query_as::<_, TaskChecklistItem>(
        r#"
        INSERT INTO task_checklist_items (task_id, text, is_completed, sort_order)
        VALUES (?1, ?2, ?3, ?4)
        RETURNING *
        "#,
    )
    .bind(req.task_id)
    .bind(&req.text)
    .bind(req.is_completed.unwrap_or(0))
    .bind(req.sort_order.unwrap_or(0))
    .fetch_one(pool)
    .await?;

    Ok(item)
}

pub async fn get_checklist_items_by_task(
    pool: &Pool<Sqlite>,
    task_id: i64,
) -> Result<Vec<TaskChecklistItem>, sqlx::Error> {
    let items = sqlx::query_as::<_, TaskChecklistItem>(
        r#"
        SELECT * FROM task_checklist_items 
        WHERE task_id = ?1 
        ORDER BY sort_order ASC, created_at ASC
        "#,
    )
    .bind(task_id)
    .fetch_all(pool)
    .await?;

    Ok(items)
}

pub async fn update_checklist_item(
    pool: &Pool<Sqlite>,
    req: UpdateTaskChecklistItemRequest,
) -> Result<TaskChecklistItem, sqlx::Error> {
    // Build dynamic update query based on provided fields
    let mut query = "UPDATE task_checklist_items SET".to_string();
    let mut binds = Vec::new();
    let mut param_count = 0;

    if let Some(text) = &req.text {
        param_count += 1;
        query.push_str(&format!(" text = ${}", param_count));
        binds.push(text.clone());
    }

    if let Some(is_completed) = req.is_completed {
        param_count += 1;
        if !query.ends_with("SET") {
            query.push(',');
        }
        query.push_str(&format!(" is_completed = ${}", param_count));
        binds.push(is_completed.to_string());
    }

    if let Some(sort_order) = req.sort_order {
        param_count += 1;
        if !query.ends_with("SET") {
            query.push(',');
        }
        query.push_str(&format!(" sort_order = ${}", param_count));
        binds.push(sort_order.to_string());
    }

    if query == "UPDATE task_checklist_items SET" {
        return Err(sqlx::Error::Protocol("No fields to update".to_string()));
    }

    param_count += 1;
    query.push_str(&format!(" WHERE id = ${}", param_count));
    query.push_str(" RETURNING *");

    let mut query_builder = sqlx::query_as::<_, TaskChecklistItem>(&query);

    for bind in binds {
        query_builder = query_builder.bind(bind);
    }

    query_builder = query_builder.bind(req.id);

    let item = query_builder.fetch_one(pool).await?;
    Ok(item)
}

pub async fn delete_checklist_item(
    pool: &Pool<Sqlite>,
    id: i64,
) -> Result<(), sqlx::Error> {
    let result = sqlx::query(
        r#"
        DELETE FROM task_checklist_items WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(sqlx::Error::RowNotFound);
    }

    Ok(())
}

pub async fn get_checklist_item_by_id(
    pool: &Pool<Sqlite>,
    id: i64,
) -> Result<TaskChecklistItem, sqlx::Error> {
    let item = sqlx::query_as::<_, TaskChecklistItem>(
        r#"
        SELECT * FROM task_checklist_items WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(item)
}
