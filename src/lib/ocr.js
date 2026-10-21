import { createWorker } from 'tesseract.js'

/**
 * ============================================================================
 * OCR VERSION CONFIGURATION
 * ============================================================================
 * Choose which OCR pipeline to use:
 *   - 'version1': Original baseline OCR (grayscale min-max contrast stretching, default PSM)
 *   - 'version2': Enhanced high-accuracy OCR (adaptive local window binarization,
 *                 shadow neutralization, 300 DPI, PSM 6 single-block layout)
 *
 * To swap versions, simply change this constant:
 */
export const ACTIVE_OCR = 'version2' // 'version1' | 'version2'

// PCSO tickets print mostly in upper case, but month abbreviations like Sep or draw labels may use mixed case.
const TICKET_CHARS = '0123456789ABCDEFJMNOSabcdegiklmnopqrstu.,:-/\u20b1 '

let workerPromise = null
let progressHandler = null

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      logger: (message) => progressHandler?.(message),
    }).catch((error) => {
      workerPromise = null
      throw error
    })
  }
  return workerPromise
}

function fileToImage(file) {
  const url = URL.createObjectURL(file)
  return loadImage(url).finally(() => URL.revokeObjectURL(url))
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('That file could not be opened as an image.'))
    image.src = src
  })
}

async function toImageElement(source) {
  if (typeof source === 'string') return loadImage(source)
  if (source instanceof Blob) return fileToImage(source)
  if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) return source
  if (source instanceof ImageBitmap) return source
  throw new Error('Unsupported image input.')
}

// -----------------------------------------------------------------------------
// VERSION 1: Original OCR implementation
// -----------------------------------------------------------------------------

/**
 * V1 Preprocessing:
 * Snap to grayscale and stretch the global contrast across the entire image.
 */
