import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import type { AuthService } from '../../services';
import type { User } from '../../shared/types';

type AuthContextValue = {
  user: User | null;
  isInitializing: boolean;
  login(login: string, password: string, remember: boolean): Promise<User>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = PropsWithChildren<{
  authService: AuthService;
}>;

export function AuthProvider({ children, authService }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isActive = true;
    authService.getCurrentUser()
      .then((currentUser) => isActive && setUser(currentUser))
      .catch(() => isActive && setUser(null))
      .finally(() => isActive && setIsInitializing(false));
    return () => { isActive = false; };
  }, [authService]);

  const login = async (loginValue: string, password: string, remember: boolean): Promise<User> => {
    const authenticatedUser = await authService.login(loginValue, password, remember);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
