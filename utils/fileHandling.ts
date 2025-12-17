import { Card } from '@/contexts/AppContext'
import { processImage } from './imageProcessing'

export async function handleFiles(
  files: FileList | null,
  deck: Card[],
  setDeck: React.Dispatch<React.SetStateAction<Card[]>>,
  setCurrentCardIndex: React.Dispatch<React.SetStateAction<number>>,
  currentCardIndex: number,
  setProcessing: React.Dispatch<React.SetStateAction<boolean>>,
  setProcessingPercent: React.Dispatch<React.SetStateAction<number>>,
  setProcessingText: React.Dispatch<React.SetStateAction<string>>
) {
  if (!files || files.length === 0) return

  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
  const total = imageFiles.length
  if (total === 0) return

  const startingDeckLength = deck.length
  setProcessing(true)

  for (let i = 0; i < total; i++) {
    setProcessingPercent(Math.round(((i + 1) / total) * 100))
    setProcessingText(`Processing image ${i + 1} of ${total}`)
    const file = imageFiles[i]

    await new Promise<void>(resolve => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const original = (e.target?.result as string) || ''
        if (!original) {
          resolve()
          return
        }
        processImage(original, 2.5, 1.9, false, (processed) => {
          const newCard: Card = {
            id: String(Date.now() + Math.random()),
            originalFront: original,
            front: processed,
            back: null,
            originalBack: null,
            trimMm: 2.5,
            bleedMm: 1.9,
            hasBleed: false,
            finish: 'standard',
            quantity: 1,
          }
          setDeck(prev => [...prev, newCard])
          resolve()
        })
      }
      reader.readAsDataURL(file)
    })
  }

  // Set currentCardIndex after all images are processed
  // If we started with no cards (after reset) and processed images, show the first one
  if (startingDeckLength === 0 && total > 0 && currentCardIndex === -1) {
    // Wait for all setDeck calls to complete, then set currentCardIndex
    setTimeout(() => {
      setCurrentCardIndex(0)
    }, 100)
  }

  setProcessing(false)
}

