import { Card } from '@/contexts/AppContext'
import { processImage } from './imageProcessing'

export interface CardRequest {
  qty: number
  name?: string
  identifier: {
    name?: string
    set?: string
    collector_number?: string
  }
  originalLine: string
}

export interface ProcessCardListResult {
  success: boolean
  errors: string[]
  failedRequests: CardRequest[]
}

export async function processCardList(
  text: string,
  deck: Card[],
  setDeck: React.Dispatch<React.SetStateAction<Card[]>>,
  currentStep: number,
  setCurrentCardIndex: React.Dispatch<React.SetStateAction<number>>,
  currentCardIndex: number,
  setProcessing: React.Dispatch<React.SetStateAction<boolean>>,
  setProcessingPercent: React.Dispatch<React.SetStateAction<number>>,
  setProcessingText: React.Dispatch<React.SetStateAction<string>>,
  setErrors: React.Dispatch<React.SetStateAction<string[]>>
): Promise<ProcessCardListResult> {
  const lines = text.split('\n').filter(l => l.trim().length > 0)
  const cardRequests: CardRequest[] = []
  const errors: string[] = []
  const failedRequests: CardRequest[] = []

  // Parse lines
  lines.forEach(line => {
    line = line.trim()
    const specificMatch = line.match(/^(\d+)\s+(.+?)\s+\(([\w\d]+)\)\s+([\w\d]+)\s*$/)
    if (specificMatch) {
      cardRequests.push({
        qty: parseInt(specificMatch[1]),
        identifier: {
          set: specificMatch[3].toLowerCase(),
          collector_number: specificMatch[4],
        },
        originalLine: line,
      })
    } else {
      const match = line.match(/^(\d+)\s*[xX]?\s+(.*)/)
      if (match) {
        cardRequests.push({
          qty: parseInt(match[1]),
          identifier: { name: match[2] },
          originalLine: line,
        })
      } else {
        cardRequests.push({
          qty: 1,
          identifier: { name: line },
          originalLine: line,
        })
      }
    }
  })

  if (cardRequests.length === 0) {
    return { success: false, errors: ['No valid lines found.'], failedRequests: [] }
  }

  setProcessing(true)
  setProcessingText(`Fetching ${cardRequests.length} unique entries...`)

  // Deduplicate requests
  const uniqueIdentifiersMap = new Map()
  cardRequests.forEach(req => {
    uniqueIdentifiersMap.set(JSON.stringify(req.identifier), req.identifier)
  })

  const identifiersToFetch = Array.from(uniqueIdentifiersMap.values())
  const chunks: typeof identifiersToFetch[] = []
  for (let i = 0; i < identifiersToFetch.length; i += 75) {
    chunks.push(identifiersToFetch.slice(i, i + 75))
  }

  const allFoundCards: any[] = []

  try {
    // Fetch from Scryfall
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      setProcessingText(`Fetching batch ${i + 1} of ${chunks.length}...`)
      const payload = { identifiers: chunk }
      const response = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (data.data) allFoundCards.push(...data.data)
    }

    setProcessingText(`Processing images...`)

    const totalReqs = cardRequests.length
    const imagesToAssign: Array<{ original: string; processed: string | null }> = []
    const newCards: Card[] = [] // Collect all new cards first

    for (let i = 0; i < totalReqs; i++) {
      const req = cardRequests[i]
      setProcessingPercent(Math.round(((i + 1) / totalReqs) * 100))
      setProcessingText(
        `Processing card ${i + 1} of ${totalReqs}: ${req.identifier.name || req.identifier.set}`
      )

      let cardData = null
      if (req.identifier.set && req.identifier.collector_number) {
        const setCode = req.identifier.set.toLowerCase()
        const collectorNumber = req.identifier.collector_number
        cardData = allFoundCards.find(
          c =>
            c.set.toLowerCase() === setCode &&
            c.collector_number === collectorNumber
        )
      } else if (req.identifier.name) {
        cardData = allFoundCards.find(
          c => c.name && c.name.toLowerCase().includes(req.identifier.name!.toLowerCase())
        )
      }

      if (cardData) {
        let frontImgSrc: string | null = null
        let backImgSrc: string | null = null

        if (
          cardData.card_faces &&
          cardData.card_faces.length > 1 &&
          cardData.card_faces[1].image_uris
        ) {
          frontImgSrc = cardData.card_faces[0].image_uris.large
          backImgSrc = cardData.card_faces[1].image_uris.large
        } else if (cardData.image_uris) {
          frontImgSrc = cardData.image_uris.large
        }

        if (frontImgSrc) {
          await new Promise<void>(resolve => {
            const pFront = new Promise<string | null>(r =>
              processImage(frontImgSrc!, 2.5, 1.9, false, r)
            )
            const pBack = backImgSrc
              ? new Promise<string | null>(r => processImage(backImgSrc!, 2.5, 1.9, false, r))
              : Promise.resolve<string | null>(null)

            Promise.all([pFront, pBack]).then(([processedFront, processedBack]) => {
              if (currentStep === 2) {
                // Back import mode
                for (let k = 0; k < req.qty; k++) {
                  imagesToAssign.push({ original: frontImgSrc!, processed: processedFront })
                }
              } else {
                // Deck import mode: GROUP them!
                const newCard: Card = {
                  id: String(Date.now() + Math.random() + i), // Add i to ensure unique IDs
                  originalFront: frontImgSrc!,
                  front: processedFront,
                  back: processedBack,
                  originalBack: backImgSrc,
                  trimMm: 2.5,
                  bleedMm: 1.9,
                  hasBleed: false,
                  printsUri: cardData.prints_search_uri,
                  finish: 'standard',
                  quantity: req.qty,
                }
                newCards.push(newCard) // Collect instead of immediately updating state
              }
              resolve()
            })
          })
        } else {
          errors.push(req.originalLine)
          failedRequests.push(req)
        }
      } else {
        errors.push(req.originalLine)
        failedRequests.push(req)
      }
    }

    // Update deck once with all new cards
    if (currentStep !== 2 && newCards.length > 0) {
      setDeck(prev => [...prev, ...newCards])
    }

    // Handle Step 2 Back Assignments
    if (currentStep === 2 && imagesToAssign.length > 0) {
      const limit = Math.min(deck.length, imagesToAssign.length)
      const updatedDeck = [...deck]

      for (let i = 0; i < limit; i++) {
        setProcessingPercent(Math.round(((i + 1) / limit) * 100))
        setProcessingText(`Applying back to card ${i + 1}...`)
        const newBack = imagesToAssign[i]

        if (updatedDeck[i]) {
          updatedDeck[i] = {
            ...updatedDeck[i],
            originalBack: newBack.original,
          }

          await new Promise<void>(resolve => {
            processImage(
              newBack.original,
              updatedDeck[i].trimMm,
              updatedDeck[i].bleedMm,
              updatedDeck[i].hasBleed,
              reProcessed => {
                updatedDeck[i] = { ...updatedDeck[i], back: reProcessed }
                resolve()
              }
            )
          })
        }
      }

      setDeck(updatedDeck)
    }

    setDeck(prev => {
      if (prev.length > 0 && currentCardIndex === -1) {
        setCurrentCardIndex(0)
      }
      return prev
    })

    setProcessing(false)
    setErrors(errors)

    return { success: errors.length === 0, errors, failedRequests }
  } catch (error) {
    console.error(error)
    setProcessing(false)
    setErrors(['Error contacting Scryfall API.'])
    return { success: false, errors: ['Error contacting Scryfall API.'], failedRequests: [] }
  }
}

