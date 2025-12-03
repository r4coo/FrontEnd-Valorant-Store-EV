"use client"

import type { ValorantAgent } from "@/types/valorant"
import { useCart } from "@/contexts/cart-context"
import { generateFigureSpecs } from "@/lib/figure-specs"
import Image from "next/image"
import { X } from "lucide-react"

interface CharacterModalProps {
agent: ValorantAgent | null
isOpen: boolean
onClose: () => void
}

export function CharacterModal({ agent, isOpen, onClose }: CharacterModalProps) {
const { addToCart } = useCart()

if (!isOpen || !agent) return null

const specs = generateFigureSpecs(agent)

const handleAddToCart = () => {
addToCart({
id: agent.uuid,
name: agent.displayName,
image: agent.fullPortrait,
price: 29.99,
})
onClose()
}

return ( <div
   className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
   onClick={onClose}
   data-testid="character-modal"
 >
<div
className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 sm:p-6 md:p-8 max-w-5xl w-full my-4 sm:my-8 border-2 border-red-500"
onClick={(e) => e.stopPropagation()}
>
{/* Header */} <div className="flex justify-between items-center mb-4 sm:mb-6 sticky top-0 bg-gradient-to-br from-gray-900 to-gray-800 pb-3 z-10"> <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white" data-testid="character-modal-name">
{agent.displayName.toUpperCase()} </h2> <button
         onClick={onClose}
         className="text-white hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
         data-testid="character-modal-close"
       > <X className="w-6 h-6" /> </button> </div>

```
    {/* Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
      
      {/* Left Side (Image + Role) */}
      <div className="order-1">
        <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-red-950 to-black rounded-lg overflow-hidden mb-3 sm:mb-4">
          <Image
            src={agent.fullPortrait || "/placeholder.svg"}
            alt={agent.displayName}
            fill
            className="object-contain"
            data-testid="character-modal-image"
          />
        </div>

        <div
          className="bg-red-900/50 text-white text-center py-2 sm:py-3 rounded font-bold text-sm sm:text-base"
          data-testid="character-modal-role"
        >
          {agent.role?.displayName.toUpperCase() || "AGENTE"}
        </div>
      </div>

      {/* Right Side (Bio + Specs + Abilities) */}
      <div className="text-white space-y-4 sm:space-y-6 order-2">
        
        {/* Biography */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-2">BIOGRAFÍA</h3>
          <p className="text-gray-300 leading-relaxed text-sm sm:text-base" data-testid="character-modal-bio">
            {agent.description || "Información no disponible"}
          </p>
        </div>

        {/* Specifications */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-3">ESPECIFICACIONES DE LA FIGURA</h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm" data-testid="character-specs">
            <div className="bg-gray-800 p-2 sm:p-3 rounded">
              <div className="text-gray-400">ALTURA:</div>
              <div className="font-bold">{specs.height}</div>
            </div>
            <div className="bg-gray-800 p-2 sm:p-3 rounded">
              <div className="text-gray-400">PESO:</div>
              <div className="font-bold">{specs.weight}</div>
            </div>
            <div className="bg-gray-800 p-2 sm:p-3 rounded">
              <div className="text-gray-400">MATERIAL:</div>
              <div className="font-bold">{specs.material}</div>
            </div>
            <div className="bg-gray-800 p-2 sm:p-3 rounded">
              <div className="text-gray-400">ARTICULACIONES:</div>
              <div className="font-bold">{specs.joints}</div>
            </div>
            <div className="bg-gray-800 p-2 sm:p-3 rounded col-span-2">
              <div className="text-gray-400">ACCESORIOS:</div>
              <div className="font-bold">{specs.accessories}</div>
            </div>
            <div className="bg-gray-800 p-2 sm:p-3 rounded col-span-2">
              <div className="text-gray-400">EDAD RECOMENDADA:</div>
              <div className="font-bold">{specs.age}</div>
            </div>
          </div>
        </div>

        {/* Abilities */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-3">HABILIDADES</h3>
          <div className="space-y-2 sm:space-y-3" data-testid="character-abilities">
            {agent.abilities?.length ? (
              agent.abilities.map((ability, index) => (
                <div
                  key={index}
                  className="flex gap-2 sm:gap-3 bg-gray-800 p-2 sm:p-3 rounded"
                >
                  {ability.displayIcon && (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                      <Image
                        src={ability.displayIcon}
                        alt={ability.displayName}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-red-400 text-sm sm:text-base">
                      {ability.displayName.toUpperCase()}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 line-clamp-3">
                      {ability.description || "Descripción no disponible"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No hay información de habilidades disponible</p>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="mt-6 sm:mt-8 sticky bottom-0 bg-gradient-to-br from-gray-900 to-gray-800 pt-4">
      <button
        onClick={handleAddToCart}
        className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all transform hover:scale-105"
        data-testid="character-add-to-cart"
      >
        AÑADIR AL CARRITO - $29.99
      </button>
    </div>
  </div>
</div>
```

)
}
