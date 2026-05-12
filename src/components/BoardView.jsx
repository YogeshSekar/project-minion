import { useState, useRef, useCallback } from 'react';
import { Play, CheckCircle, Trash2, Calendar } from 'lucide-react';
import TaskCard from './TaskCard';

// Custom drag drop implementation that works in WebView
function useCustomDragDrop(onDrop) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const dragData = useRef(null);
  const ghostRef = useRef(null);

  const handleMouseDown = useCallback((e, itemId, itemData) => {
    // Only left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    let hasDragged = false;
    
    dragData.current = { id: itemId, ...itemData };
    
    const handleMouseMove = (moveEvent) => {
      const dx = Math.abs(moveEvent.clientX - startX);
      const dy = Math.abs(moveEvent.clientY - startY);
      
      // Only start drag after moving 5px
      if (!hasDragged && (dx > 5 || dy > 5)) {
        hasDragged = true;
        setDraggingId(itemId);
        
        // Create ghost element
        const ghost = document.createElement('div');
        ghost.style.cssText = `
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.95;
          width: 280px;
          padding: 16px 20px;
          background: white;
          border: 2px solid #dc4c3f;
          border-radius: 8px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.25);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;
        ghost.textContent = itemData.title;
        ghost.style.left = moveEvent.clientX - 140 + 'px';
        ghost.style.top = moveEvent.clientY - 25 + 'px';
        
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
      }
      
      if (hasDragged && ghostRef.current) {
        ghostRef.current.style.left = moveEvent.clientX - 140 + 'px';
        ghostRef.current.style.top = moveEvent.clientY - 25 + 'px';
        setGhostPos({ x: moveEvent.clientX, y: moveEvent.clientY });
      }
    };
    
    const handleMouseUp = (upEvent) => {
      // Only handle drop if actually dragged
      if (hasDragged) {
        ghostRef.current?.remove();
        ghostRef.current = null;
        
        // Get element under mouse (excluding the ghost)
        const elemBelow = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        
        // Find closest column
        const column = elemBelow?.closest('[data-column]');
        if (column) {
          const columnId = column.dataset.column;
          if (columnId && dragData.current) {
            onDrop?.(dragData.current.id, columnId, dragData.current);
          }
        }
        
        setDraggingId(null);
        setDragOverColumn(null);
      }
      
      dragData.current = null;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onDrop]);

  const handleColumnMouseEnter = useCallback((columnId) => {
    if (draggingId) {
      setDragOverColumn(columnId);
    }
  }, [draggingId]);

  const handleColumnMouseLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  return {
    draggingId,
    dragOverColumn,
    ghostPos,
    handleMouseDown,
    handleColumnMouseEnter,
    handleColumnMouseLeave,
  };
}


function BoardColumn({ title, columnId, tasks, projects, isDropTarget, onMouseEnter, onMouseLeave, draggingId, onEdit, onDelete, onComplete, onStart, onAddToToday, onTaskMouseDown }) {
  return (
    <div
      data-column={columnId}
      onMouseEnter={() => onMouseEnter(columnId)}
      onMouseLeave={onMouseLeave}
      className={`
        flex-1 min-w-[320px] max-w-[400px] flex flex-col rounded-2xl transition-all duration-200
        ${isDropTarget 
          ? 'bg-red-50/30 dark:bg-red-900/10' 
          : 'bg-transparent'
        }
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 mb-3">
        <h3 className="font-semibold text-gray-800 dark:text-white text-sm">
          {title} 
          <span className="ml-2 text-gray-500 dark:text-gray-400 font-normal">
            ({tasks.length})
          </span>
        </h3>
      </div>
      
      {/* Task List */}
      <div className="flex-1 overflow-y-auto min-h-[300px] space-y-3 no-scrollbar">
        {tasks.length === 0 ? (
          <div className={`
            h-32 flex items-center justify-center text-sm rounded-lg border-2 border-dashed
            ${isDropTarget 
              ? 'border-red-300 text-red-500 dark:border-red-600 dark:text-red-400' 
              : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
            }
          `}>
            Drop tasks here
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              projects={projects}
              onToggleComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddToToday={onAddToToday}
              onMouseDown={onTaskMouseDown}
              isDragging={draggingId === task.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}

export function BoardView({ tasks, projects, onUpdateTask, onDeleteTask, onEditTask, onAddToToday }) {
  const handleDrop = async (taskId, newStatus, taskData) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    await onUpdateTask({ ...task, status: newStatus });
  };

  const {
    draggingId,
    dragOverColumn,
    handleMouseDown,
    handleColumnMouseEnter,
    handleColumnMouseLeave,
  } = useCustomDragDrop(handleDrop);

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'completed');

  const handleComplete = (task) => {
    onUpdateTask({ ...task, status: task.status === 'completed' ? 'todo' : 'completed' });
  };

  const handleStart = (task) => {
    onUpdateTask({ ...task, status: 'in_progress' });
  };

  return (
    <div className="h-full w-full flex gap-6 p-4 select-none">
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex gap-6 overflow-hidden">
        <BoardColumn
        title="To Do"
        columnId="todo"
        tasks={todoTasks}
        projects={projects}
        isDropTarget={dragOverColumn === 'todo'}
        draggingId={draggingId}
        onMouseEnter={handleColumnMouseEnter}
        onMouseLeave={handleColumnMouseLeave}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onComplete={handleComplete}
        onStart={handleStart}
        onAddToToday={onAddToToday}
        onTaskMouseDown={handleMouseDown}
      />

      <BoardColumn
        title="In Progress"
        columnId="in_progress"
        tasks={inProgressTasks}
        projects={projects}
        isDropTarget={dragOverColumn === 'in_progress'}
        draggingId={draggingId}
        onMouseEnter={handleColumnMouseEnter}
        onMouseLeave={handleColumnMouseLeave}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onComplete={handleComplete}
        onStart={handleStart}
        onAddToToday={onAddToToday}
        onTaskMouseDown={handleMouseDown}
      />

      <BoardColumn
        title="Done"
        columnId="completed"
        tasks={doneTasks}
        projects={projects}
        isDropTarget={dragOverColumn === 'completed'}
        draggingId={draggingId}
        onMouseEnter={handleColumnMouseEnter}
        onMouseLeave={handleColumnMouseLeave}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onComplete={handleComplete}
        onStart={handleStart}
        onAddToToday={onAddToToday}
        onTaskMouseDown={handleMouseDown}
      />
      </div>
    </div>
  );
}
