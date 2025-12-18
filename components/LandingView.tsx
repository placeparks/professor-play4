'use client'

import { useEffect, useRef } from 'react'
import { ArrowRight, Truck, ShieldCheck, Layers } from 'lucide-react'

interface LandingViewProps {
  onStartDesign: () => void
}

export default function LandingView({ onStartDesign }: LandingViewProps) {
  const heroBgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = heroBgRef.current
    if (!container) return

    const cardsConfig = [
      { speed: 0.03, rot: -15, top: '10%', left: '5%', delay: '0s' },
      { speed: 0.05, rot: 10, top: '15%', right: '10%', delay: '1s' },
      { speed: 0.02, rot: -5, bottom: '20%', left: '15%', delay: '2s' },
      { speed: 0.04, rot: 20, bottom: '10%', right: '5%', delay: '0.5s' },
      { speed: 0.06, rot: 5, top: '40%', left: '45%', delay: '1.5s', opacity: 0.3 }
    ]

    container.innerHTML = ''

    cardsConfig.forEach(conf => {
      const el = document.createElement('div')
      el.classList.add('bg-card-floater')

      if (conf.top) el.style.top = conf.top
      if (conf.bottom) el.style.bottom = conf.bottom
      if (conf.left) el.style.left = conf.left
      if (conf.right) el.style.right = conf.right

      el.style.animationDelay = conf.delay
      if (conf.opacity) el.style.opacity = String(conf.opacity)

      el.dataset.speed = String(conf.speed)
      el.dataset.rot = String(conf.rot)
      el.style.transform = `rotate(${conf.rot}deg)`

      container.appendChild(el)
    })

    const updateParallax = (e: MouseEvent) => {
      const w = window.innerWidth
      const h = window.innerHeight
      const mouseX = (e.clientX - (w / 2)) / w
      const mouseY = (e.clientY - (h / 2)) / h

      const cards = container.querySelectorAll('.bg-card-floater')
      cards.forEach(card => {
        const speed = parseFloat(card.getAttribute('data-speed') || '0')
        const rot = parseFloat(card.getAttribute('data-rot') || '0')
        const x = mouseX * speed * -1500
        const y = mouseY * speed * -1500
        const htmlCard = card as HTMLElement
        const existingStyle = htmlCard.style.cssText || ''
        htmlCard.setAttribute('style', `transform: translate(${x}px, ${y}px) rotate(${rot}deg); ${existingStyle}`)
      })
    }

    container.parentElement?.addEventListener('mousemove', updateParallax)

    return () => {
      container.parentElement?.removeEventListener('mousemove', updateParallax)
    }
  }, [])

  return (
    <div id="landing-view">
      <header className="hero-bg py-12 sm:py-16 md:py-24 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative overflow-hidden">
        <div
          id="hero-bg-anim"
          ref={heroBgRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
        />

        <div className="container mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-8 sm:gap-12 items-center relative z-10">
          <div className="space-y-4 sm:space-y-6 order-2 md:order-1">
            <div className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] sm:text-xs font-bold uppercase tracking-wide">
              No Minimum Order
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Professional Custom Cards. <br />
              <span className="text-blue-600 dark:text-blue-400">Made in the USA.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-lg">
              Design and print your custom card games and TCG prototypes with TCGPlaytest.
              Fast shipping, no tariffs, and premium quality S33 cardstock.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
              <button
                onClick={onStartDesign}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg shadow-lg hover:shadow-xl active:shadow-lg transition-all flex items-center justify-center gap-2 touch-manipulation min-h-[48px] sm:min-h-[56px]"
              >
                Start Design <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-2 sm:pt-4">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                <span>3-5 Day US Shipping</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                <span>Tariff Free</span>
              </div>
            </div>
          </div>
          {/* Card Visual - Desktop design, visible on all screens */}
          <div className="relative order-1 md:order-2">
            <div className="relative w-full max-w-md mx-auto aspect-[4/3]">
              {/* Background card outline */}
              <div className="absolute top-0 right-0 w-48 h-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 transform rotate-6 z-10 flex flex-col items-center justify-center p-4 transition-colors opacity-30">
                <div className="w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                  <span className="text-slate-400 dark:text-slate-500 font-semibold text-sm">Card Back</span>
                </div>
              </div>

              {/* Main blue card */}
              <div className="absolute top-8 right-12 w-48 h-64 bg-blue-600 rounded-xl shadow-xl transform -rotate-3 z-20 flex flex-col items-center justify-center p-1 text-white">
                <div className="w-full h-full border border-white/20 rounded-lg relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 p-4 flex flex-col items-center text-center">
                  {/* Logo */}
                  <img src="/card1.jpg" alt="Sample Card" className="w-20 h-20 object-cover" />

                  {/* Card Image */}
                  <div className="w-full h-24 rounded-full mb-4 flex items-center justify-center overflow-hidden">
                  <img src="/card-logo.jpg" alt="TCGPlaytest Logo" className="h-full mb-4 opacity-80 object-contain" />
                  </div>
                  <div className="h-2 bg-white/20 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-2 bg-white/20 rounded w-1/2 mx-auto"></div>
                </div>
              </div>

              {/* Additional card outline in bottom-right */}
              <div className="absolute bottom-0 right-0 w-40 h-56 bg-white/20 dark:bg-slate-800/20 rounded-xl border-2 border-dashed border-slate-300/30 dark:border-slate-600/30 transform rotate-12 z-0 opacity-20"></div>

              {/* Ambient glow */}
              <div className="absolute -bottom-4 -left-4 w-full h-full bg-blue-100 dark:bg-blue-900/20 rounded-full filter blur-3xl opacity-30 -z-10"></div>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}

