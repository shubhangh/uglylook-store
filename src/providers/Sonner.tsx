'use client'

import { useTheme } from '@/providers/Theme'
import { Toaster } from 'sonner'

export const SonnerProvider = ({ children }: { children?: React.ReactNode }) => {
  const { theme } = useTheme()

  return (
    <>
      {children}

      <Toaster
        position="bottom-left"
        theme={theme || 'light'}
        toastOptions={{
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--primary)',
            fontFamily: 'var(--font-inter), system-ui, sans-serif',
            fontSize: '13px',
          },
        }}
      />
    </>
  )
}
