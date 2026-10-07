import React, { useState, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus, TaskCategory, Property } from '../../types';
import { TaskCard } from '../domain/TaskCard';
import { TaskCalendarView } from '../domain/TaskCalendarView';
import { Table, Column } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FilterBar, ActiveFilterTag } from '../ui/FilterBar';
import { Select } from '../ui/Select';
import {
  Calendar,
  Columns3,
  List,
  Plus,
  CheckCircle,
  Circle,
  AlertCircle,
  Edit2,
  Trash2,
  Key,
  Flag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  properties: Property[];
  onNavigateToProperties: () => void;
  onNewTask: () => void;
  onNewTaskWithDate?: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleTaskStatus: (task: Task) => void;
  onMoveTaskStatus: (task: Task, newStatus: TaskStatus) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  properties,
  onNavigateToProperties,
  onNewTask,
  onNewTaskWithDate,
  onEditTask,
  onDeleteTask,
  onToggleTaskStatus,
  onMoveTaskStatus,
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban' | 'table'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // La card de llaves & cartelería arranca plegada: no ocupa espacio salvo que
  // la abran, cuando interesa consultar el control de llaves y carteles.
  const [isKeysCardOpen, setIsKeysCardOpen] = useState(false);

  // Control de Llaves en Oficina y Cartelería
  const keysInOffice = properties.filter((p) => p.keysLocation === 'Oficina Central').length;
  const keysInBuilding = properties.filter((p) => p.keysLocation === 'Portería').length;
  const signageActiveCount = properties.filter((p) => p.signageStatus === 'Cartel Colocado').length;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.propertyTitle && t.propertyTitle.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
  }, [tasks, searchQuery, categoryFilter, priorityFilter, statusFilter]);

  const activeFilters = useMemo<ActiveFilterTag[]>(() => {
    const list: ActiveFilterTag[] = [];
    if (categoryFilter !== 'all') {
      list.push({ id: 'category', label: 'Categoría', value: categoryFilter });
    }
    if (priorityFilter !== 'all') {
      list.push({ id: 'priority', label: 'Prioridad', value: priorityFilter });
    }
    if (statusFilter !== 'all') {
      list.push({ id: 'status', label: 'Estado', value: statusFilter });
    }
    return list;
  }, [categoryFilter, priorityFilter, statusFilter]);

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === 'category') setCategoryFilter('all');
    if (filterId === 'priority') setPriorityFilter('all');
    if (filterId === 'status') setStatusFilter('all');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
  };

  // Kanban columns configuration
  const kanbanColumns: { status: TaskStatus; label: string; dotColor: string }[] = [
    { status: 'pendiente', label: 'Por Hacer', dotColor: 'bg-slate-400' },
    { status: 'en_progreso', label: 'En Curso', dotColor: 'bg-blue-500' },
    { status: 'completada', label: 'Completadas', dotColor: 'bg-emerald-500' },
  ];

  // Table columns definition
  const columns: Column<Task>[] = [
    {
      id: 'check',
      header: '',
      width: '44px',
      render: (_, t) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleTaskStatus(t);
          }}
          className="text-slate-400 hover:text-emerald-600 transition-colors"
        >
          {t.status === 'completada' ? (
            <CheckCircle className="w-4.5 h-4.5 text-emerald-600 fill-emerald-50" />
          ) : (
            <Circle className="w-4.5 h-4.5" />
          )}
        </button>
      ),
    },
    {
      id: 'title',
      header: 'Tarea / Visita & Instrucciones',
      sortable: true,
      render: (_, t) => (
        <div className="max-w-md">
          <div
            className={`font-medium text-slate-900 ${
              t.status === 'completada' ? 'line-through text-slate-400' : ''
            }`}
          >
            {t.title}
          </div>
          {t.description && (
            <div className="text-xs text-slate-500 truncate mt-0.5">{t.description}</div>
          )}
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Gestión',
      accessor: 'category',
      width: '120px',
      sortable: true,
      render: (cat) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {cat}
        </span>
      ),
    },
    {
      id: 'priority',
      header: 'Prioridad',
      accessor: 'priority',
      width: '100px',
      sortable: true,
      render: (p) => <Badge status={p as TaskPriority} size="sm" />,
    },
    {
      id: 'dueDate',
      header: 'Programación',
      accessor: 'dueDate',
      width: '140px',
      sortable: true,
      render: (_, t) => {
        const today = new Date().toISOString().split('T')[0];
        const isOverdue = t.status !== 'completada' && t.dueDate < today;
        return (
          <div
            className={`font-mono tabular-nums text-xs flex items-center gap-1.5 ${
              isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'
            }`}
          >
            {isOverdue && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            <span>{t.dueDate}</span>
            {t.dueTime && <span className="text-slate-400">· {t.dueTime}</span>}
          </div>
        );
      },
    },
    {
      id: 'property',
      header: 'Inmueble Asociado',
      width: '200px',
      render: (_, t) => (
        <div className="text-xs text-slate-700 truncate">
          {t.propertyTitle ? (
            <span className="font-medium text-slate-800">{t.propertyTitle}</span>
          ) : (
            <span className="text-slate-400">Sin inmueble específico</span>
          )}
        </div>
      ),
    },
    {
      id: 'source',
      header: 'Origen',
      width: '120px',
      render: (_, t) => (
        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {t.assignedByDirector ? 'Jefatura' : 'Equipo'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Estado',
      accessor: 'status',
      width: '110px',
      sortable: true,
      render: (st) => <Badge status={st as TaskStatus} size="sm" />,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '80px',
      render: (_, t) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEditTask(t)}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
            title="Editar tarea"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteTask(t.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
            title="Eliminar tarea"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Agenda Operativa & Tareas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organización diaria de visitas a inmuebles, control de llaves, carteles y fotografías.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista Calendario Mensual"
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista Tablero Kanban"
            >
              <Columns3 className="w-4 h-4" />
              <span className="hidden sm:inline">Tablero</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista en Lista / Tabla"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onNewTask}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nueva Tarea / Visita
          </Button>
        </div>
      </div>

      {/* Control de Llaves & Cartelería */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <button
          onClick={() => setIsKeysCardOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 p-4.5 text-left hover:bg-slate-50 transition-colors"
          aria-expanded={isKeysCardOpen}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Key className="w-4 h-4 text-slate-700 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 whitespace-nowrap">Control de Llaves & Cartelería</h3>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 whitespace-nowrap">
              🔑 {keysInOffice} · 🚩 {signageActiveCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isKeysCardOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToProperties();
                }}
                className="text-xs text-slate-500 hover:text-slate-900 p-1 h-auto"
              >
                Ver Inmuebles
              </Button>
            )}
            <span className="text-slate-400">
              {isKeysCardOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </div>
        </button>

        {isKeysCardOpen && (
          <div className="px-4.5 pb-4.5 space-y-2.5 border-t border-slate-100 pt-3">
            {[
              { label: 'Llaves en Oficina Central', count: keysInOffice, icon: '🔑' },
              { label: 'Llaves en Portería del Edificio', count: keysInBuilding, icon: '🏢' },
              { label: 'Carteles Colocados en Frente', count: signageActiveCount, icon: '🚩' },
              { label: 'Inmuebles en Visita Hoy', count: properties.filter((p) => p.status === 'en_visita').length, icon: '🚪' },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={onNavigateToProperties}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-slate-700 font-medium">{item.label}</span>
                </div>
                <span className="font-mono font-bold tabular-nums text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bar (sólo en Tablero y Lista; el Calendario se muestra limpio) */}
      {viewMode !== 'calendar' && (
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por tarea, inmueble o instrucción..."
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onResetFilters={handleResetFilters}
        totalResults={filteredTasks.length}
      >
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-36 text-xs h-9"
          options={[
            { value: 'all', label: 'Gestión: Todas' },
            { value: 'Visita', label: '🚪 Visitas' },
            { value: 'Llaves', label: '🔑 Llaves' },
            { value: 'Cartelería', label: '🚩 Cartelería' },
            { value: 'Inspección', label: '📋 Inspecciones' },
            { value: 'Fotografía', label: '📸 Fotos' },
            { value: 'Documentación', label: '📁 Documentación' },
          ]}
        />

        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-32 text-xs h-9"
          options={[
            { value: 'all', label: 'Prioridad: Todas' },
            { value: 'alta', label: 'Alta' },
            { value: 'media', label: 'Media' },
            { value: 'baja', label: 'Baja' },
          ]}
        />

        {viewMode === 'table' && (
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-32 text-xs h-9"
            options={[
              { value: 'all', label: 'Estado: Todos' },
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'en_progreso', label: 'En Progreso' },
              { value: 'completada', label: 'Completada' },
            ]}
          />
        )}
      </FilterBar>
      )}

      {/* Content: Calendar, Kanban or Table */}
      {viewMode === 'calendar' ? (
        <TaskCalendarView
          tasks={tasks}
          onNewTaskWithDate={onNewTaskWithDate}
          onEditTask={onEditTask}
          onToggleTaskStatus={onToggleTaskStatus}
        />
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);

            return (
              <div
                key={col.status}
                className="bg-slate-100/75 rounded-xl border border-slate-200/80 p-4 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className="text-sm font-bold text-slate-800">{col.label}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold tabular-nums px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Body Cards */}
                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      No hay tareas en esta etapa
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div key={task.id} className="relative group/kanban">
                        <TaskCard
                          task={task}
                          onToggleStatus={onToggleTaskStatus}
                          onEdit={onEditTask}
                          onDelete={onDeleteTask}
                        />

                        {/* Quick Move Status Pills in Kanban */}
                        <div className="mt-1 flex items-center justify-end gap-1 px-1">
                          {col.status !== 'pendiente' && (
                            <button
                              onClick={() => onMoveTaskStatus(task, 'pendiente')}
                              className="text-[10px] text-slate-500 hover:text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs"
                              title="Mover a Por Hacer"
                            >
                              ← Por Hacer
                            </button>
                          )}
                          {col.status !== 'en_progreso' && (
                            <button
                              onClick={() => onMoveTaskStatus(task, 'en_progreso')}
                              className="text-[10px] text-blue-600 hover:text-blue-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs"
                              title="Mover a En Curso"
                            >
                              {col.status === 'completada' ? '← En Curso' : 'En Curso →'}
                            </button>
                          )}
                          {col.status !== 'completada' && (
                            <button
                              onClick={() => onMoveTaskStatus(task, 'completada')}
                              className="text-[10px] text-emerald-600 hover:text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs"
                              title="Mover a Completadas"
                            >
                              Completar →
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Add at bottom of column */}
                <button
                  onClick={onNewTask}
                  className="mt-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg border border-dashed border-slate-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir tarea</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <Table
          data={filteredTasks}
          columns={columns}
          keyExtractor={(t) => t.id}
          onRowClick={(t) => onEditTask(t)}
          pageSize={10}
          emptyMessage="No se encontraron tareas con los filtros actuales."
        />
      )}
    </div>
  );
};
