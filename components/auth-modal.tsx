import { useState, type FormEvent } from "react"

// Definición de las props del componente
interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "login" | "register"
  onSuccess: () => void
  onSwitchMode: () => void
}

/**
 * Componente Modal de Autenticación (Login y Registro)
 * Maneja la lógica del formulario, validaciones locales y llamadas a la API
 */
export function AuthModal({ isOpen, onClose, mode, onSuccess, onSwitchMode }: AuthModalProps) {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Estados para manejar el loading y los mensajes de feedback
  const [isLoading, setIsLoading] = useState(false)
  // 'error' para errores graves de API/Red
  const [error, setError] = useState<string | null>(null)
  // 'message' para validaciones de formulario o mensajes de éxito
  const [message, setMessage] = useState<string | null>(null)

  // Obtén la URL base de la API
  // NOTA: Se ha actualizado para usar la variable de entorno real
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACK

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Limpiar errores y mensajes al inicio de un nuevo intento
    setError(null)
    setMessage(null)

    // La comprobación ahora verifica si la variable de entorno está definida
    if (!API_BASE_URL) {
      setError("Error: La URL del backend (NEXT_PUBLIC_API_BACK) no está definida. Por favor, configúrala.")
      return
    }

    if (mode === "register") {
      // 1. VALIDACIONES LOCALES (REGISTRO)
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setMessage("Por favor, completa todos los campos.")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setMessage("Las contraseñas no coinciden.")
        return
      }
      if (formData.password.length < 6) {
        setMessage("La contraseña debe tener al menos 6 caracteres.")
        return
      }

      // 2. PREPARACIÓN DE DATOS PARA EL BACKEND (REGISTRO)
      const registerData = {
        nombreUsuario: formData.name,
        correo: formData.email,
        password: formData.password,
      }

      setIsLoading(true)

      // 3. LLAMADA AL BACKEND (REGISTRO)
      try {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerData),
        })

        // 4. MANEJO DE RESPUESTA (REGISTRO)
        if (response.ok) {
          setMessage("¡Registro exitoso! Ahora puedes iniciar sesión.")
          // ➡️ LÓGICA DEL MODAL REESTABLECIDA Y LIMPIEZA
          onSuccess() // Indica éxito para cualquier lógica externa (si aplica)
          setFormData({ name: "", email: "", password: "", confirmPassword: "" })
          onSwitchMode() // Cambia al modo Login automáticamente
        } else {
          // Manejo de errores 4xx o 5xx del servidor
          const errorJson = await response.json().catch(() => ({ message: 'Error desconocido' }))
          const errorMessage = `Error ${response.status}: ${errorJson.message || 'Error en el servidor.'}`
          setError(`Error al registrar: ${errorMessage}`)
        }
      } catch (err) {
        // Manejo de errores de red
        console.error("Error de red/servidor:", err)
        setError("No se pudo conectar con el servidor. Verifica la URL de la API.")
      } finally {
        setIsLoading(false)
      }
    } else {
      // 1. VALIDACIONES LOCALES (LOGIN)
      if (!formData.email || !formData.password) {
        setMessage("Por favor, completa el correo y la contraseña.")
        return
      }

      // 2. PREPARACIÓN DE DATOS PARA EL BACKEND (LOGIN)
      const loginData = {
        correo: formData.email,
        password: formData.password,
      }

      setIsLoading(true)

      // 3. LLAMADA AL BACKEND (LOGIN)
      try {
        // ASUMIMOS EL ENDPOINT /usuarios/login para la autenticación
        const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        })

        // 4. MANEJO DE RESPUESTA (LOGIN)
        if (response.ok) {
          // La respuesta puede contener un token JWT o datos del usuario (no implementado aquí)
          const data = await response.json() // Usar 'data' si se necesita guardar el token

          // ➡️ LÓGICA DEL MODAL REESTABLECIDA Y LIMPIEZA
          setMessage("¡Inicio de sesión exitoso!")
          onSuccess() // Cierra el modal
          setFormData({ name: "", email: "", password: "", confirmPassword: "" }) // Limpia el formulario
        } else {
          const errorJson = await response.json().catch(() => ({ message: 'Credenciales inválidas' }))
          const errorMessage = `Error ${response.status}: ${errorJson.message || 'Credenciales inválidas.'}`
          setError(`Error al iniciar sesión: ${errorMessage}`)
        }
      } catch (err) {
        console.error("Error de red/servidor:", err)
        setError("No se pudo conectar con el servidor. Verifica la URL de la API.")
      } finally {
        setIsLoading(false)
      }
    }
  }
  
  // Determinar el color del mensaje de feedback (éxito vs. validación/error)
  const isSuccess = message && message.includes("exitoso")
  const messageColor = isSuccess ? "bg-green-600/20 border-green-500 text-green-300" : "bg-yellow-600/20 border-yellow-500 text-yellow-300"
  const errorColor = "bg-red-600/20 border-red-500 text-red-300"


  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-inter transition-opacity duration-300"
      onClick={onClose}
      data-testid={`${mode}-modal`}
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full border border-red-700/50 transform transition-transform duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔹 Título y botón de cierre */}
        <div className="flex justify-between items-center mb-6 border-b border-red-700/30 pb-3">
          <h2
            className="text-2xl font-extrabold text-red-500 tracking-wider"
            data-testid={`${mode}-title`}
          >
            {mode === "login" ? "INICIAR SESIÓN" : "REGISTRARSE"}
          </h2>
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-700/50"
            data-testid={`${mode}-close`}
            aria-label="Cerrar Modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 🔹 Formulario principal */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-testid={`${mode}-form`}
        >
          
          {/* 💡 Mensaje de Error (API/Red) */}
          {error && (
            <div className={`p-3 rounded-lg border text-sm font-semibold text-center ${errorColor}`}>
                {error}
            </div>
          )}

          {/* 💡 Mensaje de Feedback (Validación/Éxito) */}
          {message && !error && (
            <div className={`p-3 rounded-lg border text-sm font-semibold text-center ${messageColor}`}>
                {message}
            </div>
          )}

          {mode === "register" && (
            <div>
              <label
                className="block text-gray-300 text-sm font-medium mb-1"
                htmlFor="name"
              >
                NOMBRE DE USUARIO:
              </label>
              <input
                type="text"
                id="name"
                placeholder="Tu nombre de usuario"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                required
                disabled={isLoading}
                data-testid="register-name-input"
              />
            </div>
          )}

          <div>
            <label
              className="block text-gray-300 text-sm font-medium mb-1"
              htmlFor="email"
            >
              EMAIL:
            </label>
            <input
              type="email"
              id="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
              required
              disabled={isLoading}
              data-testid={`${mode}-email-input`}
            />
          </div>

          <div>
            <label
              className="block text-gray-300 text-sm font-medium mb-1"
              htmlFor="password"
            >
              CONTRASEÑA:
            </label>
            <input
              type="password"
              id="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
              required
              disabled={isLoading}
              data-testid={`${mode}-password-input`}
            />
          </div>

          {mode === "register" && (
            <div>
              <label
                className="block text-gray-300 text-sm font-medium mb-1"
                htmlFor="confirmPassword"
              >
                CONFIRMAR CONTRASEÑA:
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                required
                disabled={isLoading}
                data-testid="register-confirm-password-input"
              />
            </div>
          )}

          {/* 🔹 Botón principal */}
          <button
            type="submit"
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            data-testid={`${mode}-submit`}
            disabled={isLoading}
          >
            {isLoading && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            <span>
                {isLoading
                ? "PROCESANDO..."
                : mode === "login"
                ? "INICIAR SESIÓN"
                : "REGISTRARSE"}
            </span>
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>
            {mode === "login"
              ? "¿No tienes cuenta?"
              : "¿Ya tienes cuenta?"}{" "}
            <button
              onClick={() => {
                onSwitchMode()
                setFormData({ name: "", email: "", password: "", confirmPassword: "" }) // Limpiar form al cambiar
                setError(null)
                setMessage(null)
              }}
              className="text-red-500 hover:text-red-400 font-bold transition-colors ml-1"
              data-testid={`switch-to-${
                mode === "login" ? "register" : "login"
              }`}
            >
              {mode === "login" ? "REGISTRARSE" : "INICIAR SESIÓN"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
