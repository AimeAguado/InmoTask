import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge, BadgeStatus } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, MetricCard } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Modal } from '../ui/Modal';
import { Table, Column } from '../ui/Table';
import { FilterBar } from '../ui/FilterBar';
import { Logo } from '../ui/Logo';
import {
  Check,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Users,
  Search,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const DesignSystemView: React.FC = () => {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoButtonLoading, setDemoButtonLoading] = useState(false);
  const [demoSearchQuery, setDemoSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  // Sample data for table demonstration
  const sampleTableData = [
    { id: '1', nombre: 'Semipiso en Recoleta', categoria: 'Venta', estado: 'disponible' as BadgeStatus, llaves: 'Oficina Central' },
    { id: '2', nombre: 'Oficina Catalinas Norte', categoria: 'Alquiler', estado: 'en_visita' as BadgeStatus, llaves: 'Portería' },
    { id: '3', nombre: 'Casa en Country Bancario', categoria: 'Venta', estado: 'reservada' as BadgeStatus, llaves: 'Oficina Central' },
  ];

  const sampleColumns: Column<(typeof sampleTableData)[0]>[] = [
    { id: 'nombre', header: 'Inmueble', accessor: 'nombre', sortable: true },
    { id: 'categoria', header: 'Operación', accessor: 'categoria', sortable: true },
    {
      id: 'estado',
      header: 'Badge de Estado',
      accessor: 'estado',
      render: (st) => <Badge status={st as BadgeStatus} size="sm" />,
    },
    { id: 'llaves', header: 'Ubicación Llaves', accessor: 'llaves' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <Logo size="md" />
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Design System & Component Library
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Componentes Reutilizables de InmoTask
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Arquitectura modular de componentes UI diseñados para máxima reusabilidad, consistencia visual,
          accesibilidad WCAG AA y comportamiento funcional interactivo.
        </p>
      </div>

      {/* 1. Botones */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">1. Botones Reutilizables (`Button.tsx`)</h3>
          <p className="text-xs text-slate-500">
            Variantes de color, tamaños (`sm`, `md`, `lg`), estados de carga (`isLoading`), y ranuras para iconos.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Variantes de Estilo</div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary (Slate 900)</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success" leftIcon={<Check className="w-4 h-4" />}>
              Success
            </Button>
            <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
              Danger
            </Button>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">Tamaños & Estados</div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small (sm)</Button>
            <Button size="md">Medium (md)</Button>
            <Button size="lg">Large (lg)</Button>
            <Button
              variant="primary"
              isLoading={demoButtonLoading}
              onClick={() => {
                setDemoButtonLoading(true);
                setTimeout(() => setDemoButtonLoading(false), 1500);
              }}
            >
              {demoButtonLoading ? 'Procesando...' : 'Click para Simular Loading'}
            </Button>
            <Button variant="outline" disabled>
              Deshabilitado
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Badges de Estado */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">2. Badges de Estado (`Badge.tsx`)</h3>
          <p className="text-xs text-slate-500">
            Etiquetas semánticas sin saturación excesiva, con punto de indicación y alto contraste accesible.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-2">Estados Inmobiliarios</div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge status="disponible" />
              <Badge status="reservado" />
              <Badge status="vendido" />
              <Badge status="alquilado" />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 mb-2">Prioridades de Tareas</div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge status="alta" />
              <Badge status="media" />
              <Badge status="baja" />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 mb-2">Estados de Tarea & Flujo CRM</div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge status="pendiente" />
              <Badge status="en_progreso" />
              <Badge status="completada" />
              <Badge status="lead" />
              <Badge status="visita_agendada" />
              <Badge status="negociacion" />
              <Badge status="cerrado" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Cards & Métricas */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">3. Cards Reutilizables (`Card.tsx` / `MetricCard`)</h3>
          <p className="text-xs text-slate-500">
            Contenedores modulares con elevación única, números tabulares (`font-mono tabular-nums`), y encabezados estructurados.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Efectividad Operativa"
            value="96.2%"
            change="+4.2% visitas a tiempo"
            trend="up"
            timeframe="Semestre actual"
            icon={Sparkles}
          />
          <MetricCard
            title="Inmuebles Activos"
            value="24"
            change="3 con visita hoy"
            trend="neutral"
            timeframe="en cartelera"
            icon={Building2}
          />
          <MetricCard
            title="Llaves en Tablero"
            value="18"
            change="Listas en recepción"
            trend="up"
            timeframe="oficina central"
            icon={ShieldCheck}
          />
        </div>

        <Card hoverable className="max-w-md">
          <CardHeader>
            <div>
              <CardTitle>Card Estructurado Base</CardTitle>
              <CardDescription>Subtítulo o descripción contextual</CardDescription>
            </div>
            <Badge status="disponible" size="sm" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              Contenido flexible dentro del cuerpo del Card. Soporta cualquier tipo de nodo, formularios o gráficos.
            </p>
          </CardContent>
          <CardFooter>
            <span>Pie de tarjeta</span>
            <Button size="sm" variant="ghost">Ver más</Button>
          </CardFooter>
        </Card>
      </div>

      {/* 4. Formularios */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            4. Formularios Reutilizables (`Input.tsx`, `Select.tsx`, `Textarea.tsx`)
          </h3>
          <p className="text-xs text-slate-500">
            Campos de entrada con validación, mensajes de ayuda, prefijos y soporte completo para teclado.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Campo de Texto con Icono"
            placeholder="Buscar o ingresar texto..."
            leftIcon={<Search className="w-4 h-4" />}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (e.target.value.length > 0 && e.target.value.length < 3) {
                setInputError('Debe ingresar al menos 3 caracteres');
              } else {
                setInputError('');
              }
            }}
            error={inputError}
            helperText={!inputError ? 'Ejemplo de validación en tiempo real' : undefined}
          />

          <Select
            label="Selector Desplegable"
            options={[
              { value: 'op1', label: 'Opción 1 - Residencial' },
              { value: 'op2', label: 'Opción 2 - Comercial' },
              { value: 'op3', label: 'Opción 3 - Industrial' },
            ]}
            helperText="Selector estilizado con flecha chevron"
          />

          <Input
            label="Campo con Prefijo y Sufijo"
            prefixText="USD"
            suffixText=".00"
            placeholder="250000"
            type="number"
          />
        </div>

        <Textarea
          label="Área de Texto Reutilizable"
          placeholder="Escriba aquí notas u observaciones extensas..."
          showCount
          maxLength={150}
          rows={2}
          helperText="Contador de caracteres integrado"
        />
      </div>

      {/* 5. Tablas & Filtros */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">5. Tablas & Filtros (`Table.tsx` & `FilterBar.tsx`)</h3>
          <p className="text-xs text-slate-500">
            Tabla densa con ordenamiento por columna, renderers personalizados, paginación y barra de filtros con buscador reactivo.
          </p>
        </div>

        <FilterBar
          searchQuery={demoSearchQuery}
          onSearchChange={setDemoSearchQuery}
          searchPlaceholder="Filtrar muestra de la tabla..."
          totalResults={sampleTableData.length}
        />

        <Table
          data={sampleTableData}
          columns={sampleColumns}
          keyExtractor={(row) => row.id}
          pageSize={3}
          showPagination={false}
        />
      </div>

      {/* 6. Modales */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">6. Modales Reutilizables (`Modal.tsx`)</h3>
          <p className="text-xs text-slate-500">
            Diálogos modales con difuminado de fondo (backdrop blur), soporte de tecla Escape y ranuras para cabecera y pie.
          </p>
        </div>

        <div>
          <Button variant="primary" onClick={() => setDemoModalOpen(true)}>
            Abrir Modal de Demostración
          </Button>
        </div>

        <Modal
          isOpen={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
          title="Modal de Demostración del Sistema"
          subtitle="Componente modal genérico accesible y responsivo."
          footer={
            <>
              <Button variant="outline" onClick={() => setDemoModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  alert('¡Acción confirmada en el modal!');
                  setDemoModalOpen(false);
                }}
              >
                Aceptar
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              Este modal utiliza bloqueo automático de desplazamiento del fondo (`body overflow hidden`),
              cierre con tecla <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-xs">Esc</kbd> o clic en el backdrop,
              y tamaños configurables desde `sm` hasta `2xl`.
            </p>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Garantiza accesibilidad aria-modal y enfoque seguro.</span>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
