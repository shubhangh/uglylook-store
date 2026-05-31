import { OrderStatus as StatusOptions } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  status: StatusOptions
  fulfillmentStatus?: string | null
  className?: string
}

export const OrderStatus: React.FC<Props> = ({ status, fulfillmentStatus, className }) => {
  // Use fulfillment status for display if available, otherwise fall back to order status
  const displayStatus = fulfillmentStatus || status
  const label = displayStatus?.replace(/_/g, ' ') || status

  return (
    <div
      className={cn(
        'text-xs tracking-widest font-mono uppercase py-0 px-2 rounded w-fit',
        className,
        {
          'bg-primary/10': status === 'processing' || fulfillmentStatus === 'pending' || fulfillmentStatus === 'sent_to_printify',
          'bg-yellow-500/20 text-yellow-300': fulfillmentStatus === 'in_production',
          'bg-blue-500/20 text-blue-300': fulfillmentStatus === 'shipped',
          'bg-success': status === 'completed' || fulfillmentStatus === 'delivered',
          'bg-red-500/20 text-red-300': fulfillmentStatus === 'failed' || fulfillmentStatus === 'cancelled',
          'bg-orange-500/20 text-orange-300': fulfillmentStatus === 'on_hold' || fulfillmentStatus === 'manual',
        },
      )}
    >
      {label}
    </div>
  )
}
