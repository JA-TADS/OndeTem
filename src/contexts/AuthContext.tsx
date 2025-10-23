import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: 'user' | 'admin') => Promise<boolean>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializar dados de exemplo
    storageService.initializeData();
    
    // Verificar se há usuário logado
    const currentUser = storageService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = storageService.getUsers();
    const foundUser = users.find(u => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      storageService.setCurrentUser(foundUser);
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, password: string, role: 'user' | 'admin'): Promise<boolean> => {
    const users = storageService.getUsers();
    
    // Verificar se email já existe
    if (users.find(u => u.email === email)) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role,
      avatar: undefined
    };

    const updatedUsers = [...users, newUser];
    storageService.saveUsers(updatedUsers);
    
    setUser(newUser);
    storageService.setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    storageService.setCurrentUser(null);
    // Redirecionar para o mapa após logout
    window.location.href = '/';
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    storageService.setCurrentUser(updatedUser);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
