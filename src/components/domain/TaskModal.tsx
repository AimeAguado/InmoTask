import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, TaskPriority, TaskStatus, Property } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { useAuth } from '../../context/AuthContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  taskToEdit?: Task | null;
  initialDate?: string;
  properties: Property[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  initialDate,
  properties,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    category: 'Visita',
    priority: 'alta',
    status: 'pendiente',
    dueDate: initialDate || new Date().toISOString().split('T')[0],
    dueTime: '11:00',
    description: '',
    propertyId: '',
    assignedByDirector: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (taskToEdit) {
      setFormData(taskToEdit);
    } else {
      setFormData({
        title: '',
        category: 'Visita',
        priority: 'alta',
        status: 'pendiente',
        dueDate: initialDate || new Date().toISOString().split('T')[0],
        dueTime: '11:00',
        description: '',
        propertyId: '',
        assignedByDirector: true,
      });
    }
    setErrors({});
  }, [taskToEdit, initialDate, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = 'El título de la tarea u orden es obligatorio';
    if (!formData.dueDate) newErrors.dueDate = 'La fecha programada es obligatoria';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const linkedProperty = properties.find((p) => p.id === formData.propertyId);

    const task: Task = {
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: formData.title || '',
      category: (formData.category as TaskCategory) || 'Visita',
      priority: (formData.priority as TaskPriority) || 'alta',
      status: (formData.status as TaskStatus) || 'pendiente',
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      dueTime: formData.dueTime,
      description: formData.description,
      propertyId: formData.propertyId || undefined,
      propertyTitle: linkedProperty?.title,
      assignedByDirector: Boolean(formData.assignedByDirector),
      assignedTo: {
        name: user?.name ?? '',
        avatar: user?.avatar ?? '',
      },
      completedAt: formData.status === 'completada' ? new Date().toISOString() : undefined,
    };

    onSave(task);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Editar Tarea / Visita' : 'Nueva Tarea u Orden de Trabajo'}
      subtitle="Organice visitas agendadas por administración, llaves, cartelería o inspecciones."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {taskToEdit ? 'Guardar Cambios' : 'Registrar Tarea'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título de la tarea o visita"
          placeholder="Ej: Visita agendada por administración - Mostrar departamento"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Tipo de Gestión"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
            options={[
              { value: 'Visita', label: '🚪 Visita a Inmueble' },
              { value: 'Llaves', label: '🔑 Retiro / Devolución de Llaves' },
              { value: 'Cartelería', label: '🚩 Colocación / Cambio de Cartel' },
              { value: 'Inspección', label: '📋 Inspección / Relevamiento' },
              { value: 'Fotografía', label: '📸 Sesión de Fotos' },
              { value: 'Documentación', label: '📁 Documentación / Planos' },
            ]}
          />

          <Select
            label="Prioridad"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
            options={[
              { value: 'alta', label: 'Alta Prioridad' },
              { value: 'media', label: 'Media Prioridad' },
              { value: 'baja', label: 'Baja Prioridad' },
            ]}
          />

          <Select
            label="Estado"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
            options={[
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'en_progreso', label: 'En Progreso' },
              { value: 'completada', label: 'Completada' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Fecha programada"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            error={errors.dueDate}
            required
          />
          <Input
            label="Hora"
            type="time"
            value={formData.dueTime || ''}
            onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
          />
        </div>

        <Select
          label="Inmueble Asociado"
          value={formData.propertyId || ''}
          onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
        >
          <option value="">Seleccionar propiedad de la cartera...</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.title} ({p.neighborhood})
            </option>
          ))}
        </Select>

        <Textarea
          label="Instrucciones u observaciones del jefe"
          placeholder="Ej: El cliente llega puntual a las 15:30. Pasar a buscar la llave por portería media hora antes..."
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="assignedByDirector"
            checked={formData.assignedByDirector}
            onChange={(e) => setFormData({ ...formData, assignedByDirector: e.target.checked })}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
          />
          <label htmlFor="assignedByDirector" className="text-xs font-medium text-slate-700 cursor-pointer">
            Coordinada por administración / Dirección
          </label>
        </div>
      </form>
    </Modal>
  );
};
