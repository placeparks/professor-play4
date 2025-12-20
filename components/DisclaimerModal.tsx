'use client'

import { useState, useEffect } from 'react'
import { X, Check, AlertCircle, AlertTriangle } from 'lucide-react'
import { setDisclaimerModalCallback } from '@/utils/modalHelpers'
import { useApp } from '@/contexts/AppContext'

export default function DisclaimerModal() {
  const { deck } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [copyrightChecked, setCopyrightChecked] = useState(false)
  const [bleedChecked, setBleedChecked] = useState(false)

  // Check how many cards don't have bleed
  const cardsWithoutBleed = deck.filter(card => !card.hasBleed).length
  const hasBleedIssue = cardsWithoutBleed > 0

  useEffect(() => {
    setDisclaimerModalCallback(() => setIsOpen(true))
      // Also attach to window for compatibility with DesignStepper
      ; (window as any).openDisclaimerModal = () => setIsOpen(true)
  }, [])

  const closeModal = () => {
    setIsOpen(false)
    setCopyrightChecked(false)
    setBleedChecked(false)
  }

  const proceedToCheckout = () => {
    if (copyrightChecked && bleedChecked) {
      closeModal()
      // Trigger checkout modal via callback
      const checkoutCallback = (window as any).openCheckoutModal
      if (checkoutCallback) {
        checkoutCallback()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[85] flex items-center justify-center backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-850 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-modal max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
            Important Disclaimers
          </h3>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-red-500 active:text-red-600 transition-colors p-1 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-850 overflow-y-auto flex-1">
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-2 sm:mb-3">
              Please confirm the following before proceeding to checkout:
            </h4>

            <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group touch-manipulation">
              <input
                type="checkbox"
                checked={copyrightChecked}
                onChange={(e) => setCopyrightChecked(e.target.checked)}
                className="mt-0.5 sm:mt-1 w-5 h-5 sm:w-6 sm:h-6 text-green-600 border-2 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-slate-800 dark:checked:bg-green-600 dark:checked:border-green-600 cursor-pointer transition-all flex-shrink-0 touch-manipulation"
              />
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                Yes, I confirm that all the images, names and other content added onto my design are correct and I that I own all copyrights for them or have full authorization to use them.
              </span>
            </label>

            <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group touch-manipulation">
              <input
                type="checkbox"
                checked={bleedChecked}
                onChange={(e) => setBleedChecked(e.target.checked)}
                className="mt-0.5 sm:mt-1 w-5 h-5 sm:w-6 sm:h-6 text-green-600 border-2 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-slate-800 dark:checked:bg-green-600 dark:checked:border-green-600 cursor-pointer transition-all flex-shrink-0 touch-manipulation"
              />
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                I verify that I understand the bleed requirements and I adjusted the cards to have 1.9mm bleed for accurate printing.
              </span>
            </label>
          </div>

          {/* Bleed Warning - Only show if cards don't have bleed */}
          {hasBleedIssue && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-700 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-2">
                    ⚠️ WARNING! Bleed has not been applied to all cards.
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                    {cardsWithoutBleed} of {deck.length} cards are missing bleed. This could affect the sizing of your prints.
                  </p>
                  <p className="text-sm font-bold text-red-900 dark:text-red-200">
                    Are you SURE you want to proceed?
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={closeModal}
              className="flex-1 px-4 py-3 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors touch-manipulation min-h-[48px]"
            >
              {hasBleedIssue ? 'Go Back & Fix Bleed' : 'Cancel'}
            </button>
            <button
              onClick={proceedToCheckout}
              disabled={!copyrightChecked || !bleedChecked}
              className={`flex-1 px-3 sm:px-4 py-3 sm:py-3 ${hasBleedIssue
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                } text-white rounded-lg font-bold text-sm sm:text-base shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600 flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation min-h-[48px]`}
            >
              <Check className="w-4 h-4 sm:w-4 sm:h-4" />
              {hasBleedIssue ? 'Proceed Anyway' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

