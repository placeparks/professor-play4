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

  setProcessing(true)

  for (let i = 0; i < total; i++) {
    setProcessingPercent(Math.round(((i + 1) / total) * 100))
    setProcessingText(`Processing image ${i + 1} of ${total}`)
    const file = imageFiles[i]

    await new Promise<void>(resolve => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const original = e.target.result as string
        processImage(original, 2.5, 1.75, false, (processed) => {
          const newCard: Card = {
            id: Date.now() + Math.random(),
            originalFront: original,
            front: processed,
            back: null,
            originalBack: null,
            trimMm: 2.5,
            bleedMm: 1.75,
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

  setDeck(prev => {
    if (prev.length > 0 && currentCardIndex === -1) {
      setCurrentCardIndex(0)
    }
    return prev
  })

  setProcessing(false)
}

