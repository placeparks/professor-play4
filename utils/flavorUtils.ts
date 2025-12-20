
/**
 * Fetches all cards with "is:flavorname" from Scryfall and returns a map
 * of lowercase flavor_name -> real_card_name.
 */
export async function fetchFlavorNameMap(): Promise<Record<string, string>> {
    const flavorMap: Record<string, string> = {}
    let hasMore = true
    let nextPageUrl = 'https://api.scryfall.com/cards/search?q=is:flavorname&unique=cards'

    try {
        while (hasMore && nextPageUrl) {
            const resp = await fetch(nextPageUrl)
            if (!resp.ok) {
                throw new Error(`Scryfall API error: ${resp.status}`)
            }
            const data = await resp.json()

            if (data.data && Array.isArray(data.data)) {
                for (const card of data.data) {
                    // Some cards have multiple faces; flavor names usually appear on one face.
                    // However, the query 'is:flavorname' returns the whole card object.
                    // We need to check top-level or card_faces for 'flavor_name'.

                    // Check top level
                    if (card.flavor_name && card.name) {
                        flavorMap[card.flavor_name.toLowerCase()] = card.name
                    }

                    // Check faces
                    if (card.card_faces) {
                        for (const face of card.card_faces) {
                            if (face.flavor_name && face.name) {
                                // For double-faced cards, the "real name" of the specific face might be what we want,
                                // or the card's overall name. Usually imports work Best with the specific face name 
                                // or the full card name (Name // Name).
                                // But usually flavor_name replaces just one face's name.
                                // Let's map to the specific face name since that's what the flavor name replaces.
                                flavorMap[face.flavor_name.toLowerCase()] = face.name
                            }
                        }
                    }
                }
            }

            hasMore = data.has_more
            nextPageUrl = data.next_page

            // Be nice to Scryfall API
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }
        }
    } catch (err) {
        console.error('Error fetching flavor names:', err)
        // Return whatever we managed to fetch, or empty
    }

    return flavorMap
}
