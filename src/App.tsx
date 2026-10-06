import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Property, Task, TaskStatus } from './types';
import { propertiesApi, tasksApi, toMessage } from './services/api';
import { Logo } from './components/ui/Logo';
import { Button } from './components/ui/Button';
import { DashboardView } from './components/views/DashboardView';
import { PropertiesView } from './components/views/PropertiesView';
import { TasksView } from './components/views/TasksView';
import { UsersView } from './components/views/UsersView';
import { LoginView } from './components/views/LoginView';
import { DesignSystemView } from './components/views/DesignSystemView';
import { PropertyModal } from './components/domain/PropertyModal';
import { PropertyDetailModal } from './components/domain/PropertyDetailModal';
import { TaskModal } from './components/domain/TaskModal';
import { DeletePropertyModal } from './components/domain/DeletePropertyModal';
import { ProfileModal, ProfileDraft } from './components/domain/ProfileModal';
import { GlobalSearch } from './components/ui/GlobalSearch';
import { UserAvatar } from './components/ui/UserAvatar';
import { NotificationsBell, getUrgentTasks } from './components/ui/NotificationsBell';
import { useAuth } from './context/AuthContext';
import { ROLE_PERMISSIONS } from './types';
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Palette,
  Plus,
  Check,
  ChevronDown,
  Users as UsersIcon,
  LogOut,
  ChevronUp,
  Loader2,
  UserCog,
} from 'lucide-react';

type ViewMode = 'dashboard' | 'properties' | 'tasks' | 'design-system' | 'users';

