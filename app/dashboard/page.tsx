"use client"

import useSWR, { mutate } from "swr"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import TopNav from "@/components/top-nav"
import { getCurrentUser, logout, listMyPermissions, getPatientHistory, getLedger, verifyChain } from "@/lib/ledger"
import RecordUpload from "@/components/dashboard/record-upload"
import DoctorUpdate from "@/components/dashboard/doctor-update"
import HistoryList from "@/components/dashboard/history-list"
import PermissionsPanel from "@/components/dashboard/permissions"
import LedgerView from "@/components/dashboard/ledger-view"
import { useMemo, useState, useEffect } from "react"
import type { User } from "@/lib/types"

const fetcher = async (key: string, ...args: any[]) => {
  switch (key) {
    case "me":
      return getCurrentUser()
    default:
      return null
  }
}

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: me } = useSWR<User | null>("me", fetcher)
  // Fix: Use a consistent key for permissions and correct type
  const { data: perms } = useSWR<any>(me ? ["perms", me.id] : null, listMyPermissions)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  useEffect(() => {
    // Only redirect if me is explicitly null (not undefined)
    if (typeof window !== "undefined" && me === null) {
      router.replace("/")
    }
  }, [me, router])

  // Prevent rendering until me is loaded (either a user or null)
  if (me === undefined) return null

  const patients = useMemo(() => {
    if (!me || !perms) return []
    if (me.role === "patient") return [me]
    // doctor -> patients who granted access
    return perms.patients
  }, [me, perms])
  const activePatientId = selectedPatientId || (patients[0]?.id ?? null)

  const { data: history } = useSWR(activePatientId ? ["history", activePatientId] : null, async () =>
    getPatientHistory(activePatientId!),
  )
  const { data: ledger } = useSWR(activePatientId ? ["ledger", activePatientId] : null, async () =>
    getLedger(activePatientId!),
  )
  const verified = useMemo(() => (ledger ? verifyChain(ledger) : null), [ledger])

  if (!me) return null

  return (
    <main className="min-h-screen">
      <TopNav
        me={me!}
        onLogout={() => {
          logout()
          mutate("me")
          router.replace("/")
        }}
      />

      <div className="mx-auto max-w-6xl p-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Dashboard</CardTitle>
            <CardDescription className="text-pretty">
              {me?.role === "patient"
                ? "Upload your reports, manage who can access them, and audit your tamper-evident history."
                : "View patients who granted access, add verified updates, and audit their history."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Enable patient selector for doctors */}
            {me?.role === "doctor" && (
              <div className="mb-4 flex items-center gap-3">
                <label className="text-sm">Select patient:</label>
                <select
                  className="border rounded-md px-2 py-1 bg-background"
                  value={activePatientId ?? ""}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  {patients.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Tabs defaultValue="records" className="w-full">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="records">Records</TabsTrigger>
                <TabsTrigger value="permissions">Access</TabsTrigger>
                <TabsTrigger value="ledger">Ledger</TabsTrigger>
              </TabsList>

              <TabsContent value="records" className="pt-4 grid gap-4 md:grid-cols-2">
                <Card className="order-2 md:order-1">
                  <CardHeader>
                    <CardTitle>History</CardTitle>
                    <CardDescription>All reports and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HistoryList items={history ?? []} />
                  </CardContent>
                </Card>

                <Card className="order-1 md:order-2">
                  <CardHeader>
                    <CardTitle>{me?.role === "patient" ? "Upload report" : "Add doctor update"}</CardTitle>
                    <CardDescription>
                      {me?.role === "patient"
                        ? "Upload a medical report. A new ledger block will be appended."
                        : "Add a verified note/update for the selected patient."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {me?.role === "patient" ? (
                      <RecordUpload
                        patientId={me.id}
                        onDone={() => {
                          mutate(["history", me.id])
                          mutate(["ledger", me.id])
                        }}
                      />
                    ) : (
                      <DoctorUpdate
                        doctorId={me!.id}
                        patientId={activePatientId ?? ""}
                        canUpdate={Boolean(activePatientId)}
                        onDone={() => {
                          // Always use the latest activePatientId
                          if (activePatientId) {
                            mutate(["history", activePatientId])
                            mutate(["ledger", activePatientId])
                          }
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="permissions" className="pt-4">
                <PermissionsPanel
                  me={me!}
                  onChanged={() => {
                    mutate(["perms", me!.id])
                  }}
                />
              </TabsContent>

              <TabsContent value="ledger" className="pt-4">
                <LedgerView
                  blocks={ledger ?? []}
                  verified={verified?.ok ?? false}
                  failures={verified?.failures ?? []}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
