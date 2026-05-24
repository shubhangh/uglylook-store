import type { Metadata } from 'next'
import React from 'react'
import { SimulatedCheckout } from '@/components/checkout/SimulatedCheckout'

export default function Checkout() {
  return (
    <div className="container min-h-[80vh] py-12">
      <SimulatedCheckout />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Checkout.',
  title: 'Checkout — UglyLook',
}
