'use client'

import { useEffect } from 'react'
import { X, ScanSearch, Trash2 } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

export default function InspectorModal() {
  const { inspectorIndex, setInspectorIndex, deck, setDeck, globalBack } = useApp()
  const isOpen = inspectorIndex >= 0 && deck[inspectorIndex] !== undefined

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const card = deck[inspectorIndex]

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
              <div className="aspect-[2.5/3.5] bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 relative group">
                {card.front ? (
                  <img src={card.front} className="w-full h-full object-cover" alt="Card front" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                    No front image
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">
                Back
              </p>
              <div className="aspect-[2.5/3.5] bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm relative group">
                {card.back || globalBack.processed ? (
                  <img
                    src={card.back || globalBack.processed || ''}
                    className="w-full h-full object-cover"
                    alt="Card back"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                    No back added
                  </div>
                )}
              </div>
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

