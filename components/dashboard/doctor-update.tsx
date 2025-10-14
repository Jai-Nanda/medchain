"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { addDoctorUpdate } from "@/lib/ledger"

export default function DoctorUpdate({
  doctorId,
  patientId,
  canUpdate,
  onDone,
}: {
  doctorId: string
  patientId: string
  canUpdate: boolean
  onDone?: () => void
}) {
  const { toast } = useToast()
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!canUpdate || !patientId) {
          toast({ title: "Select a patient first", variant: "destructive" })
          return
        }
        if (!note.trim()) return
        setLoading(true)
        try {
          await addDoctorUpdate(doctorId, patientId, note.trim())
          setNote("")
          toast({ title: "Update added" })
          onDone?.()
        } catch (err: any) {
          toast({ title: err?.message || "Failed to add update", variant: "destructive" })
        } finally {
          setLoading(false)
        }
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="note">Doctor note</Label>
        <Textarea
          id="note"
          placeholder="e.g., Diagnosis confirmed. Prescribed..."
          rows={6}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={!canUpdate || loading}>
        {loading ? "Adding..." : "Add update"}
      </Button>
    </form>
  )
}
