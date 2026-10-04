import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppUser, ROLE_PERMISSIONS, RolePermissions } from '../types';
import * as userStore from '../services/userStore';
import { authApi } from '../services/api';
import type { UpdateUserInput } from '../services/api';
import type { ProfileDraft } from '../components/domain/ProfileModal';

interface AuthContextValue {
  user: AppUser | null;
  users: AppUser[];
  permissions: RolePermissions | null;
  isAuthenticated: boolean;
  /**.True mientras se resuelve la cookie de sesión al cargar la página. */
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<userStore.LoginResult>;
  signOut: () => Promise<void>;
  /** Guarda nombre, apellido, teléfono y foto de la cuenta propia. */
  updateProfile: (input: ProfileDraft) => Promise<void>;
  /** Un admin corrigiendo los datos de un asesor de su misma inmobiliaria. */
  updateUser: (id: string, input: UpdateUserInput) => Promise<void>;
  refreshUsers: () => Promise<void>;
  addUser: (input: userStore.CreateUserInput) => Promise<userStore.CreateUserResult>;
  toggleUserActive: (id: string, active: boolean) => Promise<void>;
  changeUserRole: (id: string, role: AppUser['role']) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Al recargar, la sesión se recupera desde la cookie httpOnly. Antes de que
  // responda, isBootstrapping evita que App muestre el login y después salte al
  // panel: un parpadeo en cada recarga.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const session = await userStore.getSessionUser();
      if (cancelled) return;
      setUser(session);
      setIsBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUsers = useCallback(async () => {
    setUsers(await userStore.listUsers());
  }, []);

  // La lista de usuarios es un endpoint de admin: un asesor recibiría un 403
  // al pedirla, así que se consulta sólo cuando tiene permiso.
  useEffect(() => {
    if (!user || !ROLE_PERMISSIONS[user.role].canManageUsers) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    void userStore
      .listUsers()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await userStore.login(email, password);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await userStore.logout();
    setUser(null);
    setUsers([]);
  }, []);

  const addUser = useCallback(
    async (input: userStore.CreateUserInput) => {
      const result = await userStore.createUser(input);
      if (result.ok) await refreshUsers();
      return result;
    },
    [refreshUsers]
  );

  const toggleUserActive = useCallback(async (id: string, active: boolean) => {
    await userStore.setUserActive(id, active);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active } : u)));
    setUser((prev) => (prev && prev.id === id ? { ...prev, active } : prev));
  }, []);

  const changeUserRole = useCallback(async (id: string, role: AppUser['role']) => {
    await userStore.setUserRole(id, role);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    setUser((prev) => (prev && prev.id === id ? { ...prev, role } : prev));
  }, []);

  const updateProfile = useCallback(async (input: ProfileDraft) => {
    // Se reemplaza el usuario de sesión entero con la respuesta del servidor: el
    // `name` derivado de firstName/lastName y la ruta final de la foto los calcula
    // el backend, y si se parcheara sólo lo local la cabecera quedaría desfasada.
    const { user: saved } = await authApi.updateMe(input);
    setUser(saved);
    setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
  }, []);

  const updateUser = useCallback(async (id: string, input: UpdateUserInput) => {
    const saved = await userStore.updateUser(id, input);
    setUsers((prev) => prev.map((u) => (u.id === id ? saved : u)));
    // Si el admin se edita a sí mismo, la sesión tiene que reflejarlo también.
    setUser((prev) => (prev && prev.id === id ? saved : prev));
  }, []);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      users,
      permissions,
      isAuthenticated: user !== null,
      isBootstrapping,
      signIn,
      signOut,
      updateProfile,
      updateUser,
      refreshUsers,
      addUser,
      toggleUserActive,
      changeUserRole,
    }),
    [
      user,
      users,
      permissions,
      isBootstrapping,
      signIn,
      signOut,
      updateProfile,
      updateUser,
      refreshUsers,
      addUser,
      toggleUserActive,
      changeUserRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};