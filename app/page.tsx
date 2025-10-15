"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createAccount, login, getCurrentUser, getUserByEmail } from "@/lib/ledger"
import { MetaMaskAuth } from "@/components/metamask-auth"
import { ClientOnly } from "@/components/client-only"

// Main home component
export default function Home() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const me = getCurrentUser()
    if (me) router.replace("/dashboard")
  }, [router])

  return (
    <ClientOnly>
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
    </ClientOnly>
  )
}

function SigninForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="metamask-email">Email for MetaMask login</Label>
        <Input 
          id="metamask-email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email to connect with MetaMask"
          className="mb-2"
        />
        <MetaMaskAuth 
          role="patient"
          onSuccess={async (address) => {
            if (!email) {
              toast({ 
                title: "Email required", 
                description: "Please enter your email address",
                variant: "destructive" 
              })
              return
            }
            try {
              console.log("Attempting login with:", { email: email.trim(), address });
              const ok = await login(email.trim(), undefined, address)
              console.log("Login result:", ok);
              if (!ok) {
                toast({ 
                  title: "Authentication failed", 
                  description: "No account found with this email and wallet combination",
                  variant: "destructive" 
                })
              } else {
                const user = getCurrentUser()
                console.log("Current user after login:", user);
                toast({ 
                  title: "Welcome back!", 
                  description: `Logged in as ${user?.name || 'User'}`,
                })
                onSuccess()
              }
            } catch (error: any) {
              toast({ 
                title: "Sign in failed", 
                description: error.message || "Please try again",
                variant: "destructive" 
              })
            }
          }} 
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

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
          {loading ? "Signing in..." : "Sign in with Email"}
        </Button>
      </form>
    </div>
  )
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"patient" | "doctor">("patient")
  const [loading, setLoading] = useState(false)
  const [useMetaMask, setUseMetaMask] = useState(false)

  return (
    <div className="grid gap-4">
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
          <Button 
            type="button" 
            variant={role === "doctor" ? "default" : "secondary"} 
            onClick={() => setRole("doctor")}
          >
            Doctor
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Authentication Method</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={!useMetaMask ? "default" : "secondary"}
            onClick={() => setUseMetaMask(false)}
          >
            Password
          </Button>
          <Button 
            type="button" 
            variant={useMetaMask ? "default" : "secondary"} 
            onClick={() => setUseMetaMask(true)}
          >
            MetaMask
          </Button>
        </div>
      </div>

      {useMetaMask ? (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email2">Email</Label>
            <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <MetaMaskAuth 
            role={role}
            onSuccess={async (address) => {
              setLoading(true)
              try {
                // Validate inputs
                if (!name.trim() || !email.trim() || !address) {
                  throw new Error("Please fill in all required fields")
                }

                console.log("Creating account with:", {
                  name: name.trim(),
                  email: email.trim(),
                  role,
                  walletAddress: address
                });

                // Create account
                await createAccount({ 
                  name: name.trim(), 
                  email: email.trim(), 
                  role,
                  walletAddress: address 
                })

                // Verify account was created
                const user = await getUserByEmail(email.trim())
                console.log("Newly created user:", user);

                if (!user || user.authMethod !== 'metamask' || !user.walletAddress) {
                  throw new Error("Account creation failed - MetaMask data missing")
                }

                // Store the user data
                localStorage.setItem('medchain-user-data', JSON.stringify({
                  name: name.trim(),
                  email: email.trim(),
                  role,
                  walletAddress: address
                }));

                // Show success message and check login status
                const currentUser = getCurrentUser()
                if (currentUser) {
                  toast({ 
                    title: "Account created successfully!", 
                    description: `Welcome ${name.trim()}! You are registered as a ${role}.`
                  })
                  router.push("/dashboard")
                } else {
                  // Try to refresh the session
                  await login(email.trim(), undefined, address)
                  const refreshedUser = getCurrentUser()
                  if (refreshedUser) {
                    toast({ 
                      title: "Account created successfully!", 
                      description: `Welcome ${name.trim()}! You are registered as a ${role}.`
                    })
                    router.push("/dashboard")
                  } else {
                    throw new Error("Authentication failed after account creation. Please try signing in manually.")
                  }
                }
              } catch (err: any) {
                const msg = err?.message || "Sign up failed"
                toast({ title: msg, variant: "destructive" })
              } finally {
                setLoading(false)
              }
            }} 
          />
        </div>
      ) : (
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setLoading(true)
            try {
              await createAccount({ 
                name: name.trim(), 
                email: email.trim(), 
                password: password!, 
                role 
              })
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
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>
      )}
    </div>
  )
}
