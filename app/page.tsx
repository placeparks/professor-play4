'use client'

import { useState, useEffect } from 'react'
import { AppProvider } from '@/contexts/AppContext'
import Navigation from '@/components/Navigation'
import LandingView from '@/components/LandingView'
import HowItWorksView from '@/components/HowItWorksView'
import PricingView from '@/components/PricingView'
import WhyUsView from '@/components/WhyUsView'
import DesignStepper from '@/components/DesignStepper'
import InspectorModal from '@/components/InspectorModal'
import VersionsModal from '@/components/VersionsModal'
import DisclaimerModal from '@/components/DisclaimerModal'
import CheckoutModal from '@/components/CheckoutModal'
import ImportModal from '@/components/ImportModal'

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'how-it-works' | 'pricing' | 'why-us' | 'design'>('landing')
  const [showDesignStepper, setShowDesignStepper] = useState(false)

  const startDesign = () => {
    setCurrentView('design')
    setShowDesignStepper(true)
  }

  const showLanding = () => {
    setCurrentView('landing')
    setShowDesignStepper(false)
  }

  const showHowItWorks = () => {
    setCurrentView('how-it-works')
    setShowDesignStepper(false)
  }

  const showPricing = () => {
    setCurrentView('pricing')
    setShowDesignStepper(false)
  }

  const showWhyUs = () => {
    setCurrentView('why-us')
    setShowDesignStepper(false)
  }

  return (
    <AppProvider>
      <main className="flex-grow relative">
        <Navigation 
          currentView={currentView}
          showDesignStepper={showDesignStepper}
          onStartDesign={startDesign}
          onShowLanding={showLanding}
          onShowHowItWorks={showHowItWorks}
          onShowPricing={showPricing}
          onShowWhyUs={showWhyUs}
        />

        {currentView === 'landing' && !showDesignStepper && (
          <LandingView onStartDesign={startDesign} />
        )}

        {currentView === 'how-it-works' && !showDesignStepper && (
          <HowItWorksView onStartDesign={startDesign} />
        )}

        {currentView === 'pricing' && !showDesignStepper && (
          <PricingView onStartDesign={startDesign} />
        )}

        {currentView === 'why-us' && !showDesignStepper && (
          <WhyUsView onStartDesign={startDesign} />
        )}

        {showDesignStepper && (
          <DesignStepper onExit={showLanding} />
        )}

        <InspectorModal />
        <VersionsModal />
        <ImportModal />
        <DisclaimerModal />
        <CheckoutModal />
      </main>
    </AppProvider>
  )
}

