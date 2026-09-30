import { useMemo } from 'react';
import { Bell, AlertTriangle, CalendarClock, CheckCheck, ArrowRight, Circle } from 'lucide-react';
import type { Task } from '../../types';
import { Button } from '../ui/Button';

interface UrgentTask {
  task: Task;
  kind: 'vencida' | 'hoy';
  daysLate: number;
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const daysBetween = (fromISO: string, toISO: string) => {
  const a = new Date(`${fromISO}T00:00:00`);
  const b = new Date(`${toISO}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

export const getUrgentTasks = (tasks: Task[]): UrgentTask[] => {
  const today = todayISO();
  return tasks
    .filter((t) => t.priority === 'alta' && t.status !== 'completada' && t.dueDate <= today)
    .map((task) => {
      const delta = daysBetween(task.dueDate, today);
      return {
        task,
        kind: delta > 0 ? ('vencida' as const) : ('hoy' as const),
        daysLate: delta,
      };
    })
    .sort((a, b) => b.task.dueDate.localeCompare(a.task.dueDate));
};

interface Props {
  tasks: Task[];
  isOpen: boolean;
  onToggle: () => void;
  onNavigateToTasks: () => void;
  onClose: () => void;
  onCompleteTask: (task: Task) => void;
}

export const NotificationsBell = ({
  tasks,
  isOpen,
  onToggle,
  onNavigateToTasks,
  onClose,
  onCompleteTask,
}: Props) => {
  const urgent = useMemo(() => getUrgentTasks(tasks), [tasks]);
  const count = urgent.length;

  const label =
    count === 0
      ? 'Sin alertas de alta demanda'
      : count === 1
        ? '1 alerta de alta demanda'
        : `${count} alertas de alta demanda`;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-expanded={isOpen}
        onClick={onToggle}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <Bell className="w-4.5 h-4.5" />
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white font-mono">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={onClose}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute top-full right-0 mt-2 w-[min(22rem,calc(100vw-1.5rem))] bg-white rounded-xl shadow-lg border border-slate-200 z-40 animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-rose-500" />
                <h4 className="text-xs font-bold text-slate-900">Demanda Alta</h4>
              </div>
              {count > 0 && (
                <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </div>

            <div className="max-h-[min(22rem,60vh)] overflow-y-auto">
              {urgent.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <CheckCheck className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nada urgente por ahora.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Solo aparecen tareas de prioridad alta vencidas o con vencimiento hoy.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {urgent.map(({ task, kind, daysLate }) => (
                    <li key={task.id} className="flex items-start gap-1 hover:bg-slate-50 transition-colors">
                      <button
                        type="button"
                        title="Marcar como completada"
                        aria-label={`Marcar como completada: ${task.title}`}
                        onClick={() => onCompleteTask(task)}
                        className="shrink-0 p-2.5 text-slate-300 hover:text-emerald-600 transition-colors"
                      >
                        <Circle className="w-4.5 h-4.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToTasks();
                        }}
                        className="min-w-0 flex-1 text-left py-3 pr-3.5 flex gap-2.5"
                      >
                        <span
                          className={`mt-0.5 shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
                            kind === 'vencida' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {kind === 'vencida' ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <CalendarClock className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-slate-900 leading-snug">
                            {task.title}
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            {task.category}
                            {task.propertyTitle ? ` · ${task.propertyTitle}` : ''}
                          </span>
                          <span
                            className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wide ${
                              kind === 'vencida' ? 'text-rose-600' : 'text-amber-600'
                            }`}
                          >
                            {kind === 'vencida'
                              ? `Vencida hace ${daysLate} ${daysLate === 1 ? 'día' : 'días'}`
                              : 'Vence hoy'}
                            {task.dueTime ? ` · ${task.dueTime}` : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => {
                  onClose();
                  onNavigateToTasks();
                }}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Ver toda la agenda
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};