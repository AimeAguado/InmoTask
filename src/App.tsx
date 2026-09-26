import React, { useState } from 'react';
import { Property, Task, TaskStatus } from './types';
import {
  INITIAL_PROPERTIES,
  INITIAL_TASKS,
  CURRENT_AGENT,
} from './data/mockData';
import { Logo } from './components/ui/Logo';
import { Button } from './components/ui/Button';
import { DashboardView } from './components/views/DashboardView';
import { PropertiesView } from './components/views/PropertiesView';
import { TasksView } from './components/views/TasksView';
import { DesignSystemView } from './components/views/DesignSystemView';
import { PropertyModal } from './components/domain/PropertyModal';
import { PropertyDetailModal } from './components/domain/PropertyDetailModal';
import { TaskModal } from './components/domain/TaskModal';
import { GlobalSearch } from './components/ui/GlobalSearch';
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Palette,
  Plus,
  Check,
  ChevronDown,
} from 'lucide-react';

type ViewMode = 'dashboard' | 'properties' | 'tasks' | 'design-system';

export default function App() {
  // Main Data States (Operational Real Estate: Properties & Internal Tasks)
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // Active View State
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');

  // Modal States
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);

  const [isPropertyDetailOpen, setIsPropertyDetailOpen] = useState(false);
  const [selectedPropertyForDetail, setSelectedPropertyForDetail] = useState<Property | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskInitialDate, setTaskInitialDate] = useState<string | undefined>(undefined);

  // Global Real-time Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Quick Action Dropdown State
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  // Feedback Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Property Handlers
  const handleSaveProperty = (property: Property) => {
    setProperties((prev) => {
      const exists = prev.some((p) => p.id === property.id);
      if (exists) {
        showToast(`Ficha de ${property.code} actualizada correctamente.`);
        return prev.map((p) => (p.id === property.id ? property : p));
      } else {
        showToast(`Inmueble ${property.code} registrado en cartelera.`);
        return [property, ...prev];
      }
    });
  };

  const handleDeleteProperty = (id: string) => {
    const prop = properties.find((p) => p.id === id);
    if (confirm(`¿Confirma que desea retirar el inmueble "${prop?.title || id}"?`)) {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      showToast('Inmueble eliminado de la cartelera.');
    }
  };

  // Task Handlers
  const handleSaveTask = (task: Task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      if (exists) {
        showToast('Tarea u orden de trabajo actualizada.');
        return prev.map((t) => (t.id === task.id ? task : t));
      } else {
        showToast('Nueva tarea registrada en la agenda.');
        return [task, ...prev];
      }
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Tarea eliminada de la agenda.');
  };

  const handleToggleTaskStatus = (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completada' ? 'pendiente' : 'completada';
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === 'completada' ? new Date().toISOString() : undefined,
            }
          : t
      )
    );
    showToast(
      nextStatus === 'completada'
        ? `Visita/tarea completada: "${task.title}"`
        : `Tarea reabierta como pendiente: "${task.title}"`
    );
  };

  const handleMoveTaskStatus = (task: Task, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'completada' ? new Date().toISOString() : undefined,
            }
          : t
      )
    );
    showToast(`Tarea movida a "${newStatus.replace('_', ' ')}"`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Feedback Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* TOP BAR CONTRACT: Zone 1 (Brand) — Zone 2 (Nav Links) — Zone 3 (Actions) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/85">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single text wordmark with house/checkmark symbol */}
          <div
            onClick={() => setActiveView('dashboard')}
            className="cursor-pointer"
          >
            <Logo size="md" />
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Panel Operativo</span>
            </button>

            <button
              onClick={() => setActiveView('properties')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'properties'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Inmuebles & Llaves</span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                ({properties.length})
              </span>
            </button>

            <button
              onClick={() => setActiveView('tasks')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'tasks'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Tareas & Visitas</span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                ({tasks.filter((t) => t.status !== 'completada').length})
              </span>
            </button>

            <button
              onClick={() => setActiveView('design-system')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'design-system'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-emerald-600" />
              <span>Guía de Componentes</span>
            </button>
          </nav>

          {/* Zone 3: Global Search, Quick Create & User Agent Profile */}
          <div className="flex items-center gap-2.5">
            {/* Real-time Global Search Bar */}
            <GlobalSearch
              properties={properties}
              onSelectProperty={(property) => {
                setSelectedPropertyForDetail(property);
                setIsPropertyDetailOpen(true);
              }}
              onViewAllInProperties={(searchTerm) => {
                setGlobalSearchQuery(searchTerm);
                setActiveView('properties');
              }}
            />

            {/* Quick Create Dropdown Menu */}
            <div className="relative">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                rightIcon={<ChevronDown className="w-3 h-3 text-slate-400" />}
              >
                + Crear
              </Button>

              {isQuickCreateOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsQuickCreateOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 text-xs">
                    <button
                      onClick={() => {
                        setIsQuickCreateOpen(false);
                        setPropertyToEdit(null);
                        setIsPropertyModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>Registrar Inmueble</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsQuickCreateOpen(false);
                        setTaskToEdit(null);
                        setIsTaskModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      <span>Nueva Tarea / Visita</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Agent Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                src={CURRENT_AGENT.avatar}
                alt={CURRENT_AGENT.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-2xs"
              />
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {CURRENT_AGENT.name}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {CURRENT_AGENT.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 px-2 py-1.5 bg-slate-50 text-xs">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`p-1.5 rounded flex flex-col items-center ${
              activeView === 'dashboard' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Panel</span>
          </button>
          <button
            onClick={() => setActiveView('properties')}
            className={`p-1.5 rounded flex flex-col items-center ${
              activeView === 'properties' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Inmuebles</span>
          </button>
          <button
            onClick={() => setActiveView('tasks')}
            className={`p-1.5 rounded flex flex-col items-center ${
              activeView === 'tasks' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Tareas</span>
          </button>
          <button
            onClick={() => setActiveView('design-system')}
            className={`p-1.5 rounded flex flex-col items-center ${
              activeView === 'design-system' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">UI Guía</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeView === 'dashboard' && (
          <DashboardView
            properties={properties}
            tasks={tasks}
            onNavigate={(v) => setActiveView(v)}
            onNewProperty={() => {
              setPropertyToEdit(null);
              setIsPropertyModalOpen(true);
            }}
            onNewTask={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            onViewPropertyDetails={(prop) => {
              setSelectedPropertyForDetail(prop);
              setIsPropertyDetailOpen(true);
            }}
            onToggleTaskStatus={handleToggleTaskStatus}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {activeView === 'properties' && (
          <PropertiesView
            properties={properties}
            initialSearchQuery={globalSearchQuery}
            onNewProperty={() => {
              setPropertyToEdit(null);
              setIsPropertyModalOpen(true);
            }}
            onEditProperty={(prop) => {
              setPropertyToEdit(prop);
              setIsPropertyModalOpen(true);
            }}
            onDeleteProperty={handleDeleteProperty}
            onViewDetails={(prop) => {
              setSelectedPropertyForDetail(prop);
              setIsPropertyDetailOpen(true);
            }}
            onScheduleVisit={(prop) => {
              setTaskToEdit({
                id: `task-${Date.now()}`,
                title: `Visita programada: ${prop.code} - ${prop.title}`,
                category: 'Visita',
                priority: 'alta',
                status: 'pendiente',
                dueDate: new Date().toISOString().split('T')[0],
                dueTime: '16:00',
                propertyId: prop.id,
                propertyTitle: prop.title,
                assignedByDirector: true,
                assignedTo: {
                  name: CURRENT_AGENT.name,
                  avatar: CURRENT_AGENT.avatar,
                },
              });
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {activeView === 'tasks' && (
          <TasksView
            tasks={tasks}
            onNewTask={() => {
              setTaskToEdit(null);
              setTaskInitialDate(undefined);
              setIsTaskModalOpen(true);
            }}
            onNewTaskWithDate={(dateStr) => {
              setTaskToEdit(null);
              setTaskInitialDate(dateStr);
              setIsTaskModalOpen(true);
            }}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onToggleTaskStatus={handleToggleTaskStatus}
            onMoveTaskStatus={handleMoveTaskStatus}
          />
        )}

        {activeView === 'design-system' && <DesignSystemView />}
      </main>

      {/* Global Modals */}
      <PropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => {
          setIsPropertyModalOpen(false);
          setPropertyToEdit(null);
        }}
        onSave={handleSaveProperty}
        propertyToEdit={propertyToEdit}
      />

      <PropertyDetailModal
        property={selectedPropertyForDetail}
        isOpen={isPropertyDetailOpen}
        onClose={() => {
          setIsPropertyDetailOpen(false);
          setSelectedPropertyForDetail(null);
        }}
        onScheduleVisit={(prop) => {
          setTaskToEdit({
            id: `task-${Date.now()}`,
            title: `Visita presencial a ${prop.code} - ${prop.title}`,
            category: 'Visita',
            priority: 'alta',
            status: 'pendiente',
            dueDate: new Date().toISOString().split('T')[0],
            dueTime: '15:00',
            propertyId: prop.id,
            propertyTitle: prop.title,
            assignedByDirector: true,
            assignedTo: {
              name: CURRENT_AGENT.name,
              avatar: CURRENT_AGENT.avatar,
            },
          });
          setIsTaskModalOpen(true);
        }}
        onEdit={(prop) => {
          setIsPropertyDetailOpen(false);
          setPropertyToEdit(prop);
          setIsPropertyModalOpen(true);
        }}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
          setTaskInitialDate(undefined);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        initialDate={taskInitialDate}
        properties={properties}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-slate-400">·</span>
            <span>Sistema Operativo de Inmobiliaria & Tareas</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('design-system')}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Biblioteca de Componentes
            </button>
            <span className="text-slate-300">·</span>
            <span>{CURRENT_AGENT.name} ({CURRENT_AGENT.role})</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
