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

export default function CapturePanel({ disabled, onImage, preview }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [starting, setStarting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
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

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStreaming(false)
  }

  function capture() {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('The camera has not produced a frame yet. Wait a moment, then try again.')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError('Could not process the camera frame. Try taking another photo.')
      return
    }
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onImage(blob)
          stopCamera()
        }
      },
      'image/jpeg',
      0.92,
    )
  }

  function pickFile(event) {
    const file = event.target.files?.[0]
    if (file) {
      if (streaming) stopCamera()
      onImage(file)
    }
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (streaming) stopCamera()
      onImage(file)
    }
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
        {streaming ? (
          <>
            <video ref={attachVideo} autoPlay muted playsInline />
            <div className="ticket-guide" aria-hidden="true">
              <div className="ticket-guide__frame">
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
        {streaming ? (
          <>
            <button type="button" className="btn btn--primary" onClick={capture} disabled={disabled}>
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
          if (!disabled) fileRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={disabled}
      >
        <span className="capture-drop__label">
          <span className="capture-drop__action">Choose a photo</span> or drop it here
        </span>
        <span className="capture-drop__hint">
          Use a bright, straight-on shot. Only the printed combination and draw date need to be
          legible.
        </span>
      </button>

      {error ? (
        <div className="status status--error" role="alert">
          <p className="status__title">Camera problem</p>
          <p>{error}</p>
        </div>
      ) : null}
    </section>
  )
}
