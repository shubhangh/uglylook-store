'use client'

import { Price } from '@/components/Price'
import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import type { Product } from '@/payload-types'

export function SimulatedCheckout() {
  const { user } = useAuth()
  const { cart, clearCart } = useCart()
  const router = useRouter()
  const [step, setStep] = useState<'cart' | 'shipping' | 'confirm' | 'done'>('cart')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [orderError, setOrderError] = useState('')

  const [shipping, setShipping] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: user?.email || '',
  })

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  if (step === 'done') {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <span className="font-mono text-xs text-olive-text tracking-[0.08em] uppercase block mb-4">
          ORDER CONFIRMED
        </span>
        <h1 className="text-[clamp(36px,5vw,64px)] font-bold tracking-[-0.03em] leading-[0.95] mb-6">
          Got it.
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          Order <span className="font-mono text-foreground text-sm">{orderNumber}</span>
        </p>
        <p className="text-muted-foreground mb-8">
          We&rsquo;ll send a confirmation to <span className="text-foreground">{shipping.email || user?.email}</span>.
        </p>

        <div className="bg-card rounded-lg border border-border p-6 text-left mb-8 space-y-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-olive-text flex items-center gap-2.5">
            <span className="w-[18px] h-px bg-olive inline-block" />
            What happens next
          </h2>
          <div className="space-y-3 text-sm text-foreground/70">
            <div className="flex items-start gap-3">
              <span className="font-mono text-olive-text text-xs mt-0.5">01</span>
              <p>Your order is sent to our print partner. Production starts within 24 hours.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-mono text-olive-text text-xs mt-0.5">02</span>
              <p>Printed, pressed, quality-checked, and packed. Takes 2&ndash;5 business days.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-mono text-olive-text text-xs mt-0.5">03</span>
              <p>Ships from the nearest hub. You&rsquo;ll get tracking by email.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/shop">Keep browsing</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] mb-4">Cart's empty.</h1>
        <p className="text-muted-foreground mb-6">Nothing here. That's on you.</p>
        <Button asChild>
          <Link href="/shop">See the catalog</Link>
        </Button>
      </div>
    )
  }

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'address', 'city', 'state', 'zip', 'email']
    const newErrors: Record<string, boolean> = {}
    let valid = true
    for (const field of required) {
      if (!shipping[field as keyof typeof shipping]?.trim()) {
        newErrors[field] = true
        valid = false
      }
    }
    setErrors(newErrors)
    return valid
  }

  // Auto-lookup city from ZIP code (US only)
  const lookupCity = async (zip: string) => {
    if (shipping.country !== 'US' || zip.length < 5) return
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
      if (res.ok) {
        const data = await res.json()
        const place = data.places?.[0]
        if (place) {
          setShipping((prev) => ({
            ...prev,
            city: place['place name'] || prev.city,
            state: place['state abbreviation'] || prev.state,
          }))
        }
      }
    } catch { /* ignore */ }
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) return
    setIsProcessing(true)
    setOrderError('')

    try {
      const res = await fetch('/next/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cartId: (cart as any)?.id || null,
          items: cart?.items?.map((item: any) => ({
            product: typeof item.product === 'object' ? item.product.id : item.product,
            variant: item.variant ? (typeof item.variant === 'object' ? item.variant.id : item.variant) : null,
            quantity: item.quantity || 1,
          })),
          shipping,
          email: shipping.email,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setOrderError(data.error || 'Something went wrong. Try again.')
        setIsProcessing(false)
        return
      }

      setOrderNumber(data.orderId)
      clearCart()
      setStep('done')
    } catch {
      setOrderError('Connection failed. Try again.')
    }
    setIsProcessing(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
      {/* Left: checkout steps */}
      <div className="flex flex-col gap-8">
        <header className="grid grid-cols-[80px_1fr] items-baseline gap-4 border-b border-input pb-6 max-md:grid-cols-1">
          <span className="font-mono text-xs text-olive-text tracking-[0.06em] uppercase whitespace-nowrap">
            CHECKOUT
          </span>
          <h1 className="text-[clamp(28px,4vw,48px)] font-bold tracking-[-0.03em] leading-[0.95]">
            Almost there.
          </h1>
        </header>

        {/* Contact */}
        <section>
          <h2 className="font-mono text-xs text-muted-foreground tracking-[0.1em] uppercase mb-4 flex items-center gap-2.5">
            <span className="w-[18px] h-px bg-olive inline-block" />
            01. Contact
          </h2>
          {user ? (
            <div className="bg-card rounded-lg p-5 border border-border">
              <p className="text-sm">
                Logged in as <span className="font-mono text-foreground">{user.email}</span>
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-lg p-5 border border-border space-y-4">
              <p className="text-sm text-muted-foreground">Checking out as guest.</p>
              <div>
                <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={shipping.email}
                  onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                  placeholder="you@somewhere.com"
                  className="w-full bg-transparent border-b border-input py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-olive transition-colors"
                />
              </div>
            </div>
          )}
        </section>

        {/* Shipping */}
        <section>
          <h2 className="font-mono text-xs text-muted-foreground tracking-[0.1em] uppercase mb-4 flex items-center gap-2.5">
            <span className="w-[18px] h-px bg-olive inline-block" />
            02. Shipping
          </h2>
          <div className="bg-card rounded-lg p-5 border border-border space-y-4">
            {/* Country — US only */}
            <div>
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">
                Country
              </label>
              <div className="border-b border-input py-2 text-sm text-foreground">
                United States
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'firstName', label: 'First name', placeholder: 'first name', autoComplete: 'given-name' },
                { key: 'lastName', label: 'Last name', placeholder: 'last name', autoComplete: 'family-name' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    autoComplete={field.autoComplete}
                    value={shipping[field.key as keyof typeof shipping]}
                    onChange={(e) => setShipping({ ...shipping, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className={`w-full bg-transparent border-b py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-olive transition-colors ${errors[field.key] ? 'border-red-500' : 'border-input'}`}
                  />
                  {errors[field.key] && <p className="mt-1 font-mono text-[10px] text-red-500">Required</p>}
                </div>
              ))}
            </div>

            {/* Phone */}
            <div>
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">
                Phone
              </label>
              <input
                type="tel"
                autoComplete="tel"
                value={shipping.phone}
                onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                placeholder="phone number"
                className="w-full bg-transparent border-b border-input py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-olive transition-colors"
              />
            </div>

            {/* Address */}
            <div>
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">
                Address
              </label>
              <input
                type="text"
                autoComplete="address-line1"
                value={shipping.address}
                onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                placeholder="street address"
                className={`w-full bg-transparent border-b py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-olive transition-colors ${errors.address ? 'border-red-500' : 'border-input'}`}
              />
              {errors.address && <p className="mt-1 font-mono text-[10px] text-red-500">Required</p>}
            </div>

            {/* ZIP → City + State row */}
            <div className="grid grid-cols-[120px_1fr_100px] gap-4">
              <div>
                <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">
                  ZIP
                </label>
                <input
                  type="text"
                  autoComplete="postal-code"
                  value={shipping.zip}
                  onChange={(e) => {
                    const zip = e.target.value
                    setShipping({ ...shipping, zip })
                    if (zip.length >= 5) lookupCity(zip)
                  }}
                  placeholder="zip"
                  className={`w-full bg-transparent border-b py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-olive transition-colors ${errors.zip ? 'border-red-500' : 'border-input'}`}
                />
                {errors.zip && <p className="mt-1 font-mono text-[10px] text-red-500">Required</p>}
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">
                  City
                </label>
                <input
                  type="text"
                  autoComplete="address-level2"
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  placeholder="city"
                  className={`w-full bg-transparent border-b py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-olive transition-colors ${errors.city ? 'border-red-500' : 'border-input'}`}
                />
                {errors.city && <p className="mt-1 font-mono text-[10px] text-red-500">Required</p>}
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">
                  State
                </label>
                <input
                  type="text"
                  autoComplete="address-level1"
                  value={shipping.state}
                  onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                  placeholder="state"
                  className={`w-full bg-transparent border-b py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-olive transition-colors ${errors.state ? 'border-red-500' : 'border-input'}`}
                />
                {errors.state && <p className="mt-1 font-mono text-[10px] text-red-500">Required</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Payment simulation */}
        <section>
          <h2 className="font-mono text-xs text-muted-foreground tracking-[0.1em] uppercase mb-4 flex items-center gap-2.5">
            <span className="w-[18px] h-px bg-olive inline-block" />
            03. Payment
          </h2>
          <div className="bg-card rounded-lg p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-olive animate-pulse" />
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.08em]">
                Demo mode — no real charges
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Payment is simulated. Click below to complete the order.
            </p>
            {orderError && (
              <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{orderError}</p>
              </div>
            )}
            {isProcessing && (
              <div className="mb-4 h-1 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-olive animate-pulse rounded-full" style={{ width: '100%', animation: 'pulse 1s ease-in-out infinite' }} />
              </div>
            )}
            <Button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Place order'}
            </Button>
          </div>
        </section>
      </div>

      {/* Right: order summary */}
      <div className="lg:sticky lg:top-[84px] lg:self-start">
        <div className="bg-card/50 rounded-lg border border-border p-6 space-y-6">
          <h2 className="font-mono text-xs text-muted-foreground tracking-[0.1em] uppercase">
            Order summary
          </h2>

          <div className="space-y-4">
            {cart?.items?.map((item, i) => {
              if (typeof item.product !== 'object' || !item.product) return null
              const product = item.product as Product
              const image =
                product.gallery?.[0]?.image && typeof product.gallery[0].image !== 'string'
                  ? product.gallery[0].image
                  : null
              const variant = item.variant
              let price = product.priceInUSD
              if (variant && typeof variant === 'object' && variant.priceInUSD) {
                price = variant.priceInUSD
              }

              return (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-lg border border-border bg-near-black overflow-hidden flex-shrink-0">
                    {image && (
                      <Media
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover"
                        resource={image}
                        width={64}
                        height={64}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{product.title}</p>
                    {variant && typeof variant === 'object' && (
                      <p className="text-xs text-muted-foreground font-mono capitalize">
                        {variant.options
                          ?.map((o: any) => (typeof o === 'object' ? o.label : null))
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      x{item.quantity}
                    </p>
                  </div>
                  {typeof price === 'number' && (
                    <Price amount={price} className="text-sm font-mono whitespace-nowrap" />
                  )}
                </div>
              )
            })}
          </div>

          <hr className="border-border" />

          <div className="flex justify-between items-baseline">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Total
            </span>
            <Price
              amount={cart?.subtotal || 0}
              className="text-2xl font-mono font-medium"
            />
          </div>

          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
            Shipping calculated at fulfillment. POD · DTG · printed when you ordered it.
          </p>
        </div>
      </div>
    </div>
  )
}
