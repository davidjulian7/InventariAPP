import { useState, useEffect } from 'react'

export function useBreakpoint() {
  const getW = () => (typeof window !== 'undefined' ? window.innerWidth : 1280)
  const [w, setW] = useState(getW)

  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  return {
    isMobile: w < 768,
    isTablet: w >= 768 && w < 1024,
    isDesktop: w >= 1024,
    width: w,
  }
}
