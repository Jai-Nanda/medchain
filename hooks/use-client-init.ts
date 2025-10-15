'use client'

import { useState, useEffect } from 'react'

export function useClientInit() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}