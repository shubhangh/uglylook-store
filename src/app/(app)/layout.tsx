import { Analytics } from '@vercel/analytics/next'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import { AdminBar } from '@/components/AdminBar'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { NewsletterCTA } from '@/components/NewsletterCTA'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { getServerSideURL } from '@/utilities/getURL'
import { getOrganizationJsonLd, getWebsiteJsonLd } from '@/utilities/jsonLd'
import { Inter, JetBrains_Mono } from 'next/font/google'
import React from 'react'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'UglyLook — Ugly is the new sick.', template: '%s | UglyLook' },
  description:
    'Streetwear tees, hoodies and objects. 240gsm cotton, boxy fit, printed when you order.',
  twitter: { card: 'summary_large_image' },
  openGraph: { type: 'website', siteName: 'UglyLook', locale: 'en_US' },
  robots: { index: true, follow: true },
  metadataBase: new URL(getServerSideURL()),
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([getOrganizationJsonLd(), getWebsiteJsonLd()]),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AdminBar />
          <LivePreviewListener />

          <AnnouncementBar />
          <Header />
          <main className="animate-fade-in">{children}</main>
          <NewsletterCTA />
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
