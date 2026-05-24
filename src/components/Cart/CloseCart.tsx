import clsx from 'clsx'
import { XIcon } from 'lucide-react'
import React from 'react'

export function CloseCart({ className }: { className?: string }) {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center rounded-[4px] border border-border text-foreground transition-colors">
      <XIcon className={clsx('h-5 transition-all ease-in-out hover:scale-110', className)} />
    </div>
  )
}
