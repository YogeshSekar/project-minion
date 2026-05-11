use sqlx::{Pool, Sqlite};
use crate::database::models::project::{Project, CreateProjectRequest, UpdateProjectRequest};

pub async fn create_project(
    pool: &Pool<Sqlite>,
    req: CreateProjectRequest,
) -> Result<Project, sqlx::Error> {
    let status = if req.progress >= 100 {
        "completed"
    } else {
        "active"
    };

    let project = sqlx::query_as::<_, Project>(
        r#"
        INSERT INTO projects (title, description, start_date, deadline, priority, progress, status)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.start_date)
    .bind(&req.deadline)
    .bind(&req.priority)
    .bind(req.progress)
    .bind(status)
    .fetch_one(pool)
    .await?;

    Ok(project)
}

pub async fn get_all_projects(pool: &Pool<Sqlite>) -> Result<Vec<Project>, sqlx::Error> {
    let projects = sqlx::query_as::<_, Project>(
        r#"
        SELECT * FROM projects ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(projects)
}

pub async fn get_project_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<Project>, sqlx::Error> {
    let project = sqlx::query_as::<_, Project>(
        r#"
        SELECT * FROM projects WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(project)
}

pub async fn update_project(
    pool: &Pool<Sqlite>,
    req: UpdateProjectRequest,
) -> Result<Project, sqlx::Error> {
    let project = sqlx::query_as::<_, Project>(
        r#"
        UPDATE projects 
        SET title = ?1, description = ?2, start_date = ?3, deadline = ?4, 
            priority = ?5, progress = ?6, status = ?7, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?8
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.start_date)
    .bind(&req.deadline)
    .bind(&req.priority)
    .bind(req.progress)
    .bind(&req.status)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(project)
}

pub async fn delete_project(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM projects WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}
