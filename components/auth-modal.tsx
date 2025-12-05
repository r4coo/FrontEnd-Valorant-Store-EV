import React, { useState, useEffect, FormEvent } from "react";
// Importaciones de íconos necesarias
import { ShoppingCart, User, LogOut, UserPlus, LogIn, X, Mail, Lock, AlertTriangle, Zap, Loader2 } from "lucide-react";
// Supongo que tienes un context de carrito, pero lo dejo como un placeholder para que el código compile
// import { useCart } from "@/contexts/cart-context"; 


// ⚠️ Constante de la URL de tu backend
const API_BASE_URL = "https://backend-production-566e.up.railway.app";

// --- FUNCIÓN DE UTILIDAD: Fetch con Reintentos (Exponential Backoff) ---

/**
 * Función para realizar la llamada API con reintentos.
 * Útil para mitigar problemas de red o fallos temporales del servidor.
 */
const fetchWithRetry = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      // Incluimos errores 4xx si no son el 401/403 ya que el backend puede dar 400s de negocio.
      if (response.ok || response.status < 500) {
        return response;
      }
      // Si es un error 5xx, podría ser temporal (fallo de servidor), intentamos de nuevo.
      throw new Error(`Server Error (${response.status})`);
    } catch (error) {
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        console.warn(`[API] Reintento ${i + 1} para ${url}. Esperando ${delay}ms...`);
      } else {
        throw error; // Lanza el error después del último intento
      }
    }
  }
  throw new Error('Máximo de reintentos alcanzado.');
};


// --- COMPONENTE MODAL DE AUTENTICACIÓN ---

