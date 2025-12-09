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
    
    const baseWidth = 750
    const baseHeight = 1050
    
    const targetBleedMm = 1.75
    const targetBleedPx = mmToPx(targetBleedMm)

    canvas.width = baseWidth + (targetBleedPx * 2)
    canvas.height = baseHeight + (targetBleedPx * 2)

    const trimPx = mmToPx(trimMm)

    if (addBleed) {
      if (bleedMm > 0) {
        const dx = targetBleedPx
        const dy = targetBleedPx
        const dw = baseWidth
        const dh = baseHeight

        ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh)

        const getSafeColor = (x: number, y: number) => {
          const pixel = ctx.getImageData(dx + x, dy + y, 1, 1).data
          return `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3]/255})`
        }

        const colorTL = getSafeColor(trimPx, trimPx)
        const colorTR = getSafeColor(dw - trimPx - 1, trimPx)
        const colorBL = getSafeColor(trimPx, dh - trimPx - 1)
        const colorBR = getSafeColor(dw - trimPx - 1, dh - trimPx - 1)

        ctx.fillStyle = colorTL
        ctx.fillRect(0, 0, dx + trimPx, dy + trimPx)
        ctx.fillStyle = colorTR
        ctx.fillRect(dx + dw - trimPx, 0, targetBleedPx + trimPx, dy + trimPx)
        ctx.fillStyle = colorBL
        ctx.fillRect(0, dy + dh - trimPx, dx + trimPx, targetBleedPx + trimPx)
        ctx.fillStyle = colorBR
        ctx.fillRect(dx + dw - trimPx, dy + dh - trimPx, targetBleedPx + trimPx, targetBleedPx + trimPx)

        ctx.drawImage(canvas, dx + trimPx, dy, dw - 2*trimPx, 1, dx + trimPx, 0, dw - 2*trimPx, targetBleedPx)
        ctx.drawImage(canvas, dx + trimPx, dy + dh - 1, dw - 2*trimPx, 1, dx + trimPx, dy + dh, dw - 2*trimPx, targetBleedPx)
        ctx.drawImage(canvas, dx, dy + trimPx, 1, dh - 2*trimPx, 0, dy + trimPx, targetBleedPx, dh - 2*trimPx)
        ctx.drawImage(canvas, dx + dw - 1, dy + trimPx, 1, dh - 2*trimPx, dx + dw, dy + trimPx, targetBleedPx, dh - 2*trimPx)
      } else {
        const cropAmountPx = Math.abs(mmToPx(bleedMm))
        const finalX = -cropAmountPx
        const finalY = -cropAmountPx
        const finalW = canvas.width + (cropAmountPx * 2)
        const finalH = canvas.height + (cropAmountPx * 2)
        ctx.drawImage(img, 0, 0, img.width, img.height, finalX, finalY, finalW, finalH)
      }
    } else {
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

