'use client'

import { useState, useRef, useEffect } from 'react'
import { ImagePlus, List, FileCode, Crop, Copy, ArrowRight } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { processImage } from '@/utils/imageProcessing'
import { handleFiles as processFiles } from '@/utils/fileHandling'
import { handleXMLFile } from '@/utils/xmlHandling'
import { openImportModal } from '@/utils/modalHelpers'

export default function Sidebar() {
  const { currentStep, setCurrentStep, globalBack, setGlobalBack, deck, setDeck, currentCardIndex, setCurrentCardIndex } = useApp()
  const [processing, setProcessing] = useState(false)
  const [processingPercent, setProcessingPercent] = useState(0)
  const [processingText, setProcessingText] = useState('Processing...')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const xmlInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (currentStep === 2) {
      const file = files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        const original = (e.target?.result as string) || ''
        const newBack = { ...globalBack, original, trimMm: 2.5, bleedMm: 1.75, hasBleed: false }
        setGlobalBack(newBack)
        
        processImage(original, 2.5, 1.75, false, (processed) => {
          setGlobalBack({ ...newBack, processed })
        })
      }
      reader.readAsDataURL(file)
    } else {
      await processFiles(files, deck, setDeck, setCurrentCardIndex, currentCardIndex, setProcessing, setProcessingPercent, setProcessingText)
    }
  }

  return (
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
  )
}

function PrintPrepPanel() {
  const { currentStep, deck, currentCardIndex, setDeck, globalBack, setGlobalBack } = useApp()
  const [trimMm, setTrimMm] = useState(2.5)
  const [bleedMm, setBleedMm] = useState(1.75)
  const [hasBleed, setHasBleed] = useState(false)

  const target = currentStep === 2 ? globalBack : deck[currentCardIndex]

  useEffect(() => {
    if (target) {
      setTrimMm(target.trimMm || 2.5)
      setBleedMm(target.bleedMm !== undefined ? target.bleedMm : 1.75)
      setHasBleed(target.hasBleed || false)
    }
  }, [target, currentStep, currentCardIndex])

  const updatePrepSettings = () => {
    // Implementation will be added
  }

  return (
    <div id="print-prep-panel" className="p-6 border-t border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-850">
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
            onChange={(e) => setTrimMm(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Adjusts bleed start point (removes white corners)</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Bleed Adjustment</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.05"
                value={bleedMm}
                onChange={(e) => setBleedMm(parseFloat(e.target.value))}
                className="w-16 text-right text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
              />
              <span className="text-[10px] text-slate-400 font-mono">mm</span>
            </div>
          </div>
          <input
            type="range"
            min="-4"
            max="4"
            step="0.25"
            value={bleedMm}
            onChange={(e) => setBleedMm(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-medium px-1 mt-1">
            <span>Trim (-4mm)</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Target (+1.75mm)</span>
            <span>Extend (+4mm)</span>
          </div>
        </div>

        <button
          onClick={() => setHasBleed(!hasBleed)}
          className={`w-full border py-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
            hasBleed
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
              <strong className="text-slate-800 dark:text-slate-200">Standard (+1.75mm):</strong> We need a{' '}
              <strong>1.75mm bleed</strong> extension past the cut line for reliable borderless printing.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
          <button className="w-full bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 py-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm">
            <Copy className="w-3 h-3" /> Apply to All Cards
          </button>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-1">
            Copies current trim/bleed settings to entire deck
          </p>
        </div>
      </div>
    </div>
  )
}

