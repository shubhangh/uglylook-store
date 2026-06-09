import type { Cart } from '@/payload-types'

export type CartItem = NonNullable<Cart['items']>[number]
