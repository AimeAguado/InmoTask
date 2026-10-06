import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { GoogleSignInButton } from '../domain/GoogleSignInButton';
import { RegisterUserModal } from '../domain/RegisterUserModal';
import { Mail, Lock, AlertCircle, LogIn, UserPlus, ShieldCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Completá email y contraseña para continuar.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (result.ok) return;

    if (result.reason === 'inactive') {
      setError('Tu cuenta está desactivada o pendiente de aprobación. Contactá al administrador para activarla.');
    } else if (result.reason === 'server') {
      setError('No pudimos conectar con el servidor. Intentá de nuevo en un momento.');
    } else {
      setError('Email o contraseña incorrectos.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-7 sm:p-8">
          <Logo size="lg" />

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Accedé al panel operativo de tu inmobiliaria.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="username"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
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

          {/* Separador "o" */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400 select-none">o</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleSignInButton onError={setError} />

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>¿No tenés cuenta?</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsRegisterOpen(true)}
                leftIcon={<UserPlus className="w-3.5 h-3.5 text-emerald-600" />}
              >
                Crear usuario
              </Button>
            </div>
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px text-emerald-600" />
              <span>
                La sesión se guarda en una cookie <code className="font-mono">httpOnly</code>,
                inaccesible desde JavaScript.
              </span>
            </p>
          </div>
        </div>
      </div>

      <RegisterUserModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
};