export default function App() {
  const {
    user,
    permissions,
    isAuthenticated,
    isBootstrapping,
    signOut,
    updateProfile,
  } = useAuth();
  // Main Data States (Operational Real Estate: Properties & Internal Tasks)
  const [properties, setProperties] = useState<Property[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

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

  // Ojo con el orden: App tiene dos returns tempranos (isBootstrapping y el
  // login) más abajo. Todo useState/useEffect tiene que declararse ANTES de
  // ellos, o al autenticarse el componente ejecutará más hooks que en el render
  // anterior y React revienta con "Rendered more hooks than during the previous
  // render", dejando #root vacío.
  const [isDeletePropertyOpen, setIsDeletePropertyOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeletingProperty, setIsDeletingProperty] = useState(false);

  // Global Real-time Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Quick Action Dropdown State
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  // Navbar User Menu State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Perfil propio: nombre, apellido, teléfono y foto.
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const urgentTasks = getUrgentTasks(tasks);

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
        setIsNotifOpen(false);
        setIsQuickCreateOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // Aviso al entrar cuando hay tareas de alta demanda vencidas o con vencimiento hoy.
  // Ojo: App ya está montado en el LoginView, así que hay que dispararlo al autenticarse,
  // no al montar, o el aviso se muestra (y se borra) antes de que el usuario entre.
  const urgentToastShown = useRef(false);
  useEffect(() => {
    if (!isAuthenticated) {
      urgentToastShown.current = false;
      return;
    }
    if (urgentToastShown.current) return;
    urgentToastShown.current = true;
    if (urgentTasks.length === 0) return;
    const [first] = urgentTasks;
    const extra = urgentTasks.length - 1;
    showToast(
      `${urgentTasks.length === 1 ? '1 tarea' : `${urgentTasks.length} tareas`} de alta demanda: ` +
        `${first.task.title}${extra > 0 ? ` y ${extra} más` : ''}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Feedback Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [props, tsk] = await Promise.all([propertiesApi.list(), tasksApi.list()]);
      setProperties(props.properties);
      setTasks(tsk.tasks);
    } catch (err) {
      showToast(toMessage(err));
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Los datos se piden recién con sesión activa: antes de eso cualquier endpoint
  // responde 401 y no hay nada que mostrar.
  useEffect(() => {
    if (!isAuthenticated) return;
    void loadData();
  }, [isAuthenticated, loadData]);

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    setIsQuickCreateOpen(false);
    setActiveView('dashboard');
    // Se vacían los caches locales: si otro usuario entra en el mismo navegador
    // no puede ver por un instante los datos del anterior.
    setProperties([]);
    setTasks([]);
    void signOut();
  };

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginView />;
  }

  // Property Handlers
  // El id del modal no viene de Mongo: las fichas nuevas usan 'prop-<timestamp>'
  // como id temporal. Si no está en la lista, es un alta; si está, un PUT.
  const handleSaveProperty = async (property: Property) => {
    const exists = properties.some((p) => p.id === property.id);
    try {
      const { property: saved } = exists
        ? await propertiesApi.update(property.id, property)
        : await propertiesApi.create(property);

      setProperties((prev) =>
        exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]
      );
      showToast(
        exists
          ? `Ficha de ${saved.code} actualizada correctamente.`
          : `Inmueble ${saved.code} registrado en cartelera.`
      );
    } catch (err) {
      showToast(toMessage(err));
    }
  };

  const handleAskDeleteProperty = (property: Property) => {
    setPropertyToDelete(property);
    setIsDeletePropertyOpen(true);
  };

  const handleSaveProfile = async (draft: ProfileDraft): Promise<void> => {
    setIsSavingProfile(true);
    setProfileError('');
    try {
      await updateProfile(draft);
      setIsProfileOpen(false);
      showToast('Perfil actualizado.');
    } catch (err) {
      setProfileError(toMessage(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteProperty = async (property: Property) => {
    setIsDeletingProperty(true);
    try {
      const { photos } = await propertiesApi.remove(property.id);
      setProperties((prev) => prev.filter((p) => p.id !== property.id));
      setIsDeletePropertyOpen(false);
      setPropertyToDelete(null);

      // El servidor puede preservar carpetas compartidas o fallar el borrado de
      // alguna: en esos casos la ficha igual se fue, pero conviene que el
      // usuario sepa que quedaron fotos.
      const leftovers = [...photos.foldersKept, ...photos.foldersFailed];
      const detail =
        photos.filesDeleted > 0
          ? ` Se borraron ${photos.filesDeleted} ${photos.filesDeleted === 1 ? 'foto' : 'fotos'}.`
          : '';
      const warning = leftovers.length
        ? ` Quedaron fotos sin borrar en "${leftovers.join(', ')}": ${photos.foldersKept.length ? 'las usa otra ficha' : 'revisá la carpeta'}.`
        : '';

      showToast(`Inmueble ${property.code} eliminado de la cartelera.${detail}${warning}`);
    } catch (err) {
      showToast(toMessage(err));
    } finally {
      setIsDeletingProperty(false);
    }
  };

  // Task Handlers
  const handleSaveTask = async (task: Task) => {
    const exists = tasks.some((t) => t.id === task.id);
    try {
      const { task: saved } = exists
        ? await tasksApi.update(task.id, task)
        : await tasksApi.create(task);

      setTasks((prev) => (exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev]));
      showToast(exists ? 'Tarea u orden de trabajo actualizada.' : 'Nueva tarea registrada en la agenda.');
    } catch (err) {
      showToast(toMessage(err));
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await tasksApi.remove(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast('Tarea eliminada de la agenda.');
    } catch (err) {
      showToast(toMessage(err));
    }
  };

  const handleToggleTaskStatus = (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completada' ? 'pendiente' : 'completada';

    // Se aplica el cambio local al instante y se revierte si la API lo rechaza:
    // marcar una tarea es una acción de un click y no debería esperar al round trip.
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

    void tasksApi
      .setStatus(task.id, nextStatus)
      .then(({ task: saved }) => {
        setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      })
      .catch((err: unknown) => {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        showToast(toMessage(err));
      });

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

    void tasksApi
      .setStatus(task.id, newStatus)
      .then(({ task: saved }) => {
        setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      })
      .catch((err: unknown) => {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        showToast(toMessage(err));
      });

    showToast(`Tarea movida a "${newStatus.replace('_', ' ')}"`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white overflow-x-clip">
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
      <header ref={headerRef} className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/85">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 xl:gap-4">
          {/* Zone 1: Single text wordmark with house/checkmark symbol */}
          <div
            onClick={() => setActiveView('dashboard')}
            className="cursor-pointer shrink-0"
          >
            <Logo size="md" className="[&>span]:hidden sm:[&>span]:flex" />
          </div>

          {/* Zone 2: Clean text navigation links — never compressed */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-2.5 xl:px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Panel Operativo</span>
            </button>

            <button
              onClick={() => setActiveView('properties')}
              className={`px-2.5 xl:px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'properties'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden xl:inline">Inmuebles &amp; Llaves</span>
              <span className="xl:hidden">Inmuebles</span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                ({properties.length})
              </span>
            </button>

            <button
              onClick={() => setActiveView('tasks')}
              className={`px-2.5 xl:px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'tasks'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Tareas &amp; Visitas</span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                ({tasks.filter((t) => t.status !== 'completada').length})
              </span>
            </button>

            {permissions?.canManageUsers && (
              <button
                onClick={() => setActiveView('users')}
                className={`px-2.5 xl:px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeView === 'users'
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <UsersIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Usuarios</span>
              </button>
            )}

            <button
              onClick={() => setActiveView('design-system')}
              title="Guía de Componentes"
              className={`hidden 2xl:flex px-2.5 xl:px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap items-center gap-1.5 ${
                activeView === 'design-system'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>UI</span>
            </button>
          </nav>

          {/* Zone 3: Global Search, Quick Create & User Agent Profile */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            {/* Real-time Global Search Bar */}
            <GlobalSearch
              properties={properties}
              className="flex-1 min-w-[7rem] max-w-[15rem] shrink"
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
                rightIcon={<ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />}
              >
                <span className="hidden sm:inline">+ Crear</span>
              </Button>

              {isQuickCreateOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsQuickCreateOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 text-xs">
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

            <NotificationsBell
              tasks={tasks}
              isOpen={isNotifOpen}
              onToggle={() => {
                setIsNotifOpen((v) => !v);
                setIsUserMenuOpen(false);
                setIsQuickCreateOpen(false);
              }}
              onNavigateToTasks={() => {
                setActiveView('tasks');
                setGlobalSearchQuery('');
              }}
              onClose={() => setIsNotifOpen(false)}
              onCompleteTask={handleToggleTaskStatus}
            />

            {/* Agent Profile + Session Menu */}
            <div className="relative flex items-center gap-2 pl-2 border-l border-slate-200 shrink-0">
              <button
                onClick={() => {
                  setIsUserMenuOpen((v) => !v);
                  setIsNotifOpen(false);
                  setIsQuickCreateOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-slate-50 transition-colors"
                aria-expanded={isUserMenuOpen}
                title="Menú de usuario"
              >
                <UserAvatar name={user.name} size="sm" />
                <div className="hidden xl:block min-w-0 max-w-[150px] text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight truncate">
                    {permissions?.label}
                  </div>
                </div>
                {isUserMenuOpen ? (
                  <ChevronUp className="w-3 h-3 text-slate-400 shrink-0 hidden sm:block" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 hidden sm:block" />
                )}
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 text-xs overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <div className="font-bold text-slate-900 truncate">{user.name}</div>
                      <div className="font-mono text-[11px] text-slate-500 truncate">
                        {user.email}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {permissions?.label}
                        </span>
                        {/* La inmobiliaria a la que está dado de alta el usuario: en un
                            solo sistema hay varias, así que conviene tenerla siempre a
                            la vista para no confundir carteras. */}
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 max-w-[120px]">
                          <Building2 size={10} className="shrink-0" />
                          <span className="truncate">{user.inmoviliaria || '—'}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setProfileError('');
                        setIsProfileOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <UserCog size={16} className="text-slate-500" />
                      <span>Editar mi perfil</span>
                    </button>

                    {permissions?.canManageUsers && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setActiveView('users');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <UsersIcon className="w-4 h-4 text-emerald-600" />
                        <span>Gestionar usuarios</span>
                      </button>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-700 border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar — visible until the desktop nav takes over at lg */}
        <div className="lg:hidden flex items-center justify-around border-t border-slate-100 px-2 py-1.5 bg-slate-50 text-xs">
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
        {isLoadingData && properties.length === 0 && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2.5" />
            <span className="text-sm">Cargando datos desde la base...</span>
          </div>
        ) : (
          <>
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
onDeleteProperty={handleAskDeleteProperty}
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
                  name: user.name,
                  avatar: user.avatar,
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

        {activeView === 'users' && permissions?.canManageUsers && <UsersView />}

        {activeView === 'design-system' && <DesignSystemView />}
          </>
        )}
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
              name: user.name,
              avatar: user.avatar,
            },
          });
          setIsTaskModalOpen(true);
        }}
        onEdit={(prop) => {
          setIsPropertyDetailOpen(false);
          setPropertyToEdit(prop);
          setIsPropertyModalOpen(true);
        }}
        onDelete={(prop) => {
          setSelectedPropertyForDetail(null);
          handleAskDeleteProperty(prop);
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

      <DeletePropertyModal
        property={propertyToDelete}
        isOpen={isDeletePropertyOpen}
        isDeleting={isDeletingProperty}
        onClose={() => {
          setIsDeletePropertyOpen(false);
          setPropertyToDelete(null);
        }}
        onConfirm={handleDeleteProperty}
      />

      {user && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            setProfileError('');
          }}
          user={user}
          inmobiliaria={user.inmoviliaria}
          isSaving={isSavingProfile}
          error={profileError}
          onSubmit={handleSaveProfile}
        />
      )}

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
            <span>
              {user.name} ({permissions?.label})
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
