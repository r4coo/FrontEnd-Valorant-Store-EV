// contexts/auth-context.tsx
"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

// 1. 🟢 Definimos la clave de almacenamiento
const AUTH_STORAGE_KEY = "valorant_auth_user";

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  // 2. 🟢 Función login: Ahora recibe los datos del usuario desde el modal
  loginUser: (data: User) => void; 
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false); // Para asegurar que cargamos solo una vez

  // EFECTO 1: Cargar sesión desde localStorage al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        try {
          const loadedUser: User = JSON.parse(storedUser);
          setUser(loadedUser);
        } catch (error) {
          console.error("Error al parsear el usuario almacenado:", error);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } else {
        // Usuario de DEMO solo si no hay sesión guardada
        setUser({ 
          name: 'Usuario Autenticado (DEMO)', 
          email: 'usuario.autenticado@ejemplo.com' 
        });
      }
      setIsAuthLoaded(true);
    }
  }, []);

  // EFECTO 2: Guardar sesión en localStorage cada vez que 'user' cambia
  useEffect(() => {
    if (isAuthLoaded && typeof window !== 'undefined' && user) {
      // Solo guardar si no es el usuario de DEMO
      if (user.email !== 'usuario.autenticado@ejemplo.com') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
          // Si por alguna razón el usuario vuelve a DEMO, lo borramos de persistencia
          localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, [user, isAuthLoaded]);
  
  // 3. 🟢 Implementación de loginUser: Solo se encarga de guardar el usuario en el contexto/storage
  const loginUser = useCallback((data: User) => {
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    // Volver al usuario de DEMO
    setUser({ 
        name: 'Usuario Autenticado (DEMO)', 
        email: 'usuario.autenticado@ejemplo.com' 
    });
  }, []);
  
  // Se considera autenticado si existe un usuario y NO es el placeholder de DEMO
  const isAuthenticated = !!user && user.email !== 'usuario.autenticado@ejemplo.com';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. 🟢 Asegúrate de usar useAuth para exportar loginUser
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
