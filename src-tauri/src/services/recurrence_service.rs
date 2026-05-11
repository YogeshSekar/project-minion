use chrono::{Datelike, Duration, NaiveDate, Utc};
use sqlx::{Pool, Sqlite};
use crate::database::models::task::Task;
use crate::database::models::task_completion_log::TaskCompletionLog;

/// Calculates the next scheduled date based on recurrence pattern
/// 
/// # Arguments
/// * `current_date` - Current date in YYYY-MM-DD format
/// * `recurrence_type` - Type of recurrence: "daily", "weekly", "bi_weekly", "weekdays_only", or "monthly"
/// * `recurrence_interval` - Interval for recurrence (e.g., 1 for every day, 2 for every 2 weeks)
/// 
/// # Returns
/// * `Ok(String)` - Next date in YYYY-MM-DD format
/// * `Err(String)` - Error message if calculation fails
pub fn calculate_next_scheduled_date(
    current_date: &str,
    recurrence_type: &str,
    recurrence_interval: i64,
) -> Result<String, String> {
    // Parse the current date
    let date = NaiveDate::parse_from_str(current_date, "%Y-%m-%d")
        .map_err(|e| format!("Invalid date format: {}", e))?;

    let next_date = match recurrence_type {
        "daily" => {
            date + Duration::days(recurrence_interval)
        }
        "weekly" => {
            date + Duration::weeks(recurrence_interval)
        }
        "bi_weekly" => {
            // Bi-weekly means every 2 weeks
            date + Duration::weeks(2)
        }
        "weekdays_only" => {
            // For weekdays only, find the next weekday (Monday-Friday)
            let mut next_date = date + Duration::days(1);
            
            // Skip weekends (Saturday = 6, Sunday = 7 in chrono's weekday numbering)
            while next_date.weekday().num_days_from_monday() >= 5 {
                next_date = next_date + Duration::days(1);
            }
            
            next_date
        }
        "monthly" => {
            // For monthly recurrence, we need to handle month overflow carefully
            let mut year = date.year();
            let mut month = date.month() as i32 + recurrence_interval as i32;
            let day = date.day();
            
            // Handle year overflow
            while month > 12 {
                month -= 12;
                year += 1;
            }
            while month < 1 {
                month += 12;
                year -= 1;
            }
            
            // Create the new date, adjusting for invalid days (e.g., Feb 30)
            let mut next_date_candidate = NaiveDate::from_ymd_opt(year, month as u32, day);
            
            // If the day is invalid for the month (e.g., 31st in a 30-day month), use the last valid day
            if next_date_candidate.is_none() {
                // Get the last day of the target month
                let next_month = if month == 12 { 1 } else { month + 1 };
                let next_month_year = if month == 12 { year + 1 } else { year };
                let last_day_of_month = NaiveDate::from_ymd_opt(next_month_year, next_month as u32, 1)
                    .unwrap_or_else(|| NaiveDate::from_ymd_opt(year, month as u32, 1).unwrap())
                    - Duration::days(1);
                
                next_date_candidate = Some(last_day_of_month);
            }
            
            next_date_candidate.ok_or_else(|| "Failed to calculate next monthly date".to_string())?
        }
        _ => {
            return Err(format!("Unsupported recurrence type: {}", recurrence_type));
        }
    };

    Ok(next_date.format("%Y-%m-%d").to_string())
}

