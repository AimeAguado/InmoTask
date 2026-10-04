import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Property } from '../../types';

export interface DeletePropertyModalProps {
  property: Property | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (property: Property) => void;
}

/**
 * Confirmación de borrado irreversible.
 *
 * Pide escribir el código del inmueble en vez de un simple "sí/no": el borrado
 * elimina la ficha y las fotos del disco, no hay forma de recuperarlo desde la
 * aplicación, y un clic de más en un botón junto al de editar no debería
 * alcanzar para ejecutar algo así.
 */
export const DeletePropertyModal: React.FC<DeletePropertyModalProps> = ({
  property,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  const [typed, setTyped] = useState('');

  // El texto se reinicia en cada apertura para no arrastrar lo último escrito.
  useEffect(() => {
    if (isOpen) setTyped('');
  }, [isOpen, property?.id]);

  if (!property) return null;

  const matches = typed.trim().toUpperCase() === property.code.toUpperCase();
  const photoCount = property.images?.length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar inmueble"
      subtitle={`${property.code} · ${property.title}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(property)}
            disabled={!matches || isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 space-y-1">
            <p className="font-semibold">Esta acción no se puede deshacer.</p>
            <p>
              Se borra la ficha de la base de datos
              {photoCount > 0 && (
                <>
                  {' '}
                  y su carpeta con <strong>{photoCount}</strong>{' '}
                  {photoCount === 1 ? 'foto' : 'fotos'} del servidor.
                </>
              )}
              .
            </p>
          </div>
        </div>

        {/*
          Si la ficha viene de la importación, volver a correr el importador la
          reconstruye (hace upsert por código). Conviene avisarlo antes de que
          alguien gaste un click en esto y lo descubra después.
        */}
        {property.source === 'captacion' && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Esta ficha viene de la planilla de captación. Si se corre{' '}
            <code className="font-mono">npm run import:properties</code> más
            adelante, va a volver a aparecer.
          </p>
        )}

        <div>
          <Input
            label={`Escribí ${property.code} para confirmar`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={property.code}
            autoFocus
            autoComplete="off"
            disabled={isDeleting}
          />
        </div>
      </div>
    </Modal>
  );
};