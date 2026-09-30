import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AppUser, ROLE_PERMISSIONS, RolePermissions } from '../types';
import * as userStore from '../services/userStore';

interface AuthContextValue {
  user: AppUser | null;
  users: AppUser[];
  permissions: RolePermissions | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => userStore.LoginResult;
  signOut: () => void;
  refreshUsers: () => void;
  addUser: (input: userStore.CreateUserInput) => userStore.CreateUserResult;
  toggleUserActive: (id: string, active: boolean) => void;
  changeUserRole: (id: string, role: AppUser['role']) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => userStore.getSessionUser());
  const [users, setUsers] = useState<AppUser[]>(() => userStore.listUsers());

  const refreshUsers = useCallback(() => {
    setUsers(userStore.listUsers());
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const result = userStore.login(email, password);
    if (result.ok) {
      setUser(result.user);
      setUsers(userStore.listUsers());
    }
    return result;
  }, []);

  const signOut = useCallback(() => {
    userStore.logout();
    setUser(null);
  }, []);

  const addUser = useCallback(
    (input: userStore.CreateUserInput) => {
      const result = userStore.createUser(input);
      if (result.ok) setUsers(userStore.listUsers());
      return result;
    },
    []
  );

  const toggleUserActive = useCallback((id: string, active: boolean) => {
    userStore.setUserActive(id, active);
    setUsers(userStore.listUsers());
    setUser((prev) => (prev && prev.id === id ? { ...prev, active } : prev));
  }, []);

  const changeUserRole = useCallback((id: string, role: AppUser['role']) => {
    userStore.setUserRole(id, role);
    setUsers(userStore.listUsers());
    setUser((prev) => (prev && prev.id === id ? { ...prev, role } : prev));
  }, []);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      users,
      permissions,
      isAuthenticated: user !== null,
      signIn,
      signOut,
      refreshUsers,
      addUser,
      toggleUserActive,
      changeUserRole,
    }),
    [user, users, permissions, signIn, signOut, refreshUsers, addUser, toggleUserActive, changeUserRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
