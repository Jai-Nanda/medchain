"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { downloadRecordFile } from "@/lib/ledger"
import type { RecordItem } from "@/lib/types"

export default function HistoryList({ items }: { items: RecordItem[] }) {
  if (!items?.length) {
    return <div className="text-sm text-muted-foreground">No records yet.</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>File</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it) => (
          <TableRow key={it.id}>
            <TableCell>
              <Badge variant={it.type === "report" ? "default" : "secondary"}>{it.type}</Badge>
            </TableCell>
            <TableCell className="max-w-[280px] truncate">
              {it.title || (it.type === "update" ? "Doctor update" : "Report")}
            </TableCell>
            <TableCell className="max-w-[200px] truncate">{it.authorName}</TableCell>
            <TableCell>{new Date(it.createdAt).toLocaleString()}</TableCell>
            <TableCell>
              {it.fileId ? (
                <Button variant="outline" size="sm" onClick={() => downloadRecordFile(it.id)}>
                  Download
                </Button>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
