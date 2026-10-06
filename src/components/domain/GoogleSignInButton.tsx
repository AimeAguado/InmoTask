import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getGoogleConfig } from '../../services/userStore';

// Declaración mínima de Google Identity Services (cuentas.google.com/gsi/client).
// El resto de la API no se usa, así que no hace falta el paquete de tipos.
declare global {
  interface Window {
    google?: GoogleAccounts;
  }
  interface GoogleAccounts {
    id: GoogleIdentityServices;
  }
  interface GoogleIdentityServices {
    initialize(config: { client_id: string; callback: (payload: { credential: string }) => void; auto_select?: boolean }): void;
    renderButton(element: HTMLElement, options: Record<string, unknown>): void;
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise: Promise<void> | null = null;

const loadGisScript = (): Promise<void> => {
  if (window.google?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('No se pudo cargar el login de Google.'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
};

/**
 * Botón "Continuar con Google".
 *
 * Se oculta si el backend no tiene GOOGLE_CLIENT_ID configurado. Cuando existe,
 * carga GIS y renderiza el botón oficial de Google (su UI está pegada al iframe
 * que Google controla). El id_token resultante se lo valida al backend, que abre
 * sesión sólo si hay un usuario con ese email.
 */
export const GoogleSignInButton: React.FC<{ onError: (message: string) => void }> = ({ onError }) => {
  const { signInWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'hidden' | 'failed'>('loading');
  const renderedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const config = await getGoogleConfig();
      if (cancelled) return;

      if (!config?.googleEnabled || !config.googleClientId) {
        setStatus('hidden');
        return;
      }

      setClientId(config.googleClientId);

      try {
        await loadGisScript();
        if (cancelled) return;
        setStatus('ready');
      } catch {
        if (cancelled) return;
        setStatus('failed');
        onError('No se pudo cargar el acceso con Google. Intentá de nuevo.');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !buttonRef.current || !clientId || renderedRef.current) return;

    const container = buttonRef.current;
    // Sin React StrictMode, renderButton() agrega un iframe por llamada; el ref
    // evita duplicarlo si el efecto corre dos veces en desarrollo.
    renderedRef.current = true;

    window.google!.id.initialize({
      client_id: clientId,
      auto_select: false,
      callback: (payload) => {
        void signInWithGoogle(payload.credential).then((result) => {
          if (!result.ok) onError(result.message);
        });
      },
    });
    window.google!.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      locale: 'es',
      width: 0, // 0 = ancho natural del contenedor
    });
  }, [status, clientId, signInWithGoogle, onError]);

  if (status === 'hidden') return null;

  return (
    <div className="w-full">
      {status === 'loading' && (
        <div className="h-11 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-xs text-slate-500">
          Cargando…
        </div>
      )}
      {status === 'ready' && <div ref={buttonRef} className="w-full [&>div]:w-full [&>div>iframe]:!w-full" />}
      {status === 'failed' && (
        <div className="h-11 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-xs text-slate-400">
          Acceso con Google no disponible
        </div>
      )}
    </div>
  );
};