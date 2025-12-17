'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ScanSearch, Trash2, Wand2, Loader2, Check, Image, Upload } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { handleImageClick, generateSilverMask, rgbToHex, hexToRgb } from '@/utils/silverMasking'
import { processImage } from '@/utils/imageProcessing'

export default function InspectorModal() {
  const {
    inspectorIndex,
    setInspectorIndex,
    deck,
    setDeck,
    globalBack,
    maskingColors,
    setMaskingColors,
    maskingTolerance,
    setMaskingTolerance,
    setActiveVersionIndex,
  } = useApp()
  const isOpen = inspectorIndex >= 0 && deck[inspectorIndex] !== undefined
  const frontImageRef = useRef<HTMLImageElement>(null)
  const backFileInputRef = useRef<HTMLInputElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [maskUpdating, setMaskUpdating] = useState(false)
  const [maskUpdated, setMaskUpdated] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Reset image loaded state when modal opens
      setImageLoaded(false)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && deck[inspectorIndex]) {
      // Load masking colors from card only when modal first opens or card changes
      const card = deck[inspectorIndex]
      // Always set maskingColors from card, ensuring it's an array
      if (Array.isArray(card.maskingColors)) {
        setMaskingColors(card.maskingColors)
      } else {
        setMaskingColors([])
      }
      if (card.maskingTolerance !== undefined) {
        setMaskingTolerance(card.maskingTolerance)
      } else {
        setMaskingTolerance(15)
      }
    }
  }, [isOpen, inspectorIndex]) // Only run when modal opens or card changes, not when deck updates

  // Check if image is already loaded when component mounts or card changes
  // This must be before the early return to avoid hooks violation
  useEffect(() => {
    if (isOpen && frontImageRef.current && deck[inspectorIndex]?.front) {
      const img = frontImageRef.current
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        setImageLoaded(true)
      }
    }
  }, [isOpen, inspectorIndex, deck])

  if (!isOpen) {
    return null
  }

  const card = deck[inspectorIndex]
  const isSilverFinish = card.finish && card.finish.includes('silver')

  const closeInspector = () => {
    setInspectorIndex(-1)
  }

  const removeCard = () => {
    if (confirm('Are you sure you want to remove this card group?')) {
      const newDeck = deck.filter((_, i) => i !== inspectorIndex)
      setDeck(newDeck)
      closeInspector()
    }
  }

  const handleColorPick = (color: string) => {
    if (!maskingColors.includes(color)) {
      const newColors = [...maskingColors, color]
      setMaskingColors(newColors)
      // Update card
      setDeck((prev) => {
        const newDeck = [...prev]
        newDeck[inspectorIndex] = {
          ...newDeck[inspectorIndex],
          maskingColors: newColors,
        }
        return newDeck
      })
      // Auto-update mask immediately like HTML version
      updateSilverMask(newColors, maskingTolerance)
    }
  }

  const removeColor = (colorToRemove: string) => {
    const newColors = maskingColors.filter((c) => c !== colorToRemove)
    setMaskingColors(newColors)
    setDeck((prev) => {
      const newDeck = [...prev]
      newDeck[inspectorIndex] = {
        ...newDeck[inspectorIndex],
        maskingColors: newColors,
      }
      return newDeck
    })
    // Auto-update mask immediately like HTML version
    updateSilverMask(newColors, maskingTolerance)
  }

  const clearSilverMask = () => {
    setMaskingColors([])
    setDeck((prev) => {
      const newDeck = [...prev]
      newDeck[inspectorIndex] = {
        ...newDeck[inspectorIndex],
        maskingColors: [],
        silverMask: null,
      }
      return newDeck
    })
  }

  const updateSilverMask = (colorsToUse?: string[], toleranceToUse?: number) => {
    // Get fresh card data to avoid stale closures
    const currentCard = deck[inspectorIndex]
    if (!currentCard) return

    // Get colors from parameter or current state, ensuring it's always an array
    const colors = colorsToUse !== undefined
      ? (Array.isArray(colorsToUse) ? colorsToUse : [])
      : (Array.isArray(maskingColors) ? maskingColors : [])
    const tolerance = toleranceToUse !== undefined ? toleranceToUse : maskingTolerance

    // Use front image (processed) like HTML version uses deck[inspectorIndex].front
    const imageSrc = currentCard.front

    if (!imageSrc || !Array.isArray(colors) || colors.length === 0) {
      setDeck((prev) => { // Clear mask if no colors selected
        const newDeck = [...prev]
        if (newDeck[inspectorIndex]) {
          newDeck[inspectorIndex] = {
            ...newDeck[inspectorIndex],
            silverMask: null,
          }
        }
        return newDeck
      })
      setMaskUpdating(false)
      setMaskUpdated(false)
      return
    }

    setMaskUpdating(true)
    setMaskUpdated(false)

    generateSilverMask(imageSrc, colors, tolerance, (maskUrl) => {
      if (!maskUrl) {
        console.warn('Failed to generate silver mask')
        setMaskUpdating(false)
        setMaskUpdated(false)
        return
      }

      setDeck((prev) => {
        const newDeck = [...prev]
        if (newDeck[inspectorIndex]) {
          newDeck[inspectorIndex] = {
            ...newDeck[inspectorIndex],
            silverMask: maskUrl,
            maskingTolerance: tolerance,
            maskingColors: colors, // Also save colors to card
          }
        }
        return newDeck
      })
      setMaskUpdating(false)
      setMaskUpdated(true)
      // Reset "Updated" state after 2 seconds
      setTimeout(() => {
        setMaskUpdated(false)
      }, 2000)
    })
  }

  const handleToleranceChange = (value: number) => {
    setMaskingTolerance(value)
    setDeck((prev) => {
      const newDeck = [...prev]
      newDeck[inspectorIndex] = {
        ...newDeck[inspectorIndex],
        maskingTolerance: value,
      }
      return newDeck
    })
    // Auto-update mask immediately like HTML version
    updateSilverMask(maskingColors, value)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleFrontImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isSilverFinish || !card.front) return
    e.stopPropagation() // Prevent any parent click handlers
    // The handleImageClick utility function handles image loading internally
    // It will wait for the image to load if needed
    handleImageClick(e, card.front, handleColorPick)
  }

  const handleChangeVersion = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (card.printsUri) {
      setActiveVersionIndex(inspectorIndex)
      // Open VersionsModal - we'll need to expose this via a global function or context
      // For now, we'll trigger it via window event
      window.dispatchEvent(new CustomEvent('openVersionsModal', { detail: { index: inspectorIndex } }))
    }
  }

  const handleChangeBackClick = () => {
    backFileInputRef.current?.click()
  }

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || inspectorIndex < 0) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const originalBack = (event.target?.result as string) || ''
      const currentCard = deck[inspectorIndex]

      setDeck((prev) => {
        const newDeck = [...prev]
        newDeck[inspectorIndex] = {
          ...newDeck[inspectorIndex],
          originalBack,
        }
        return newDeck
      })

      // Process the back image with current card's trim/bleed settings
      processImage(
        originalBack,
        currentCard.trimMm || 2.5,
        currentCard.bleedMm || 1.9,
        currentCard.hasBleed || false,
        (processed) => {
          setDeck((prev) => {
            const newDeck = [...prev]
            newDeck[inspectorIndex] = {
              ...newDeck[inspectorIndex],
              back: processed,
            }
            return newDeck
          })
        }
      )
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleRevertToGlobalBack = () => {
    setDeck((prev) => {
      const newDeck = [...prev]
      newDeck[inspectorIndex] = {
        ...newDeck[inspectorIndex],
        back: null,
        originalBack: null,
      }
      return newDeck
    })
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center backdrop-blur-sm p-2 sm:p-4"
    >
      <div className="bg-white dark:bg-slate-850 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white flex items-center gap-2">
            <ScanSearch className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" /> Card Inspector
          </h3>
          <button
            onClick={closeInspector}
            className="text-slate-400 hover:text-red-500 active:text-red-600 transition-colors p-1 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-850 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">
                Front
              </p>
              <div className="aspect-[2.5/3.5] bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm relative group">
                {card.front ? (
                  <>
                    <img
                      ref={frontImageRef}
                      src={card.front}
                      className={`w-full h-full object-cover ${isSilverFinish ? 'cursor-crosshair' : 'cursor-pointer'}`}
                      alt="Card front"
                      onLoad={handleImageLoad}
                      onClick={isSilverFinish ? handleFrontImageClick : undefined}
                      style={{ pointerEvents: 'auto' }}
                    />
                    {/* Finish Overlay */}
                    {card.finish && (
                      <div className="absolute inset-0 pointer-events-none">
                        {card.finish.includes('silver') && card.silverMask && (
                          <div
                            className="finish-silver absolute inset-0"
                            style={{
                              WebkitMaskImage: `url(${card.silverMask})`,
                              maskImage: `url(${card.silverMask})`,
                            }}
                          />
                        )}
                        {card.finish.includes('rainbow') && <div className="finish-rainbow absolute inset-0" />}
                        {card.finish.includes('gloss') && !card.finish.includes('rainbow') && (
                          <div className="finish-gloss absolute inset-0" />
                        )}
                      </div>
                    )}

                    {/* Change Version Button - Only visible when printsUri exists */}
                    {card.printsUri && (
                      <div className="absolute bottom-4 left-0 w-full flex justify-center z-30">
                        <button
                          onClick={handleChangeVersion}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 transition-transform hover:scale-105 backdrop-blur-sm border border-white/20"
                        >
                          <Image className="w-3 h-3" /> Change Version
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                    No front image
                  </div>
                )}
              </div>

              {/* Silver Masking Tools Panel */}
              {isSilverFinish && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" /> Spot Silver Tools
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded p-3 text-xs space-y-3">
                    <p className="text-slate-500 dark:text-slate-400">
                      {imageLoaded
                        ? 'Click on the card image above to select colors to become metallic silver.'
                        : 'Loading image...'}
                    </p>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Selected Colors</span>
                        <button
                          onClick={clearSilverMask}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 min-h-[20px]">
                        {maskingColors.length === 0 ? (
                          <span className="text-slate-400 italic">None selected</span>
                        ) : (
                          maskingColors.map((color) => (
                            <div
                              key={color}
                              className="w-5 h-5 rounded border border-slate-300 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                              onClick={() => removeColor(color)}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Tolerance</label>
                        <span className="font-mono text-slate-500">{maskingTolerance}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={maskingTolerance}
                        onChange={(e) => handleToleranceChange(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={() => updateSilverMask()}
                      disabled={maskUpdating || !Array.isArray(maskingColors) || maskingColors.length === 0}
                      className="w-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 py-1.5 rounded font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {maskUpdating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Updating...
                        </>
                      ) : maskUpdated ? (
                        <>
                          <Check className="w-3 h-3" />
                          Updated
                        </>
                      ) : (
                        'Update Mask Preview'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Finish Selector in Inspector */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Card Finish
                </label>
                <select
                  value={card.finish || 'standard'}
                  onChange={(e) => {
                    const newFinish = e.target.value
                    setDeck((prev) => {
                      const newDeck = [...prev]
                      const updatedCard = { ...newDeck[inspectorIndex], finish: newFinish }

                      // If switching TO silver, initialize masking
                      if (newFinish.includes('silver') && !updatedCard.maskingColors) {
                        updatedCard.maskingColors = []
                        updatedCard.maskingTolerance = 15
                        setMaskingColors([])
                        setMaskingTolerance(15)
                      } else if (!newFinish.includes('silver')) {
                        // If switching FROM silver, clear mask data
                        updatedCard.silverMask = null
                        updatedCard.maskingColors = []
                        updatedCard.maskingTolerance = 15
                        setMaskingColors([])
                        setMaskingTolerance(15)
                      }

                      newDeck[inspectorIndex] = updatedCard
                      return newDeck
                    })
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-md px-2 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="standard">Standard Finish</option>
                  <option value="rainbow">Rainbow Foil (+$2.50)</option>
                  <option value="gloss">Piano Gloss (+$2.50)</option>
                  <option value="silver">Spot Silver (+$3.50)</option>
                  <option value="silver-rainbow">Spot Silver + Rainbow (+$6.00)</option>
                  <option value="silver-gloss">Spot Silver + Gloss (+$6.00)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center flex items-center justify-center gap-2">
                Back
                {card.back && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                    Custom
                  </span>
                )}
              </p>
              <div
                className="aspect-[2.5/3.5] bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm relative group cursor-pointer"
                onClick={handleChangeBackClick}
              >
                {card.back || globalBack.processed ? (
                  <>
                    <img
                      src={card.back || globalBack.processed || ''}
                      className="w-full h-full object-cover relative z-10"
                      alt="Card back"
                    />
                    {/* Hover overlay with Change Back button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <button className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                        <Upload className="w-3 h-3" /> Change Back
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                    No back added
                  </div>
                )}
              </div>

              {/* Hidden file input for back upload */}
              <input
                ref={backFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBackFileChange}
              />

              {/* Revert to Global Back button - only show if card has custom back */}
              {card.back && (
                <div className="text-center space-y-2 pt-2">
                  <button
                    onClick={handleRevertToGlobalBack}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors font-medium border border-red-200 dark:border-red-900 px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    Revert to Deck Back
                  </button>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Click image to upload custom back for this card only.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0">
          <button
            onClick={removeCard}
            className="text-red-500 hover:text-red-700 active:text-red-800 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 px-3 sm:px-2 bg-red-50 dark:bg-red-900/20 py-2 sm:py-1.5 rounded border border-red-100 dark:border-red-800 touch-manipulation min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" /> <span className="hidden xs:inline">Delete All Copies</span><span className="xs:hidden">Delete</span>
          </button>
          <button
            onClick={closeInspector}
            className="bg-slate-800 hover:bg-slate-900 active:bg-slate-950 dark:bg-slate-700 dark:hover:bg-slate-600 dark:active:bg-slate-500 text-white px-4 sm:px-5 py-2.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors shadow touch-manipulation min-h-[44px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

