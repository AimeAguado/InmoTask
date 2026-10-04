import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_PASSWORD } from '../../services/userStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { UserAvatar } from '../ui/UserAvatar';
import { Mail, Lock, AlertCircle, LogIn, Info, Users } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    name: 'Natalia Aimé',
    email: 'natalia@inmotask.com',
    role: 'Jefatura',
    note: 'Finanzas y alta de usuarios',
  },
  {
    name: 'Martín Duarte',
    email: 'martin@inmotask.com',
    role: 'Asesor',
    note: 'Cartera y agenda de tareas',
  },
];

export const LoginView: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Completá email y contraseña para continuar.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (result.ok) return;

    if (result.reason === 'inactive') {
      setError('Tu cuenta está desactivada. Contactá al administrador para reactivarla.');
    } else if (result.reason === 'server') {
      setError('No pudimos conectar con el servidor. Intentá de nuevo en un momento.');
    } else {
      setError('Email o contraseña incorrectos.');
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-7 sm:p-8">
          <Logo size="lg" />

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Accedé al panel operativo de la inmobiliaria con tu cuenta.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="username"
              placeholder="usuario@inmotask.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Ingresar
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px text-slate-400" />
              <span>
                Las cuentas se dan de alta desde <strong>Usuarios</strong>, disponible solo para
                el rol de administrador. Si no tenés usuario, pedíselo al administrador.
              </span>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="w-4 h-4" />
            <h2 className="text-sm font-bold text-slate-700">Cuentas de demostración</h2>
          </div>

          <p className="text-xs text-slate-500">
            Tocá una cuenta para completar el formulario. La contraseña de todas es{' '}
            <code className="font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
              {DEMO_PASSWORD}
            </code>
          </p>

          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemo(account.email)}
              className="w-full flex items-center gap-3.5 bg-white rounded-xl border border-slate-200/90 p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <UserAvatar
                name={account.name}
                src={account.email === 'natalia@inmotask.com' ? '/src/assets/images/avatar_natalia_1790435623633.jpg' : undefined}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">{account.name}</span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                      account.role === 'Jefatura'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {account.role}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 truncate">{account.email}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{account.note}</div>
              </div>
            </button>
          ))}

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            Sesión real: el login se valida contra la base de datos y la cookie de sesión es{' '}
            <code className="font-mono">httpOnly</code>, inaccesible desde JavaScript.
          </p>
        </div>
      </div>
    </div>
  );
};
