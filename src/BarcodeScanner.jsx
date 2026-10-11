
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const onDetectedRef = useRef(onDetected)

  const [starting, setStarting] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Preparing camera...')

  // Always use the latest callback from App.jsx
  onDetectedRef.current = onDetected

  useEffect(() => {
    let cancelled = false
    let handled = false

    const reader = new BrowserMultiFormatReader()

    async function startScanner() {
      console.log('[Scanner] Component started')
      setStatus('Requesting camera permission...')

      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, scanError) => {
            if (cancelled || handled) return

            if (result) {
              const value = result.getText().trim()

              console.log('[Scanner] BARCODE DETECTED:', value)

              if (value) {
                handled = true
                setStatus(`Barcode detected: ${value}`)
                controlsRef.current?.stop()
                onDetectedRef.current(value)
              }
            }
          }
        )

        controlsRef.current = controls

        if (!cancelled) {
          console.log('[Scanner] Camera started successfully')
          setStarting(false)
          setStatus('Camera running. Point it at your barcode.')
        } else {
          controls.stop()
        }
      } catch (err) {
        console.error('[Scanner] Camera startup failed:', err)

        if (!cancelled) {
          setStarting(false)
          setError(err?.message || 'Could not start the camera.')
          setStatus('Camera failed to start.')
        }
      }
    }

    startScanner()

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [])

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-heading">
          <div>
            <h2>Scan Student ID</h2>
            <p>Keep the barcode inside the camera view.</p>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <video
          ref={videoRef}
          className="scanner-video"
          muted
          autoPlay
          playsInline
        />

        {starting && <p>Starting camera...</p>}
        {error && <p className="scanner-error">{error}</p>}
        <p>{status}</p>

        <button type="button" onClick={onClose}>
          Cancel scanning
        </button>
      </div>
    </div>
  )
}
