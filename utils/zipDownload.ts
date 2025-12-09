import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Card, GlobalBack } from '@/contexts/AppContext'
import { createBlankImage } from './imageProcessing'

export async function downloadZip(
  side: 'fronts' | 'backs' | 'masks',
  deck: Card[],
  globalBack: GlobalBack
) {
  if (deck.length === 0) {
    alert("No cards to download.")
    return
  }

  const zip = new JSZip()
  let count = 0

  for (const card of deck) {
    const qty = card.quantity || 1
    for (let i = 0; i < qty; i++) {
      count++
      let imgSrc: string | null = null
      
      if (side === 'fronts') {
        imgSrc = card.front
      } else if (side === 'backs') {
        imgSrc = card.back || globalBack.processed || globalBack.original
      } else if (side === 'masks') {
        imgSrc = card.silverMask || null
      }
      
      const fileName = `${String(count).padStart(3, '0')}.png`

      if (imgSrc) {
        if (imgSrc.startsWith('data:')) {
          const base64Data = imgSrc.split(',')[1]
          zip.file(fileName, base64Data, { base64: true })
        } else {
          try {
            const response = await fetch(imgSrc)
            const blob = await response.blob()
            zip.file(fileName, blob)
          } catch (e) {
            console.error(`Failed to fetch image for card ${count}`, e)
            zip.file(fileName, createBlankImage(), { base64: true })
          }
        }
      } else {
        zip.file(fileName, createBlankImage(), { base64: true })
      }
    }
  }
  
  try {
    const content = await zip.generateAsync({ type: "blob" })
    const filePrefix = side === 'fronts' ? 'fronts' : side === 'backs' ? 'backs' : 'masks'
    saveAs(content, `tcgplaytest_${filePrefix}.zip`)
  } catch (e) {
    console.error("Error generating zip", e)
    alert("Error generating zip file.")
  }
}

