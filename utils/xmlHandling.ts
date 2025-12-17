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
    const xmlText = (e.target?.result as string) || ''
    if (!xmlText) {
      setProcessing(false)
      return
    }
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

    const fronts = xmlDoc.querySelectorAll('fronts > card')
    const backs = xmlDoc.querySelectorAll('backs > card')
    const cardbackNode = xmlDoc.querySelector('cardback')

    const getDriveUrl = (id: string) => `https://lh3.googleusercontent.com/d/${id}=w1000`

    setProcessing(true)
    setProcessingText('Parsing XML...')
    setProcessingPercent(0)

    try {
      // Handle global cardback
      if (cardbackNode && cardbackNode.textContent) {
        const backId = cardbackNode.textContent.trim()
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
            setGlobalBack(prev => ({ ...prev, original: dataUrl }))
            processImage(dataUrl, 2.5, 1.9, false, (processed) => {
              setGlobalBack(prev => ({ ...prev, processed: processed || null }))
              resolve()
            })
          }
          img.onerror = () => {
            console.warn('Failed to load global cardback')
            resolve()
          }
          img.src = backUrl
        })
      }

      if (currentStep === 2) {
        // Step 2: Apply backs to existing cards
        const backMap = new Map<number, string>()

        backs.forEach(node => {
          const idNode = node.querySelector('id')
          const slotsNode = node.querySelector('slots')
          if (idNode?.textContent && slotsNode?.textContent) {
            const id = idNode.textContent.trim()
            const url = getDriveUrl(id)
            const slots = slotsNode.textContent.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
            slots.forEach(slot => {
              backMap.set(slot, url)
            })
          }
        })

        const sortedSlots = Array.from(backMap.keys()).sort((a, b) => a - b)
        const totalSlots = sortedSlots.length

        for (let i = 0; i < sortedSlots.length; i++) {
          const slot = sortedSlots[i]
          setProcessingText(`Processing back for card ${slot + 1}...`)
          setProcessingPercent(Math.round(((i + 1) / totalSlots) * 100))

          if (slot < deck.length) {
            const backUrl = backMap.get(slot)!
            const card = deck[slot]

            await new Promise<void>(resolve => {
              const img = new Image()
              img.crossOrigin = 'Anonymous'
              img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                canvas.getContext('2d')?.drawImage(img, 0, 0)
                const dataUrl = canvas.toDataURL()

                setDeck(prev => {
                  const newDeck = [...prev]
                  if (slot < newDeck.length) {
                    newDeck[slot] = {
                      ...newDeck[slot],
                      originalBack: dataUrl,
                    }
                  }
                  return newDeck
                })

                processImage(dataUrl, card.trimMm || 2.5, card.bleedMm || 1.9, card.hasBleed || false, (processed) => {
                  setDeck(prev => {
                    const newDeck = [...prev]
                    if (slot < newDeck.length) {
                      newDeck[slot] = {
                        ...newDeck[slot],
                        back: processed,
                      }
                    }
                    return newDeck
                  })
                  resolve()
                })
              }
              img.onerror = () => {
                console.warn(`Failed to load back image for slot ${slot}`)
                resolve()
              }
              img.src = backUrl
            })
          }
        }
      } else {
        // Step 1: Import fronts and backs as new cards
        const slotMap = new Map<number, { front?: string; back?: string }>()

        // Parse fronts
        fronts.forEach(node => {
          const idNode = node.querySelector('id')
          const slotsNode = node.querySelector('slots')
          if (idNode?.textContent && slotsNode?.textContent) {
            const id = idNode.textContent.trim()
            const url = getDriveUrl(id)
            const slots = slotsNode.textContent.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
            slots.forEach(slot => {
              if (!slotMap.has(slot)) {
                slotMap.set(slot, {})
              }
              slotMap.get(slot)!.front = url
            })
          }
        })

        // Parse backs
        backs.forEach(node => {
          const idNode = node.querySelector('id')
          const slotsNode = node.querySelector('slots')
          if (idNode?.textContent && slotsNode?.textContent) {
            const id = idNode.textContent.trim()
            const url = getDriveUrl(id)
            const slots = slotsNode.textContent.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
            slots.forEach(slot => {
              if (!slotMap.has(slot)) {
                slotMap.set(slot, {})
              }
              slotMap.get(slot)!.back = url
            })
          }
        })

        const sortedSlots = Array.from(slotMap.keys()).sort((a, b) => a - b)
        const totalSlots = sortedSlots.length
        const newCards: Card[] = []

        for (let i = 0; i < sortedSlots.length; i++) {
          const slot = sortedSlots[i]
          setProcessingText(`Processing card ${slot + 1} of ${totalSlots}...`)
          setProcessingPercent(Math.round(((i + 1) / totalSlots) * 100))

          const data = slotMap.get(slot)!
          if (!data.front) continue

          // Load front image
          const frontDataUrl = await new Promise<string | null>(resolve => {
            const img = new Image()
            img.crossOrigin = 'Anonymous'
            img.onload = () => {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              canvas.getContext('2d')?.drawImage(img, 0, 0)
              resolve(canvas.toDataURL())
            }
            img.onerror = () => resolve(null)
            img.src = data.front!
          })

          // Load back image if available
          const backDataUrl = data.back
            ? await new Promise<string | null>(resolve => {
              const img = new Image()
              img.crossOrigin = 'Anonymous'
              img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                canvas.getContext('2d')?.drawImage(img, 0, 0)
                resolve(canvas.toDataURL())
              }
              img.onerror = () => resolve(null)
              img.src = data.back!
            })
            : null

          if (frontDataUrl) {
            // Process front
            const processedFront = await new Promise<string | null>(resolve => {
              processImage(frontDataUrl, 2.5, 1.9, false, resolve)
            })

            // Process back if available
            const processedBack = backDataUrl
              ? await new Promise<string | null>(resolve => {
                processImage(backDataUrl, 2.5, 1.9, false, resolve)
              })
              : null

            const newCard: Card = {
              id: String(Date.now() + Math.random() + slot),
              originalFront: frontDataUrl,
              front: processedFront,
              originalBack: backDataUrl,
              back: processedBack,
              trimMm: 2.5,
              bleedMm: 1.9,
              hasBleed: false,
              finish: 'standard',
              quantity: 1,
            }

            newCards.push(newCard)
          }
        }

        // Add all new cards to deck at once
        if (newCards.length > 0) {
          setDeck(prev => [...prev, ...newCards])
          if (deck.length === 0 && newCards.length > 0) {
            setCurrentCardIndex(0)
          }
        }
      }
    } catch (err) {
      console.error('XML processing error', err)
      setProcessingText('Error processing XML file')
    } finally {
      setProcessingPercent(100)
      setProcessingText('Done!')
      setTimeout(() => {
        setProcessing(false)
      }, 500)
    }
  }

  reader.readAsText(file)
}

