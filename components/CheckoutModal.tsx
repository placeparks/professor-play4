'use client'

import { useState, useEffect } from 'react'
import { X, ShoppingCart, Lock } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { updateDeckStats } from '@/utils/deckStats'
import { compressImage } from '@/utils/imageCompression'

export default function CheckoutModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { deck, globalBack } = useApp()

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US'
  })

  useEffect(() => {
    // Expose function to open modal globally
    ;(window as any).openCheckoutModal = () => setIsOpen(true)
  }, [])

  const closeModal = () => {
    setIsOpen(false)
    setIsSubmitting(false)
  }

  const getShippingCost = (country: string): number => {
    return country === 'US' ? 6.95 : 24.95
  }

  // Calculate prices using the same logic as updateDeckStats
  const quantity = deck.reduce((acc, card) => acc + (card.quantity || 1), 0)
  
  let pricePerCard = 0.35
  if (quantity >= 500) {
    pricePerCard = 0.26
  } else if (quantity >= 145) {
    pricePerCard = 0.30
  }

  // Calculate finish surcharges (same logic as updateDeckStats)
  let finishSurcharge = 0
  deck.forEach(card => {
    const qty = card.quantity || 1
    if (card.finish && card.finish !== 'standard') {
      if (card.finish.includes('silver')) {
        let cardCost = 3.50
        if (card.finish.includes('rainbow') || card.finish.includes('gloss')) {
          cardCost += 2.50 // Total 6.00 for silver + rainbow/gloss
        }
        finishSurcharge += (cardCost * qty)
      } else {
        // Just Rainbow or Gloss
        finishSurcharge += (2.50 * qty)
      }
    }
  })

  const cardsTotal = quantity * pricePerCard
  const shippingCost = getShippingCost(formData.country)
  const total = cardsTotal + finishSurcharge + shippingCost

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare card images organized properly (front/back/mask triplets)
      const frontImages = deck.map(card => card.front || card.originalFront).filter(Boolean) as string[]
      
      // Collect back images - use card-specific back, or global back, or null
      const backImages: string[] = []
      deck.forEach((card) => {
        const backImg = card.back || card.originalBack || globalBack.processed || globalBack.original
        if (backImg) backImages.push(backImg)
      })

      // Collect mask images - masks are saved as separate image files
      const maskImages: string[] = []
      deck.forEach((card) => {
        const maskImg = card.silverMask || null
        if (maskImg) maskImages.push(maskImg)
      })

      // Prepare card data WITHOUT base64 images (we'll upload separately and use URLs)
      // Base64 images are included separately in allImages array
      const cardData = deck.map((card) => ({
        id: card.id, // Include card ID
        quantity: card.quantity || 1,
        trimMm: card.trimMm || 0,
        bleedMm: card.bleedMm || 2,
        hasBleed: card.hasBleed || false,
        finish: card.finish || 'standard', // Include finish/effects (standard, rainbow, gloss, silver, etc.)
        silverMask: card.silverMask || null, // Include silver mask if available (will be replaced with URL after upload)
        maskingColors: card.maskingColors || [], // Include masking colors if available
        maskingTolerance: card.maskingTolerance || null, // Include masking tolerance if available
        printsUri: card.printsUri || null, // Include Scryfall prints URI if available
        originalFront: null, // Don't save original base64 (too large)
        originalBack: null, // Don't save original base64 (too large)
        // Don't include base64 images here - they're in allImages array
        // After upload, URLs will be added to cardData
        front: null,
        back: null
      }))

      // Combine all images in order: [front1, back1, mask1, front2, back2, mask2, ...]
      // Masks are included as separate images alongside fronts and backs
      const allImages: string[] = []
      for (let i = 0; i < frontImages.length; i++) {
        if (frontImages[i]) allImages.push(frontImages[i])
        if (backImages[i]) allImages.push(backImages[i])
        if (maskImages[i]) allImages.push(maskImages[i])
      }

      // Check total payload size with base64
      const testPayload = {
        quantity,
        shippingAddress: formData,
        cardImages: allImages,
        cardData
      }
      const payloadSizeMB = (new Blob([JSON.stringify(testPayload)]).size / (1024 * 1024)).toFixed(2)
      console.log(`📊 Estimated payload size: ${payloadSizeMB} MB`)

      let uploadedImageUrls: string[] = []

      // Always upload images first if we have any images (safer for Vercel's 4.5MB limit)
      // This prevents 413 errors and ensures reliable checkout
      const shouldUploadImagesFirst = allImages.length > 0
      
      if (shouldUploadImagesFirst) {
        console.log(`📤 Payload too large (${payloadSizeMB} MB), uploading images via backend first...`)

        // Generate temp order ID
        const tempOrderId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        console.log(`📦 Total images to upload: ${allImages.length} (${frontImages.length} fronts, ${backImages.length} backs)`)

        // Compress images before upload to reduce payload size
        console.log('🗜️ Compressing images to reduce payload size...')
        const compressedImages: string[] = []
        for (let i = 0; i < allImages.length; i++) {
          console.log(`🗜️ Compressing image ${i + 1}/${allImages.length}...`)
          const compressed = await compressImage(allImages[i], 0.8) // Max 0.8MB per image
          compressedImages.push(compressed)
        }
        console.log(`✅ Compressed ${compressedImages.length} images`)

        // Upload in chunks of 2 images to stay under 4.5MB limit per request
        const CHUNK_SIZE = 2 // 1 card per chunk (2 images = 1 front + 1 back pair)
        const totalChunks = Math.ceil(compressedImages.length / CHUNK_SIZE)

        for (let i = 0; i < compressedImages.length; i += CHUNK_SIZE) {
          const chunk = compressedImages.slice(i, i + CHUNK_SIZE)
          const chunkNum = Math.floor(i / CHUNK_SIZE) + 1

          console.log(`📤 Uploading chunk ${chunkNum}/${totalChunks}: ${chunk.length} images`)

          try {
            const uploadResponse = await fetch('/api/upload-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                images: chunk,
                orderId: tempOrderId,
                shippingAddress: formData
              })
            })

            if (!uploadResponse.ok) {
              let errorText
              try {
                const errorData = await uploadResponse.json()
                errorText = errorData.error || errorData.message || JSON.stringify(errorData)
              } catch {
                try {
                  errorText = await uploadResponse.text()
                } catch {
                  errorText = `HTTP ${uploadResponse.status}: ${uploadResponse.statusText}`
                }
              }
              console.error(`❌ Upload failed for chunk ${chunkNum}:`, errorText)
              throw new Error(`Upload failed: ${errorText}`)
            }

            const uploadData = await uploadResponse.json()
            if (uploadData.imageUrls && uploadData.imageUrls.length > 0) {
              uploadedImageUrls.push(...uploadData.imageUrls)
              console.log(`✅ Chunk ${chunkNum} uploaded: ${uploadData.imageUrls.length} URLs received`)
            } else {
              console.error(`⚠️ Chunk ${chunkNum} upload returned no URLs`)
            }
          } catch (uploadError: any) {
            console.error(`❌ Error uploading chunk ${chunkNum}:`, uploadError)
            throw new Error(`Failed to upload images: ${uploadError.message}`)
          }
        }

        console.log(`✅ All images uploaded successfully: ${uploadedImageUrls.length} total URLs`)

        // Map URLs back to cardData
        const finalCardData = cardData.map((card, index) => {
          const frontUrlIndex = index * 2
          const backUrlIndex = index * 2 + 1

          return {
            ...card,
            frontUrl: uploadedImageUrls[frontUrlIndex] || null,
            backUrl: uploadedImageUrls[backUrlIndex] || null
          }
        })

        // Send checkout request with URLs only (lightweight)
        const checkoutPayload = {
          quantity,
          shippingAddress: formData,
          cardImages: uploadedImageUrls, // URLs instead of base64
          cardData: finalCardData
        }

        const checkoutPayloadSize = (new Blob([JSON.stringify(checkoutPayload)]).size / (1024 * 1024)).toFixed(2)
        console.log(`📊 Checkout payload size with URLs: ${checkoutPayloadSize} MB`)

        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkoutPayload)
        })

        if (!response.ok) {
          const errorText = await response.text()
          let error
          try {
            error = JSON.parse(errorText)
          } catch {
            error = { error: errorText }
          }
          throw new Error(error.error || error.message || 'Failed to create checkout session')
        }

        const data = await response.json()

        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL received')
        }
      } else {
        // Payload is small enough, send directly
        console.log(`✅ Payload size OK (${payloadSizeMB} MB), sending directly to checkout`)

        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        })

        if (!response.ok) {
          const errorText = await response.text()
          let error
          try {
            error = JSON.parse(errorText)
          } catch {
            error = { error: errorText }
          }
          throw new Error(error.error || error.message || 'Failed to create checkout session')
        }

        const data = await response.json()

        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL received')
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert('Checkout failed: ' + error.message)
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[90] flex items-center justify-center backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-850 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-modal">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" /> Checkout
          </h3>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-850">
          {/* Order Summary */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white mb-2 sm:mb-3">Order Summary</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">{quantity} cards</span>
                <span className="font-semibold text-slate-800 dark:text-white">${cardsTotal.toFixed(2)}</span>
              </div>
              {finishSurcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Premium Finishes</span>
                  <span className="font-semibold text-slate-800 dark:text-white">${finishSurcharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                <span className="font-semibold text-slate-800 dark:text-white">${shippingCost.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Total</span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none touch-manipulation"
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none touch-manipulation"
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                Address Line 1 *
              </label>
              <input
                type="text"
                required
                value={formData.line1}
                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none touch-manipulation"
                placeholder="123 Main Street"
                autoComplete="street-address"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.line2}
                onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none touch-manipulation"
                placeholder="Apartment, suite, etc."
                autoComplete="address-line2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none touch-manipulation"
                  placeholder="New York"
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                  State/Province *
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none touch-manipulation"
                  placeholder="NY"
                  autoComplete="address-level1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                  ZIP/Postal Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none touch-manipulation"
                  placeholder="10001"
                  autoComplete="postal-code"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                  Country *
                </label>
                <select
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none touch-manipulation"
                  autoComplete="country"
                >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="OTHER">Other (International)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 sm:pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 sm:px-6 py-3 sm:py-3.5 text-base sm:text-sm rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600 touch-manipulation min-h-[48px]"
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{isSubmitting ? 'Processing...' : 'Proceed to Payment'}</span>
              </button>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                Secure payment powered by Stripe
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

