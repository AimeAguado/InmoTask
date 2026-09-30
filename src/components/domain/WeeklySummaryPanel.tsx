import React, { useMemo } from 'react';
import { Task } from '../../types';
import {
  CheckCircle2,
  TrendingUp,
  Target,
  Award,
  ArrowRight,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface WeeklySummaryPanelProps {
  tasks: Task[];
  onNavigateToTasks?: () => void;
  targetDailyAverage?: number;
}

interface DayData {
  dayKey: string;
  dayName: string;
  dateStr: string;
  shortDate: string;
  completadas: number;
  pendientes: number;
  promedioProductividad: number;
  isToday: boolean;
  categories: Record<string, number>;
}

export const WeeklySummaryPanel: React.FC<WeeklySummaryPanelProps> = ({
  tasks,
  onNavigateToTasks,
  targetDailyAverage = 2.5,
}) => {
  // Use current week Monday to Sunday
  // Based on current local date or September 21-27, 2026 week
  const weekData = useMemo(() => {
    // Current date reference
    const now = new Date();
    // In our operational year 2026, find the Monday of the current week (Sep 21, 2026)
    // Or dynamically calculate based on current date
    const currentYear = now.getFullYear();
    const isMockYear = currentYear === 2026;

    let mondayDate: Date;
    if (isMockYear && now.getMonth() === 8) {
      // September 2026: week of 21-27
      mondayDate = new Date(2026, 8, 21);
    } else {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      mondayDate = new Date(now.setDate(diff));
    }

    const days: DayData[] = [];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dayShortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const shortDate = `${dd}/${mm}`;

      // Check tasks completed on this date
      const completedTasksForDay = tasks.filter((t) => {
        if (t.status !== 'completada') return false;
        if (t.completedAt && t.completedAt.startsWith(dateStr)) return true;
        return t.dueDate === dateStr;
      });

      // Check tasks pending on this date
      const pendingTasksForDay = tasks.filter((t) => {
        return t.status !== 'completada' && t.dueDate === dateStr;
      });

      // Categories breakdown
      const categories: Record<string, number> = {};
      completedTasksForDay.forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + 1;
      });

      const todayStr = new Date().toISOString().split('T')[0];

      days.push({
        dayKey: dayShortNames[i],
        dayName: dayNames[i],
        dateStr,
        shortDate,
        completadas: completedTasksForDay.length,
        pendientes: pendingTasksForDay.length,
        promedioProductividad: targetDailyAverage,
        isToday: dateStr === todayStr || (dateStr === '2026-09-26'),
        categories,
      });
    }

    return days;
  }, [tasks, targetDailyAverage]);

  // Overall statistics
  const totalCompletedThisWeek = weekData.reduce((acc, d) => acc + d.completadas, 0);
  const activeDaysCount = 6; // Lunes a Sábado operativas
  const dailyAverageAchieved = Number((totalCompletedThisWeek / activeDaysCount).toFixed(1));
  const completionVersusGoalPercent = Math.round((dailyAverageAchieved / targetDailyAverage) * 100);

  // Best performing day
  const bestDay = useMemo(() => {
    let best = weekData[0];
    weekData.forEach((d) => {
      if (d.completadas > best.completadas) {
        best = d;
      }
    });
    return best;
  }, [weekData]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 mt-0.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Resumen Semanal de Productividad
              </h3>
              <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Semana 21 al 27 de Septiembre
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tareas y visitas operativas completadas por día frente a la meta promedio de productividad ({targetDailyAverage} tareas/día).
            </p>
          </div>
        </div>

        {onNavigateToTasks && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToTasks}
            className="text-xs text-slate-600 hover:text-slate-900 shrink-0 self-start sm:self-auto"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Ver Agenda de Tareas
          </Button>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-2.5 my-3.5">
        {/* KPI 1: Total Completadas */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completadas Esta Semana
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg xl:text-xl font-extrabold font-mono text-slate-900 tabular-nums">
              {totalCompletedThisWeek}
            </span>
            <span className="text-xs font-medium text-emerald-600">gestiones</span>
          </div>
        </div>

        {/* KPI 2: Promedio Diario */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            Promedio Diario vs. Meta
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg xl:text-xl font-extrabold font-mono text-slate-900 tabular-nums">
              {dailyAverageAchieved}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {targetDailyAverage} meta</span>
          </div>
        </div>

        {/* KPI 3: Tasa de Cumplimiento */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Efectividad Semanal
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-lg xl:text-xl font-extrabold font-mono tabular-nums ${
                completionVersusGoalPercent >= 100 ? 'text-emerald-700' : 'text-slate-900'
              }`}
            >
              {completionVersusGoalPercent}%
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {completionVersusGoalPercent >= 100 ? 'Superada' : 'En rango'}
            </span>
          </div>
        </div>

        {/* KPI 4: Día Más Productivo */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-purple-600" />
            Día con Mayor Actividad
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base xl:text-base font-bold text-slate-900 truncate">
              {bestDay.dayName}
            </span>
            <span className="text-xs font-mono font-semibold text-purple-700">
              ({bestDay.completadas})
            </span>
          </div>
        </div>
      </div>

      {/* Day by Day Quick Footer Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-7 gap-1 text-center">
        {weekData.map((d) => {
          const meetsTarget = d.completadas >= d.promedioProductividad;
          const breakdown = Object.entries(d.categories)
            .map(([cat, count]) => `${cat}: ${count}`)
            .join(', ');
          return (
            <div
              key={d.dateStr}
              title={[
                `${d.dayName} ${d.shortDate}`,
                `${d.completadas} ${
                  d.completadas === 1 ? 'tarea' : 'tareas'
                } completadas (meta: ${d.promedioProductividad})`,
                meetsTarget ? 'Superó la meta' : 'Por debajo de la meta',
                breakdown ? `Tipos: ${breakdown}` : null,
              ]
                .filter(Boolean)
                .join(' — ')}
              className={`p-1 rounded-lg border transition-all ${
                d.isToday
                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/40'
                  : 'bg-slate-50/60 border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="text-[9px] sm:text-[10px] font-medium text-slate-500 flex items-center justify-center gap-1">
                <span>{d.dayKey}</span>
                {d.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                )}
              </div>
              <div className="mt-0.5 text-xs font-bold font-mono text-slate-900 tabular-nums">
                {d.completadas}
              </div>
              <div
                className={`h-1 w-1 rounded-full mx-auto mt-1 ${
                  meetsTarget ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
