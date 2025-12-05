// contexts/auth-context.tsx
"use client" // Es crucial para usar hooks como useState

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define la estructura de los datos del usuario
interface User {
  name: string;
  email: string;
}

// Define la estructura del contexto de autenticación
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  // Funciones para manejar la sesión
  login: (name: string, email: string) => void; 
  logout: () => void;
}

// Clave para guardar el usuario en el almacenamiento local (persistencia básica)
const AUTH_STORAGE_KEY = "auth_user" 

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Inicializamos el estado del usuario como null
  const [user, setUser] = useState<User | null>(null);

  // 🟢 EFECTO 1: Cargar sesión desde localStorage al inicio (para recordar al usuario)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error al parsear el usuario almacenado:", error);
          localStorage.removeItem(AUTH_STORAGE_KEY); // Limpiar datos corruptos
        }
      } else {
        // Establecer un usuario de DEMO si no hay sesión real, 
        // para que se vean los detalles en el modal si no hay login
        setUser({ 
          name: 'Usuario Autenticado (DEMO)', 
          email: 'usuario.autenticado@ejemplo.com' 
        });
      }
    }
  }, []);

  // 🟢 EFECTO 2: Guardar sesión en localStorage cada vez que el estado 'user' cambia
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      // Guardamos solo si hay un usuario logueado (no el DEMO)
      if (user.email !== 'usuario.autenticado@ejemplo.com') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      }
    }
  }, [user]);


  const login = (name: string, email: string) => {
    const newUser = { name, email };
    setUser(newUser);
    // En una app real, aquí guardarías el JWT en una cookie HTTP-only.
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    // Opcional: Volver al usuario de DEMO para rellenar el modal
    setUser({ 
        name: 'Usuario Autenticado (DEMO)', 
        email: 'usuario.autenticado@ejemplo.com' 
    });
  };

  // Se considera autenticado si existe un usuario y no es el placeholder de DEMO
  const isAuthenticated = !!user && user.email !== 'usuario.autenticado@ejemplo.com';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Este error solo ocurriría si no usas el provider en el layout
    throw new Error('useAuth debe ser usado dentro de un AuthProvider'); 
  }
  return context;
};
