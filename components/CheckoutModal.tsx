'use client'

import { useRef, useState, useEffect } from 'react'
import { X, ShoppingCart, Lock } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { updateDeckStats } from '@/utils/deckStats'
import { compressImage } from '@/utils/imageCompression'

export default function CheckoutModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { deck, globalBack } = useApp()

  // User-facing progress UI for long operations (compression + upload + redirect)
  const [progressText, setProgressText] = useState<string>('')
  const [progressPct, setProgressPct] = useState<number>(0)
  const [progressSubtext, setProgressSubtext] = useState<string>('')
  const lastUiUpdateRef = useRef<number>(0)

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
    ; (window as any).openCheckoutModal = () => setIsOpen(true)
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
    setProgressText('Preparing your order…')
    setProgressPct(2)
    setProgressSubtext('We truly care about the quality of your cards. Thanks for your patience.')

    try {
      // Concurrency helper to speed up compression + uploads without overwhelming the browser/network
      const mapWithConcurrency = async <T, R>(
        items: T[],
        concurrency: number,
        fn: (item: T, index: number) => Promise<R>
      ): Promise<R[]> => {
        const results: R[] = new Array(items.length)
        let nextIndex = 0

        const worker = async () => {
          while (true) {
            const current = nextIndex++
            if (current >= items.length) return
            results[current] = await fn(items[current], current)
          }
        }

        const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker())
        await Promise.all(workers)
        return results
      }

      // EXPAND CARDS BASED ON QUANTITY
      // Cards with quantity > 1 need to be expanded into separate instances
      // Example: 1 card with quantity: 4 becomes 4 separate cards with quantity: 1
      const expandedDeck: typeof deck = []
      deck.forEach((card, originalIndex) => {
        const qty = card.quantity || 1
        for (let i = 0; i < qty; i++) {
          expandedDeck.push({
            ...card,
            id: `${card.id}_${i}`, // Unique ID for each expanded card
            quantity: 1 // Each expanded card has quantity 1
          })
        }
      })

      console.log(`📦 Expanded ${deck.length} cards (with quantities) into ${expandedDeck.length} individual cards`)

      // Prepare card images organized properly (front/back/mask triplets)
      // Ensure arrays match expandedDeck length exactly - one entry per card

      const frontImages: string[] = []
      const backImages: string[] = []
      const maskImages: (string | null)[] = []

      expandedDeck.forEach((card, index) => {
        // Front image (required) - this should be the card front
        const frontImg = card.front || card.originalFront
        frontImages.push(frontImg || '')

        // Back image - use card-specific back, or global back, or empty
        // IMPORTANT: Make sure we're getting the back, not the front
        const backImg = card.back || card.originalBack || globalBack.processed || globalBack.original
        backImages.push(backImg || '')

        // Mask image - always include (even if null) to maintain array pattern
        const maskImg = card.silverMask || null
        maskImages.push(maskImg)

        // Debug logging to verify front/back are correct
        console.log(`🃏 Card ${index + 1} image collection:`, {
          hasFront: !!frontImg,
          hasBack: !!backImg,
          hasMask: !!maskImg,
          frontSource: card.front ? 'card.front' : (card.originalFront ? 'card.originalFront' : 'none'),
          backSource: card.back ? 'card.back' : (card.originalBack ? 'card.originalBack' : (globalBack.processed ? 'globalBack.processed' : (globalBack.original ? 'globalBack.original' : 'none')))
        })
      })

      // Prepare card data WITHOUT base64 images (we'll upload separately and use URLs)
      // Base64 images are included separately in allImages array
      const cardData = expandedDeck.map((card) => ({
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
      // Always maintain the pattern: front, back, mask for each card
      // All arrays should have the same length as expandedDeck.length
      const allImages: string[] = []
      for (let i = 0; i < expandedDeck.length; i++) {
        // Always push in order: front, back, mask
        // Use empty string for missing images to maintain array structure
        allImages.push(frontImages[i] || '') // Front (required, but use empty string if missing)
        allImages.push(backImages[i] || '') // Back (may be empty string if no back)
        allImages.push(maskImages[i] || '') // Mask (may be empty string if no mask)
      }

      // Estimate payload size WITHOUT JSON.stringifying the full payload (can throw "Invalid string length" for large decks)
      // This is only used for logging/debugging.
      const approxImagesBytes = allImages.reduce((acc, s) => acc + (s ? s.length : 0), 0)
      let approxCardDataBytes = 0
      try {
        approxCardDataBytes = JSON.stringify(cardData).length
      } catch {
        approxCardDataBytes = 0
      }
      const payloadSizeMB = ((approxImagesBytes + approxCardDataBytes) / (1024 * 1024)).toFixed(2)
      console.log(`📊 Estimated payload size (approx): ${payloadSizeMB} MB`)

      // Keep the full payload object for the small-payload fallback path below.
      // Note: we intentionally do NOT JSON.stringify this here (can be huge and throw).
      const testPayload = {
        quantity,
        shippingAddress: formData,
        cardImages: allImages,
        cardData
      }

      let uploadedImageUrls: string[] = []

      // Always upload images first if we have any images (safer for Vercel's 4.5MB limit)
      // This prevents 413 errors and ensures reliable checkout
      const shouldUploadImagesFirst = allImages.length > 0

      if (shouldUploadImagesFirst) {
        console.log(`📤 Payload too large (${payloadSizeMB} MB), uploading images via backend first...`)

        // Generate temp order ID
        const tempOrderId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Count non-empty masks
        const maskCount = maskImages.filter(m => m && m.trim() !== '').length
        console.log(`📦 Total images to upload: ${allImages.length} (${frontImages.length} fronts, ${backImages.length} backs, ${maskCount} masks)`)

        // Upload per-card (front + back + mask) with concurrency to speed up large decks.
        // This keeps each request small while dramatically reducing total wall-clock time.
        const CHUNK_SIZE = 3 // [front, back, mask]
        const totalChunks = Math.ceil(allImages.length / CHUNK_SIZE)
        const indices = Array.from({ length: totalChunks }, (_, idx) => idx)

        // Conservative defaults to avoid freezing the browser and to stay friendly to Supabase.
        const COMPRESS_CONCURRENCY = 3
        const UPLOAD_CONCURRENCY = 4

        const compressDoneRef = { current: 0 }
        const uploadDoneRef = { current: 0 }
        const maybeUpdateUi = (phase: 'compress' | 'upload') => {
          const now = Date.now()
          if (now - lastUiUpdateRef.current < 200) return
          lastUiUpdateRef.current = now

          const compressed = compressDoneRef.current
          const uploaded = uploadDoneRef.current

          if (phase === 'compress') {
            const pct = totalChunks > 0 ? Math.round((compressed / totalChunks) * 50) : 0
            setProgressText(`Preparing your artwork… (${compressed}/${totalChunks} cards)`)
            setProgressPct(Math.min(50, Math.max(5, pct)))
            setProgressSubtext('We’re optimizing files for a fast, reliable upload—your print quality stays the same.')
          } else {
            const pct = totalChunks > 0 ? 50 + Math.round((uploaded / totalChunks) * 48) : 50
            setProgressText(`Uploading images… (${uploaded}/${totalChunks} cards)`)
            setProgressPct(Math.min(98, Math.max(50, pct)))
            setProgressSubtext('Hang tight—large orders can take a couple minutes. We’re working as fast as we can.')
          }
        }

        // Compress fronts/backs for each chunk (skip masks; keep PNG) with limited concurrency
        console.log('🗜️ Compressing images to reduce payload size (parallel)...')
        setProgressText(`Preparing your artwork… (0/${totalChunks} cards)`)
        setProgressPct(5)
        setProgressSubtext('We’re optimizing files for a fast, reliable upload—your print quality stays the same.')
        const compressedChunks = await mapWithConcurrency(indices, COMPRESS_CONCURRENCY, async (chunkIdx) => {
          const start = chunkIdx * CHUNK_SIZE
          const chunk = allImages.slice(start, start + CHUNK_SIZE)

          // Ensure exactly [front, back, mask] shape (pad with '')
          while (chunk.length < CHUNK_SIZE) chunk.push('')

          const [front, back, mask] = chunk

          const compressIfNeeded = async (img: string) => {
            if (!img || img.trim() === '') return ''
            // If it's already a URL, don't touch it
            if (img.startsWith('http')) return img
            // Base64 data URL: compress to jpeg
            return await compressImage(img, 0.8)
          }

          const compressedFront = await compressIfNeeded(front)
          const compressedBack = await compressIfNeeded(back)

          // Masks must remain PNG for transparency; do not compress
          const finalMask = mask && mask.trim() !== '' ? mask : ''

          compressDoneRef.current += 1
          maybeUpdateUi('compress')
          return [compressedFront, compressedBack, finalMask]
        })

        console.log(`✅ Compression done for ${compressedChunks.length} cards`)
        setProgressText(`Uploading images… (0/${totalChunks} cards)`)
        setProgressPct(50)
        setProgressSubtext('Hang tight—large orders can take a couple minutes. We’re working as fast as we can.')

        console.log(`📤 Uploading ${compressedChunks.length} cards (parallel)...`)
        const uploadedChunkResults = await mapWithConcurrency(indices, UPLOAD_CONCURRENCY, async (chunkIdx) => {
          const chunkNum = chunkIdx + 1
          const chunk = compressedChunks[chunkIdx]

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
              console.error(`❌ Upload failed for card ${chunkNum}:`, errorText)
              throw new Error(`Upload failed: ${errorText}`)
            }

            const uploadData = await uploadResponse.json()
            const imageUrls: string[] = Array.isArray(uploadData.imageUrls) ? uploadData.imageUrls : []

            // /api/upload-images returns URLs aligned to input chunk length (3).
            if (imageUrls.length !== 3) {
              console.warn(`⚠️ Upload for card ${chunkNum} returned ${imageUrls.length} urls; expected 3.`, imageUrls)
            }

            uploadDoneRef.current += 1
            maybeUpdateUi('upload')
            return imageUrls
          } catch (uploadError: any) {
            console.error(`❌ Error uploading card ${chunkNum}:`, uploadError)
            throw new Error(`Failed to upload images: ${uploadError.message}`)
          }
        })

        // Flatten in original order
        uploadedImageUrls = uploadedChunkResults.flat()

        console.log(`✅ All images uploaded successfully: ${uploadedImageUrls.length} total URLs`)

        // Map URLs back to cardData
        const finalCardData = cardData.map((card, index) => {
          const frontUrlIndex = index * 3
          const backUrlIndex = index * 3 + 1
          const maskUrlIndex = index * 3 + 2

          return {
            ...card,
            frontUrl: uploadedImageUrls[frontUrlIndex] || null,
            backUrl: uploadedImageUrls[backUrlIndex] || null,
            // Keep silverMask in sync with uploaded mask URL if present
            silverMask: uploadedImageUrls[maskUrlIndex] || null
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

        setProgressText('Creating secure Stripe checkout…')
        setProgressPct(99)
        setProgressSubtext('Almost there—securely connecting you to Stripe.')
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
          setProgressText('Redirecting to Stripe…')
          setProgressPct(100)
          setProgressSubtext('You’ll be redirected automatically.')
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL received')
        }
      } else {
        // Payload is small enough, send directly
        console.log(`✅ Payload size OK (${payloadSizeMB} MB), sending directly to checkout`)
        setProgressText('Creating secure Stripe checkout…')
        setProgressPct(70)
        setProgressSubtext('Almost there—securely connecting you to Stripe.')

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
          setProgressText('Redirecting to Stripe…')
          setProgressPct(100)
          setProgressSubtext('You’ll be redirected automatically.')
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL received')
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert('Checkout failed: ' + error.message)
      setIsSubmitting(false)
      setProgressText('')
      setProgressPct(0)
      setProgressSubtext('')
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
                <span>{isSubmitting ? 'Processing…' : 'Proceed to Payment'}</span>
              </button>
              {isSubmitting && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{progressText || 'Working…'}</span>
                    <span className="font-mono">{Math.max(0, Math.min(100, progressPct))}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${Math.max(2, Math.min(100, progressPct))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {progressSubtext || 'Thanks for your patience—we’re taking great care of your order.'}
                  </p>
                </div>
              )}
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

