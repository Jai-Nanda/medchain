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
      const ok = await login(email.trim(), undefined, address)
      if (!ok) {
        toast({ 
          title: "Authentication failed", 
          description: "No account found with this email and wallet combination",
          variant: "destructive" 
        })
      } else {
        // Redirect to dashboard on success
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