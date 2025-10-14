"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createAccount, login, getCurrentUser } from "@/lib/ledger"

// Simple, user-friendly landing page with Auth
export default function Home() {
  const router = useRouter()
  const { toast } = useToast()

  // Redirect if already logged in
  if (typeof window !== "undefined") {
    const me = getCurrentUser()
    if (me) router.replace("/dashboard")
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-balance">MedChain — Secure Medical Records</CardTitle>
          <CardDescription className="text-pretty">
            Patients own their data. Doctors add verified updates. Tamper-evident history on a local blockchain ledger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="pt-4">
              <SigninForm
                onSuccess={() => {
                  toast({ title: "Welcome back!" })
                  router.push("/dashboard")
                }}
              />
            </TabsContent>
            <TabsContent value="signup" className="pt-4">
              <SignupForm
                onSuccess={() => {
                  toast({ title: "Account created" })
                  router.push("/dashboard")
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}

function SigninForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
          const ok = await login(email.trim(), password)
          if (!ok) {
            toast({ title: "Invalid credentials", variant: "destructive" })
          } else {
            onSuccess()
          }
        } catch {
          toast({ title: "Sign in failed", variant: "destructive" })
        } finally {
          setLoading(false)
        }
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"patient" | "doctor">("patient")
  const [loading, setLoading] = useState(false)

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
          await createAccount({ name: name.trim(), email: email.trim(), password, role })
          onSuccess()
        } catch (err: any) {
          const msg = err?.message || "Sign up failed"
          toast({ title: msg, variant: "destructive" })
        } finally {
          setLoading(false)
        }
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email2">Email</Label>
        <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password2">Password</Label>
        <Input id="password2" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>Role</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={role === "patient" ? "default" : "secondary"}
            onClick={() => setRole("patient")}
          >
            Patient
          </Button>
          <Button type="button" variant={role === "doctor" ? "default" : "secondary"} onClick={() => setRole("doctor")}>
            Doctor
          </Button>
        </div>
      </div>
      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? "Creating..." : "Create account"}
      </Button>
    </form>
  )
}
