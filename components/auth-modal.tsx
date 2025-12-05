// Dentro de AuthModal...

// Importa useState y FormEvent
import { useState, type FormEvent } from "react" 

// ... (resto de props e interfaces)

export function AuthModal({ isOpen, onClose, mode, onSuccess, onSwitchMode }: AuthModalProps) {
    const [formData, setFormData] = useState({ /* ... */ });
    // Nuevo estado para manejar el loading y el error
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Obtén la URL base de la API
    // Asegúrate de que esta variable está disponible en tu entorno Vercel/Next.js
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACK;

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => { // ⬅️ Hacemos la función ASÍNCRONA
        e.preventDefault();
        setError(null);
        
        if (mode === "register") {
            // ➡️ [Validaciones locales...]
            if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
                alert("Por favor, completa todos los campos");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                alert("Las contraseñas no coinciden");
                return;
            }
            if (formData.password.length < 6) {
                alert("La contraseña debe tener al menos 6 caracteres");
                return;
            }

            // --- LÓGICA DE CONEXIÓN CON EL BACKEND ---
            
            // 1. Preparamos el cuerpo de la petición.
            // Los nombres de las propiedades deben coincidir con tu DTO/Entity en Spring:
            // nombreUsuario, correo, password
            const registerData = {
                nombreUsuario: formData.name, // El DTO espera nombreUsuario
                correo: formData.email,
                password: formData.password,
            };

            if (!API_BASE_URL) {
                setError("Error: La URL del backend no está configurada (NEXT_PUBLIC_API_BACK)");
                return;
            }

            setIsLoading(true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/usuarios`, { // ⬅️ Endpoint POST en tu controller
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(registerData),
                });
                
                // 2. Manejamos la respuesta del servidor
                if (response.ok) {
                    // La respuesta HTTP 201 (CREATED) es exitosa
                    alert("¡Registro exitoso! Ya puedes iniciar sesión.");
                    onSwitchMode(); // Opcional: cambiar a modo login tras registro
                } else {
                    // Si el servidor responde con un error (ej: 400 Bad Request, 409 Conflict)
                    const errorBody = await response.json();
                    const errorMessage = errorBody.message || "Error desconocido al registrar.";
                    setError(errorMessage);
                    alert(`Error al registrar: ${errorMessage}`);
                }
            } catch (err) {
                // Manejar errores de red (servidor caído, CORS no configurado, etc.)
                console.error("Error de red/servidor:", err);
                setError("No se pudo conectar con el servidor de autenticación. Verifica la configuración de CORS.");
                alert("No se pudo conectar con el servidor. Intenta de nuevo.");
            } finally {
                setIsLoading(false);
            }

            // ------------------------------------------

        } else {
            // Lógica de Login (Aquí también harías una llamada POST a /usuarios/login)
            if (!formData.email || !formData.password) {
                alert("Por favor, completa todos los campos");
                return;
            }
            alert("¡Inicio de sesión exitoso! (Demo)"); // Reemplaza esto con la llamada a /usuarios/login
        }

        // onSuccess() // Normalmente solo llamas a onSuccess si el registro fue exitoso
        // setFormData({ name: "", email: "", password: "", confirmPassword: "" }); // Solo si el proceso fue exitoso
    }

    // ... (rest of the return statement)

    return (
        // ...
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
            data-testid={`${mode}-form`}
        >
            {/* ... otros campos ... */}
            
            {/* 💡 Muestra el error si existe */}
            {error && (
                <p className="text-red-500 text-center font-bold">{error}</p>
            )}

            {/* 🔹 Botón principal */}
            <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-3 rounded font-bold transition-all disabled:opacity-50"
                data-testid={`${mode}-submit`}
                disabled={isLoading} // ⬅️ Deshabilita mientras carga
            >
                {isLoading 
                    ? "Cargando..." 
                    : mode === "login" ? "INICIAR SESIÓN" : "REGISTRARSE"}
            </button>
        </form>
        // ...
    );
}
