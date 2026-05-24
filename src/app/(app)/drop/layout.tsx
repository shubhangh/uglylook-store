import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Drop — UglyLook',
}

export default function DropLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
