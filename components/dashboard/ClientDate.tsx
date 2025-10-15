"use client"
import { useEffect, useState } from "react"

export function ClientDate({ timestamp }: { timestamp: number }) {
  const [date, setDate] = useState("")
  useEffect(() => {
    setDate(new Date(timestamp).toLocaleString())
  }, [timestamp])
  return <>{date || new Date(timestamp).toISOString()}</>
}
