'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ShopError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col rounded-lg border border-border bg-card p-8 md:p-12">
      <h2 className="text-xl font-semibold tracking-[-0.02em]">Shop hit a wall.</h2>
      <p className="my-2 text-muted-foreground">Something broke loading products.</p>
      <div className="mt-4 flex gap-3">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button variant="secondary" asChild>
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  )
}
