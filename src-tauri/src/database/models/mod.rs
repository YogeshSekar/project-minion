// Models module
// This module contains all data models

pub mod project;
pub mod task;
pub mod meeting;
pub mod note;
pub mod activity;
pub mod habit;
pub mod habit_log;
pub mod task_completion_log;

// Re-export all models for easier access
pub use project::{Project, CreateProjectRequest, UpdateProjectRequest};
pub use task::{Task, CreateTaskRequest, UpdateTaskRequest};
pub use meeting::{Meeting, CreateMeetingRequest, UpdateMeetingRequest, UpdateMeetingUrlRequest};
pub use note::{Note, CreateNoteRequest, UpdateNoteRequest};
pub use activity::{Activity, CreateActivityRequest, UpdateActivityRequest};
pub use habit::{Habit, CreateHabitRequest, UpdateHabitRequest};
pub use habit_log::{HabitLog, CreateHabitLogRequest, UpdateHabitLogRequest};
pub use task_completion_log::{TaskCompletionLog, CreateTaskCompletionLogRequest, UpdateTaskCompletionLogRequest};
