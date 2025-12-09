'use client'

import { ChevronLeft, ChevronRight, Minus, Plus, Image } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

export default function EditorView() {
  const {
    currentStep,
    deck,
    currentCardIndex,
    setCurrentCardIndex,
    globalBack,
    setDeck,
  } = useApp()

  const currentCard = currentStep === 2 ? null : deck[currentCardIndex]
  const imageToShow = currentStep === 2 ? globalBack.processed : currentCard?.front

  const nextCard = () => {
    if (deck.length === 0) return
    setCurrentCardIndex((currentCardIndex + 1) % deck.length)
  }

  const prevCard = () => {
    if (deck.length === 0) return
    setCurrentCardIndex((currentCardIndex - 1 + deck.length) % deck.length)
  }

  const updateQuantity = (change: number) => {
    if (currentCardIndex < 0 || !deck[currentCardIndex]) return
    const card = deck[currentCardIndex]
    const newQty = (card.quantity || 1) + change
    if (newQty >= 1) {
      setDeck(prev => {
        const newDeck = [...prev]
        newDeck[currentCardIndex] = { ...newDeck[currentCardIndex], quantity: newQty }
        return newDeck
      })
    }
  }

  return (
    <div className="flex-grow bg-slate-100 dark:bg-slate-950 canvas-area p-2 sm:p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-2 sm:px-3 py-1 sm:py-1.5 rounded shadow text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 z-10 flex gap-1.5 sm:gap-2">
        <span>Canvas: 2.5" x 3.5"</span>
        {currentStep === 2 && (
          <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 rounded-sm font-bold">
            Common Back
          </span>
        )}
      </div>

      <div className="flex flex-col items-center justify-center w-full h-full">
        {deck.length > 0 && currentStep === 1 && (
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 z-10">
            <button
              onClick={prevCard}
              className="bg-white dark:bg-slate-800 p-2 sm:p-2 rounded-full shadow hover:bg-blue-50 dark:hover:bg-slate-700 active:bg-blue-100 dark:active:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Previous Card"
              aria-label="Previous Card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-slate-800 rounded-full shadow pl-3 sm:pl-4 pr-1.5 sm:pr-2 py-1.5 transition-colors">
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[35px] sm:min-w-[40px] text-center">
                {currentCardIndex + 1} / {deck.length}
              </span>
              <div className="w-px h-3 sm:h-4 bg-slate-200 dark:bg-slate-600"></div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <button
                  onClick={() => updateQuantity(-1)}
                  className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation"
                  title="Decrease Quantity"
                  aria-label="Decrease Quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 w-7 sm:w-8 text-center">
                  x{currentCard?.quantity || 1}
                </span>
                <button
                  onClick={() => updateQuantity(1)}
                  className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation"
                  title="Increase Quantity"
                  aria-label="Increase Quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <button
              onClick={nextCard}
              className="bg-white dark:bg-slate-800 p-2 sm:p-2 rounded-full shadow hover:bg-blue-50 dark:hover:bg-slate-700 active:bg-blue-100 dark:active:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Next Card"
              aria-label="Next Card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div
          id="card-canvas"
          className="h-[280px] sm:h-[350px] md:h-[420px] w-auto max-w-[90vw] sm:max-w-full bg-white dark:bg-slate-800 shadow-2xl rounded-xl relative border border-slate-200 dark:border-slate-700 transition-all duration-200 transform origin-center"
        >
          <div
            id="cut-line"
            className="absolute inset-0 border-2 border-cyan-500 border-dotted pointer-events-none z-40 hidden opacity-90"
          >
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-cyan-600 dark:text-cyan-400 font-bold font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow border border-cyan-100 dark:border-cyan-900 whitespace-nowrap">
              Cut Line (63x88mm)
            </span>
          </div>

          <div className="w-full h-full rounded-lg overflow-hidden relative bg-white dark:bg-slate-800 group">
            {imageToShow ? (
              <img
                src={imageToShow}
                alt="Card"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-8 text-center group">
                <Image className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm font-medium">
                  {currentStep === 2 ? 'No Back Selected' : 'No Image Selected'}
                </p>
                <p className="text-xs opacity-75 mt-1">Upload an image to start</p>
              </div>
            )}
          </div>
        </div>

        {currentCard && currentStep === 1 && (
          <div className="mt-4 sm:mt-6 flex justify-center gap-3 z-20">
            <button className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 transition-colors border border-blue-700/20 touch-manipulation min-h-[44px]">
              <Image className="w-4 h-4" /> Change Art
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

