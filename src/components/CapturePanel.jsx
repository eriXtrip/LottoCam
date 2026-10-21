import { useEffect, useRef, useState } from 'react'

function cameraMessage(cause) {
  const name = cause?.name
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera access was blocked. Allow it in your browser settings, or choose a saved photo instead.'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera was found on this device. Choose a saved photo instead.'
  }
  return 'The camera could not start. Choose a saved photo instead.'
}

/* The captured frame is held on screen for this long while the scan plays. */
const SCAN_MS = 3000

/* Scattered ripple origins inside the guide frame. The animation loops while a
   scan is running, so the delays spread one 1.5s cycle instead of a 3s pass. */
const SCAN_RIPPLES = [
  { x: '24%', y: '26%', delay: 0 },
  { x: '70%', y: '34%', delay: 250 },
  { x: '46%', y: '52%', delay: 500 },
  { x: '18%', y: '66%', delay: 750 },
  { x: '76%', y: '74%', delay: 1000 },
  { x: '42%', y: '84%', delay: 1250 },
]

/* Maps the guide frame's on-screen box to source pixels of a video rendered
   with object-fit: cover, so the capture keeps only the framed ticket. */
function frameSourceRect(video, frame) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  const videoBox = video.getBoundingClientRect()
  const frameBox = frame?.getBoundingClientRect()
  if (!vw || !vh || !frameBox || !videoBox.width || !videoBox.height) return null

  const scale = Math.max(videoBox.width / vw, videoBox.height / vh)
  const drawnWidth = vw * scale
  const drawnHeight = vh * scale
  const offsetX = (drawnWidth - videoBox.width) / 2
  const offsetY = (drawnHeight - videoBox.height) / 2

  const x = (frameBox.left - videoBox.left + offsetX) / scale
  const y = (frameBox.top - videoBox.top + offsetY) / scale
  const width = frameBox.width / scale
  const height = frameBox.height / scale

  const sx = Math.min(Math.max(x, 0), vw - 1)
  const sy = Math.min(Math.max(y, 0), vh - 1)
  const sw = Math.min(Math.max(width, 1), vw - sx)
  const sh = Math.min(Math.max(height, 1), vh - sy)
  if (sw < 1 || sh < 1) return null
  return { sx, sy, sw, sh }
}