function AuthModal({ isOpen, onClose, mode, onSuccess, onSwitchMode }) {
  // Los tipos de TypeScript se eliminan para que sea un componente JSX simple, pero se mantiene la estructura
  // de las propiedades que recibes, asumiendo 'any' para la compatibilidad rápida.
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Si el modal no está abierto, no renderiza nada
  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (mode === "register") {
      // 🚀 LÓGICA DE REGISTRO
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError("Por favor, completa todos los campos.");
        setIsLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden.");
        setIsLoading(false);
        return;
      }
      
      const registerData = {
        nombreUsuario: formData.name,
        correo: formData.email,
        password: formData.password,
      };

      try {
        const response = await fetchWithRetry(`${API_BASE_URL}/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerData),
        });

        if (response.ok) {
          setSuccessMessage("¡Registro exitoso! Ahora puedes iniciar sesión.");
          setFormData({ name: "", email: formData.email, password: "", confirmPassword: "" });
          setTimeout(() => { onSwitchMode(); }, 1500);
        } else {
          const errorBody = await response.json().catch(() => ({}));
          const errorText = errorBody.message || errorBody.error || await response.text();
          setError(`Error ${response.status}: ${errorText || 'El usuario ya existe o error desconocido.'}`);
        }
      } catch (err) {
        console.error("Error de red/servidor:", err);
        setError("🔴 No se pudo conectar con el servidor. Revisa tu conexión o intenta más tarde.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // 🚀 LÓGICA DE INICIO DE SESIÓN (LOGIN)
      if (!formData.email || !formData.password) {
        setError("Por favor, completa el correo y la contraseña.");
        setIsLoading(false);
        return;
      }

      const loginData = {
        correo: formData.email,
        password: formData.password,
      };

      try {
        // 🔥 Usando el endpoint /usuarios/login
        const response = await fetchWithRetry(`${API_BASE_URL}/usuarios/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData),
        });

        if (response.ok) {
          const userData = await response.json();
          // Guarda la sesión en localStorage
          localStorage.setItem('user_session', JSON.stringify(userData));
          
          setSuccessMessage("¡Inicio de sesión exitoso!");

          setTimeout(() => {
            onSuccess(userData);
            setFormData({ name: "", email: "", password: "", confirmPassword: "" });
            onClose(); // Cierra el modal después del éxito
          }, 1000);
          
        } else {
          const errorBody = await response.json().catch(() => ({}));
          const errorText = errorBody.message || errorBody.error || await response.text();
          setError(`Error ${response.status}: ${errorText || 'Credenciales inválidas o error desconocido.'}`);
        }
      } catch (err) {
        console.error("Error de red/servidor:", err);
        setError("🔴 No se pudo conectar con el servidor. Revisa tu conexión o el CORS.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Deshabilita el cierre y los botones si está cargando o hay un mensaje de éxito/error
  const isAuthEnabled = !isLoading && !successMessage;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 backdrop-blur-sm"
      // Cierra solo si no está en proceso
      onClick={isAuthEnabled ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 max-w-md w-full border-2 border-red-600 shadow-2xl transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <LogIn className="w-7 h-7 text-red-500" />
            {mode === "login" ? "INICIAR SESIÓN" : "REGISTRARSE"}
          </h2>
          <button
            onClick={onClose}
            className="text-white p-2 text-2xl hover:text-red-500 transition-colors rounded-full hover:bg-gray-700 disabled:opacity-50"
            disabled={!isAuthEnabled}
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        {(error || successMessage) && (
          <p className={`text-center text-sm font-medium mb-4 p-3 rounded-lg border flex items-center justify-center gap-2 ${
            error 
              ? 'text-red-300 bg-red-900/30 border-red-500/50' 
              : 'text-green-300 bg-green-900/30 border-green-500/50'
          }`}>
            {error ? <AlertTriangle className="w-4 h-4"/> : <Zap className="w-4 h-4"/>}
            {error || successMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === "register" && (
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-1" htmlFor="name">
                <User className="inline w-4 h-4 mr-1 text-red-500"/> NOMBRE:
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-red-500 focus:ring-red-500 outline-none transition-all placeholder:text-gray-500"
                required
                disabled={!isAuthEnabled}
                placeholder="Nombre de usuario"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-1" htmlFor="email">
                <Mail className="inline w-4 h-4 mr-1 text-red-500"/> EMAIL:
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-red-500 focus:ring-red-500 outline-none transition-all placeholder:text-gray-500"
              required
              disabled={!isAuthEnabled}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-1" htmlFor="password">
                <Lock className="inline w-4 h-4 mr-1 text-red-500"/> CONTRASEÑA:
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-red-500 focus:ring-red-500 outline-none transition-all placeholder:text-gray-500"
              required
              disabled={!isAuthEnabled}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-1" htmlFor="confirmPassword">
                <Lock className="inline w-4 h-4 mr-1 text-red-500"/> CONFIRMAR CONTRASEÑA:
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-red-500 focus:ring-red-500 outline-none transition-all placeholder:text-gray-500"
                required
                disabled={!isAuthEnabled}
                placeholder="Repite la contraseña"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-3 rounded-lg font-extrabold tracking-wide transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 hover:shadow-red-500/50"
            disabled={!isAuthEnabled}
          >
            {isLoading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
              : mode === "login"
              ? "INICIAR SESIÓN"
              : "REGISTRARSE"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
          <p>
            {mode === "login"
              ? "¿No tienes cuenta?"
              : "¿Ya tienes cuenta?"}{" "}
            <button
              onClick={onSwitchMode}
              className="text-red-400 hover:text-red-300 font-bold transition-colors disabled:opacity-50"
              disabled={!isAuthEnabled}
            >
              {mode === "login" ? "REGISTRARSE" : "INICIAR SESIÓN"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}


// --- COMPONENTE PRINCIPAL DE LA APLICACIÓN (EXPORTACIÓN POR DEFECTO) ---

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [userData, setUserData] = useState(null);

  // 1. Cargar la sesión desde localStorage al inicio
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem('user_session');
      if (storedSession) {
        const user = JSON.parse(storedSession);
        setUserData(user);
      }
    } catch (e) {
      console.error("Error al cargar la sesión de localStorage:", e);
      localStorage.removeItem('user_session');
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setUserData(user);
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    setUserData(null);
    setIsModalOpen(false);
  };

  const openLogin = () => {
    setAuthMode("login");
    setIsModalOpen(true);
  };

  const openRegister = () => {
    setAuthMode("register");
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-2xl shadow-2xl border-t-4 border-red-600 text-center">
        <h1 className="text-4xl font-black mb-4 text-red-500">
          Autenticación Cliente-Servidor (Railway)
        </h1>
        
        <p className="text-gray-400 mb-8">
          Esta demo prueba la conexión de inicio de sesión/registro con tu backend Spring Boot alojado en Railway.
        </p>

        {userData ? (
          <div className="p-6 bg-gray-700 rounded-xl border border-red-600">
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2 text-green-400">
              <Zap className="w-6 h-6"/> ¡Bienvenido!
            </h2>
            <p className="text-lg mb-4">
              Has iniciado sesión como: <span className="font-mono text-red-300">{userData.correo}</span>
            </p>
            <p className="text-sm text-gray-300 mb-6">
              Tu ID de usuario es: <span className="font-semibold">{userData.id}</span>
            </p>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-colors flex items-center gap-2 mx-auto"
            >
              <LogOut className="w-5 h-5"/> Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={openLogin}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5"/> Iniciar Sesión
            </button>
            <button
              onClick={openRegister}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-red-400 font-bold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 border border-red-400"
            >
              <User className="w-5 h-5"/> Registrarse
            </button>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={authMode}
        onSuccess={handleLoginSuccess}
        onSwitchMode={() => setAuthMode(authMode === "login" ? "register" : "login")}
      />
    </div>
  );
}
