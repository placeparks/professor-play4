'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, ShoppingCart } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import Sidebar from './Sidebar'
import EditorView from './EditorView'
import PreviewGrid from './PreviewGrid'
import { updateDeckStats } from '@/utils/deckStats'

interface DesignStepperProps {
  onExit: () => void
}

export default function DesignStepper({ onExit }: DesignStepperProps) {
  const { currentStep, setCurrentStep, deck } = useApp()
  const [totalPrice, setTotalPrice] = useState('$0.00')
  const [deckStats, setDeckStats] = useState('0 Cards • S33 Stock')

  useEffect(() => {
    const stats = updateDeckStats(deck)
    setTotalPrice(stats.totalPrice)
    setDeckStats(stats.deckStats)
  }, [deck])

  const handleStepClick = (stepNum: number) => {
    setCurrentStep(stepNum)
  }

  return (
    <div id="design-stepper" className="h-full flex flex-col min-h-screen">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-30 transition-colors">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between py-2 sm:py-3 md:py-4 gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-6 lg:gap-8 flex-1 min-w-0 overflow-x-auto">
              <button
                onClick={() => handleStepClick(1)}
                className={`text-[10px] sm:text-xs md:text-sm font-semibold pb-1 flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink-0 touch-manipulation active:opacity-70 transition-opacity px-1 sm:px-0 ${
                  currentStep === 1
                    ? 'step-active text-blue-600 dark:text-blue-400'
                    : 'step-inactive text-slate-500 dark:text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0 ${
                    currentStep === 1
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  1
                </span>
                <span className="hidden sm:inline whitespace-nowrap">Customize Front</span>
                <span className="sm:hidden text-[10px] whitespace-nowrap">Front</span>
              </button>
              <button
                onClick={() => handleStepClick(2)}
                className={`text-[10px] sm:text-xs md:text-sm font-semibold pb-1 flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink-0 touch-manipulation active:opacity-70 transition-opacity px-1 sm:px-0 ${
                  currentStep === 2
                    ? 'step-active text-blue-600 dark:text-blue-400'
                    : 'step-inactive text-slate-500 dark:text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0 ${
                    currentStep === 2
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  2
                </span>
                <span className="hidden sm:inline whitespace-nowrap">Customize Back</span>
                <span className="sm:hidden text-[10px] whitespace-nowrap">Back</span>
              </button>
              <button
                onClick={() => handleStepClick(3)}
                className={`text-[10px] sm:text-xs md:text-sm font-semibold pb-1 flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink-0 touch-manipulation active:opacity-70 transition-opacity px-1 sm:px-0 ${
                  currentStep === 3
                    ? 'step-active text-blue-600 dark:text-blue-400'
                    : 'step-inactive text-slate-500 dark:text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0 ${
                    currentStep === 3
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  3
                </span>
                <span className="hidden sm:inline whitespace-nowrap">Preview</span>
                <span className="sm:hidden text-[10px] whitespace-nowrap">Preview</span>
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 text-right block">
                <div className="font-bold text-slate-900 dark:text-white">{totalPrice}</div>
                <div>{deckStats}</div>
              </div>
              <button 
                onClick={() => {
                  const disclaimerCallback = (window as any).openDisclaimerModal || 
                    (() => {
                      const checkoutCallback = (window as any).openCheckoutModal
                      if (checkoutCallback) checkoutCallback()
                    })
                  if (typeof disclaimerCallback === 'function') {
                    disclaimerCallback()
                  }
                }}
                className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-md font-bold text-[10px] sm:text-xs md:text-sm shadow-sm flex items-center gap-1 sm:gap-2 touch-manipulation min-h-[36px] sm:min-h-[40px]"
              >
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" /> 
                <span className="hidden xs:inline">Add to Cart</span>
                <span className="xs:hidden">Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-grow h-full overflow-hidden">
        {currentStep !== 3 && <Sidebar />}
        {currentStep === 3 ? <PreviewGrid /> : <EditorView />}
      </div>
    </div>
  )
}

