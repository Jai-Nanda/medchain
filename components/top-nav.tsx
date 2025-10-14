"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import type { User } from "@/lib/types"

export default function TopNav({
  me,
  onLogout,
}: {
  me: User
  onLogout: () => void
}) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/placeholder-logo.png" alt="MedChain logo" width={28} height={28} />
          <span className="font-semibold">MedChain</span>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">
            {me.name} • {me.role}
          </span>
        </div>
        <Button variant="secondary" onClick={onLogout}>
          Log out
        </Button>
      </div>
    </header>
  )
}
