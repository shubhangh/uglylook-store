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
      className="text-[13px] font-medium border border-input rounded-[4px] px-4 py-2.5 text-foreground bg-transparent cursor-pointer transition-colors hover:border-olive"
      aria-label={`Shopping bag, ${quantity || 0} items`}
      {...rest}
    >
      Bag (<span key={quantity} className="inline-block animate-cart-bump">{quantity || 0}</span>)
    </button>
  )
}
