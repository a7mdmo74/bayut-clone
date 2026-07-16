'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCheckout } from '@/lib/api/payments-client'
import type { CreateCheckoutInput } from '@repo/types'

interface CheckoutButtonProps {
  input: CreateCheckoutInput
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
}

export function CheckoutButton({
  input,
  children,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await createCheckout(input)

      // Redirect to the provider's hosted checkout page
      if (response && response.redirectUrl) {
        window.location.href = response.redirectUrl
      } else {
        setError('Failed to initiate checkout. Please try again.')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during checkout')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || isLoading}
        onClick={handleCheckout}
      >
        {isLoading ? 'Redirecting to secure checkout…' : children}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
