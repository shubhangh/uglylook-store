import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { AccountForm } from '@/components/forms/AccountForm'
import { Order } from '@/payload-types'
import { OrderItem } from '@/components/OrderItem'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 5,
      user,
      overrideAccess: false,
      pagination: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (error) {
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // so swallow the error here and simply render the page with fallback data where necessary
    // in production you may want to redirect to a 404  page or at least log the error somewhere
    // console.error(error)
  }

  return (
    <>
      <div className="border border-border p-8 rounded-lg bg-card">
        <div className="mb-8">
          <span className="font-mono text-[10px] uppercase tracking-widest text-olive-text">
            SEC / 01
          </span>
          <h1 className="text-2xl font-bold tracking-[-0.02em] mt-2 text-foreground">
            Account Settings
          </h1>
        </div>
        <AccountForm />
      </div>

      <div className="border border-border p-8 rounded-lg bg-card">
        <div className="mb-8">
          <span className="font-mono text-[10px] uppercase tracking-widest text-olive-text">
            SEC / 02
          </span>
          <h2 className="text-2xl font-bold tracking-[-0.02em] mt-2 text-foreground">
            Recent Orders
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your most recent orders. More orders, more problems.
          </p>
        </div>

        {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
          <p className="text-sm text-muted-foreground mb-8">No orders yet.</p>
        )}

        {orders && orders.length > 0 && (
          <ul className="flex flex-col gap-6 mb-8">
            {orders?.map((order, index) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        )}

        <Button asChild className="bg-olive text-cream hover:bg-olive/90 rounded">
          <Link href="/orders">View all orders</Link>
        </Button>
      </div>
    </>
  )
}

export const metadata: Metadata = {
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
