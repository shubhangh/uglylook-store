'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CheckoutError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col rounded-lg border border-border bg-card p-8 md:p-12">
      <h2 className="text-xl font-semibold tracking-[-0.02em]">Checkout failed.</h2>
      <p className="my-2 text-muted-foreground">Your cart is still safe. Try again.</p>
      <div className="mt-4 flex gap-3">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button variant="secondary" asChild>
          <Link href="/shop">Back to shop</Link>
        </Button>
      </div>
    </div>
  )
}
