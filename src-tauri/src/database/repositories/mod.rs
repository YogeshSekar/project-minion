// Repositories module
// This module contains all database repository functions

pub mod activity;
pub mod area;
pub mod meeting;
pub mod meeting_page;
pub mod note;
pub mod page;
pub mod page_pin;
pub mod page_task;
pub mod page_update;
pub mod project;
pub mod task;
pub mod task_checklist;
pub mod task_completion_log;

// Re-export all repository functions for easier access
pub use activity::*;
pub use area::*;
pub use meeting::*;
pub use meeting_page::*;
pub use note::*;
pub use page::*;
pub use page_pin::*;
pub use page_task::*;
pub use page_update::*;
pub use project::*;
pub use task::*;
pub use task_checklist::*;
pub use task_completion_log::*;
