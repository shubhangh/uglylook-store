import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import Link from 'next/link'
import React from 'react'

import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { LoginForm } from '@/components/forms/LoginForm'
import { redirect } from 'next/navigation'

export default async function Login() {
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
            SEC / 01
          </span>
          <h1 className="text-3xl font-bold tracking-[-0.03em] mt-2">Log in</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Welcome back. You know the drill.
          </p>
        </div>

        <div className="border border-border rounded-lg bg-card p-8">
          <LoginForm />
        </div>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          No account?{' '}
          <Link href="/create-account" className="text-olive-text underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Login or create an account to get started.',
  openGraph: {
    title: 'Login',
    url: '/login',
  },
  title: 'Login',
}
