import { Suspense } from 'react'
import { CheckoutSuccessContent } from './content'

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container min-h-[60vh] flex items-center justify-center">
          <p className="text-muted-foreground font-mono text-sm">Processing your order...</p>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}
