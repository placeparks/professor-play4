'use client'

import { useState, useEffect, useRef } from 'react'
import { X, List, DownloadCloud, AlertTriangle, XCircle, Wrench } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { setImportModalCallback } from '@/utils/modalHelpers'
import { processCardList, CardRequest } from '@/utils/scryfallImport'
import { fetchFlavorNameMap } from '@/utils/flavorUtils'

export default function ImportModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [processingPercent, setProcessingPercent] = useState(0)
  const [processingText, setProcessingText] = useState('Processing...')
  const [fixing, setFixing] = useState(false)
  const lastFailedRequests = useRef<CardRequest[]>([])

  const {
    currentStep,
    deck,
    setDeck,
    currentCardIndex,
    setCurrentCardIndex,
  } = useApp()

  useEffect(() => {
    setImportModalCallback(() => setIsOpen(true))
  }, [])

  const handleImport = async (textOverride?: string) => {
    const textToProcess = textOverride ?? importText
    if (!textToProcess.trim()) return

    setStatus('Parsing list...')
    setErrors([])
    setProcessing(true)
    lastFailedRequests.current = [] // Reset failed requests

    const result = await processCardList(
      textToProcess,
      deck,
      setDeck,
      currentStep,
      setCurrentCardIndex,
      currentCardIndex,
      setProcessing,
      setProcessingPercent,
      setProcessingText,
      setErrors
    )

    if (result.success) {
      setStatus('Import Complete!')
      lastFailedRequests.current = []
      setTimeout(() => {
        setIsOpen(false)
        setImportText('')
        setStatus('')
        setErrors([])
      }, 1000)
    } else {
      setStatus(`Finished with ${result.errors.length} errors.`)
      setErrors(result.errors)
      lastFailedRequests.current = result.failedRequests // Store failed requests for retry
    }
  }

  const fixAndRetry = async () => {
    setFixing(true)
    setStatus('Fetching flavor name database...')
    setProcessing(true)

    // Fetch flavor map only when needed to save bandwidth on initial load
    const flavorMap = await fetchFlavorNameMap()

    setStatus('Fixing list...')

    // Build fixed lines from the stored failed requests (not from error display strings)
    const fixedLines = lastFailedRequests.current.map(req => {
      // Strip set codes and collector numbers from the name, keep just card name + qty
      let cleanName = req.identifier.name || req.originalLine

      // 0. Remove *F* markers (common in some export formats for Foil) - FIRST
      cleanName = cleanName.replace(/\*F\*/gi, '')

      // 1. Remove (Set) Number or [Set] Number patterns
      cleanName = cleanName.replace(/\s+[\(\[].*?[\)\]]\s+\S+$/, '')
      cleanName = cleanName.replace(/\s+[\(\[].*?[\)\]]$/, '')
      cleanName = cleanName.replace(/\s+\d{3,}$/, '')

      // 2. Remove trailing 'F' (and surrounding whitespace) - Fix for user issue
      // Matches "Name F" or "NameF" at the end of the string
      cleanName = cleanName.replace(/\s*F$/, '')

      cleanName = cleanName.trim()

      // 3. Check for Flavor Name match
      const lowerName = cleanName.toLowerCase()
      if (flavorMap[lowerName]) {
        cleanName = flavorMap[lowerName]
      }

      return `${req.qty} ${cleanName}`
    })

    const fixedText = fixedLines.join('\n')
    setImportText(fixedText)
    setErrors([])
    setStatus('')
    setFixing(false)
    // setProcessing(false) // handleImport sets this to true, but we are about to call it.

    // Call handleImport with the fixed text directly to avoid async state issue
    handleImport(fixedText)
  }

  const closeModal = () => {
    setIsOpen(false)
    setImportText('')
    setStatus('')
    setErrors([])
    setProcessing(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[70] flex items-center justify-center backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-850 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white flex items-center gap-2">
            <List className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" /> Import Card List
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-red-500 active:text-red-600 transition-colors p-1 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 bg-white dark:bg-slate-850 overflow-y-auto flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Paste your card names below (one per line). Examples:
          </p>
          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 font-mono mb-3">
            4 Lightning Bolt<br />
            1 Satyr Wayfinder (M3C) 244<br />
            1 Sol Ring (MPS) 24
          </div>

          <div className="mb-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-800/50 flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Import Note:</p>
              <p>
                Cards from <strong>"The List" (PLST)</strong> often fail to load. If you experience errors, try
                removing the (PLST) code or use the "Fix & Retry" button that appears after an error.
              </p>
            </div>
          </div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full h-40 sm:h-48 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-md p-3 text-sm sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none touch-manipulation"
            placeholder="Enter cards here..."
            disabled={processing}
          />

          {processing && (
            <div className="mt-4">
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

          {status && (
            <div className={`mt-2 text-xs ${errors.length > 0 ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
              {status}
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <h4 className="text-xs font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Failed to Import
              </h4>
              <ul className="text-xs text-red-600 dark:text-red-300 font-mono list-disc list-inside space-y-1 max-h-32 overflow-y-auto mb-3">
                {errors.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
              <button
                onClick={fixAndRetry}
                disabled={fixing}
                className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fixing ? (
                  <>
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wrench className="w-3 h-3" /> Fix & Retry (Remove Set/Number)
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={closeModal}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:text-slate-900 dark:active:text-slate-100 px-4 py-2.5 sm:py-2 text-sm font-medium touch-manipulation min-h-[44px] order-2 sm:order-1"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={() => handleImport()}
            disabled={processing || !importText.trim()}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 sm:px-5 py-2.5 sm:py-2 rounded-lg font-medium text-sm transition-colors shadow flex items-center justify-center gap-2 touch-manipulation min-h-[44px] order-1 sm:order-2"
          >
            <DownloadCloud className="w-4 h-4" /> Import Cards
          </button>
        </div>
      </div>
    </div>
  )
}

