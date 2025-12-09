'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

export interface Card {
  id: string
  originalFront: string | null
  front: string | null
  back: string | null
  originalBack: string | null
  trimMm: number
  bleedMm: number
  hasBleed: boolean
  finish: string
  quantity: number
  printsUri?: string
  silverMask?: string | null
  maskingColors?: string[]
  maskingTolerance?: number
}

export interface GlobalBack {
  original: string | null
  processed: string | null
  trimMm: number
  bleedMm: number
  hasBleed: boolean
}

interface AppContextType {
  deck: Card[]
  setDeck: React.Dispatch<React.SetStateAction<Card[]>>
  globalBack: GlobalBack
  setGlobalBack: React.Dispatch<React.SetStateAction<GlobalBack>>
  currentCardIndex: number
  setCurrentCardIndex: React.Dispatch<React.SetStateAction<number>>
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  inspectorIndex: number
  setInspectorIndex: React.Dispatch<React.SetStateAction<number>>
  activeVersionIndex: number
  setActiveVersionIndex: React.Dispatch<React.SetStateAction<number>>
  maskingColors: string[]
  setMaskingColors: React.Dispatch<React.SetStateAction<string[]>>
  maskingTolerance: number
  setMaskingTolerance: React.Dispatch<React.SetStateAction<number>>
  currentZoomLevel: number
  setCurrentZoomLevel: React.Dispatch<React.SetStateAction<number>>
  isDarkMode: boolean
  toggleTheme: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [deck, setDeck] = useState<Card[]>([])
  const [globalBack, setGlobalBack] = useState<GlobalBack>({
    original: null,
    processed: null,
    trimMm: 2.5,
    bleedMm: 1.75,
    hasBleed: false,
  })
  const [currentCardIndex, setCurrentCardIndex] = useState(-1)
  const [currentStep, setCurrentStep] = useState(1)
  const [inspectorIndex, setInspectorIndex] = useState(-1)
  const [activeVersionIndex, setActiveVersionIndex] = useState(-1)
  const [maskingColors, setMaskingColors] = useState<string[]>([])
  const [maskingTolerance, setMaskingTolerance] = useState(15)
  const [currentZoomLevel, setCurrentZoomLevel] = useState(1)
  const [isDarkMode, setIsDarkMode] = useState(true)

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev
      if (typeof document !== 'undefined') {
        const html = document.documentElement
        if (newValue) {
          html.classList.add('dark')
          html.classList.remove('light')
        } else {
          html.classList.remove('dark')
          html.classList.add('light')
        }
      }
      return newValue
    })
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement
      if (isDarkMode) {
        html.classList.add('dark')
        html.classList.remove('light')
      } else {
        html.classList.remove('dark')
        html.classList.add('light')
      }
    }
  }, [isDarkMode])

  return (
    <AppContext.Provider
      value={{
        deck,
        setDeck,
        globalBack,
        setGlobalBack,
        currentCardIndex,
        setCurrentCardIndex,
        currentStep,
        setCurrentStep,
        inspectorIndex,
        setInspectorIndex,
        activeVersionIndex,
        setActiveVersionIndex,
        maskingColors,
        setMaskingColors,
        maskingTolerance,
        setMaskingTolerance,
        currentZoomLevel,
        setCurrentZoomLevel,
        isDarkMode,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

