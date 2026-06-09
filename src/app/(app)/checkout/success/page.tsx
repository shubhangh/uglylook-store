'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'

export default function CheckoutSuccess() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCart()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }

    // Clear the cart on successful payment
    clearCart()
    setStatus('success')
  }, [sessionId, clearCart])

  if (status === 'loading') {
    return (
      <div className="container min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground font-mono text-sm">Processing your order...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="container min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Something went wrong.</p>
        <p className="text-sm text-muted-foreground">No session ID found. Your payment may still have been processed.</p>
        <Link href="/shop" className="font-mono text-xs uppercase tracking-widest text-olive-text hover:text-foreground transition-colors underline underline-offset-4">
          Back to shop
        </Link>
      </div>
    )
  }

  return (
    <div className="container min-h-[60vh] py-24">
      <div className="max-w-xl mx-auto text-center">
        <span className="font-mono text-xs text-olive-text tracking-[0.08em] uppercase block mb-4">
          ORDER CONFIRMED
        </span>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Got it.</h1>
        <p className="text-muted-foreground mb-8">
          Your payment was processed successfully. We&rsquo;ll send a confirmation email shortly.
        </p>

        <div className="bg-card border border-border rounded-lg p-8 mb-8 text-left">
          <h2 className="font-mono text-xs text-muted-foreground tracking-[0.08em] uppercase mb-6">
            What happens next
          </h2>
          <div className="space-y-4">
            {[
              { num: '01', text: 'Your order is sent to our print partner. Production starts within 24 hours.' },
              { num: '02', text: 'Printed, pressed, quality-checked, and packed. Takes 2–5 business days.' },
              { num: '03', text: 'Ships from the nearest hub. You\'ll get tracking by email.' },
            ].map((step) => (
              <div key={step.num} className="flex gap-4">
                <span className="font-mono text-xs text-olive-text shrink-0 mt-0.5">{step.num}</span>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-[4px] bg-olive text-cream px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-olive/90 transition-colors"
          >
            Keep browsing
          </Link>
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  )
}
