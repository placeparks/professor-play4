'use client'

import { Aperture, Layers, Wallet, CheckCircle2, ArrowRight } from 'lucide-react'

interface WhyUsViewProps {
  onStartDesign: () => void
}

export default function WhyUsView({ onStartDesign }: WhyUsViewProps) {
  return (
    <div id="why-us-view" className="bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 py-12 sm:py-16 max-w-5xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4">
            Built for the Discerning Player
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-2">
            We combine industrial-grade technology with TCG-specific materials to create prototypes that look and feel real.
          </p>
        </div>

        <div className="space-y-12 sm:space-y-16">
          {/* Feature 1: Color Accuracy */}
          <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-12">
            <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-900 rounded-2xl p-6 sm:p-8 min-h-[250px] sm:min-h-[300px] flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10"></div>
              <div className="relative z-10 flex gap-3 sm:gap-4">
                <div className="w-12 h-24 sm:w-16 sm:h-32 bg-cyan-500 rounded-lg shadow-xl transform translate-y-4 opacity-90"></div>
                <div className="w-12 h-24 sm:w-16 sm:h-32 bg-[#ec4899] rounded-lg shadow-xl transform -translate-y-4 opacity-90"></div>
                <div className="w-12 h-24 sm:w-16 sm:h-32 bg-yellow-400 rounded-lg shadow-xl transform translate-y-2 opacity-90"></div>
                <div className="w-12 h-24 sm:w-16 sm:h-32 bg-slate-900 dark:bg-slate-700 rounded-lg shadow-xl transform -translate-y-2 opacity-90"></div>
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold uppercase tracking-wide">
                <Aperture className="w-3 h-3" /> Print Technology
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">100% Perfect Color Accuracy</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                We utilize a state-of-the-art, 6-color print engine designed for the highest end of digital production.
              </p>
              <ul className="space-y-2 sm:space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Ultra HD Resolution:</strong> Rendering at 1200 x 1200 x 10-bit depth for butter-smooth gradients and sharp text.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Automated Color Quality:</strong> Inline spectrophotometers constantly monitor color consistency, ensuring your 100th card looks exactly like your first.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Wide Gamut:</strong> Capable of hitting vibrant hues that standard CMYK office printers simply can't reach.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2: Material */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 sm:gap-12">
            <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-900 rounded-2xl p-6 sm:p-8 min-h-[250px] sm:min-h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="w-40 h-56 sm:w-48 sm:h-64 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl flex flex-col items-center justify-center transform rotate-3 transition-transform hover:rotate-0">
                <div className="text-center space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase">Cross Section</div>
                  <div className="h-24 sm:h-32 w-2 bg-slate-800 mx-auto rounded-full"></div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-300">Black Core</div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wide">
                <Layers className="w-3 h-3" /> Material Science
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">S33 Black Core Cardstock</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Flimsy paper prototypes break immersion. Our cards are built on premium 330 GSM stock with a dedicated light-blocking black core layer.
              </p>
              <ul className="space-y-2 sm:space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>The "Snap" Test:</strong> Offers the authentic tactile resilience and auditory "snap" of a standard trading card.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Proper Thickness:</strong> Sized to fit perfectly into standard sleeves without feeling too loose or too bulky.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Opaque:</strong> The black core prevents see-through, essential for double-sided play.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Flexibility */}
          <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-12">
            <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-900 rounded-2xl p-6 sm:p-8 min-h-[250px] sm:min-h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="w-12 h-20 sm:w-16 sm:h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm"></div>
                <div className="w-12 h-20 sm:w-16 sm:h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded flex items-center justify-center text-slate-400 text-[10px] sm:text-xs">Empty</div>
                <div className="w-12 h-20 sm:w-16 sm:h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded flex items-center justify-center text-slate-400 text-[10px] sm:text-xs">Empty</div>
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wide">
                <Wallet className="w-3 h-3" /> Cost Effective
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Zero Minimums</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Most print shops force you to buy in batches of 18 or 54. We don't.
              </p>
              <ul className="space-y-2 sm:space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <span><strong>Print Exactly What You Need:</strong> Need 1 commander replacement? 4 cards for a playset? 63 for a deck? You pay for exactly that count.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <span><strong>No Wasted Money:</strong> Stop paying for blank filler cards just to meet a sheet quota.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-16 sm:mt-20">
          <button
            onClick={onStartDesign}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-lg font-bold text-lg sm:text-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 inline-flex items-center gap-2 touch-manipulation min-h-[48px]"
          >
            Experience the Quality <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

