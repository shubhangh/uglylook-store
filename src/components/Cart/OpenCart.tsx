import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  return (
    <button
      className="font-mono text-[13px] border border-input rounded-[4px] px-4 py-2.5 text-foreground bg-transparent cursor-pointer transition-colors hover:border-olive"
      aria-label={`Shopping bag, ${quantity || 0} items`}
      {...rest}
    >
      Bag ({quantity || 0})
    </button>
  )
}
