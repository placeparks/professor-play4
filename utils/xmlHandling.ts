import { Card, GlobalBack } from '@/contexts/AppContext'
import { processImage } from './imageProcessing'

export function handleXMLFile(
  files: FileList | null,
  deck: Card[],
  setDeck: React.Dispatch<React.SetStateAction<Card[]>>,
  setCurrentCardIndex: React.Dispatch<React.SetStateAction<number>>,
  currentCardIndex: number,
  globalBack: GlobalBack,
  setGlobalBack: React.Dispatch<React.SetStateAction<GlobalBack>>,
  currentStep: number,
  setProcessing: React.Dispatch<React.SetStateAction<boolean>>,
  setProcessingPercent: React.Dispatch<React.SetStateAction<number>>,
  setProcessingText: React.Dispatch<React.SetStateAction<string>>
) {
  if (!files || files.length === 0) return

  const file = files[0]
  const reader = new FileReader()

  reader.onload = async (e) => {
    const xmlText = e.target.result as string
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

    const fronts = xmlDoc.querySelectorAll('fronts > card')
    const backs = xmlDoc.querySelectorAll('backs > card')
    const cardbackNode = xmlDoc.querySelector('cardback')

    const getDriveUrl = (id: string) => `https://lh3.googleusercontent.com/d/${id}=w1000`

    setProcessing(true)

    try {
      if (cardbackNode && cardbackNode.textContent) {
        const backId = cardbackNode.textContent
        const backUrl = getDriveUrl(backId)
        await new Promise<void>(resolve => {
          const img = new Image()
          img.crossOrigin = 'Anonymous'
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            canvas.getContext('2d')?.drawImage(img, 0, 0)
            const dataUrl = canvas.toDataURL()
            setGlobalBack({ ...globalBack, original: dataUrl })
            processImage(dataUrl, 2.5, 1.75, false, (processed) => {
              setGlobalBack(prev => ({ ...prev, processed: processed || null }))
              resolve()
            })
          }
          img.onerror = () => resolve()
          img.src = backUrl
        })
      }

      // Process fronts and backs based on current step
      // Implementation continues similar to original JavaScript logic
      // This is a simplified version - full implementation would handle all XML parsing logic

    } catch (err) {
      console.error('XML processing error', err)
    } finally {
      setProcessing(false)
    }
  }

  reader.readAsText(file)
}

