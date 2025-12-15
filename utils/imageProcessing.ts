export function processImage(
  imgSrc: string | null,
  trimMm: number,
  bleedMm: number,
  addBleed: boolean,
  callback: (result: string | null) => void
) {
  if (!imgSrc) {
    callback(null)
    return
  }

  const img = new Image()
  img.crossOrigin = "Anonymous"
  
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      callback(null)
      return
    }

    const DPI = 300
    const mmToPx = (mm: number) => Math.floor(mm * DPI / 25.4)
    
    // Standard card dimensions: 63mm × 88mm at 300 DPI
    const baseWidth = 750  // 63mm at 300 DPI
    const baseHeight = 1050 // 88mm at 300 DPI
    
    // Use the actual bleedMm value for canvas size when adding bleed
    // This allows the bleed to expand outward while keeping cut lines in place
    const activeBleedMm = addBleed && bleedMm > 0 ? bleedMm : 0
    const activeBleedPx = mmToPx(activeBleedMm)
    
    // Canvas size includes the bleed area on all sides
    canvas.width = baseWidth + (activeBleedPx * 2)
    canvas.height = baseHeight + (activeBleedPx * 2)

    const trimPx = mmToPx(trimMm)

    if (addBleed) {
      if (bleedMm > 0) {
        // EXPANDING BLEED: Extend edges outward by the specified bleedMm amount
        // The original image is drawn at the center (63×88mm area)
        // The bleed area extends outward from the edges
        
        const dx = activeBleedPx  // X offset where card content starts
        const dy = activeBleedPx  // Y offset where card content starts
        const dw = baseWidth      // Card width (63mm)
        const dh = baseHeight     // Card height (88mm)

        // Draw the original image into the card area (center of canvas)
        ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh)

        // Sample colors from inside the trim area for corner fills
        // This avoids sampling from potentially white/empty corners
        const getSafeColor = (x: number, y: number) => {
          const pixel = ctx.getImageData(dx + x, dy + y, 1, 1).data
          return `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3]/255})`
        }

        // Get corner colors (sampled from inside the trim boundary)
        const colorTL = getSafeColor(trimPx, trimPx)
        const colorTR = getSafeColor(dw - trimPx - 1, trimPx)
        const colorBL = getSafeColor(trimPx, dh - trimPx - 1)
        const colorBR = getSafeColor(dw - trimPx - 1, dh - trimPx - 1)

        // Fill corner regions of the bleed area with sampled colors
        // Top-left corner
        ctx.fillStyle = colorTL
        ctx.fillRect(0, 0, dx + trimPx, dy + trimPx)
        // Top-right corner
        ctx.fillStyle = colorTR
        ctx.fillRect(dx + dw - trimPx, 0, activeBleedPx + trimPx, dy + trimPx)
        // Bottom-left corner
        ctx.fillStyle = colorBL
        ctx.fillRect(0, dy + dh - trimPx, dx + trimPx, activeBleedPx + trimPx)
        // Bottom-right corner
        ctx.fillStyle = colorBR
        ctx.fillRect(dx + dw - trimPx, dy + dh - trimPx, activeBleedPx + trimPx, activeBleedPx + trimPx)

        // Extend edges outward by copying 1-pixel strips from the image edges
        // Top edge: copy row at y=dy (top of card) and stretch it up into bleed area
        ctx.drawImage(canvas, dx + trimPx, dy, dw - 2*trimPx, 1, dx + trimPx, 0, dw - 2*trimPx, activeBleedPx)
        // Bottom edge: copy row at y=dy+dh-1 (bottom of card) and stretch it down
        ctx.drawImage(canvas, dx + trimPx, dy + dh - 1, dw - 2*trimPx, 1, dx + trimPx, dy + dh, dw - 2*trimPx, activeBleedPx)
        // Left edge: copy column at x=dx (left of card) and stretch it left
        ctx.drawImage(canvas, dx, dy + trimPx, 1, dh - 2*trimPx, 0, dy + trimPx, activeBleedPx, dh - 2*trimPx)
        // Right edge: copy column at x=dx+dw-1 (right of card) and stretch it right
        ctx.drawImage(canvas, dx + dw - 1, dy + trimPx, 1, dh - 2*trimPx, dx + dw, dy + trimPx, activeBleedPx, dh - 2*trimPx)
      } else if (bleedMm < 0) {
        // NEGATIVE BLEED (CROPPING): Zoom into the image
        // This is for images that already have bleed and need to be trimmed
        // Canvas stays at base size (no bleed extension)
        canvas.width = baseWidth
        canvas.height = baseHeight
        
        const cropAmountPx = Math.abs(mmToPx(bleedMm))
        // Draw the image larger than canvas, cropping the edges
        const finalX = -cropAmountPx
        const finalY = -cropAmountPx
        const finalW = canvas.width + (cropAmountPx * 2)
        const finalH = canvas.height + (cropAmountPx * 2)
        ctx.drawImage(img, 0, 0, img.width, img.height, finalX, finalY, finalW, finalH)
      } else {
        // bleedMm === 0: No bleed adjustment
        canvas.width = baseWidth
        canvas.height = baseHeight
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height)
      }
    } else {
      // addBleed is false: No bleed processing, just resize to base dimensions
      canvas.width = baseWidth
      canvas.height = baseHeight
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height)
    }

    callback(canvas.toDataURL())
  }
  
  img.onerror = () => {
    console.warn("Failed to load image for processing")
    callback(null)
  }
  
  img.src = imgSrc
}

export function createBlankImage(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 750
  canvas.height = 1050
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 750, 1050)
  }
  return canvas.toDataURL().split(',')[1]
}

export function rgbToHex(r: number, g: number, b: number): string {
  if (r > 255 || g > 255 || b > 255)
    throw "Invalid color component"
  return ((r << 16) | (g << 8) | b).toString(16)
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}
