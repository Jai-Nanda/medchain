"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAllDoctors, getAllPatients, grantAccess, revokeAccess, listMyPermissions } from "@/lib/ledger"
import type { User } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

export default function PermissionsPanel({
  me,
  onChanged,
}: {
  me: User
  onChanged?: () => void
}) {
  const { toast } = useToast()
  const { data: perms } = useSWR(["perms", me.id], async () => listMyPermissions())
  const [query, setQuery] = useState("")

  const { data: list } = useSWR(me.role === "patient" ? ["doctors", query] : ["patients", query], async () => {
    const q = query.trim().toLowerCase()
    if (me.role === "patient") {
      const all = await getAllDoctors()
      return all.filter((d) => d.email.toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
    } else {
      const all = await getAllPatients()
      return all.filter((p) => p.email.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
    }
  })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Current access</CardTitle>
          <CardDescription>
            {me.role === "patient"
              ? "Doctors you’ve allowed to view your records."
              : "Patients who granted you access."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2">
            {(me.role === "patient" ? perms?.doctors : perms?.patients)?.map((u: any) => (
              <li key={u.id} className="flex items-center justify-between border rounded-md p-2">
                <div className="text-sm">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-muted-foreground">{u.email}</div>
                </div>
                {me.role === "patient" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await revokeAccess(me.id, u.id)
                      mutate(["perms", me.id])
                      onChanged?.()
                    }}
                  >
                    Revoke
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground pr-2">Granted</span>
                )}
              </li>
            )) ?? <span className="text-sm text-muted-foreground">No entries</span>}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{me.role === "patient" ? "Grant access" : "Your patients"}</CardTitle>
          <CardDescription>
            {me.role === "patient" ? "Search doctors by name or email" : "Search patients by name or email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Input
              placeholder={me.role === "patient" ? "Find doctors..." : "Find patients..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="grid gap-2">
            {list?.map((u: any) => (
              <li key={u.id} className="flex items-center justify-between border rounded-md p-2">
                <div className="text-sm">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-muted-foreground">{u.email}</div>
                </div>
                {me.role === "patient" ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await grantAccess(me.id, u.id)
                      mutate(["perms", me.id])
                      onChanged?.()
                      toast({ title: "Access granted" })
                    }}
                  >
                    Grant
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground pr-2">View-only</span>
                )}
              </li>
            )) ?? <span className="text-sm text-muted-foreground">No matches</span>}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
