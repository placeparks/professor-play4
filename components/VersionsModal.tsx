'use client'

import { useState, useEffect } from 'react'
import { X, Image, Loader2 } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { processImage } from '@/utils/imageProcessing'

interface ScryfallCard {
  id: string
  name: string
  set_name: string
  image_uris?: {
    normal: string
    large: string
  }
  card_faces?: Array<{
    image_uris?: {
      normal: string
      large: string
    }
  }>
}

export default function VersionsModal() {
  const { activeVersionIndex, setActiveVersionIndex, deck, setDeck } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [versions, setVersions] = useState<ScryfallCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleOpenVersions = (e: CustomEvent) => {
      const index = e.detail?.index
      if (index !== undefined && index >= 0) {
        setActiveVersionIndex(index)
        setIsOpen(true)
      }
    }

    window.addEventListener('openVersionsModal' as any, handleOpenVersions as EventListener)
    return () => {
      window.removeEventListener('openVersionsModal' as any, handleOpenVersions as EventListener)
    }
  }, [setActiveVersionIndex])

  // Fetch versions when modal opens
  useEffect(() => {
    if (isOpen && activeVersionIndex >= 0 && deck[activeVersionIndex]) {
      const card = deck[activeVersionIndex]
      if (card.printsUri) {
        fetchVersions(card.printsUri)
      } else {
        setVersions([])
        setError('Cards loaded from Scryfall must have 1.9mm bleed. Alternative art versions are only available for cards imported from Scryfall. To change the art for manually uploaded images, please upload a new image via the sidebar.')
      }
    }
  }, [isOpen, activeVersionIndex, deck])

  const fetchVersions = async (uri: string) => {
    setLoading(true)
    setError(null)
    setVersions([])

    try {
      const response = await fetch(uri)
      if (!response.ok) {
        throw new Error('Failed to fetch card versions')
      }
      const data = await response.json()
      if (data.data && Array.isArray(data.data)) {
        setVersions(data.data)
      } else {
        setError('No versions found')
      }
    } catch (err) {
      console.error('Error fetching versions:', err)
      setError(err instanceof Error ? err.message : 'Error loading versions')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setActiveVersionIndex(-1)
    setVersions([])
    setError(null)
  }

  const handleSelectVersion = async (version: ScryfallCard) => {
    if (activeVersionIndex < 0 || !deck[activeVersionIndex]) return

    // Get the large image URL
    let largeImgUrl: string | null = null
    if (version.image_uris?.large) {
      largeImgUrl = version.image_uris.large
    } else if (version.card_faces?.[0]?.image_uris?.large) {
      largeImgUrl = version.card_faces[0].image_uris.large
    }

    if (!largeImgUrl) {
      console.warn('No large image URL found for selected version')
      return
    }

    const currentCard = deck[activeVersionIndex]

    // Update the card with the new image
    setDeck((prev) => {
      const newDeck = [...prev]
      newDeck[activeVersionIndex] = {
        ...newDeck[activeVersionIndex],
        originalFront: largeImgUrl,
      }
      return newDeck
    })

    // Process the new image with current card's trim/bleed settings
    processImage(
      largeImgUrl,
      currentCard.trimMm || 2.5,
      currentCard.bleedMm || 1.9,
      currentCard.hasBleed || false,
      (processed) => {
        setDeck((prev) => {
          const newDeck = [...prev]
          newDeck[activeVersionIndex] = {
            ...newDeck[activeVersionIndex],
            front: processed,
          }
          return newDeck
        })
        handleClose()
      }
    )
  }

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
            onClick={handleClose}
            className="text-slate-400 hover:text-red-500 active:text-red-600 transition-colors p-1 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Loading versions...</span>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12 text-red-400">{error}</div>
          ) : versions.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">No versions available</div>
          ) : (
            versions.map((version) => {
              // Get image URL (prefer normal for grid, but we'll use large when selected)
              let imgSrc: string | null = null
              if (version.image_uris?.normal) {
                imgSrc = version.image_uris.normal
              } else if (version.card_faces?.[0]?.image_uris?.normal) {
                imgSrc = version.card_faces[0].image_uris.normal
              }

              if (!imgSrc) return null

              return (
                <div
                  key={version.id}
                  className="aspect-[2.5/3.5] cursor-pointer hover:scale-105 transition-transform shadow-sm rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  onClick={() => handleSelectVersion(version)}
                >
                  <img
                    src={imgSrc}
                    alt={version.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="bg-white dark:bg-slate-800 text-[10px] text-center py-1 font-mono text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700">
                    {version.set_name}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

