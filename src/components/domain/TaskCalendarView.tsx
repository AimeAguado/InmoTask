import React, { useState } from 'react';
import { Task, TaskCategory } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle,
  Circle,
  Building,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface TaskCalendarViewProps {
  tasks: Task[];
  onNewTaskWithDate?: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
  onToggleTaskStatus?: (task: Task) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onNewTaskWithDate,
  onEditTask,
  onToggleTaskStatus,
}) => {
  // Current date reference
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Current viewed month and year state
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 1)); // Septiembre 2026 based on mock data
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  // Month formatted title in Spanish
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const monthTitle = `${monthNames[month]} ${year}`;

  // Days of week (Monday to Sunday)
  const weekDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calculate calendar days
  // Day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Convert Sunday=0 to index 6, Monday=1 to index 0

  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Build grid items (42 cells: 6 weeks x 7 days)
  interface CalendarDay {
    dateStr: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    tasks: Task[];
  }

  const calendarDays: CalendarDay[] = [];

  // Previous month padding days
  for (let i = startingDayIndex - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, dayNumber);
    const dateStr = prevMonthDate.toISOString().split('T')[0];
    calendarDays.push({
      dateStr,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      tasks: tasks.filter((t) => t.dueDate === dateStr),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const currentMonthDate = new Date(year, month, d);
    // Format YYYY-MM-DD reliably
    const yyyy = currentMonthDate.getFullYear();
    const mm = String(currentMonthDate.getMonth() + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    calendarDays.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      tasks: tasks.filter((t) => t.dueDate === dateStr),
    });
  }

  // Next month padding days to complete grid (42 cells)
  const remainingCells = 42 - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const yyyy = nextMonthDate.getFullYear();
    const mm = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    calendarDays.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      tasks: tasks.filter((t) => t.dueDate === dateStr),
    });
  }

  // Tasks in currently selected day
  const selectedDayTasks = tasks.filter((t) => t.dueDate === selectedDateStr);

  // Category badge colors / icons helper
  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case 'Visita': return '🚪';
      case 'Llaves': return '🔑';
      case 'Cartelería': return '🚩';
      case 'Inspección': return '📋';
      case 'Fotografía': return '📸';
      case 'Documentación': return '📁';
      default: return '📌';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'alta': return 'border-l-rose-500 bg-rose-50/50 hover:bg-rose-50';
      case 'media': return 'border-l-amber-500 bg-amber-50/40 hover:bg-amber-50';
      case 'baja': return 'border-l-blue-500 bg-blue-50/40 hover:bg-blue-50';
      default: return 'border-l-slate-400 bg-slate-50 hover:bg-slate-100';
    }
  };

  // Count total tasks this month
  const totalTasksInMonth = calendarDays
    .filter((d) => d.isCurrentMonth)
    .reduce((acc, curr) => acc + curr.tasks.length, 0);

  return (
    <div className="space-y-4">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{monthTitle}</span>
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {totalTasksInMonth} {totalTasksInMonth === 1 ? 'tarea/visita' : 'tareas/visitas'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Haga clic en cualquier fecha para revisar sus visitas o agendar una nueva gestión.
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs"
          >
            Hoy
          </Button>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90 text-center text-xs font-semibold text-slate-600">
          {weekDayNames.map((d, index) => (
            <div
              key={d}
              className={`py-2.5 ${index >= 5 ? 'text-slate-400 bg-slate-100/50' : ''}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 42 Calendar Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {calendarDays.map((day) => {
            const isSelected = day.dateStr === selectedDateStr;

            return (
              <div
                key={day.dateStr}
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={`min-h-[96px] sm:min-h-[110px] p-1.5 flex flex-col justify-between transition-all cursor-pointer group ${
                  !day.isCurrentMonth
                    ? 'bg-slate-50/60 opacity-50'
                    : isSelected
                    ? 'bg-emerald-50/30 ring-2 ring-emerald-500/50 ring-inset z-10'
                    : 'bg-white hover:bg-slate-50/80'
                }`}
              >
                {/* Date Cell Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-mono tabular-nums rounded-full w-6 h-6 ${
                      day.isToday
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : isSelected
                        ? 'bg-emerald-600 text-white font-semibold'
                        : day.isCurrentMonth
                        ? 'text-slate-700 font-semibold group-hover:text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Quick Add Button on Hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNewTaskWithDate) {
                        onNewTaskWithDate(day.dateStr);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-200/70 rounded transition-all"
                    title={`Agendar tarea para el ${day.dateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Tasks List (Mini chips) */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[70px] pr-0.5">
                  {day.tasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                      className={`text-[10px] leading-tight px-1.5 py-1 rounded border-l-2 border transition-all text-slate-800 ${getPriorityBorder(
                        task.priority
                      )} ${
                        task.status === 'completada'
                          ? 'opacity-60 line-through'
                          : ''
                      }`}
                      title={`${task.title} (${task.category}) - ${task.dueTime || 'Sin hora'}`}
                    >
                      <div className="flex items-center gap-1 font-medium truncate">
                        <span className="shrink-0">{getCategoryIcon(task.category)}</span>
                        {task.dueTime && (
                          <span className="font-mono tabular-nums text-slate-500 shrink-0">
                            {task.dueTime}
                          </span>
                        )}
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  ))}

                  {/* Overflow indicator if > 2 tasks */}
                  {day.tasks.length > 2 && (
                    <div className="text-[10px] font-semibold text-slate-500 hover:text-emerald-700 text-center py-0.5">
                      +{day.tasks.length - 2} más...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Detail Panel */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900">
                Agenda del {selectedDateStr}
              </h4>
              {selectedDateStr === todayStr && (
                <span className="text-[10px] font-semibold bg-slate-900 text-white px-2 py-0.5 rounded">
                  Hoy
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedDayTasks.length === 0
                ? 'No hay visitas ni tareas asignadas para esta fecha.'
                : `${selectedDayTasks.length} ${
                    selectedDayTasks.length === 1 ? 'gestión programada' : 'gestiones programadas'
                  } para este día.`}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (onNewTaskWithDate) {
                onNewTaskWithDate(selectedDateStr);
              }
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + Agendar Visita en esta fecha
          </Button>
        </div>

        {/* Selected Day Tasks Grid */}
        <div className="mt-4">
          {selectedDayTasks.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Día libre de compromisos programados
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Utilice el botón superior para agendar una visita o tarea en esta fecha.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-lg border text-left transition-all ${
                    task.status === 'completada'
                      ? 'bg-slate-50/60 border-slate-200/70 opacity-75'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{getCategoryIcon(task.category)}</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {task.category}
                      </span>
                      <Badge status={task.priority} size="sm" />
                    </div>

                    {onToggleTaskStatus && (
                      <button
                        onClick={() => onToggleTaskStatus(task)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors"
                        title={task.status === 'completada' ? 'Reabrir' : 'Completar'}
                      >
                        {task.status === 'completada' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  <h5
                    onClick={() => onEditTask(task)}
                    className={`text-xs font-bold leading-snug cursor-pointer hover:text-emerald-700 ${
                      task.status === 'completada' ? 'line-through text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {task.title}
                  </h5>

                  {task.description && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {task.propertyTitle && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-2 truncate">
                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{task.propertyTitle}</span>
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 font-mono text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{task.dueTime || 'Sin hora fija'}</span>
                    </div>

                    <button
                      onClick={() => onEditTask(task)}
                      className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-0.5"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ver Ficha</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
