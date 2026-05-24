import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — UglyLook',
  description: 'Answers to questions we get asked. Reluctantly.',
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