export async function preprocessV1(source, maxWidth = 1800) {
  const element = await toImageElement(source)
  const naturalWidth = element.naturalWidth ?? element.width
  const naturalHeight = element.naturalHeight ?? element.height
  const scale = Math.min(1, maxWidth / naturalWidth)
  const width = Math.max(1, Math.round(naturalWidth * scale))
  const height = Math.max(1, Math.round(naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(element, 0, 0, width, height)

  const pixels = context.getImageData(0, 0, width, height)
  const { data } = pixels
  const gray = new Uint8ClampedArray(data.length / 4)

  let min = 255
  let max = 0
  for (let i = 0, g = 0; i < data.length; i += 4, g += 1) {
    const value = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000
    gray[g] = value
    if (value < min) min = value
    if (value > max) max = value
  }

  const span = Math.max(1, max - min)
  for (let i = 0, g = 0; i < data.length; i += 4, g += 1) {
    const stretched = ((gray[g] - min) / span) * 255
    data[i] = stretched
    data[i + 1] = stretched
    data[i + 2] = stretched
  }

  context.putImageData(pixels, 0, 0)
  return canvas
}

/**
 * V1 OCR Engine:
 * Standard Tesseract run with whitelist and default segmentation.
 */
export async function readTextV1(source, onProgress) {
  progressHandler = onProgress ?? null
  try {
    const canvas = await preprocessV1(source)
    const worker = await getWorker()
    await worker.setParameters({
      tessedit_char_whitelist: TICKET_CHARS,
      preserve_interword_spaces: '1',
    })
    const { data } = await worker.recognize(canvas)
    return data.text ?? ''
  } finally {
    progressHandler = null
  }
}

// -----------------------------------------------------------------------------
// VERSION 2: Enhanced High-Accuracy OCR implementation
// -----------------------------------------------------------------------------

/**
 * V2 Preprocessing:
 * 1. Grayscale luminance conversion.
 * 2. High-performance Bradley-Roth local adaptive thresholding (integral image)
 *    to neutralize shadows, phone reflections, and uneven thermal paper lighting.
 * 3. Dynamic contrast separation separating faint thermal ink from background stock.
 */
export async function preprocessV2(source, maxWidth = 1800) {
  const element = await toImageElement(source)
  const naturalWidth = element.naturalWidth ?? element.width
  const naturalHeight = element.naturalHeight ?? element.height
  const scale = Math.min(1, maxWidth / naturalWidth)
  const width = Math.max(1, Math.round(naturalWidth * scale))
  const height = Math.max(1, Math.round(naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(element, 0, 0, width, height)

  const pixels = context.getImageData(0, 0, width, height)
  const { data } = pixels
  const totalPixels = width * height

  // 1. Grayscale pass
  const gray = new Uint8ClampedArray(totalPixels)
  for (let i = 0, g = 0; i < data.length; i += 4, g += 1) {
    gray[g] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000
  }

  // 2. Compute 2D Integral Image for O(1) local mean calculations
  const integral = new Uint32Array((width + 1) * (height + 1))
  const intW = width + 1

  for (let y = 0; y < height; y += 1) {
    let rowSum = 0
    for (let x = 0; x < width; x += 1) {
      rowSum += gray[y * width + x]
      integral[(y + 1) * intW + (x + 1)] = integral[y * intW + (x + 1)] + rowSum
    }
  }

  // 3. Adaptive thresholding: local window of ~1/16th of width, threshold 14%
  const windowRadius = Math.max(4, Math.round(width / 32))
  const T = 0.14 // Pixel must be 14% darker than surrounding paper to be ink

  for (let y = 0; y < height; y += 1) {
    const y1 = Math.max(0, y - windowRadius)
    const y2 = Math.min(height - 1, y + windowRadius)

    for (let x = 0; x < width; x += 1) {
      const x1 = Math.max(0, x - windowRadius)
      const x2 = Math.min(width - 1, x + windowRadius)
      const count = (x2 - x1 + 1) * (y2 - y1 + 1)

      const sum =
        integral[(y2 + 1) * intW + (x2 + 1)] -
        integral[y1 * intW + (x2 + 1)] -
        integral[(y2 + 1) * intW + x1] +
        integral[y1 * intW + x1]

      const pixelIdx = (y * width + x) * 4
      const currentGray = gray[y * width + x]

      // If current pixel is significantly darker than local neighborhood mean -> ink (black), else paper (white)
      const isInk = currentGray * count < sum * (1 - T)
      const binaryVal = isInk ? 0 : 255

      data[pixelIdx] = binaryVal
      data[pixelIdx + 1] = binaryVal
      data[pixelIdx + 2] = binaryVal
      data[pixelIdx + 3] = 255
    }
  }

  context.putImageData(pixels, 0, 0)
  return canvas
}

/**
 * V2 OCR Engine:
 * 1. Adaptive binarized canvas.
 * 2. PSM 6 (Single uniform block of text) - ideal for single-column lotto slips.
 * 3. user_defined_dpi: 300 to calibrate LSTM character bounding boxes.
 */
export async function readTextV2(source, onProgress) {
  progressHandler = onProgress ?? null
  try {
    const canvas = await preprocessV2(source)
    const worker = await getWorker()
    await worker.setParameters({
      tessedit_char_whitelist: TICKET_CHARS,
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: '6', // PSM 6: Single block of text
      user_defined_dpi: '300',
    })
    const { data } = await worker.recognize(canvas)
    return data.text ?? ''
  } finally {
    progressHandler = null
  }
}

// -----------------------------------------------------------------------------
// Main Dispatcher: easily swapped via ACTIVE_OCR constant
// -----------------------------------------------------------------------------

export async function preprocess(source, maxWidth) {
  if (ACTIVE_OCR === 'version1') {
    return preprocessV1(source, maxWidth)
  }
  return preprocessV2(source, maxWidth)
}

export async function readText(source, onProgress) {
  if (ACTIVE_OCR === 'version1') {
    return readTextV1(source, onProgress)
  }
  return readTextV2(source, onProgress)
}
