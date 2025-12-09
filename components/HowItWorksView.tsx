'use client'

import { UploadCloud, Edit3, PackageCheck, Zap, ArrowRight } from 'lucide-react'

interface HowItWorksViewProps {
  onStartDesign: () => void
}

export default function HowItWorksView({ onStartDesign }: HowItWorksViewProps) {
  return (
    <div id="how-it-works-view" className="bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4">
            From Digital to Tabletop in Days
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-2">
            Create professional quality trading card prototypes without the hassle. Here is how our simple process works.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 mb-12 sm:mb-16">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">1. Upload Your Art</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Drag and drop your card images or import a deck list directly. Our tool automatically handles basic formatting.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-2 hover:-rotate-6 transition-transform">
              <Edit3 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">2. Customize & Prep</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Set card backs, adjust bleed/trim settings, and use our built-in editor for last-minute tweaks.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-1 hover:rotate-3 transition-transform">
              <PackageCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">3. Order & Ship</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Review your digital proof grid. Once approved, we print on premium S33 cardstock.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-24 sm:p-32 bg-blue-100 dark:bg-blue-900/20 rounded-full filter blur-3xl opacity-20 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide mb-4 sm:mb-6">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" /> Lightning Fast Fulfillment
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 px-2">
              Don't wait weeks for your prototype.
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
              We know you need to playtest <em>now</em>. That's why we ship all orders{' '}
              <strong>within 1 business day</strong> of receiving payment. Expect your cards at your door within{' '}
              <strong>3-5 business days</strong>.
            </p>
            <button
              onClick={onStartDesign}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base shadow-lg active:shadow-md transition-all active:scale-95 inline-flex items-center gap-2 touch-manipulation min-h-[44px] sm:min-h-[48px]"
            >
              Start Your Design Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

