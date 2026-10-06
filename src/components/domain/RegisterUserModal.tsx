import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { register } from '../../services/userStore';
import type { RegisterInput } from '../../services/userStore';
import {
  UserPlus,
  Building2,
  Phone,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;

type FieldErrors = Partial<Record<keyof RegisterInput | 'password', string>>;

export const RegisterUserModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [form, setForm] = useState<RegisterInput>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    inmobiliaria: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [createdFor, setCreatedFor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update =
    (key: keyof RegisterInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      // Al editar un campo se limpia su error y el banner general.
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      setBanner(null);
    };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    const trimmed: RegisterInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
      inmobiliaria: form.inmobiliaria.trim(),
    };

    if (!trimmed.firstName) next.firstName = 'El nombre es obligatorio.';
    if (!trimmed.lastName) next.lastName = 'El apellido es obligatorio.';
    if (!trimmed.email) next.email = 'El email es obligatorio.';
    else if (!EMAIL_RE.test(trimmed.email)) next.email = 'El email no tiene un formato válido.';
    if (!trimmed.phone) next.phone = 'El teléfono es obligatorio.';
    else if (!PHONE_RE.test(trimmed.phone) || !/\d/.test(trimmed.phone))
      next.phone = 'El teléfono no tiene un formato válido.';
    if (!trimmed.password) next.password = 'La contraseña es obligatoria.';
    else if (trimmed.password.length < 8)
      next.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (!trimmed.inmobiliaria) next.inmobiliaria = 'La inmobiliaria es obligatoria.';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
      inmobiliaria: form.inmobiliaria.trim(),
    });
    setIsSubmitting(false);

    if (result.ok) {
      setCreatedFor(form.inmobiliaria.trim());
      return;
    }

    // Errores con lugar conocido se marcan en el campo; el resto cae al banner.
    if (result.code === 'duplicate-email') {
      setFieldErrors((prev) => ({ ...prev, email: result.message }));
    } else if (result.code === 'not_found') {
      setFieldErrors((prev) => ({ ...prev, inmobiliaria: result.message }));
    } else {
      setBanner(result.message);
    }
  };

  const handleClose = () => {
    onClose();
    // Se limpia el estado para que la próxima apertura arranque de cero.
    setTimeout(() => {
      setForm({ firstName: '', lastName: '', phone: '', email: '', password: '', inmobiliaria: '' });
      setFieldErrors({});
      setBanner(null);
      setCreatedFor(null);
    }, 200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear usuario"
      subtitle="Solicitá un acceso a tu inmobiliaria. Un administrador lo tiene que aprobar."
      size="md"
      footer={
        createdFor ? (
          <Button variant="primary" onClick={handleClose}>
            Listo
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="register-user-form"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Crear usuario
            </Button>
          </>
        )
      }
    >
      {createdFor ? (
        <div
          role="status"
          className="flex flex-col items-center text-center gap-3 py-6 px-2"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Usuario creado</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
            Tu cuenta quedó registrada en <strong>{createdFor}</strong> pero todavía{' '}
            <strong>no puede ingresar</strong>: un administrador de la inmobiliaria debe
            activarla desde <strong>Usuarios</strong>. Recibirás acceso una vez aprobada.
          </p>
        </div>
      ) : (
        <form id="register-user-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              placeholder="Nombre"
              value={form.firstName}
              onChange={update('firstName')}
              error={fieldErrors.firstName}
              required
            />
            <Input
              label="Apellido"
              placeholder="Apellido"
              value={form.lastName}
              onChange={update('lastName')}
              error={fieldErrors.lastName}
              required
            />
          </div>

          <Input
            label="Teléfono"
            type="tel"
            placeholder="+54 9 11 1234-5678"
            value={form.phone}
            onChange={update('phone')}
            leftIcon={<Phone className="w-4 h-4" />}
            error={fieldErrors.phone}
            autoComplete="tel"
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={update('email')}
            leftIcon={<Mail className="w-4 h-4" />}
            error={fieldErrors.email}
            autoComplete="email"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={update('password')}
            leftIcon={<Lock className="w-4 h-4" />}
            error={fieldErrors.password}
            autoComplete="new-password"
            helperText="La usás para ingresar en cuanto se active tu cuenta."
            required
          />

          <Input
            label="Inmobiliaria"
            placeholder="Nombre de la inmobiliaria"
            value={form.inmobiliaria}
            onChange={update('inmobiliaria')}
            leftIcon={<Building2 className="w-4 h-4" />}
            error={fieldErrors.inmobiliaria}
            helperText="Tiene que estar registrada en el sistema. Si no aparece, pedí que te creen el usuario."
            required
          />

          {banner && (
            <div
              role="alert"
              className="flex items-start gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              <span>{banner}</span>
            </div>
          )}

          <p className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed pt-1">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px text-emerald-600" />
            <span>
              Ningún dato de otra inmobiliaria es visible hasta que tu cuenta sea aprobada por un
              administrador de la tuya.
            </span>
          </p>
        </form>
      )}
    </Modal>
  );
};