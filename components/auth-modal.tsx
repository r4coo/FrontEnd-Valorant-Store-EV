import { useState, type FormEvent } from "react";
// Importamos los íconos necesarios para una UI moderna y clara
import { LogIn, User, Mail, Zap, Lock } from 'lucide-react'; 

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "register";
  onSuccess: (userData: any) => void; // Cambiado para recibir y manejar los datos de usuario
  onSwitchMode: () => void;
}

/**
 * Componente modal para el inicio de sesión y registro de usuarios.
 * NO utiliza React Context. Guarda la sesión en localStorage temporalmente.
 */
export function AuthModal({ isOpen, onClose, mode, onSuccess, onSwitchMode }: AuthModalProps) {
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Estados para manejar el loading y el error/mensaje de estado
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ⚠️ Importante: URL de tu backend. Se mantiene la misma URL.
  const API_BASE_URL = "https://backend-production-566e.up.railway.app";
  
  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError(null);
    setSuccessMessage(null);
  };

  /**
   * Función para realizar la llamada API con reintentos (simulación de backoff).
   * Ayuda a mitigar el error "No se pudo conectar con el servidor" en redes inestables.
   */
  const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok || response.status < 500) {
            return response;
        }
        // Si es un error 5xx, podría ser temporal, intentamos de nuevo.
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
    // Debería ser inalcanzable si el throw final funciona, pero por seguridad:
    throw new Error('Máximo de reintentos alcanzado.');
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!API_BASE_URL) {
      setError("Error: La URL del backend no está configurada.");
      setIsLoading(false);
      return;
    }

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
      if (formData.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
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
          // Limpia el formulario y cambia a modo login
          setFormData({ name: "", email: formData.email, password: "", confirmPassword: "" });
          setTimeout(() => { onSwitchMode(); }, 1500);
        } else {
          const errorBody = await response.json().catch(() => ({}));
          const errorText = errorBody.message || errorBody.error || await response.text();
          setError(`Error ${response.status}: ${errorText || 'El usuario ya existe o error desconocido.'}`);
        }
      } catch (err) {
        console.error("Error de red/servidor:", err);
        // Mensaje más específico para errores de conexión
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
        const response = await fetchWithRetry(`${API_BASE_URL}/usuarios/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData),
        });

        if (response.ok) {
          const userData = await response.json();
          
          // 🔑 CLAVE: Guardamos los datos de usuario en localStorage (sustituto del Contexto)
          localStorage.setItem('user_session', JSON.stringify(userData));
          
          setSuccessMessage("¡Inicio de sesión exitoso!");

          // Llama a onSuccess (y pasa la data si es necesario)
          setTimeout(() => {
            onSuccess(userData);
            setFormData({ name: "", email: "", password: "", confirmPassword: "" });
          }, 1000);
          
        } else {
          const errorBody = await response.json().catch(() => ({}));
          const errorText = errorBody.message || errorBody.error || await response.text();
          setError(`Error ${response.status}: ${errorText || 'Credenciales inválidas o error desconocido.'}`);
        }
      } catch (err) {
        console.error("Error de red/servidor:", err);
        // Mensaje más específico para errores de conexión
        setError("🔴 No se pudo conectar con el servidor. Revisa tu conexión o intenta más tarde.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isAuthEnabled = !isLoading && !successMessage;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={isAuthEnabled ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-8 max-w-md w-full border-2 border-red-500 shadow-2xl transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <LogIn className="w-6 h-6 text-red-500" />
            {mode === "login" ? "INICIAR SESIÓN" : "REGISTRARSE"}
          </h2>
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-red-500 transition-colors disabled:opacity-50"
            disabled={!isAuthEnabled}
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="text-red-300 text-center text-sm font-medium mb-4 p-2 bg-red-900/30 rounded-md border border-red-500/50">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="text-green-300 text-center text-sm font-medium mb-4 p-2 bg-green-900/30 rounded-md border border-green-500/50">
            {successMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === "register" && (
            <div>
              <label className="block text-white text-sm font-bold mb-2" htmlFor="name">
                <User className="inline w-4 h-4 mr-1 text-gray-500"/> NOMBRE:
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 text-white border-2 border-gray-700 rounded focus:border-red-500 outline-none transition-colors"
                required
                disabled={!isAuthEnabled}
                placeholder="Ej: John Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-white text-sm font-bold mb-2" htmlFor="email">
                <Mail className="inline w-4 h-4 mr-1 text-gray-500"/> EMAIL:
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 text-white border-2 border-gray-700 rounded focus:border-red-500 outline-none transition-colors"
              required
              disabled={!isAuthEnabled}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-bold mb-2" htmlFor="password">
                <Lock className="inline w-4 h-4 mr-1 text-gray-500"/> CONTRASEÑA:
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 text-white border-2 border-gray-700 rounded focus:border-red-500 outline-none transition-colors"
              required
              disabled={!isAuthEnabled}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-white text-sm font-bold mb-2" htmlFor="confirmPassword">
                <Lock className="inline w-4 h-4 mr-1 text-gray-500"/> CONFIRMAR CONTRASEÑA:
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 text-white border-2 border-gray-700 rounded focus:border-red-500 outline-none transition-colors"
                required
                disabled={!isAuthEnabled}
                placeholder="Repite la contraseña"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-3 rounded font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/50"
            disabled={!isAuthEnabled}
          >
            {isLoading
              ? <><Zap className="w-5 h-5 animate-spin" /> Procesando...</>
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
              className="text-red-500 hover:text-red-400 font-bold transition-colors disabled:opacity-50"
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
