'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import detectEthereumProvider from "@metamask/detect-provider"
import { ethers } from "ethers"
import { ClientOnly } from "@/components/client-only"

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (request: { method: string; params?: Array<any> }) => Promise<any>
      on: (event: string, handler: (...args: any[]) => void) => void
      removeListener: (event: string, handler: (...args: any[]) => void) => void
      removeAllListeners: (event?: string) => void
      selectedAddress?: string | null
      chainId?: string
    }
  }
}

interface MetaMaskAuthProps {
  role: "patient" | "doctor"
  onSuccess: (address: string) => void
}

import React from 'react'

function MetaMaskAuthContent({ role, onSuccess }: MetaMaskAuthProps): React.ReactElement {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for MetaMask on mount
    if (window.ethereum) {
      setHasMetaMask(true)

      // Handle account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          toast({
            title: "Account disconnected",
            description: "Please reconnect your MetaMask wallet",
            variant: "destructive"
          })
        }
      }

      // Handle chain changes
      const handleChainChanged = (_chainId: string) => {
        window.location.reload()
      }

      const ethereum = window.ethereum
      if (ethereum) {
        ethereum.on('accountsChanged', handleAccountsChanged)
        ethereum.on('chainChanged', handleChainChanged)

        return () => {
          ethereum.removeListener('accountsChanged', handleAccountsChanged)
          ethereum.removeListener('chainChanged', handleChainChanged)
        }
      }
      window.ethereum.on('chainChanged', (_chainId: string) => {
        window.location.reload()
      })

      // Handle disconnect
      window.ethereum.on('disconnect', () => {
        toast({
          title: "MetaMask disconnected",
          description: "Please reconnect your MetaMask wallet",
          variant: "destructive"
        })
      })
    }

    return () => {
      // Cleanup listeners on unmount
      if (window.ethereum) {
        window.ethereum.removeAllListeners()
      }
    }
  }, [toast])

  const connectWallet = async () => {
    if (loading) return; // Prevent multiple clicks
    
    setLoading(true)
    try {
      // Check if MetaMask is installed
      if (typeof window === 'undefined' || !window.ethereum) {
        toast({ 
          title: "MetaMask not found",
          description: (
            <div className="flex flex-col gap-2">
              <p>Please install MetaMask browser extension</p>
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                Download MetaMask
              </a>
            </div>
          ),
          duration: 5000,
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Set up timeout for MetaMask connection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 30000) // 30 second timeout
      })

      // Ensure window.ethereum is ready and check provider
      await new Promise((resolve) => setTimeout(resolve, 100))
      const provider = await Promise.race([
        detectEthereumProvider(),
        timeoutPromise
      ]).catch(error => {
        if (error.message === 'Connection timeout') {
          throw new Error('MetaMask connection timed out. Please try again.')
        }
        throw error
      }) as typeof window.ethereum

      if (!provider || !provider.isMetaMask) {
        toast({ 
          title: "MetaMask not detected",
          description: "Please unlock your MetaMask wallet or switch to the MetaMask extension",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Get Ethereum provider
      const ethersProvider = new ethers.providers.Web3Provider(provider)

      // Ensure we're on the correct network (Ethereum Mainnet)
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }], // '0x1' is Ethereum Mainnet
        })
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          toast({ 
            title: "Network not found",
            description: "Please add Ethereum Mainnet to MetaMask",
            variant: "destructive"
          })
          setLoading(false)
          return
        }
        // User rejected the network switch
        if (switchError.code === 4001) {
          toast({ 
            title: "Network switch rejected",
            description: "Please switch to Ethereum Mainnet to continue",
            variant: "destructive"
          })
          setLoading(false)
          return
        }
        throw switchError
      }

      // Request account access with timeout
      const accounts = await Promise.race([
        provider.request({ method: 'eth_requestAccounts' }),
        timeoutPromise
      ]) as string[];

      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        throw new Error("No accounts found. Please make sure your wallet is unlocked.")
      }

      // Get the connected wallet address
      const address = accounts[0]

      // Create a message to sign
      const message = `Sign this message to authenticate with MedChain as ${role}\nTimestamp: ${Date.now()}`
      
      // Request signature from user with timeout
      const signaturePromise = provider.request({
        method: 'personal_sign',
        params: [message, address]
      })

      try {
        const signature = await Promise.race([
          signaturePromise,
          timeoutPromise
        ]) as string

        if (!signature) {
          throw new Error("Failed to sign message")
        }

        // Verify signature
        const signerAddr = ethers.utils.verifyMessage(message, signature)

        // Verify the recovered address matches the connected address
        if (signerAddr.toLowerCase() !== address.toLowerCase()) {
          throw new Error("Signature verification failed")
        }
      
        // Success - verified signature matches the address
        onSuccess(address)
      } catch (error: any) {
        if (error.code === 4001) {
          toast({ 
            title: "Signature declined",
            description: "Please sign the message to authenticate",
            variant: "destructive"
          })
        } else if (error.message === 'Connection timeout') {
          toast({ 
            title: "Signature timeout",
            description: "The request to sign timed out. Please try again.",
            variant: "destructive"
          })
        } else {
          toast({ 
            title: "Signature error",
            description: error.message || "Failed to complete authentication",
            variant: "destructive"
          })
        }
        throw error
      }
    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred"
      setError(errorMessage)
      toast({ 
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset error state when starting a new connection attempt
  useEffect(() => {
    if (loading) {
      setError(null)
    }
  }, [loading])

  if (!hasMetaMask) {
    return (
      <a 
        href="https://metamask.io/download/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full"
      >
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M34.0125 1L19.7625 10.7833L22.1958 5.03333L34.0125 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 1L15.1583 10.8667L12.8167 5.03333L1 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M29.0792 23.5833L25.4125 28.9333L33.2625 31L35.4875 23.75L29.0792 23.5833Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M0.5625 23.75L2.77917 31L10.6292 28.9333L6.97083 23.5833L0.5625 23.75Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Install MetaMask
        </Button>
      </a>
    )
  }

  return (
    <Button 
      onClick={connectWallet} 
      disabled={loading}
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Connecting...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M34.0125 1L19.7625 10.7833L22.1958 5.03333L34.0125 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 1L15.1583 10.8667L12.8167 5.03333L1 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M29.0792 23.5833L25.4125 28.9333L33.2625 31L35.4875 23.75L29.0792 23.5833Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M0.5625 23.75L2.77917 31L10.6292 28.9333L6.97083 23.5833L0.5625 23.75Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Connect with MetaMask
        </>
      )}
    </Button>
  )
}

export function MetaMaskAuth(props: MetaMaskAuthProps) {
  return (
    <ClientOnly>
      <MetaMaskAuthContent {...props} />
    </ClientOnly>
  )
}