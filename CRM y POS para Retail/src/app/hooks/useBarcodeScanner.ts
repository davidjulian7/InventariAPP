import { useState, useRef, useCallback } from 'react'

interface UseBarcodeScannerOptions {
  onDetect: (barcode: string) => void
  onError?: (error: Error) => void
}

export function useBarcodeScanner({ onDetect, onError }: UseBarcodeScannerOptions) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<any>(null)

  const startScanning = useCallback(async () => {
    setScanning(true)
    setError(null)

    try {
      const { BrowserBarcodeReader } = await import('@zxing/browser')
      const { BrowserMultiFormatReader } = await import('@zxing/library')

      if (BrowserMultiFormatReader) {
        const codeReader = new BrowserMultiFormatReader()
        codeReaderRef.current = codeReader

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 },
        })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()

          codeReader.decodeFromVideoDevice(null, videoRef.current, (result: any, err: any) => {
            if (result) {
              onDetect(result.getText())
              stopScanning()
            }
          })
        }
      } else {
        const reader = new BrowserBarcodeReader()
        codeReaderRef.current = reader

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 },
        })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()

          reader.decodeFromVideoDevice(null, videoRef.current, (result: any, err: any) => {
            if (result) {
              onDetect(result.text || result.getText())
              stopScanning()
            }
          })
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error accessing camera')
      setScanning(false)
      onError?.(err)
    }
  }, [onDetect, onError])

  const stopScanning = useCallback(() => {
    if (codeReaderRef.current) {
      try { codeReaderRef.current.reset() } catch {}
      codeReaderRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }, [])

  return {
    scanning,
    error,
    videoRef,
    startScanning,
    stopScanning,
  }
}
