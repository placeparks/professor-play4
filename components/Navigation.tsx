'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Moon, Sun, X, Menu } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

interface NavigationProps {
  currentView: string
  showDesignStepper: boolean
  onStartDesign: () => void
  onShowLanding: () => void
  onShowHowItWorks: () => void
  onShowPricing: () => void
  onShowWhyUs: () => void
}

export default function Navigation({
  currentView,
  showDesignStepper,
  onStartDesign,
  onShowLanding,
  onShowHowItWorks,
  onShowPricing,
  onShowWhyUs,
}: NavigationProps) {
  const { isDarkMode, toggleTheme } = useApp()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleMobileNavClick = (action: () => void) => {
    action()
    closeMobileMenu()
  }

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-40 transition-colors duration-300">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation min-w-0" 
          onClick={onShowLanding}
          aria-label="Go to homepage"
        >
          {/* Icon mark */}
          <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <Image
              src="/card1.jpg"
              alt="TCGPlaytest logo"
              fill
              sizes="40px"
              className="object-cover"
              priority
            />
          </div>

          {/* Wordmark (kept compact for mobile) */}
          <div className="relative h-6 sm:h-7 w-[130px] sm:w-[170px] max-w-[55vw]">
            <Image
              src="/card-logo.jpg"
              alt="TCGPlaytest"
              fill
              sizes="(max-width: 640px) 130px, 170px"
              className="object-contain object-left"
              priority
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className={`hidden md:flex items-center space-x-8 font-medium text-sm text-slate-600 dark:text-slate-300 ${showDesignStepper ? 'hidden' : ''}`}>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onShowHowItWorks(); }} 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation"
          >
            How it Works
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onShowPricing(); }} 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation"
          >
            Pricing
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onShowWhyUs(); }} 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation"
          >
            Why Us
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Toggle Dark Mode"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {showDesignStepper && (
            <button
              onClick={onShowLanding}
              className="flex text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 active:text-red-700 dark:active:text-red-500 text-xs sm:text-sm font-medium items-center gap-1 px-2 py-1.5 rounded touch-manipulation min-h-[44px]"
            >
              <X className="w-4 h-4" /> <span className="hidden xs:inline">Exit</span>
            </button>
          )}

          {!showDesignStepper && (
            <>
              {/* Desktop Start Button */}
              <button
                onClick={onStartDesign}
                className="hidden md:block bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-colors shadow-sm touch-manipulation min-h-[44px] whitespace-nowrap"
              >
                Start Your Design
              </button>

              {/* Mobile Hamburger Menu */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && !showDesignStepper && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4 py-3 space-y-2">
            <button
              onClick={() => handleMobileNavClick(onShowHowItWorks)}
              className="w-full text-left px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation font-medium"
            >
              How it Works
            </button>
            <button
              onClick={() => handleMobileNavClick(onShowPricing)}
              className="w-full text-left px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation font-medium"
            >
              Pricing
            </button>
            <button
              onClick={() => handleMobileNavClick(onShowWhyUs)}
              className="w-full text-left px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation font-medium"
            >
              Why Us
            </button>
            <button
              onClick={() => handleMobileNavClick(onStartDesign)}
              className="w-full text-left px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors touch-manipulation font-semibold"
            >
              Start Your Design
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

