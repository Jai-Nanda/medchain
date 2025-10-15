"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ClientDate } from "./ClientDate"

export default function LedgerView({
  blocks,
  verified,
  failures,
}: {
  blocks: Array<{
    id: string
    index: number
    prevHash: string
    hash: string
    timestamp: number
    payloadType: string
    authorName: string
  }>
  verified: boolean
  failures: { index: number; reason: string }[]
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Blockchain ledger</CardTitle>
          <CardDescription>Append-only blocks with hash chaining</CardDescription>
        </div>
        <Badge variant={verified ? "default" : "destructive"}>{verified ? "Verified" : "Tamper detected"}</Badge>
      </CardHeader>
      <CardContent>
        {failures?.length ? (
          <div className="mb-4">
            <div className="text-sm font-medium">Verification failures:</div>
            <ul className="list-disc pl-5 text-sm text-destructive">
              {failures.map((f) => (
                <li key={f.index}>
                  Block {f.index}: {f.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ScrollArea className="h-72 border rounded-md">
          <ul className="divide-y">
            {blocks.map((b) => (
              <li key={b.id} className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Block #{b.index}</div>
                  <div className="text-muted-foreground"><ClientDate timestamp={b.timestamp} /></div>
                </div>
                <div className="mt-1 grid gap-1">
                  <div>
                    <span className="text-muted-foreground">Author:</span> {b.authorName}
                  </div>
                  <div className="truncate">
                    <span className="text-muted-foreground">Hash:</span> {b.hash}
                  </div>
                  <div className="truncate">
                    <span className="text-muted-foreground">Prev:</span> {b.prevHash}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span> {b.payloadType}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
