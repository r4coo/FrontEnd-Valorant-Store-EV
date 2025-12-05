import { useState, type FormEvent } from "react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "login" | "register"
  onSuccess: () => void
  onSwitchMode: () => void
}

export function AuthModal({ isOpen, onClose, mode, onSuccess, onSwitchMode }: AuthModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Nuevos estados para manejar el loading y el error del API
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obtén la URL base de la API
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACK

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === "register") {
      // 1. VALIDACIONES LOCALES
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        alert("Por favor, completa todos los campos")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        alert("Las contraseñas no coinciden")
        return
      }
      if (formData.password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres")
        return
      }

      if (!API_BASE_URL) {
        setError("Error: La URL del backend no está configurada (NEXT_PUBLIC_API_BACK)")
        return
      }

      // 2. PREPARACIÓN DE DATOS PARA EL BACKEND
      const registerData = {
        nombreUsuario: formData.name,
        correo: formData.email,
        password: formData.password,
      }

      setIsLoading(true)

      // 3. LLAMADA AL BACKEND
      try {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerData),
        })

        // 4. MANEJO DE RESPUESTA
        if (response.ok) {
          alert("¡Registro exitoso! Ya puedes iniciar sesión.")

          // ➡️ LÓGICA DEL MODAL REESTABLECIDA Y LIMPIEZA
          onSuccess() 
          setFormData({ name: "", email: "", password: "", confirmPassword: "" })
          onSwitchMode() 
        } else {
          // Manejo de errores 4xx o 5xx del servidor
          const errorText = await response.text()
          const errorMessage = `Error ${response.status}: ${errorText || 'Error desconocido'}`
          setError(errorMessage)
          alert(`Error al registrar: ${errorMessage}`)
        }
      } catch (err) {
        // Manejo de errores de red
        console.error("Error de red/servidor:", err)
        setError("No se pudo conectar con el servidor. Verifica la URL y la configuración de CORS.")
        alert("No se pudo conectar con el servidor. Intenta de nuevo.")
      } finally {
        setIsLoading(false)
      }
    } else {
      // Lógica de Login (por completar con llamada a API)
      if (!formData.email || !formData.password) {
        alert("Por favor, completa todos los campos")
        return
      }
      alert("¡Inicio de sesión exitoso! (Demo)")

      // ➡️ LÓGICA DEL MODAL REESTABLECIDA para Login (Si la llamada al API de Login fuera exitosa)
      onSuccess()
      setFormData({ name: "", email: "", password: "", confirmPassword: "" })
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid={`${mode}-modal`}
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-8 max-w-md w-full border-2 border-red-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔹 Título y botón de cierre */}
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-2xl font-bold text-white"
            data-testid={`${mode}-title`}
          >
            {mode === "login" ? "INICIAR SESIÓN" : "REGISTRARSE"}
          </h2>
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-red-500 transition-colors"
            data-testid={`${mode}-close`}
          >
            ✕
          </button>
        </div>

        {/* 🔹 Formulario principal */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-testid={`${mode}-form`}
        >
          {/* 💡 Muestra el error si existe */}
          {error && (
            <p className="text-red-500 text-center font-bold">{error}</p>
          )}

          {mode === "register" && (
            <div>
              <label
                className="block text-white text-sm font-bold mb-2"
                htmlFor="name"
              >
                NOMBRE:
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-800 text-white border-2 border-gray-700 rounded focus:border-red-500 outline-none"
                required
                data-testid="register-name-input"
              />
            </div>
          )}

          <div>
            <label
              className="block text-white text-sm font-bold mb-2"
              htmlFor="email"
            >
              EMAIL:
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-800 text-white border-2 border-gray-700 rounded focus:border-red-500 outline-none"
              required
              data-testid={`${mode}-email-input`}
            />
          </div>

          <div>
            <label
              className="block text-white text-sm font-bold mb-2"
              htmlFor="password"
            >
              CONTRASEÑA:
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-800 text-white border-2 border-gray-700 rounded focus:border-red-500 outline-none"
              required
              data-testid={`${mode}-password-input`}
            />
          </div>

          {mode === "register" && (
            <div>
              <label
                className="block text-white text-sm font-bold mb-2"
                htmlFor="confirmPassword"
              >
                CONFIRMAR CONTRASEÑA:
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-gray-800 text-white border-2 border-gray-700 rounded focus:border-red-500 outline-none"
                required
                data-testid="register-confirm-password-input"
              />
            </div>
          )}

          {/* 🔹 Botón principal */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-3 rounded font-bold transition-all disabled:opacity-50"
            data-testid={`${mode}-submit`}
            disabled={isLoading} // Deshabilita mientras carga
          >
            {isLoading
              ? "Cargando..."
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
              className="text-red-500 hover:text-red-400 font-bold"
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