/// Completes a recurring task by creating a completion log and scheduling the next occurrence
/// 
/// # Arguments
/// * `db_pool` - Database connection pool
/// * `task` - The task to complete (must be recurring)
/// 
/// # Returns
/// * `Ok<TaskCompletionLog>` - The created completion log
/// * `Err(String)` - Error description if validation or database operations fail
pub async fn complete_recurring_task(
    db_pool: &Pool<Sqlite>,
    task: &Task,
) -> Result<TaskCompletionLog, String> {
    // Start a transaction for atomic operations
    let mut tx = db_pool.begin().await
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // 1. Validate task
    if task.is_recurring != 1 {
        return Err("Task is not recurring".to_string());
    }

    let recurrence_type = task.recurrence_type.as_ref()
        .ok_or("Task missing recurrence_type")?;
    
    // Handle null scheduled_date by using current date
    let scheduled_date = if let Some(date) = task.scheduled_date.as_ref() {
        date
    } else {
        // Use current date when scheduled_date is null
        &Utc::now().format("%Y-%m-%d").to_string()
    };

    // 2. Insert row into task_completion_logs
    let current_timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    let completion_log = sqlx::query_as::<_, TaskCompletionLog>(
        r#"
        INSERT INTO task_completion_logs (task_id, occurrence_date, completed_at, is_undone)
        VALUES (?1, ?2, ?3, 0)
        RETURNING *
        "#,
    )
    .bind(task.id)
    .bind(scheduled_date)
    .bind(&current_timestamp)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| format!("Failed to create completion log: {}", e))?;

    // 3. Calculate next scheduled_date using existing helper
    let next_scheduled_date = calculate_next_scheduled_date(
        scheduled_date,
        recurrence_type,
        task.recurrence_interval.unwrap_or(1) as i64,
    ).map_err(|e| format!("Failed to calculate next scheduled date: {}", e))?;

    // 4. Update task with next scheduled date and reset status
    sqlx::query(
        r#"
        UPDATE tasks 
        SET scheduled_date = ?1, status = 'todo', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2
        "#,
    )
    .bind(&next_scheduled_date)
    .bind(task.id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to update task scheduled date: {}", e))?;

    // Commit the transaction
    tx.commit().await
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(completion_log)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_daily_recurrence() {
        // Test daily recurrence with interval 1
        let result = calculate_next_scheduled_date("2024-01-15", "daily", 1);
        assert_eq!(result.unwrap(), "2024-01-16");

        // Test daily recurrence with interval 7
        let result = calculate_next_scheduled_date("2024-01-15", "daily", 7);
        assert_eq!(result.unwrap(), "2024-01-22");

        // Test daily recurrence across month boundary
        let result = calculate_next_scheduled_date("2024-01-31", "daily", 1);
        assert_eq!(result.unwrap(), "2024-02-01");

        // Test daily recurrence across year boundary
        let result = calculate_next_scheduled_date("2024-12-31", "daily", 1);
        assert_eq!(result.unwrap(), "2025-01-01");
    }

    #[test]
    fn test_weekly_recurrence() {
        // Test weekly recurrence with interval 1
        let result = calculate_next_scheduled_date("2024-01-15", "weekly", 1);
        assert_eq!(result.unwrap(), "2024-01-22");

        // Test weekly recurrence with interval 2
        let result = calculate_next_scheduled_date("2024-01-15", "weekly", 2);
        assert_eq!(result.unwrap(), "2024-01-29");

        // Test weekly recurrence across month boundary
        let result = calculate_next_scheduled_date("2024-01-29", "weekly", 1);
        assert_eq!(result.unwrap(), "2024-02-05");

        // Test weekly recurrence across year boundary
        let result = calculate_next_scheduled_date("2024-12-30", "weekly", 1);
        assert_eq!(result.unwrap(), "2025-01-06");
    }

    #[test]
    fn test_monthly_recurrence() {
        // Test monthly recurrence with interval 1
        let result = calculate_next_scheduled_date("2024-01-15", "monthly", 1);
        assert_eq!(result.unwrap(), "2024-02-15");

        // Test monthly recurrence with interval 3
        let result = calculate_next_scheduled_date("2024-01-15", "monthly", 3);
        assert_eq!(result.unwrap(), "2024-04-15");

        // Test monthly recurrence across year boundary
        let result = calculate_next_scheduled_date("2024-12-15", "monthly", 1);
        assert_eq!(result.unwrap(), "2025-01-15");

        // Test monthly recurrence with interval > 12
        let result = calculate_next_scheduled_date("2024-01-15", "monthly", 15);
        assert_eq!(result.unwrap(), "2025-04-15");

        // Test edge case: end of month (31st to February)
        let result = calculate_next_scheduled_date("2024-01-31", "monthly", 1);
        assert_eq!(result.unwrap(), "2024-02-29"); // 2024 is a leap year

        // Test edge case: end of month (30th to February)
        let result = calculate_next_scheduled_date("2024-03-30", "monthly", 1);
        assert_eq!(result.unwrap(), "2024-04-30");

        // Test edge case: leap year February 29th
        let result = calculate_next_scheduled_date("2024-02-29", "monthly", 1);
        assert_eq!(result.unwrap(), "2024-03-29");
    }

    #[test]
    fn test_invalid_date_format() {
        let result = calculate_next_scheduled_date("2024-13-01", "daily", 1);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid date format"));

        let result = calculate_next_scheduled_date("invalid-date", "daily", 1);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid date format"));
    }

    #[test]
    fn test_bi_weekly_recurrence() {
        // Test bi-weekly recurrence
        let result = calculate_next_scheduled_date("2024-01-15", "bi_weekly", 1);
        assert_eq!(result.unwrap(), "2024-01-29");

        // Test bi-weekly recurrence across month boundary
        let result = calculate_next_scheduled_date("2024-01-25", "bi_weekly", 1);
        assert_eq!(result.unwrap(), "2024-02-08");

        // Test bi-weekly recurrence across year boundary
        let result = calculate_next_scheduled_date("2024-12-20", "bi_weekly", 1);
        assert_eq!(result.unwrap(), "2025-01-03");
    }

    #[test]
    fn test_weekdays_only_recurrence() {
        // Test weekdays only from Friday
        let result = calculate_next_scheduled_date("2024-01-12", "weekdays_only", 1);
        assert_eq!(result.unwrap(), "2024-01-15"); // Monday

        // Test weekdays only from Monday
        let result = calculate_next_scheduled_date("2024-01-15", "weekdays_only", 1);
        assert_eq!(result.unwrap(), "2024-01-16"); // Tuesday

        // Test weekdays only from Thursday
        let result = calculate_next_scheduled_date("2024-01-18", "weekdays_only", 1);
        assert_eq!(result.unwrap(), "2024-01-19"); // Friday

        // Test weekdays only from Friday to Monday (skips weekend)
        let result = calculate_next_scheduled_date("2024-01-19", "weekdays_only", 1);
        assert_eq!(result.unwrap(), "2024-01-22"); // Monday

        // Test weekdays only from Saturday (should go to Monday)
        let result = calculate_next_scheduled_date("2024-01-20", "weekdays_only", 1);
        assert_eq!(result.unwrap(), "2024-01-22"); // Monday

        // Test weekdays only from Sunday (should go to Monday)
        let result = calculate_next_scheduled_date("2024-01-21", "weekdays_only", 1);
        assert_eq!(result.unwrap(), "2024-01-22"); // Monday
    }

    #[test]
    fn test_unsupported_recurrence_type() {
        let result = calculate_next_scheduled_date("2024-01-15", "yearly", 1);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unsupported recurrence type"));

        let result = calculate_next_scheduled_date("2024-01-15", "hourly", 1);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unsupported recurrence type"));
    }

    #[test]
    fn test_edge_cases() {
        // Test with zero interval (should work but return same date)
        let result = calculate_next_scheduled_date("2024-01-15", "daily", 0);
        assert_eq!(result.unwrap(), "2024-01-15");

        // Test with negative interval
        let result = calculate_next_scheduled_date("2024-01-15", "daily", -1);
        assert_eq!(result.unwrap(), "2024-01-14");

        // Test with negative monthly interval
        let result = calculate_next_scheduled_date("2024-03-15", "monthly", -1);
        assert_eq!(result.unwrap(), "2024-02-15");

        // Test with negative monthly interval across year boundary
        let result = calculate_next_scheduled_date("2024-01-15", "monthly", -1);
        assert_eq!(result.unwrap(), "2023-12-15");
    }
}
