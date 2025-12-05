"use client"

import { useCart } from "@/contexts/cart-context"
import Image from "next/image"
import { useState } from "react"

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
}

// ⚠️ IMPORTANTE: Aquí deberías integrar tu hook de autenticación real (ej. useAuth) 
// para obtener el nombre y correo del usuario autenticado.
// Usaremos placeholders para simular los datos necesarios para la API.
const DUMMY_USER_NAME = "Usuario Autenticado" 
const DUMMY_USER_EMAIL = "usuario.autenticado@ejemplo.com"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACK

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, getTotalPrice } = useCart()
  
  // Estados para manejar la compra
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  if (!isOpen) return null

  const handleCheckout = async () => {
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
    
    // El backend espera un objeto Venta, así que enviamos los datos necesarios.
    // Asegúrate de que los nombres de los campos (nombreUsuario, correo, total, etc.) 
    // coincidan con las propiedades de tu entidad Venta en Spring Boot.
    const orderData = {
      // Usar datos reales del usuario (reemplazar DUMMY_USER_...)
      nombreUsuario: DUMMY_USER_NAME,
      correo: DUMMY_USER_EMAIL,
      total: totalPrice,
      productos: cart.map(item => ({
        idProducto: item.id, // Asume que cada producto tiene un ID
        nombre: item.name,
        cantidad: item.quantity,
        precioUnitario: item.price,
      })),
    }

    setIsLoading(true)
    setCheckoutMessage(null)

    // 3. Llamada a la API
    try {
      // 🚨 CORRECCIÓN CLAVE: CAMBIAMOS /compras A /ventas para coincidir con el VentaController
      const response = await fetch(`${API_BASE_URL}/ventas`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Aquí iría el Token JWT si estuvieras usándolo para seguridad
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
        clearCart()
        // No cerramos el modal inmediatamente, permitimos al usuario ver el mensaje de éxito
      } else {
        // Error de la API (ej. 400, 500)
        const errorText = await response.text()
        setCheckoutMessage({ 
            type: 'error', 
            text: `Error ${response.status} al procesar la compra: ${errorText || 'Error desconocido del servidor'}` 
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

        {/* Mensaje de Compra/Error (Reemplaza el antiguo alert) */}
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

        {/* Información del Usuario (PLACEHOLDER) */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6 text-sm text-gray-300">
            <p className="font-semibold text-white mb-2">Detalles del Comprador (Placeholder):</p>
            <p>Nombre: <span className="text-red-400">{DUMMY_USER_NAME}</span></p>
            <p>Email: <span className="text-red-400">{DUMMY_USER_EMAIL}</span></p>
            <p className="text-xs mt-1 italic text-gray-500">
                ⚠️ Reemplaza estas constantes con los datos de tu Contexto de Autenticación.
            </p>
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
                  <Image
                    src={item.image || "https://placehold.co/80x80/1f2937/FFFFFF?text=Product"}
                    alt={item.name}
                    fill
                    className="object-contain"
                    data-testid={`cart-item-image-${index}`}
                    // Para que Next.js no se queje de URLs vacías en el código del usuario.
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
              className="flex-1 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white py-3 rounded font-bold transition-all disabled:opacity-50"
              data-testid="cart-checkout"
              disabled={cart.length === 0 || isLoading}
            >
              {isLoading ? "PROCESANDO..." : "COMPRAR AHORA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
