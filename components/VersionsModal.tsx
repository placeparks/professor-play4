'use client'

import { useState } from 'react'
import { X, Image } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

export default function VersionsModal() {
  const { activeVersionIndex, setActiveVersionIndex } = useApp()
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen || activeVersionIndex < 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[80] flex items-center justify-center backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-850 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] sm:h-[80vh] flex flex-col">
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white flex items-center gap-2">
            <Image className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" /> Select Art Version
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-red-500 active:text-red-600 transition-colors p-1 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <div className="col-span-full text-center py-12 text-slate-400">No versions available</div>
        </div>
      </div>
    </div>
  )
}

