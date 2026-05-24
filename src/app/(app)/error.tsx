'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col rounded-lg border border-border bg-card p-8 md:p-12">
      <h2 className="text-xl font-semibold tracking-[-0.02em]">That didn't work.</h2>
      <p className="my-2 text-muted-foreground">
        Try again, or don't.
      </p>
      <Button className="mt-4" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  )
}
