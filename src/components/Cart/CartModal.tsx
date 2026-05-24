'use client'

import { Price } from '@/components/Price'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { OpenCartButton } from './OpenCart'
import { Button } from '@/components/ui/button'
import { Product } from '@/payload-types'

export function CartModal() {
  const { cart } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const totalQuantity = useMemo(() => {
    if (!cart || !cart.items || !cart.items.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <OpenCartButton quantity={totalQuantity} />
      </SheetTrigger>

      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>

          <SheetDescription className="text-muted-foreground">
            Manage your cart here, add items to view the total.
          </SheetDescription>
        </SheetHeader>

        {!cart || cart?.items?.length === 0 ? (
          <div className="text-center flex flex-col items-center gap-4 py-12">
            <ShoppingCart className="h-12 text-muted-foreground" />
            <p className="text-xl font-semibold tracking-tight">Nothing here.</p>
            <p className="text-sm text-muted-foreground">That&rsquo;s on you.</p>
            <Button asChild variant="secondary" onClick={() => setIsOpen(false)}>
              <Link href="/shop">See the catalog</Link>
            </Button>
          </div>
        ) : (
          <div className="grow flex px-4">
            <div className="flex flex-col justify-between w-full">
              <ul className="grow overflow-auto py-4">
                {cart?.items?.map((item, i) => {
                  const product = item.product
                  const variant = item.variant

                  if (typeof product !== 'object' || !item || !product || !product.slug)
                    return <React.Fragment key={i} />

                  const metaImage =
                    product.meta?.image && typeof product.meta?.image === 'object'
                      ? product.meta.image
                      : undefined

                  const firstGalleryImage =
                    typeof product.gallery?.[0]?.image === 'object'
                      ? product.gallery?.[0]?.image
                      : undefined

                  let image = firstGalleryImage || metaImage
                  let price = product.priceInUSD

                  const isVariant = Boolean(variant) && typeof variant === 'object'

                  if (isVariant) {
                    price = variant?.priceInUSD

                    const imageVariant = product.gallery?.find((item: { variantOption?: any; image?: unknown }) => {
                      if (!item.variantOption) return false
                      const variantOptionID =
                        typeof item.variantOption === 'object'
                          ? item.variantOption.id
                          : item.variantOption

                      const hasMatch = variant?.options?.some((option: any) => {
                        if (typeof option === 'object') return option.id === variantOptionID
                        else return option === variantOptionID
                      })

                      return hasMatch
                    })

                    if (imageVariant && typeof imageVariant.image === 'object') {
                      image = imageVariant.image
                    }
                  }

                  return (
                    <li className="flex w-full flex-col" key={i}>
                      <div className="relative flex w-full flex-row justify-between px-1 py-4">
                        <div className="absolute z-40 -mt-2 ml-[55px]">
                          <DeleteItemButton item={item} />
                        </div>
                        <Link
                          className="z-30 flex flex-row space-x-4"
                          href={`/products/${(item.product as Product)?.slug}`}
                        >
                          <div className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-lg border border-border bg-near-black">
                            {image?.url && (
                              <Image
                                alt={image?.alt || product?.title || ''}
                                className="h-full w-full object-cover"
                                height={94}
                                src={image.url}
                                width={94}
                              />
                            )}
                          </div>

                          <div className="flex flex-1 flex-col text-base">
                            <span className="leading-tight font-medium text-[15px]">{product?.title}</span>
                            {isVariant && variant ? (
                              <p className="text-sm text-muted-foreground capitalize">
                                {variant.options
                                  ?.map((option: any) => {
                                    if (typeof option === 'object') return option.label
                                    return null
                                  })
                                  .join(', ')}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                        <div className="flex h-16 flex-col justify-between">
                          {typeof price === 'number' && (
                            <Price
                              amount={price}
                              className="flex justify-end space-y-2 text-right text-sm font-mono"
                            />
                          )}
                          <div className="ml-auto flex h-9 flex-row items-center rounded-[4px] border border-border">
                            <EditItemQuantityButton item={item} type="minus" />
                            <p className="w-6 text-center">
                              <span className="w-full text-sm font-mono">{item.quantity}</span>
                            </p>
                            <EditItemQuantityButton item={item} type="plus" />
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="px-4">
                <div className="py-4 text-sm text-muted-foreground">
                  {typeof cart?.subtotal === 'number' && (
                    <div className="mb-3 flex items-center justify-between border-b border-border pb-1 pt-1">
                      <p className="font-mono text-xs uppercase tracking-[0.08em]">Total</p>
                      <Price
                        amount={cart?.subtotal}
                        className="text-right text-base font-mono text-foreground"
                      />
                    </div>
                  )}

                  <Button asChild className="w-full">
                    <Link href="/checkout">
                      Proceed to Checkout
                    </Link>
                  </Button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center mt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Continue shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
