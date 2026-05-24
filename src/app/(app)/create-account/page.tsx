import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import React from 'react'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { CreateAccountForm } from '@/components/forms/CreateAccountForm'
import { redirect } from 'next/navigation'

export default async function CreateAccount() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <div className="container py-16">
      <div className="max-w-lg mx-auto">
        <RenderParams />

        <div className="mb-8">
          <span className="font-mono text-[10px] uppercase tracking-widest text-olive-text">
            SEC / 02
          </span>
          <h1 className="text-3xl font-bold tracking-[-0.03em] mt-2">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-2">
            One more ugly face in the crowd.
          </p>
        </div>

        <div className="border border-border rounded-lg bg-card p-8">
          <CreateAccountForm />
        </div>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-olive-text underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Create Account',
    url: '/create-account',
  }),
  title: 'Create Account',
}
