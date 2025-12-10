'use client'

import { Download, Sparkles, ShoppingCart } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { downloadZip } from '@/utils/zipDownload'
import { openDisclaimerModal } from '@/utils/modalHelpers'

export default function PreviewGrid() {
  const { deck, globalBack, setInspectorIndex, setDeck } = useApp()

  if (deck.length === 0) {
    return (
      <div className="flex-grow bg-slate-100 dark:bg-slate-950 canvas-area p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
          <Sparkles className="w-16 h-16 mb-4 opacity-50" />
          <p>No cards created yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-grow bg-slate-100 dark:bg-slate-950 canvas-area p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Deck Preview</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => downloadZip('fronts', deck, globalBack)}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-[10px] sm:text-xs shadow transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation min-h-[40px] flex-1 sm:flex-none"
          >
            <Download className="w-3 h-3" /> <span className="hidden xs:inline">All </span>Fronts
          </button>
          <button
            onClick={() => downloadZip('backs', deck, globalBack)}
            className="bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-[10px] sm:text-xs shadow transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation min-h-[40px] flex-1 sm:flex-none"
          >
            <Download className="w-3 h-3" /> <span className="hidden xs:inline">All </span>Backs
          </button>
          <button
            onClick={() => downloadZip('masks', deck, globalBack)}
            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-[10px] sm:text-xs shadow transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation min-h-[40px] flex-1 sm:flex-none"
          >
            <Sparkles className="w-3 h-3" /> <span className="hidden xs:inline">All </span>Masks
          </button>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-3 sm:bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-3 sm:px-4 w-full max-w-[calc(100%-1.5rem)] sm:max-w-none sm:w-auto">
        <button
          onClick={() => openDisclaimerModal()}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-3 md:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg shadow-xl hover:shadow-2xl active:shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 sm:gap-3 touch-manipulation min-h-[48px] sm:min-h-[52px]"
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden xs:inline">Proceed to </span>Checkout
        </button>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 justify-items-center pb-24 sm:pb-20">
        {deck.map((cardGroup, groupIndex) => {
          const quantity = cardGroup.quantity || 1
          return Array.from({ length: quantity }).map((_, i) => {
            const visualIndex = deck.slice(0, groupIndex).reduce((sum, c) => sum + (c.quantity || 1), 0) + i + 1
            
            const backImgSrc = cardGroup.back || globalBack.processed || globalBack.original

            return (
              <div key={`${groupIndex}-${i}`} className="flex flex-col gap-1.5 sm:gap-2 w-full max-w-[140px] sm:max-w-[150px]">
                <div 
                  className="flip-card w-full h-[196px] sm:h-[210px] cursor-pointer relative group touch-manipulation"
                  onClick={() => setInspectorIndex(groupIndex)}
                >
                  <div className="flip-card-inner shadow-md rounded-lg">
                    <div className="flip-card-front bg-white dark:bg-slate-800 overflow-hidden relative">
                      {cardGroup.front && (
                        <>
                          <img src={cardGroup.front} className="w-full h-full object-cover" alt={`Card ${visualIndex}`} />
                          {cardGroup.finish && cardGroup.finish.includes('silver') && cardGroup.silverMask && (
                            <div
                              className="finish-silver"
                              style={{
                                WebkitMaskImage: `url(${cardGroup.silverMask})`,
                                maskImage: `url(${cardGroup.silverMask})`,
                              }}
                            />
                          )}
                          {cardGroup.finish && cardGroup.finish.includes('rainbow') && (
                            <div className="finish-rainbow" />
                          )}
                          {cardGroup.finish && cardGroup.finish.includes('gloss') && !cardGroup.finish.includes('rainbow') && (
                            <div className="finish-gloss" />
                          )}
                        </>
                      )}
                    </div>
                    <div className="flip-card-back bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {backImgSrc ? (
                        <img src={backImgSrc} className="w-full h-full object-cover" alt={`Card ${visualIndex} back`} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-xs font-medium p-4 text-center">
                          No back added
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center px-1.5 sm:px-1 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 py-1">
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold pl-1">
                    #{visualIndex}
                  </span>
                  <select
                    className="bg-slate-50 dark:bg-slate-800 text-[9px] sm:text-[10px] font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-0 cursor-pointer w-20 sm:w-24 text-right touch-manipulation"
                    value={cardGroup.finish || 'standard'}
                    onChange={(e) => {
                      const newFinish = e.target.value
                      setDeck(prev => {
                        const newDeck = [...prev]
                        const group = { ...newDeck[groupIndex] } // Create a copy to avoid mutation
                        
                        // If selecting Silver, we need to open inspector to configure it
                        if (newFinish.includes('silver')) {
                          if (group.quantity > 1) {
                            // Split group first - reduce original quantity
                            const updatedGroup = { ...group, quantity: group.quantity - 1 }
                            const newCard = {
                              ...group,
                              id: Date.now() + Math.random(),
                              quantity: 1,
                              finish: newFinish,
                              // Reset any existing mask data since it's a new config
                              silverMask: null,
                              maskingColors: [],
                              maskingTolerance: 15,
                            }
                            // Update the original group and insert new card right after it
                            newDeck[groupIndex] = updatedGroup
                            newDeck.splice(groupIndex + 1, 0, newCard)
                            // Open inspector for the NEW card (index + 1)
                            setTimeout(() => {
                              setInspectorIndex(groupIndex + 1)
                            }, 100)
                          } else {
                            // Already a single card, just update finish
                            const updatedGroup = {
                              ...group,
                              finish: newFinish,
                              silverMask: group.silverMask || null,
                              maskingColors: group.maskingColors || [],
                              maskingTolerance: group.maskingTolerance || 15,
                            }
                            newDeck[groupIndex] = updatedGroup
                            setTimeout(() => {
                              setInspectorIndex(groupIndex)
                            }, 100)
                          }
                        } else {
                          // Standard/Rainbow/Gloss logic
                          if (group.quantity > 1) {
                            // Split group - reduce original quantity
                            const updatedGroup = { ...group, quantity: group.quantity - 1 }
                            const newCard = {
                              ...group,
                              id: Date.now() + Math.random(),
                              quantity: 1,
                              finish: newFinish,
                            }
                            // Clear silver mask data if switching away from silver
                            if (group.finish && group.finish.includes('silver') && !newFinish.includes('silver')) {
                              newCard.silverMask = null
                              newCard.maskingColors = []
                              newCard.maskingTolerance = 15
                            }
                            // Update the original group and insert new card right after it
                            newDeck[groupIndex] = updatedGroup
                            newDeck.splice(groupIndex + 1, 0, newCard)
                          } else {
                            // Already a single card, just update finish
                            const updatedGroup = {
                              ...group,
                              finish: newFinish,
                            }
                            // Clear silver mask data if switching away from silver
                            if (group.finish && group.finish.includes('silver') && !newFinish.includes('silver')) {
                              updatedGroup.silverMask = null
                              updatedGroup.maskingColors = []
                              updatedGroup.maskingTolerance = 15
                            }
                            newDeck[groupIndex] = updatedGroup
                          }
                        }
                        
                        return newDeck
                      })
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="standard">Standard</option>
                    <option value="rainbow">Rainbow</option>
                    <option value="gloss">Gloss</option>
                    <option value="silver">Spot Silver</option>
                    <option value="silver-rainbow">Silver+Holo</option>
                    <option value="silver-gloss">Silver+Gloss</option>
                  </select>
                </div>
              </div>
            )
          })
        })}
      </div>
    </div>
  )
}

