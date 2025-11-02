"use client"

import { useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { AuthModal } from "./auth-modal"
import { CartModal } from "./cart-modal"

export function Header() {
  const { getTotalItems } = useCart()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
    setShowLoginModal(false)
  }

  const handleRegister = () => {
    setIsLoggedIn(true)
    setShowRegisterModal(false)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
    <>
      <header
        className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-white py-8 px-4 border-b-4 border-red-500"
        data-testid="header"
      >
        <div className="max-w-7xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider"
            data-testid="main-title"
          >
            FIGURAS VALORANT
          </h1>
          <p
            className="text-center text-red-200 text-sm md:text-base mb-6"
            data-testid="subtitle"
          >
            SELECCIONA TU AGENTE FAVORITO
          </p>

          <div className="flex justify-center items-center gap-4 flex-wrap">
            <div className="flex gap-2">
              {!isLoggedIn ? (
                <>
                  {/* 🔹 Botón de Login con testid actualizado */}
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold text-sm transition-colors"
                    data-testid="open-login"
                  >
                    INICIAR SESIÓN
                  </button>

                  {/* 🔹 Botón de Registro con testid actualizado */}
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold text-sm transition-colors"
                    data-testid="open-register"
                  >
                    REGISTRAR
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => alert("Perfil de usuario (Demo)")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold text-sm transition-colors"
                    data-testid="profile-button"
                  >
                    MI PERFIL
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded font-bold text-sm transition-colors"
                    data-testid="logout-button"
                  >
                    CERRAR SESIÓN
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setShowCartModal(true)}
              className="bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white px-6 py-2 rounded font-bold text-sm transition-all flex items-center gap-2"
              data-testid="cart-button"
            >
              🛒 <span data-testid="cart-count">{getTotalItems()}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 🔹 Modal de Login */}
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mode="login"
        onSuccess={handleLogin}
        onSwitchMode={() => {
          setShowLoginModal(false)
          setShowRegisterModal(true)
        }}
      />

      {/* 🔹 Modal de Registro */}
      <AuthModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        mode="register"
        onSuccess={handleRegister}
        onSwitchMode={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />

      {/* 🔹 Modal del carrito */}
      <CartModal
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
      />
    </>
  )
}
