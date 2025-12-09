'use client'

import { Check, Truck, Globe, ArrowRight } from 'lucide-react'

interface PricingViewProps {
  onStartDesign: () => void
}

export default function PricingView({ onStartDesign }: PricingViewProps) {
  return (
    <div id="pricing-view" className="bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4">
            Simple, Volume-Based Pricing
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-2">
            Premium S33 cardstock. No hidden fees. Automatic discounts as your deck size grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md active:shadow-lg transition-shadow relative overflow-hidden group touch-manipulation">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors"></div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">Starter Deck</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">Perfect for Commander decks or small prototypes.</p>
            <div className="flex items-baseline mb-4 sm:mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">$0.35</span>
              <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 ml-2">/ card</span>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 dark:text-green-400" /> 1 – 144 cards
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 dark:text-green-400" /> S33 Premium Stock
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 dark:text-green-400" /> Full Color Print
              </li>
            </ul>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-slate-300 dark:bg-slate-600 h-full w-1/3"></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-blue-600 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden transform md:-translate-y-4 touch-manipulation">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-bl-lg">BEST VALUE</div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">Playtest Set</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">Ideal for cubes, battle boxes, or multiple decks.</p>
            <div className="flex items-baseline mb-4 sm:mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">$0.30</span>
              <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 ml-2">/ card</span>
            </div>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 sm:mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-500 dark:text-blue-400" /> 145 – 500 cards
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-500 dark:text-blue-400" /> S33 Premium Stock
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-500 dark:text-blue-400" /> Fast Production
              </li>
            </ul>
            <div className="w-full bg-blue-100 dark:bg-blue-900/30 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-2/3"></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md active:shadow-lg transition-shadow relative overflow-hidden group touch-manipulation">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 group-hover:bg-green-500 transition-colors"></div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">Bulk Order</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">For designers, clubs, and large collections.</p>
            <div className="flex items-baseline mb-4 sm:mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">$0.26</span>
              <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 ml-2">/ card</span>
            </div>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 sm:mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 dark:text-green-400" /> 500+ cards
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 dark:text-green-400" /> Lowest Price Rate
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 dark:text-green-400" /> Priority Support
              </li>
            </ul>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full w-full"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 rounded-xl flex items-start gap-3 sm:gap-4 border border-slate-100 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-full shadow-sm text-blue-600 dark:text-blue-400 shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Domestic Shipping (USA)</h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2">Flat rate for all deck sizes.</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">$6.95</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 rounded-xl flex items-start gap-3 sm:gap-4 border border-slate-100 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-full shadow-sm text-blue-600 dark:text-blue-400 shrink-0">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">International Shipping</h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2">Flat rate worldwide.</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">$24.95</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <button
            onClick={onStartDesign}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg shadow-lg active:shadow-md transition-all inline-flex items-center gap-2 touch-manipulation min-h-[48px] sm:min-h-[56px]"
          >
            Start Your Design <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

