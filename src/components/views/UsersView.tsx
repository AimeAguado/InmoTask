import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppUser, ROLE_PERMISSIONS, UserRole } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { UserAvatar } from '../ui/UserAvatar';
import {
  UserPlus,
  Users,
  ShieldCheck,
  Briefcase,
  Mail,
  Phone,
  IdCard,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Power,
  Pencil,
  X,
} from 'lucide-react';

const ROLE_ICON: Record<UserRole, typeof ShieldCheck> = {
  jefatura: ShieldCheck,
  asesor: Briefcase,
};

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

const NewUserForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { addUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'asesor' as UserRole,
    phone: '',
    license: '',
  });
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const result = addUser({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      phone: form.phone,
      license: form.license,
    });

    if (result.ok) {
      onDone();
      return;
    }

    setError(
      result.reason === 'duplicate-email'
        ? 'Ya existe un usuario registrado con ese email.'
        : 'Revisá que nombre, email y contraseña estén completos.'
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Dar de alta un usuario</h3>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-50"
          title="Cerrar formulario"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre y apellido"
          placeholder="Ej. Paula Gómez"
          value={form.name}
          onChange={update('name')}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="usuario@inmotask.com"
          value={form.email}
          onChange={update('email')}
          required
        />
        <Input
          label="Contraseña provisional"
          type="text"
          placeholder="Mínimo 6 caracteres"
          value={form.password}
          onChange={update('password')}
          helperText="Se la comunicás al usuario para su primer ingreso."
          required
        />
        <Select
          label="Rol"
          value={form.role}
          onChange={update('role')}
          options={[
            { value: 'asesor', label: 'Asesor' },
            { value: 'jefatura', label: 'Jefatura' },
          ]}
          helperText={ROLE_PERMISSIONS[form.role].description}
        />
        <Input
          label="Teléfono"
          placeholder="+54 9 11 ..."
          value={form.phone}
          onChange={update('phone')}
        />
        <Input
          label="Matrícula"
          placeholder="CUCICBA Mat. ..."
          value={form.license}
          onChange={update('license')}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
          Crear usuario
        </Button>
      </div>
    </form>
  );
};

export const UsersView: React.FC = () => {
  const { users, user: currentUser, toggleUserActive, changeUserRole } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sorted = [...users].sort((a, b) => {
    if (a.id === currentUser?.id) return -1;
    if (b.id === currentUser?.id) return 1;
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Usuarios del Sistema</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <Users className="w-3 h-3" />
              {users.filter((u) => u.active).length} activos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Alta de cuentas y asignación de roles. Visible únicamente para el rol de Jefatura.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsFormOpen((v) => !v)}
          leftIcon={<UserPlus className="w-3.5 h-3.5 text-emerald-400" />}
        >
          {isFormOpen ? 'Cerrar formulario' : '+ Nuevo Usuario'}
        </Button>
      </div>

      {isFormOpen && <NewUserForm onDone={() => setIsFormOpen(false)} />}

      {/* Users List */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
        {sorted.map((u, index) => {
          const RoleIcon = ROLE_ICON[u.role];
          const isSelf = u.id === currentUser?.id;
          const permissions = ROLE_PERMISSIONS[u.role];

          return (
            <div
              key={u.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 ${
                index > 0 ? 'border-t border-slate-100' : ''
              } ${u.active ? '' : 'bg-slate-50/60'}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <UserAvatar name={u.name} src={u.avatar} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{u.name}</span>
                    {isSelf && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                        Vos
                      </span>
                    )}
                    {!u.active && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200">
                        Desactivado
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {u.email}
                    </span>
                    {u.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {u.phone}
                      </span>
                    )}
                    {u.license && (
                      <span className="flex items-center gap-1">
                        <IdCard className="w-3 h-3 text-slate-400" />
                        {u.license}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-slate-400" />
                      {formatDate(u.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role + Status Controls */}
              <div className="flex items-center gap-2 sm:justify-end flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <RoleIcon
                    className={`w-3.5 h-3.5 ${
                      u.role === 'jefatura' ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="hidden xl:inline max-w-[180px] truncate">
                    {permissions.canManageUsers ? 'Finanzas + usuarios' : 'Cartera y tareas'}
                  </span>
                </div>

                <Select
                  value={u.role}
                  onChange={(e) => changeUserRole(u.id, e.target.value as UserRole)}
                  disabled={isSelf}
                  className="!h-8 !text-xs !py-0 !w-auto min-w-[7.5rem]"
                  options={[
                    { value: 'asesor', label: 'Asesor' },
                    { value: 'jefatura', label: 'Jefatura' },
                  ]}
                />

                <Button
                  variant={u.active ? 'outline' : 'success'}
                  size="sm"
                  disabled={isSelf}
                  onClick={() => toggleUserActive(u.id, !u.active)}
                  title={
                    isSelf
                      ? 'No podés desactivar tu propia cuenta'
                      : u.active
                      ? 'Desactivar acceso'
                      : 'Reactivar acceso'
                  }
                  leftIcon={
                    u.active ? (
                      <Power className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {u.active ? 'Desactivar' : 'Reactivar'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-400 flex items-start gap-2 px-1">
        <Pencil className="w-3.5 h-3.5 shrink-0 mt-px" />
        <span>
          No podés cambiar tu propio rol ni desactivar tu cuenta: así la aplicación siempre queda
          con al menos una jefatura activa.
        </span>
      </p>
    </div>
  );
};
