import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — UglyLook',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
