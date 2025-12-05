"use client"

import { useState, useMemo, useEffect } from "react"
// Importaciones de Firebase para autenticación y base de datos
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'; 


// =====================================================================
// MOCK DE CONTEXTO DE CARRITO (Se mantiene el mock de productos)
// =====================================================================

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

// 🛒 MOCK DE useCart
const DUMMY_CART_ITEMS: CartItem[] = [
    { id: 101, name: "Espada de Energía", price: 150.00, quantity: 1, image: "https://placehold.co/80x80/22c55e/FFFFFF?text=E" },
    { id: 102, name: "Armadura Pesada", price: 299.99, quantity: 2, image: "https://placehold.co/80x80/3b82f6/FFFFFF?text=A" },
];

const useCart = () => {
    // Usamos useMemo para simular el precio total y evitar errores de dependencia
    const getTotalPrice = useMemo(() => () => DUMMY_CART_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0), []);

    return {
        cart: DUMMY_CART_ITEMS, 
        removeFromCart: (index: number) => console.log(`[MOCK] Eliminando ítem ${index}`),
        increaseQuantity: (index: number) => console.log(`[MOCK] Aumentando cantidad ${index}`),
        decreaseQuantity: (index: number) => console.log(`[MOCK] Disminuyendo cantidad ${index}`),
        clearCart: () => console.log("[MOCK] Vaciando carrito"),
        getTotalPrice,
    };
};
// =====================================================================


interface CartModalProps {
  isOpen: boolean
  onClose: () => void
}

// Variables globales proporcionadas por el entorno de Canvas (Requeridas para Firebase)
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string | undefined;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACK

