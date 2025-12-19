'use client'

import { useState, useRef, useEffect } from 'react'
import { ImagePlus, List, FileCode, Crop, Copy, ArrowRight, Scissors, RotateCcw, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { processImage } from '@/utils/imageProcessing'
import { handleFiles as processFiles } from '@/utils/fileHandling'
import { handleXMLFile } from '@/utils/xmlHandling'
import { openImportModal } from '@/utils/modalHelpers'

export default function Sidebar() {
  const {
    currentStep,
    setCurrentStep,
    globalBack,
    setGlobalBack,
    deck,
    setDeck,
    currentCardIndex,
    setCurrentCardIndex,
    setInspectorIndex,
    setActiveVersionIndex,
    setMaskingColors,
    setMaskingTolerance,
    setCurrentZoomLevel
  } = useApp()
  const [processing, setProcessing] = useState(false)
  const [processingPercent, setProcessingPercent] = useState(0)
  const [processingText, setProcessingText] = useState('Processing...')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const xmlInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (currentStep === 2) {
      const file = files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        const original = (e.target?.result as string) || ''
        const newBack = { ...globalBack, original, trimMm: 2.5, bleedMm: 1.9, hasBleed: false }
        setGlobalBack(newBack)

        processImage(original, 2.5, 1.9, false, (processed) => {
          setGlobalBack({ ...newBack, processed })
        })
      }
      reader.readAsDataURL(file)
    } else {
      await processFiles(files, deck, setDeck, setCurrentCardIndex, currentCardIndex, setProcessing, setProcessingPercent, setProcessingText)
    }
  }

  const handleReset = () => {
    setShowResetConfirm(true)
  }

  const confirmReset = () => {
    // Reset all state to initial values
    setDeck([])
    setGlobalBack({
      original: null,
      processed: null,
      trimMm: 2.5,
      bleedMm: 1.9,
      hasBleed: false,
    })
    setCurrentCardIndex(-1)
    setCurrentStep(1)
    setInspectorIndex(-1)
    setActiveVersionIndex(-1)
    setMaskingColors([])
    setMaskingTolerance(15)
    setCurrentZoomLevel(1)
    setShowResetConfirm(false)
    // Reset file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (xmlInputRef.current) {
      xmlInputRef.current.value = ''
    }
  }

  const cancelReset = () => {
    setShowResetConfirm(false)
  }

  return (
    <>
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-850 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-modal">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                Reset Project
              </h3>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-slate-400 hover:text-red-500 active:text-red-600 transition-colors p-1 touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-850">
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-2">
                  Are you sure you want to reset the project?
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  This will permanently clear all cards, settings, and start fresh. This action cannot be undone.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <RotateCcw className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-semibold mb-1">What will be reset:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-500">
                    <li>All card images and data</li>
                    <li>Card backs and finishes</li>
                    <li>Trim and bleed settings</li>
                    <li>All customizations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-lg font-medium text-sm transition-colors bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 touch-manipulation min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2.5 rounded-lg font-medium text-sm transition-colors bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm touch-manipulation min-h-[44px]"
              >
                Yes, Reset Project
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="main-sidebar" className="w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-lg md:shadow-none transition-colors">
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          <div id="upload-panel" className="p-4 sm:p-6 flex-grow">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ImagePlus className="w-4 h-4" />
              {currentStep === 2 ? 'Upload Back' : 'Upload Fronts'}
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 sm:p-6 text-center hover:bg-blue-50 dark:hover:bg-slate-800 active:bg-blue-100 dark:active:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer mb-4 sm:mb-6 group touch-manipulation"
            >
              <ImagePlus className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {currentStep === 2 ? 'Click to set Card Back' : 'Click to upload'}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">JPG, PNG (Max 32MB)</p>
            </div>

            {processing && (
              <div className="mb-6">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>{processingText}</span>
                  <span>{processingPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${processingPercent}%` }}
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="mb-6 space-y-2">
                <button
                  onClick={() => openImportModal()}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2 rounded-md text-xs font-medium hover:bg-white dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                >
                  <List className="w-3 h-3" /> Import from Text List
                </button>

                <input
                  ref={xmlInputRef}
                  type="file"
                  accept=".xml"
                  className="hidden"
                  onChange={(e) => handleXMLFile(e.target.files, deck, setDeck, setCurrentCardIndex, currentCardIndex, globalBack, setGlobalBack, currentStep, setProcessing, setProcessingPercent, setProcessingText)}
                />

                <button
                  onClick={() => xmlInputRef.current?.click()}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2 rounded-md text-xs font-medium hover:bg-white dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                >
                  <FileCode className="w-3 h-3" /> Upload XML (MPCFill)
                </button>

                {deck.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="w-full border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2 rounded-md text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Project
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Instructions</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {currentStep === 2
                  ? 'Upload an image here to set a common back for ALL cards, or use Import to set specific backs.'
                  : 'Upload your card art here. Each image will create a new card in your deck.'}
              </p>
            </div>
          </div>

          <PrintPrepPanel />
        </div>

        {/* Background Image Selector - Only show in step 2 */}
        {currentStep === 2 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Choose Background
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const bgPath = '/bg1.jpg'
                  fetch(bgPath)
                    .then(res => res.blob())
                    .then(blob => {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        const original = (e.target?.result as string) || ''
                        const newBack = { ...globalBack, original, trimMm: 2.5, bleedMm: 1.9, hasBleed: false }
                        setGlobalBack(newBack)
                        processImage(original, 2.5, 1.9, false, (processed) => {
                          setGlobalBack({ ...newBack, processed })
                        })
                      }
                      reader.readAsDataURL(blob)
                    })
                }}
                className="relative group overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all aspect-[63/88]"
              >
                <img
                  src="/bg1.jpg"
                  alt="Background 1"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 bg-blue-600 px-2 py-1 rounded">
                    Select
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  const bgPath = '/bg2.jpg'
                  fetch(bgPath)
                    .then(res => res.blob())
                    .then(blob => {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        const original = (e.target?.result as string) || ''
                        const newBack = { ...globalBack, original, trimMm: 2.5, bleedMm: 1.9, hasBleed: false }
                        setGlobalBack(newBack)
                        processImage(original, 2.5, 1.9, false, (processed) => {
                          setGlobalBack({ ...newBack, processed })
                        })
                      }
                      reader.readAsDataURL(blob)
                    })
                }}
                className="relative group overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all aspect-[63/88]"
              >
                <img
                  src="/bg2.jpg"
                  alt="Background 2"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 bg-blue-600 px-2 py-1 rounded">
                    Select
                  </span>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2">
              Click to apply as card back
            </p>
          </div>
        )}

        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setCurrentStep(currentStep === 1 ? 2 : 3)}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 sm:py-3 rounded-lg font-bold text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-colors touch-manipulation min-h-[48px]"
          >
            {currentStep === 1 ? (
              <>
                Next: Customize Back <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Next: Preview Deck <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

function PrintPrepPanel() {
  const { currentStep, deck, currentCardIndex, setDeck, globalBack, setGlobalBack } = useApp()
  const [trimMm, setTrimMm] = useState(2.5)
  const [bleedMm, setBleedMm] = useState(1.9)
  const [hasBleed, setHasBleed] = useState(false)
  const [isApplied, setIsApplied] = useState(false) // Persistent state for button
  const [showNotificationBanner, setShowNotificationBanner] = useState(false) // Temporary banner

  const target = currentStep === 2 ? globalBack : deck[currentCardIndex]

  // Reset applied state when deck length changes (new cards added)
  useEffect(() => {
    setIsApplied(false)
  }, [deck.length])

  useEffect(() => {
    if (target) {
      // Only sync if values are actually different to avoid resetting during updates
      const targetTrim = target.trimMm || 2.5
      const targetBleed = target.bleedMm !== undefined ? target.bleedMm : 1.9
      const targetHasBleed = target.hasBleed || false

      if (Math.abs(targetTrim - trimMm) > 0.01) {
        setTrimMm(targetTrim)
        setIsApplied(false) // Reset when settings change
      }
      if (Math.abs(targetBleed - bleedMm) > 0.01) {
        setBleedMm(targetBleed)
        setIsApplied(false) // Reset when settings change
      }
      if (targetHasBleed !== hasBleed) {
        setHasBleed(targetHasBleed)
        setIsApplied(false) // Reset when settings change
      }
    }
  }, [target, currentStep, currentCardIndex])

  // Update cut line overlay visually (without processing image)
  const updateCutLineOverlay = (newTrim?: number, newBleedMm?: number, newHasBleed?: boolean) => {
    const finalTrim = newTrim !== undefined ? newTrim : trimMm
    const finalBleedMm = newBleedMm !== undefined ? newBleedMm : bleedMm
    const finalHasBleed = newHasBleed !== undefined ? newHasBleed : hasBleed

    // Update state to trigger cut line overlay update in EditorView
    if (currentStep === 2) {
      setGlobalBack(prev => ({
        ...prev,
        trimMm: finalTrim,
        bleedMm: finalBleedMm,
        hasBleed: finalHasBleed
      }))
    } else {
      if (currentCardIndex < 0) return
      const cardIdx = currentCardIndex
      setDeck(prevDeck => {
        if (cardIdx >= prevDeck.length || !prevDeck[cardIdx]) return prevDeck
        const newDeck = [...prevDeck]
        newDeck[cardIdx] = {
          ...newDeck[cardIdx],
          trimMm: finalTrim,
          bleedMm: finalBleedMm,
          hasBleed: finalHasBleed
        }
        return newDeck
      })
    }
  }

  // Process image with current settings (called when bleed is toggled)
  const updatePrepSettings = (source?: 'slider' | 'input', newTrim?: number, newBleedMm?: number, newHasBleed?: boolean) => {
    // Use provided values or fall back to state
    const finalTrim = newTrim !== undefined ? newTrim : trimMm
    const finalBleedMm = newBleedMm !== undefined ? newBleedMm : bleedMm
    const finalHasBleed = newHasBleed !== undefined ? newHasBleed : hasBleed

    if (currentStep === 2) {
      // Update global back
      setGlobalBack(prev => {
        const originalSrc = prev.original
        if (!originalSrc) return prev

        const newBack = {
          ...prev,
          trimMm: finalTrim,
          bleedMm: finalBleedMm,
          hasBleed: finalHasBleed
        }

        // Process image and update when done
        processImage(originalSrc, finalTrim, finalBleedMm, finalHasBleed, (processed) => {
          setGlobalBack(prevBack => ({ ...prevBack, processed, trimMm: finalTrim, bleedMm: finalBleedMm, hasBleed: finalHasBleed }))
        })

        return newBack
      })
    } else {
      // Update current card
      if (currentCardIndex < 0) return

      // Capture currentCardIndex to avoid closure issues
      const cardIdx = currentCardIndex

      setDeck(prevDeck => {
        if (cardIdx >= prevDeck.length || !prevDeck[cardIdx]) return prevDeck

        const card = prevDeck[cardIdx]
        const originalSrc = card.originalFront
        if (!originalSrc) return prevDeck

        const updatedCard = {
          ...card,
          trimMm: finalTrim,
          bleedMm: finalBleedMm,
          hasBleed: finalHasBleed
        }

        // Process front image
        processImage(originalSrc, finalTrim, finalBleedMm, finalHasBleed, (processed) => {
          setDeck(prev => {
            const newDeck = [...prev]
            if (cardIdx < newDeck.length) {
              newDeck[cardIdx] = {
                ...newDeck[cardIdx],
                front: processed,
                trimMm: finalTrim,
                bleedMm: finalBleedMm,
                hasBleed: finalHasBleed
              }
            }
            return newDeck
          })
        })

        // Also process back if it exists
        if (card.originalBack) {
          processImage(card.originalBack, finalTrim, finalBleedMm, finalHasBleed, (processedBack) => {
            setDeck(prev => {
              const newDeck = [...prev]
              if (cardIdx < newDeck.length) {
                newDeck[cardIdx] = {
                  ...newDeck[cardIdx],
                  back: processedBack,
                  trimMm: finalTrim,
                  bleedMm: finalBleedMm,
                  hasBleed: finalHasBleed
                }
              }
              return newDeck
            })
          })
        }

        // Return updated card immediately (without processed image, which will come in callback)
        const newDeck = [...prevDeck]
        newDeck[cardIdx] = updatedCard
        return newDeck
      })
    }
  }

  const toggleBleed = () => {
    const newHasBleed = !hasBleed
    setHasBleed(newHasBleed)
    setIsApplied(false) // Reset applied state when user toggles bleed
    // Update cut line overlay first
    updateCutLineOverlay(undefined, undefined, newHasBleed)
    // Then process the image with the new bleed state
    updatePrepSettings(undefined, undefined, undefined, newHasBleed)
  }

  const applyPrepToAll = async () => {
    if (deck.length === 0) return

    // Capture current state values at the time of execution
    // These should be the latest values when the button is clicked
    const currentTrim = trimMm
    const currentBleed = bleedMm
    const currentHasBleed = hasBleed

    // Process all cards in parallel
    const promises = deck.map(async (card) => {
      const updatedCard = {
        ...card,
        trimMm: currentTrim,
        bleedMm: currentBleed,
        hasBleed: currentHasBleed
      }

      const pFront = card.originalFront ? new Promise<string | null>((resolve) => {
        processImage(card.originalFront!, currentTrim, currentBleed, currentHasBleed, resolve)
      }) : Promise.resolve(null)

      const pBack = card.originalBack ? new Promise<string | null>((resolve) => {
        processImage(card.originalBack!, currentTrim, currentBleed, currentHasBleed, resolve)
      }) : Promise.resolve(null)

      const [processedFront, processedBack] = await Promise.all([pFront, pBack])

      return {
        ...updatedCard,
        front: processedFront || card.front,
        back: processedBack || card.back
      }
    })

    try {
      const updatedDeck = await Promise.all(promises)
      setDeck(updatedDeck)
      // Set applied state to true (persists until changes)
      setIsApplied(true)
      // Show temporary notification banner
      setShowNotificationBanner(true)
      setTimeout(() => {
        setShowNotificationBanner(false)
      }, 3000) // Hide banner after 3 seconds
    } catch (error) {
      console.error('Error applying prep settings to all cards:', error)
    }
  }

  return (
    <div id="print-prep-panel" className="p-6 border-t border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-850 relative">
      {/* Success Notification */}
      {showNotificationBanner && (
        <div className="absolute top-4 left-4 right-4 bg-green-500 dark:bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-semibold">Settings applied to all {deck.length} card{deck.length !== 1 ? 's' : ''}!</span>
        </div>
      )}

      <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Crop className="w-4 h-4" /> Print Prep
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Corner Trim</label>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{trimMm}mm</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.25"
            value={trimMm}
            onChange={(e) => {
              const newTrim = parseFloat(e.target.value)
              setTrimMm(newTrim)
              setIsApplied(false) // Reset applied state when user changes settings
              // Update cut line overlay visually
              updateCutLineOverlay(newTrim)
              // If bleed is active, reprocess image with new trim value
              if (hasBleed) {
                updatePrepSettings('slider', newTrim)
              }
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Adjusts bleed start point (removes white corners)</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Bleed Adjustment</label>
            <div className="flex items-center gap-1">
              <input
                id="bleed-fine-tune"
                type="number"
                step="0.05"
                value={bleedMm}
                onChange={(e) => {
                  const newBleed = parseFloat(e.target.value)
                  setBleedMm(newBleed)
                  setIsApplied(false) // Reset applied state when user changes settings
                  // Sync slider
                  const bleedSlider = document.getElementById('bleed-slider') as HTMLInputElement
                  if (bleedSlider) {
                    const clampedValue = Math.max(-4, Math.min(4, newBleed))
                    bleedSlider.value = clampedValue.toString()
                  }
                  // Update cut line overlay visually
                  updateCutLineOverlay(undefined, newBleed)
                  // If bleed is active, reprocess image with new bleed value
                  if (hasBleed) {
                    updatePrepSettings('input', undefined, newBleed)
                  }
                }}
                className="w-16 text-right text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
              />
              <span className="text-[10px] text-slate-400 font-mono">mm</span>
            </div>
          </div>
          <input
            id="bleed-slider"
            type="range"
            min="-4"
            max="4"
            step="0.25"
            value={bleedMm}
            onChange={(e) => {
              const newBleed = parseFloat(e.target.value)
              setBleedMm(newBleed)
              setIsApplied(false) // Reset applied state when user changes settings
              // Sync input field
              const bleedInput = document.getElementById('bleed-fine-tune') as HTMLInputElement
              if (bleedInput) bleedInput.value = newBleed.toString()
              // Update cut line overlay visually
              updateCutLineOverlay(undefined, newBleed)
              // If bleed is active, reprocess image with new bleed value
              if (hasBleed) {
                updatePrepSettings('slider', undefined, newBleed)
              }
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-medium px-1 mt-1">
            <span>Trim (-4mm)</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Target (+1.9mm)</span>
            <span>Extend (+4mm)</span>
          </div>
        </div>

        <button
          onClick={toggleBleed}
          className={`w-full border py-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 ${hasBleed
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
            }`}
        >
          <Crop className="w-3 h-3" /> {hasBleed ? 'Bleed Active' : 'Add Bleed'}
        </button>

        <div className="bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2.5 space-y-2">
          <div className="flex gap-2 items-start">
            <Crop className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-tight text-slate-600 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">Standard (+1.9mm):</strong> We need a{' '}
              <strong>1.9mm bleed</strong> extension past the cut line for reliable borderless printing.
            </p>
          </div>
          <div className="flex gap-2 items-start pt-1 border-t border-blue-200 dark:border-blue-800">
            <Scissors className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-tight text-slate-600 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">MPCFill (-1.25mm):</strong> These images often have large bleeds. Set adjustment to <strong>-1.25mm</strong> to trim them to our spec.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
          <button
            onClick={applyPrepToAll}
            className="w-full bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 py-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {isApplied ? (
              <>
                <CheckCircle className="w-3 h-3" /> Applied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Apply to All Cards
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-1">
            Copies current trim/bleed settings to entire deck
          </p>
        </div>
      </div>
    </div>
  )
}

