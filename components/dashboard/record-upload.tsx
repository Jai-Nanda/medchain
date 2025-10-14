"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { addReport } from "@/lib/ledger"

export default function RecordUpload({
  patientId,
  onDone,
}: {
  patientId: string
  onDone?: () => void
}) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!file && !title.trim()) return
        setLoading(true)
        try {
          await addReport(patientId, { title: title.trim(), file })
          toast({ title: "Report added" })
          setFile(null)
          setTitle("")
          onDone?.()
        } catch (e) {
          toast({ title: "Failed to add report", variant: "destructive" })
        } finally {
          setLoading(false)
        }
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g., MRI scan 2025-10-01"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="file">File (optional)</Label>
        <Input id="file" type="file" onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)} />
      </div>
      <Button disabled={loading} type="submit">
        {loading ? "Uploading..." : "Add report"}
      </Button>
    </form>
  )
}
