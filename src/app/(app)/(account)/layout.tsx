import type { ReactNode } from 'react'

import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { RenderParams } from '@/components/RenderParams'
import { AccountNav } from '@/components/AccountNav'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  return (
    <div className="bg-background min-h-screen">
      <div className="container pt-4">
        <RenderParams className="" />
      </div>

      <div className="container py-12 flex gap-12">
        {user && (
          <AccountNav className="max-w-56 shrink-0 flex-col items-start gap-2 hidden md:flex border-r border-border pr-8" />
        )}

        <div className="flex flex-col gap-10 grow min-w-0">{children}</div>
      </div>
    </div>
  )
}
