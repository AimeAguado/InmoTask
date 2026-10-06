import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { UserAvatar } from '../ui/UserAvatar';
import type { AppUser } from '../../types';

export interface ProfileDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Usuario tal como está hoy; sólo se usa para mostrar el estado inicial. */
  user: AppUser;
  /** Empresa a la que pertenece, para dejar claro que no se puede cambiar. */
  inmobiliaria: string;
  isSaving?: boolean;
  error?: string;
  onSubmit: (draft: ProfileDraft) => void | Promise<void>;
}

/**
 * Datos del perfil: nombre, apellido, teléfono, email. La empresa y el rol no se
 * cambian desde acá (los define el admin). Los avatares son solo iniciales: no
 * hay foto de perfil.
 *
 * Se reutiliza para los dos casos: el usuario editando su propia cuenta y el
 * admin corrigiendo los datos de un asesor.
 */
export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  inmobiliaria,
  isSaving = false,
  error,
  onSubmit,
}) => {
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [email, setEmail] = useState(user.email ?? '');

  // Al reabrir el modal se descarta lo que se había tipeado a medias: si no, al
  // editar otro usuario aparecen los datos del anterior.
  useEffect(() => {
    if (!isOpen) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setPhone(user.phone ?? '');
    setEmail(user.email ?? '');
  }, [isOpen, user]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    void onSubmit({ firstName, lastName, phone, email });
  };

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const trimmedEmail = email.trim();
  const canSubmit =
    trimmedFirst.length > 0 && trimmedLast.length > 0 && trimmedEmail.length > 0 && !isSaving;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar perfil"
      subtitle={`${user.name} · ${inmobiliaria || 'Sin inmobiliaria'}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} isLoading={isSaving}>
            Guardar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="flex items-center justify-center">
          <UserAvatar name={`${trimmedFirst} ${trimmedLast}`} size="lg" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            maxLength={80}
          />
          <Input
            label="Apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            maxLength={80}
          />
        </div>

        <Input
          label="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={40}
          placeholder="+54 9 11 0000-0000"
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={160}
          placeholder="usuario@email.com"
          helperText="Es tu usuario de ingreso: al cambiarlo, tenés que entrar con este email."
        />

        <Input
          label="Inmobiliaria"
          value={inmobiliaria || '—'}
          disabled
          helperText="Empresa de la que venís referido. No se cambia desde acá: la asigna el administrador."
        />

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        {/* Permite enviar con Enter sin duplicar el botón del footer. */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
};
