import React from 'react';
import { Property, Task } from '../../types';
import { MetricCard } from '../ui/Card';
import { PropertyCard } from '../domain/PropertyCard';
import { TaskCard } from '../domain/TaskCard';
import { WeeklySummaryPanel } from '../domain/WeeklySummaryPanel';
import { Button } from '../ui/Button';
import {
  Building2,
  CheckSquare,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface DashboardViewProps {
  properties: Property[];
  tasks: Task[];
  onNavigate: (view: 'dashboard' | 'properties' | 'tasks' | 'design-system') => void;
  onNewProperty: () => void;
  onNewTask: () => void;
  onViewPropertyDetails: (property: Property) => void;
  onToggleTaskStatus: (task: Task) => void;
  onEditTask: (task: Task) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  properties,
  tasks,
  onNavigate,
  onNewProperty,
  onNewTask,
  onViewPropertyDetails,
  onToggleTaskStatus,
  onEditTask,
}) => {
  // Inmuebles Activos
  const activeProperties = properties.filter((p) => p.status === 'disponible');
  const activePropertiesCount = activeProperties.length;
  const totalProperties = properties.length;

  // Tareas & Visitas Pendientes
  const pendingTasks = tasks.filter((t) => t.status !== 'completada');
  const highPriorityTodayCount = pendingTasks.filter((t) => t.priority === 'alta').length;

  // Control de Llaves en Oficina y Cartelería
  const keysInOffice = properties.filter((p) => p.keysLocation === 'Oficina Central').length;
  const keysInBuilding = properties.filter((p) => p.keysLocation === 'Portería').length;
  const signageActiveCount = properties.filter((p) => p.signageStatus === 'Cartel Colocado').length;

  const pendingTasksList = pendingTasks.slice(0, 3);
  const featuredProperties = properties.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Panel Operativo de Inmobiliaria
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gestión Diaria
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Organización de llaves, cartelería en calle y visitas a inmuebles coordinadas por administración.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewTask}
            leftIcon={<Plus className="w-3.5 h-3.5 text-slate-600" />}
          >
            + Nueva Tarea / Visita
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onNewProperty}
            leftIcon={<Building2 className="w-3.5 h-3.5 text-emerald-400" />}
          >
            + Registrar Inmueble
          </Button>
        </div>
      </div>

      {/* Agenda & Tareas Inminentes — arriba de todo, es lo accionable del día */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Agenda &amp; Tareas Inminentes</h3>
            {pendingTasksList.length > 0 && (
              <span className="text-[11px] font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                {pendingTasksList.length} pendientes
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={onNewTask}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              + Registrar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('tasks')}
              className="text-xs text-slate-500 hover:text-slate-900 p-1 h-auto"
            >
              Ver todas ({tasks.length})
            </Button>
          </div>
        </div>

        <div className="mt-3.5">
          {pendingTasksList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay tareas pendientes en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pendingTasksList.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleStatus={onToggleTaskStatus}
                  onEdit={onEditTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid de Métricas Operativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Inmuebles en Cartera"
          value={totalProperties}
          change={`${activePropertiesCount} disponibles`}
          trend="up"
          timeframe="inventario total"
          icon={Building2}
          onClick={() => onNavigate('properties')}
        />

        <MetricCard
          title="Tareas en Curso"
          value={pendingTasks.length}
          change={`${highPriorityTodayCount} prioritarias`}
          trend={highPriorityTodayCount > 0 ? 'down' : 'neutral'}
          timeframe="agenda operativa"
          icon={CheckSquare}
          onClick={() => onNavigate('tasks')}
        />
      </div>

      {/* Resumen Semanal de Productividad */}
      <div className="grid gap-6 items-start grid-cols-1">
        <WeeklySummaryPanel
          tasks={tasks}
          onNavigateToTasks={() => onNavigate('tasks')}
        />
      </div>
    </div>
  );
};
