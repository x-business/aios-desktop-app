import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState } from '@shared/types/auth-types';

const AuthContext = createContext<{
  authState: AuthState;
  logout: () => Promise<void>;
}>({
  authState: { isAuthenticated: false, user: null },
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: true,
    user: null,
  });

  useEffect(() => {
    // Get initial auth state
    window.api.getAuthState().then(setAuthState);

    // Listen for auth state changes
    const cleanup = window.api.onAuthStateChanged((newState) => {
      setAuthState(newState);
    });

    return cleanup;
  }, []);

  const logout = async () => {
    const newState = await window.api.logout();
    setAuthState(newState);
  };

  return (
    <AuthContext.Provider value={{ authState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 