import { useState, useRef, useCallback } from 'react';
import { CheckCircle2, ListTodo, PauseCircle, PlayCircle, Plus } from 'lucide-react';
import TaskCard from './TaskCard';

// Custom drag drop implementation that works in WebView
function useCustomDragDrop(onDrop) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const dragData = useRef(null);
  const ghostRef = useRef(null);
  const suppressClickUntilRef = useRef(0);

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
        // Browsers may emit a click immediately after mouseup. Keep that
        // synthetic post-drag click from opening the task side panel.
        suppressClickUntilRef.current = Date.now() + 300;
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

  const shouldSuppressClick = useCallback(() => {
    return Date.now() < suppressClickUntilRef.current;
  }, []);

  return {
    draggingId,
    dragOverColumn,
    ghostPos,
    handleMouseDown,
    handleColumnMouseEnter,
    handleColumnMouseLeave,
    shouldSuppressClick,
  };
}


const columnHeaderMap = {
  todo: { icon: ListTodo, iconColor: 'text-sky-600 dark:text-sky-400', count: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  in_progress: { icon: PlayCircle, iconColor: 'text-amber-600 dark:text-amber-400', count: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  waiting: { icon: PauseCircle, iconColor: 'text-violet-600 dark:text-violet-400', count: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  completed: { icon: CheckCircle2, iconColor: 'text-emerald-600 dark:text-emerald-400', count: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  default: { icon: ListTodo, iconColor: 'text-slate-500 dark:text-slate-400', count: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

const columnDropTargetMap = {
  todo: 'border-sky-400 bg-sky-100/80 ring-sky-200',
  in_progress: 'border-amber-400 bg-amber-100/80 ring-amber-200',
  waiting: 'border-violet-400 bg-violet-100/80 ring-violet-200',
  completed: 'border-emerald-400 bg-emerald-100/80 ring-emerald-200',
  default: 'border-slate-400 bg-slate-100 ring-slate-200',
};

function BoardColumn({ title, columnId, tasks, projects, isDropTarget, onMouseEnter, onMouseLeave, draggingId, onEdit, onLinkPage, onUpdate, onDelete, onComplete, onStart, onAddToToday, onTaskMouseDown, onStartActivity, onStopActivity, runningActivity, onQuickAdd, focusTaskId, onTaskFocusHandled }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAddError, setQuickAddError] = useState('');
  const headerStyle = columnHeaderMap[columnId] ?? columnHeaderMap.default;
  const ColumnIcon = headerStyle.icon;
  const dropTargetClass = columnDropTargetMap[columnId] ?? columnDropTargetMap.default;

  const openQuickAdd = () => {
    setQuickAddError('');
    setQuickAddOpen(true);
  };

  const discardQuickAdd = () => {
    setQuickAddOpen(false);
    setQuickAddError('');
  };

  const submitQuickAdd = async (taskTitle) => {
    if (quickAddSaving) return;
    setQuickAddSaving(true);
    setQuickAddError('');
    const response = await onQuickAdd?.(columnId, taskTitle);
    setQuickAddSaving(false);

    if (response?.success) {
      setQuickAddOpen(false);
    } else {
      setQuickAddError(response?.error || 'Could not add task');
    }
  };

  return (
    <div
      data-column={columnId}
      onMouseEnter={() => onMouseEnter(columnId)}
      onMouseLeave={onMouseLeave}
      className={`
        flex min-w-[260px] w-full flex-col border-r border-slate-200 bg-transparent px-3 transition-all duration-200 dark:border-slate-800
        ${isDropTarget
          ? `${dropTargetClass} rounded-xl border ring-2 ring-inset shadow-sm`
          : ''
        }
      `}
    >
      <div className="mb-3 flex items-center gap-2">
        <ColumnIcon className={`h-5 w-5 ${headerStyle.iconColor}`} />
        <h3 className="font-semibold text-gray-900 dark:text-slate-100">
          {title}
        </h3>
        {tasks.length > 0 && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${headerStyle.count}`}>
            {tasks.length}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {isDropTarget && (
            <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm">
              Drop here
            </span>
          )}
          <button
            type="button"
            onClick={openQuickAdd}
            disabled={quickAddSaving || quickAddOpen}
            className={`grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50 ${headerStyle.iconColor}`}
            title={`Add task to ${title}`}
            aria-label={`Add task to ${title}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] space-y-2 overflow-y-auto no-scrollbar">
        {quickAddOpen && (
          <TaskCard
            task={{ id: `draft-${columnId}`, title: '', status: columnId, priority: 'medium', description: null }}
            projects={projects}
            compact
            hideStatus
            isDraft
            onEdit={() => {}}
            onDraftSave={submitQuickAdd}
            onDraftCancel={discardQuickAdd}
            draftSaving={quickAddSaving}
            draftError={quickAddError}
          />
        )}

        {tasks.length === 0 && !quickAddOpen ? (
          <div className={`
            flex h-24 items-center justify-center rounded-xl border-2 border-dashed text-sm
            ${isDropTarget 
              ? 'border-current bg-white/70 font-semibold text-slate-700' 
              : 'border-gray-200 text-gray-400 dark:border-slate-800 dark:text-slate-600'
            }
          `}>
            {isDropTarget ? 'Release to move task' : 'No tasks'}
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              projects={projects}
              onUpdate={onUpdate}
              onToggleComplete={onComplete}
              onEdit={onEdit}
              onLinkPage={onLinkPage}
              onDelete={onDelete}
              onAddToToday={onAddToToday}
              onMouseDown={onTaskMouseDown}
              isDragging={draggingId === task.id}
              onStartActivity={onStartActivity}
              onStopActivity={onStopActivity}
              runningActivity={runningActivity}
              hideStatus={true}
              compact={true}
              autoEditTitle={focusTaskId === task.id}
              onAutoEditComplete={onTaskFocusHandled}
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

export function BoardView({ tasks, projects, onUpdateTask, onDeleteTask, onEditTask, onLinkPage, onAddToToday, onStartActivity, onStopActivity, runningActivity, showDone = true, onQuickAddTask, focusTaskId, onTaskFocusHandled }) {
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
    shouldSuppressClick,
  } = useCustomDragDrop(handleDrop);

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const waitingTasks = tasks.filter(t => t.status === 'waiting');
  const doneTasks = tasks.filter(t => t.status === 'completed');

  const handleComplete = (task) => {
    onUpdateTask({ ...task, status: task.status === 'completed' ? 'todo' : 'completed' });
  };

  const handleStart = (task) => {
    onUpdateTask({ ...task, status: 'in_progress' });
  };

  return (
    <div
      className="h-full w-full overflow-auto bg-transparent p-4 select-none"
      onClickCapture={(event) => {
        if (shouldSuppressClick()) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div className="flex h-full min-h-[420px] gap-0 [&>[data-column]:last-child]:border-r-0">
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
          onLinkPage={onLinkPage}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
          onComplete={handleComplete}
          onStart={handleStart}
          onAddToToday={onAddToToday}
          onTaskMouseDown={handleMouseDown}
          onStartActivity={onStartActivity}
          onStopActivity={onStopActivity}
          runningActivity={runningActivity}
          onQuickAdd={onQuickAddTask}
          focusTaskId={focusTaskId}
          onTaskFocusHandled={onTaskFocusHandled}
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
          onLinkPage={onLinkPage}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
          onComplete={handleComplete}
          onStart={handleStart}
          onAddToToday={onAddToToday}
          onTaskMouseDown={handleMouseDown}
          onStartActivity={onStartActivity}
          onStopActivity={onStopActivity}
          runningActivity={runningActivity}
          onQuickAdd={onQuickAddTask}
          focusTaskId={focusTaskId}
          onTaskFocusHandled={onTaskFocusHandled}
        />

        <BoardColumn
          title="Waiting"
          columnId="waiting"
          tasks={waitingTasks}
          projects={projects}
          isDropTarget={dragOverColumn === 'waiting'}
          draggingId={draggingId}
          onMouseEnter={handleColumnMouseEnter}
          onMouseLeave={handleColumnMouseLeave}
          onEdit={onEditTask}
          onLinkPage={onLinkPage}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
          onComplete={handleComplete}
          onStart={handleStart}
          onAddToToday={onAddToToday}
          onTaskMouseDown={handleMouseDown}
          onStartActivity={onStartActivity}
          onStopActivity={onStopActivity}
          runningActivity={runningActivity}
          onQuickAdd={onQuickAddTask}
          focusTaskId={focusTaskId}
          onTaskFocusHandled={onTaskFocusHandled}
        />

        {showDone && (
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
            onLinkPage={onLinkPage}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
            onComplete={handleComplete}
            onStart={handleStart}
            onAddToToday={onAddToToday}
            onTaskMouseDown={handleMouseDown}
            onStartActivity={onStartActivity}
            onStopActivity={onStopActivity}
            runningActivity={runningActivity}
            onQuickAdd={onQuickAddTask}
            focusTaskId={focusTaskId}
            onTaskFocusHandled={onTaskFocusHandled}
          />
        )}
      </div>
    </div>
  );
}
