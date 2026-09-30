import React from 'react';
import { Task } from '../../types';
import { Badge } from '../ui/Badge';
import { UserAvatar } from '../ui/UserAvatar';
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  Building,
  AlertCircle,
  Edit2,
  Trash2,
  Briefcase,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggleStatus?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
  className = '',
}) => {
  const isCompleted = task.status === 'completada';
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = !isCompleted && task.dueDate < today;
  const isDueToday = !isCompleted && task.dueDate === today;

  return (
    <div
      className={`group bg-white rounded-xl border transition-all duration-150 p-4 text-left ${
        isCompleted
          ? 'border-slate-200/60 bg-slate-50/50 opacity-75'
          : isOverdue
          ? 'border-rose-200 shadow-xs'
          : 'border-slate-200/85 hover:border-slate-300 hover:shadow-xs'
      } ${className}`}
    >
      {/* Top Bar: Category & Priority & Quick Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
            {task.category}
          </span>
          <Badge status={task.priority} size="sm" />
          {task.assignedByDirector && (
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
              Jefatura
            </span>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              title="Editar tarea"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
              title="Eliminar tarea"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Title & Checkbox */}
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => onToggleStatus?.(task)}
          className="mt-0.5 text-slate-400 hover:text-emerald-600 shrink-0 transition-colors"
          title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
        >
          {isCompleted ? (
            <CheckCircle className="w-4.5 h-4.5 text-emerald-600 fill-emerald-50" />
          ) : (
            <Circle className="w-4.5 h-4.5 hover:text-emerald-500" />
          )}
        </button>

        <div className="flex-1">
          <h4
            className={`text-sm font-semibold leading-snug ${
              isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
            }`}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Associated Property */}
      {task.propertyTitle && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 truncate" title={task.propertyTitle}>
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">{task.propertyTitle}</span>
          </div>
        </div>
      )}

      {/* Footer: Due date + Assignee */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div
          className={`flex items-center gap-1 font-mono tabular-nums ${
            isOverdue
              ? 'text-rose-600 font-semibold'
              : isDueToday
              ? 'text-amber-600 font-semibold'
              : 'text-slate-500'
          }`}
        >
          {isOverdue && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          {!isOverdue && <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span>{task.dueDate}</span>
          {task.dueTime && (
            <>
              <span className="text-slate-300">·</span>
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{task.dueTime}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5" title={`A cargo: ${task.assignedTo.name}`}>
          <UserAvatar
            name={task.assignedTo.name}
            src={task.assignedTo.avatar}
            size="xs"
            className="!w-5 !h-5 !text-[8px] border border-white shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
};
