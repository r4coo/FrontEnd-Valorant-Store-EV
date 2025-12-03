"use client"

import { useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { AuthModal } from "./auth-modal"
import { CartModal } from "./cart-modal"
import { ShoppingCart, User, LogOut, UserPlus, LogIn } from "lucide-react"

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
        className="bg-gradient-to-br from-gray-900 via-red-950 to-black text-white py-8 px-4"
        data-testid="header"
      >
        <div className="max-w-7xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider text-red-500"
            data-testid="main-title"
          >
            FIGURAS VALORANT
          </h1>
          <p className="text-center text-red-300 text-sm md:text-base mb-6" data-testid="subtitle">
            SELECCIONA TU AGENTE FAVORITO
          </p>

          <div className="flex justify-center items-center gap-4 flex-wrap">
            <div className="flex gap-3">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-500/50 flex items-center gap-2"
                    data-testid="login-button"
                  >
                    <LogIn className="w-4 h-4" />
                    INICIAR SESIÓN
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="group relative bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/50 flex items-center gap-2"
                    data-testid="register-button"
                  >
                    <UserPlus className="w-4 h-4" />
                    REGISTRAR
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => alert("Perfil de usuario (Demo)")}
                    className="group relative bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
                    data-testid="profile-button"
                  >
                    <User className="w-4 h-4" />
                    MI PERFIL
                  </button>
                  <button
                    onClick={handleLogout}
                    className="group relative bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-lg hover:shadow-gray-500/50 flex items-center gap-2"
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4" />
                    CERRAR SESIÓN
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setShowCartModal(true)}
              className="relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-lg hover:shadow-red-500/50 flex items-center gap-2"
              data-testid="cart-button"
            >
              <ShoppingCart className="w-5 h-5" />
              <span
                className="bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                data-testid="cart-count"
              >
                {getTotalItems()}
              </span>
            </button>
          </div>
        </div>
      </header>

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

      <CartModal isOpen={showCartModal} onClose={() => setShowCartModal(false)} />
    </>
  )
}
