import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center bg-background">
      <div className="container text-center py-24">
        <span className="font-mono text-[11px] tracking-widest text-olive-text uppercase block mb-4">
          ERR / 404
        </span>
        <h1
          className="font-sans text-5xl font-bold leading-[0.95] text-foreground md:text-7xl lg:text-8xl mb-6"
          style={{ letterSpacing: '-0.03em' }}
        >
          Personality
          <br />
          not found.
        </h1>
        <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto">
          Whatever you were looking for isn&rsquo;t here. It might have existed once.
          It might never have. Either way, this is what you get.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/shop">See the catalog</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