export default function CapturePanel({ disabled, onImage, preview, extracting }) {
  const videoRef = useRef(null)
  const frameRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [starting, setStarting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [shotUrl, setShotUrl] = useState('')
  const [error, setError] = useState('')
  const scanTimerRef = useRef(null)
  const shotObjectRef = useRef(null)

  /* The ripples run from the shutter through the whole OCR pass, so the stage
     keeps them until the parent says extraction is done. */
  const scanningActive = scanning || Boolean(extracting)
  const scanImage = shotUrl || preview

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
      if (shotObjectRef.current) URL.revokeObjectURL(shotObjectRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    const stream = streamRef.current
    if (streaming && video && stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream
      }
      video.playsInline = true
      video.muted = true
      video.play().catch(() => { })
    }
  }, [streaming])

  const attachVideo = (video) => {
    videoRef.current = video
    if (video && streamRef.current) {
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current
      }
      video.playsInline = true
      video.muted = true
      video.play().catch(() => { })
    }
  }

  async function startCamera() {
    if (starting || streaming) return
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser or connection does not allow camera access. Choose a photo instead.')
      return
    }

    setStarting(true)
    try {
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
      } catch (err) {
        if (err?.name === 'OverconstrainedError' || err?.name === 'TypeError') {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
        } else {
          throw err
        }
      }

      streamRef.current = stream
      setStreaming(true)
    } catch (cause) {
      setError(cameraMessage(cause))
    } finally {
      setStarting(false)
    }
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStreaming(false)
  }

  function clearShot() {
    if (shotObjectRef.current) {
      URL.revokeObjectURL(shotObjectRef.current)
      shotObjectRef.current = null
    }
    setShotUrl('')
  }

  function stopCamera() {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current)
      scanTimerRef.current = null
    }
    setScanning(false)
    clearShot()
    stopStream()
  }

  /* Uploaded photos play the same 3s ripple before they are handed off. */
  function scanUpload(file) {
    if (scanning) return
    const url = URL.createObjectURL(file)
    shotObjectRef.current = url
    stopStream()
    setShotUrl(url)
    setScanning(true)
    scanTimerRef.current = setTimeout(() => {
      scanTimerRef.current = null
      onImage(file)
      clearShot()
      setScanning(false)
    }, SCAN_MS)
  }

  function capture() {
    const video = videoRef.current
    if (scanning) return
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('The camera has not produced a frame yet. Wait a moment, then try again.')
      return
    }
    const crop = frameSourceRect(video, frameRef.current)
    const canvas = document.createElement('canvas')
    canvas.width = crop ? Math.round(crop.sw) : video.videoWidth
    canvas.height = crop ? Math.round(crop.sh) : video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError('Could not process the camera frame. Try taking another photo.')
      return
    }
    const started = performance.now()
    if (crop) {
      ctx.drawImage(
        video,
        Math.round(crop.sx),
        Math.round(crop.sy),
        Math.round(crop.sw),
        Math.round(crop.sh),
        0,
        0,
        canvas.width,
        canvas.height,
      )
    } else {
      ctx.drawImage(video, 0, 0)
    }

    stopStream()
    setShotUrl(canvas.toDataURL('image/jpeg', 0.92))
    setScanning(true)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setScanning(false)
          clearShot()
          setError('Could not save the camera frame. Try scanning again.')
          return
        }
        scanTimerRef.current = setTimeout(
          () => {
            scanTimerRef.current = null
            onImage(blob)
            clearShot()
            setScanning(false)
          },
          Math.max(0, SCAN_MS - (performance.now() - started)),
        )
      },
      'image/jpeg',
      0.92,
    )
  }

  function pickFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || scanning) return
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image. Choose a photo instead.')
      return
    }
    scanUpload(file)
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    if (disabled || scanning) return
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) scanUpload(file)
  }

  return (
    <section className="panel panel--stub panel--raised" data-stub="Camera" aria-labelledby="capture-title">
      <div className="panel__head">
        <h2 id="capture-title" className="panel__title">
          Photograph the ticket
        </h2>
        <span className="panel__note">Reads on your device</span>
      </div>

      <div className="capture-stage">
        {scanningActive && scanImage ? (
          <>
            <img src={scanImage} alt="The ticket frame you just captured" />
            <div className="ticket-guide__ripples" aria-hidden="true">
              {SCAN_RIPPLES.map((ripple) => (
                <span
                  key={`${ripple.x}-${ripple.y}`}
                  className="ticket-guide__ripple"
                  style={{ '--x': ripple.x, '--y': ripple.y, '--d': `${ripple.delay}ms` }}
                />
              ))}
            </div>
          </>
        ) : streaming ? (
          <>
            <video ref={attachVideo} autoPlay muted playsInline />
            <div className="ticket-guide" aria-hidden="true">
              <div className="ticket-guide__frame" ref={frameRef}>
                <span className="ticket-guide__corner ticket-guide__corner--tl" />
                <span className="ticket-guide__corner ticket-guide__corner--tr" />
                <span className="ticket-guide__corner ticket-guide__corner--bl" />
                <span className="ticket-guide__corner ticket-guide__corner--br" />
                <span className="ticket-guide__label">Place ticket here</span>
              </div>
            </div>
          </>
        ) : preview ? (
          <img src={preview} alt="The ticket photo you captured" />
        ) : (
          <p className="capture-stage__hint">
            The camera is off. Align the ticket within the guide, then scan.
          </p>
        )}
      </div>

      <div className="capture-actions">
        {scanning ? (
          <>
            <button type="button" className="btn btn--primary" disabled>
              Scanning…
            </button>
            <button type="button" className="btn btn--ghost" onClick={stopCamera}>
              Cancel
            </button>
          </>
        ) : streaming ? (
          <>
            <button
              type="button"
              className="btn btn--primary"
              onClick={capture}
              disabled={disabled}
            >
              Scan
            </button>
            <button type="button" className="btn btn--ghost" onClick={stopCamera} disabled={disabled}>
              Stop camera
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={startCamera}
            disabled={disabled || starting}
          >
            {starting ? 'Opening camera…' : 'Start camera'}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={pickFile}
          tabIndex={-1}
        />
      </div>

      <button
        type="button"
        className={dragging ? 'capture-drop is-dragging' : 'capture-drop'}
        onClick={() => {
          if (!disabled && !scanning) fileRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={disabled || scanning}
      >
        <span className="capture-drop__label">
          <span className="capture-drop__action">Choose a photo</span> or drop it here
        </span>
        <span className="capture-drop__hint">
          Use a bright, straight-on shot. Only the printed combination and draw date need to be
          legible.
        </span>
      </button>

      {extracting ? (
        <p className="capture-note" role="status">
          <span className="capture-note__dot" aria-hidden="true" />
          Scanning…
        </p>
      ) : null}

      {error ? (
        <div className="status status--error" role="alert">
          <p className="status__title">Camera problem</p>
          <p>{error}</p>
        </div>
      ) : null}
    </section>
  )
}
