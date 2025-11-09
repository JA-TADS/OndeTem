import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { firebaseAuth, firebaseService } from '../services/firebase';
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
    // Inicializar dados (se necessário)
    firebaseService.initializeData();
    
    // Observar mudanças no estado de autenticação
    const unsubscribe = firebaseAuth.onAuthStateChanged((currentUser) => {
      // Limpar cache quando usuário muda (login/logout)
      storageService.clearCache();
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Limpar cache antes do login
      storageService.clearCache();
      const loggedInUser = await firebaseAuth.login(email, password);
      if (loggedInUser) {
        setUser(loggedInUser);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro no login:', error);
      // Tratar erros específicos do Firebase
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return false;
      }
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role: 'user' | 'admin'): Promise<boolean> => {
    try {
      const newUser = await firebaseAuth.register(name, email, password, role);
      if (newUser) {
        setUser(newUser);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro no registro:', error);
      // Tratar erros específicos do Firebase
      if (error.code === 'auth/email-already-in-use') {
        return false;
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Marcar que estamos fazendo logout para evitar atualizações de estado
      if ((window as any).__isLoggingOut) {
        (window as any).__isLoggingOut();
      }
      
      // Limpar cache antes do logout
      storageService.clearCache();
      
      // Fazer logout no Firebase primeiro
      await firebaseAuth.logout();
      
      // Redirecionar para a tela de login após logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
      // Se houver erro, ainda assim redirecionar para login
      window.location.href = '/login';
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await firebaseService.updateUser(updatedUser.id, updatedUser);
      setUser(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
