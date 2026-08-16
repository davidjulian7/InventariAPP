import { useState, useRef, useCallback, useEffect } from 'react'

interface UseBarcodeScannerOptions {
  onDetect: (barcode: string) => void
  onError?: (error: Error) => void
}

export function useBarcodeScanner({ onDetect, onError }: UseBarcodeScannerOptions) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const quaggaRef = useRef<any>(null)

  const stopScanning = useCallback(() => {
    setScanning(false)
    setError(null)
  }, [])

  useEffect(() => {
    if (!scanning) return
    let cancelled = false
    let quaggaInstance: any = null
    let onDetectedHandler: ((data: any) => void) | null = null

    const start = async () => {
      setError(null)
      try {
        const mod: any = await import('quagga')
        const Quagga = mod.default || mod
        await new Promise(resolve => setTimeout(resolve, 80))
        if (cancelled) return
        if (!containerRef.current) return

        Quagga.init({
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: containerRef.current,
            constraints: {
              facingMode: 'environment',
              width: 640,
              height: 480,
            },
            area: { top: '15%', right: '10%', left: '10%', bottom: '15%' },
          },
          locator: { patchSize: 'medium', halfSample: true },
          numOfWorkers: 0,
          decoder: {
            readers: ['code_128_reader', 'ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_39_reader', 'codabar_reader'],
            multiple: false,
          },
          locate: true,
        }, (err: any) => {
          if (err) {
            if (cancelled) return
            const message = err.message || 'No se pudo acceder a la cámara'
            setError(message)
            setScanning(false)
            onError?.(err)
            return
          }
          if (cancelled) return
          quaggaInstance = Quagga
          quaggaRef.current = Quagga
          Quagga.start()
        })

        onDetectedHandler = (data: any) => {
          const code = data?.codeResult?.code
          if (!code || cancelled) return
          stopScanning()
          onDetect(code)
        }
        Quagga.onDetected(onDetectedHandler)
      } catch (err: any) {
        if (cancelled) return
        setError(err.message || 'Error al iniciar el escáner')
        setScanning(false)
        onError?.(err)
      }
    }

    start()

    return () => {
      cancelled = true
      if (onDetectedHandler && quaggaInstance) {
        try { quaggaInstance.offDetected(onDetectedHandler) } catch {}
      }
      if (quaggaInstance) {
        try { quaggaInstance.stop() } catch {}
      }
      quaggaRef.current = null
    }
  }, [scanning, onDetect, onError, stopScanning])

  return {
    scanning,
    error,
    containerRef,
    startScanning: () => setScanning(true),
    stopScanning,
  }
}