export function CartModal({ isOpen, onClose }: CartModalProps) {
  
  // =====================================================================
  // ESTADO DE AUTENTICACIÓN REAL (Firebase)
  // =====================================================================
  const [authReady, setAuthReady] = useState(false);
  // El estado 'user' ahora almacena el objeto de usuario REAL de Firebase Auth
  const [user, setUser] = useState<FirebaseUser | null>(null); 
  const isAuthenticated = !!user;
  const [db, setDb] = useState<Firestore | null>(null);

  useEffect(() => {
      let unsubscribe: () => void = () => {};
      try {
          const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
          const firebaseConfig = JSON.parse(__firebase_config);
          const app = initializeApp(firebaseConfig);
          const auth = getAuth(app);
          const firestoreDb = getFirestore(app);
          setDb(firestoreDb);

          // 1. Inicio de Sesión
          const signIn = async () => {
              try {
                  if (typeof __initial_auth_token !== 'undefined') {
                      await signInWithCustomToken(auth, __initial_auth_token);
                  } else {
                      await signInAnonymously(auth);
                  }
              } catch (error) {
                  console.error("Firebase Auth Error durante el inicio de sesión:", error);
              }
          };
          
          signIn();

          // 2. Listener de Estado de Autenticación
          unsubscribe = onAuthStateChanged(auth, (currentUser) => {
              setUser(currentUser);
              setAuthReady(true);
          });

      } catch (error) {
          console.error("Error de Inicialización de Firebase:", error);
          setAuthReady(true); 
      }

      return () => {
          // Limpia el listener de autenticación al desmontar
          unsubscribe();
      };
  }, []);
  // =====================================================================


  const { cart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, getTotalPrice } = useCart()
  
  // Estados para manejar la compra
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  if (!isOpen) return null

  const handleCheckout = async () => {
    // 0. Validar estado de autenticación
    if (!authReady || !isAuthenticated || !user) {
        setCheckoutMessage({ type: 'error', text: "La autenticación no está lista o debes iniciar sesión para completar la compra." });
        return
    }

    // 0. Validar la URL del API
    if (!API_BASE_URL) {
      setCheckoutMessage({ type: 'error', text: "Error: La URL del backend no está configurada (NEXT_PUBLIC_API_BACK)." });
      return
    }

    // 1. Validar el carrito
    if (cart.length === 0) {
      setCheckoutMessage({ type: 'error', text: "Tu carrito está vacío. Agrega productos para comprar." });
      return
    }

    // 2. Preparar los datos de la orden
    const totalPrice = getTotalPrice()
    
    // 🟢 USANDO DATOS REALES DEL USUARIO DE FIREBASE:
    const orderData = {
      // Usamos displayName (nombre) o email (correo) del objeto User de Firebase
      nombreUsuario: user.displayName || user.email || `ID Usuario ${user.uid}`, 
      correo: user.email || 'sin-correo-disponible@firebase.com',     
      total: totalPrice,
      productos: cart.map(item => ({
        idProducto: item.id,
        nombre: item.name,
        cantidad: item.quantity,
        precioUnitario: item.price,
      })),
    }

    setIsLoading(true)
    setCheckoutMessage(null)

    // 3. Llamada a la API
    try {
      const response = await fetch(`${API_BASE_URL}/ventas`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Aquí iría el Token JWT si fuera necesario para la API
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        // Compra exitosa
        const result = await response.json()
        setCheckoutMessage({ 
            type: 'success', 
            text: `¡Compra exitosa! Total pagado: $${totalPrice.toFixed(2)}. ID de venta: ${result.id || 'N/A'}` 
        })
        // clearCart() // Comentado en el mock para mantener los ítems visibles
      } else {
        // Error de la API (ej. 400, 500)
        const errorJson = await response.json().catch(() => ({}))
        setCheckoutMessage({ 
            type: 'error', 
            text: `Error ${response.status} al procesar la compra: ${errorJson.message || 'Error desconocido del servidor'}` 
        })
      }
    } catch (err) {
      // Error de red
      console.error("Error de red/servidor:", err)
      setCheckoutMessage({ 
          type: 'error', 
          text: "No se pudo conectar con el servidor para procesar la compra." 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Datos REALES de Firebase para mostrar en la interfaz
  // Utilizamos displayName o email para el nombre, y el email para el correo.
  const displayedUserName = user?.displayName || user?.email || "No Autenticado (Anónimo)"
  const displayedUserEmail = user?.email ?? "Sin correo registrado"
  const displayedAuthStatus = authReady ? (isAuthenticated ? 'Autenticado' : 'Cargando/Sesión requerida') : 'Cargando...';


  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="cart-modal"
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-red-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white" data-testid="cart-title">
            CARRITO DE COMPRAS
          </h2>
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-red-500 transition-colors"
            data-testid="cart-close"
          >
            ✕
          </button>
        </div>

        {/* Mensaje de Compra/Error */}
        {checkoutMessage && (
          <div 
            className={`p-4 mb-4 rounded-lg font-bold text-center ${
              checkoutMessage.type === 'success' 
                ? 'bg-green-700 text-white' 
                : 'bg-red-700 text-white'
            }`}
          >
            {checkoutMessage.text}
            {checkoutMessage.type === 'success' && (
                <button
                    onClick={onClose}
                    className="ml-4 font-normal underline hover:text-gray-200"
                >
                    Cerrar
                </button>
            )}
          </div>
        )}

        {/* Información del Usuario (REAL DE BASE DE DATOS/AUTH) */}
        <div className={`p-4 rounded-lg mb-6 text-sm ${isAuthenticated ? 'bg-gray-800 border border-green-500/50' : 'bg-red-900/20 border border-red-500/50'}`}>
            <p className="font-semibold text-white mb-2">Detalles del Comprador:</p>
            <p className="text-gray-300">Estado: 
                <span className={`font-bold ${isAuthenticated ? 'text-green-400' : 'text-red-400'}`}>
                    {displayedAuthStatus}
                </span>
            </p>
            <p className="text-gray-300">Nombre: <span className="text-red-400">{displayedUserName}</span></p>
            <p className="text-gray-300">Email: <span className="text-red-400">{displayedUserEmail}</span></p>
            {!isAuthenticated && (
                <p className="text-xs mt-2 italic text-red-400">
                    Por favor, inicia sesión para que la orden se registre correctamente a tu nombre.
                </p>
            )}
        </div>


        <div className="space-y-4 mb-6" data-testid="cart-items">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-8" data-testid="empty-cart">
              TU CARRITO ESTÁ VACÍO
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700"
                data-testid={`cart-item-${index}`}
              >
                <div className="relative w-20 h-20 flex-shrink-0">
                  {/* Reemplazando Next/Image por tag <img> estándar */}
                  <img
                    src={item.image || "https://placehold.co/80x80/1f2937/FFFFFF?text=Product"}
                    alt={item.name}
                    style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                    data-testid={`cart-item-image-${index}`}
                    onError={(e: any) => e.target.src = "https://placehold.co/80x80/1f2937/FFFFFF?text=Product"}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold" data-testid={`cart-item-name-${index}`}>
                    {item.name.toUpperCase()}
                  </div>
                  <div className="text-green-400" data-testid={`cart-item-price-${index}`}>
                    ${item.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decreaseQuantity(index)}
                    className="bg-red-600 hover:bg-red-700 text-white w-8 h-8 rounded font-bold"
                    data-testid={`cart-item-decrease-${index}`}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="text-white font-bold w-8 text-center" data-testid={`cart-item-quantity-${index}`}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => increaseQuantity(index)}
                    className="bg-green-600 hover:bg-green-700 text-white w-8 h-8 rounded font-bold"
                    data-testid={`cart-item-increase-${index}`}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(index)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm ml-2"
                    data-testid={`cart-item-remove-${index}`}
                  >
                    ELIMINAR
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white font-bold text-xl">Total:</span>
            <span className="text-green-400 font-bold text-2xl" data-testid="cart-total">
              ${getTotalPrice().toFixed(2)}
            </span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={clearCart}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition-colors disabled:opacity-50"
              data-testid="cart-clear"
              disabled={cart.length === 0 || isLoading}
            >
              VACIAR CARRITO
            </button>
            <button
              onClick={handleCheckout}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white py-3 rounded font-bold transition-all disabled:opacity-50 disabled:from-gray-600 disabled:to-gray-700"
              data-testid="cart-checkout"
              // Se deshabilita si el carrito está vacío, está cargando, o NO está autenticado/listo
              disabled={cart.length === 0 || isLoading || !isAuthenticated || !authReady} 
            >
              {isLoading ? "PROCESANDO..." : "COMPRAR AHORA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
