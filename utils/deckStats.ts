import { Card } from '@/contexts/AppContext'

export function updateDeckStats(deck: Card[]): { totalPrice: string; deckStats: string } {
  let count = 0
  let finishSurcharge = 0

  deck.forEach(card => {
    const qty = card.quantity || 1
    count += qty
    
    if (card.finish && card.finish !== 'standard') {
      if (card.finish.includes('silver')) {
        let cardCost = 3.50
        if (card.finish.includes('rainbow') || card.finish.includes('gloss')) {
          cardCost += 2.50
        }
        finishSurcharge += (cardCost * qty)
      } else {
        finishSurcharge += (2.50 * qty)
      }
    }
  })
  
  let pricePerCard = 0.35
  if (count >= 500) {
    pricePerCard = 0.26
  } else if (count >= 145) {
    pricePerCard = 0.30
  }
  
  const baseTotal = count * pricePerCard
  const finalTotal = baseTotal + finishSurcharge
  
  return {
    totalPrice: `Total: $${finalTotal.toFixed(2)}`,
    deckStats: `${count} Cards • S33 Stock`
  }
}

