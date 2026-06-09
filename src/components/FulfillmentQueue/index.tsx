'use client'

import React, { useCallback, useEffect, useState } from 'react'
import './fulfillment-queue.css'

type OrderItem = {
  product: any
  variant: any
  quantity: number
}

type SelfFulfillment = {
  packedAt?: string
  packedBy?: any
  shippedAt?: string
  shippedBy?: any
  deliveredAt?: string
  carrier?: string
  notes?: string
}

type Order = {
  id: string
  createdAt: string
  amount: number
  currency: string
  customerEmail: string
  fulfillmentStatus: string
  fulfillmentSource: string
  trackingNumber?: string
  trackingCarrier?: string
  trackingUrl?: string
  shippingAddress: {
    firstName?: string
    lastName?: string
    addressLine1?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    phone?: string
  }
  items: OrderItem[]
  selfFulfillment?: SelfFulfillment
}

type QueueResponse = {
  orders: Order[]
  total: number
  counts: {
    pending: number
    packed: number
    shipped: number
    delivered: number
  }
}

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'all', label: 'All' },
] as const

const CARRIERS = [
  { value: 'usps', label: 'USPS' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'dhl', label: 'DHL' },
  { value: 'other', label: 'Other' },
]

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m ago`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h ago`
}

function formatAddress(addr: Order['shippingAddress']): string {
  const parts = [
    [addr.firstName, addr.lastName].filter(Boolean).join(' '),
    addr.addressLine1,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', '),
    addr.country !== 'US' ? addr.country : '',
  ].filter(Boolean)
  return parts.join('\n')
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending': return 'fq-badge fq-badge--pending'
    case 'in_production': return 'fq-badge fq-badge--packed'
    case 'shipped': return 'fq-badge fq-badge--shipped'
    case 'delivered': return 'fq-badge fq-badge--delivered'
    default: return 'fq-badge'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'PENDING'
    case 'in_production': return 'PACKED'
    case 'shipped': return 'SHIPPED'
    case 'delivered': return 'DELIVERED'
    default: return status.toUpperCase()
  }
}

// ── Ship Dialog ──

function ShipDialog({
  orderId,
  onClose,
  onShipped,
}: {
  orderId: string
  onClose: () => void
  onShipped: () => void
}) {
  const [carrier, setCarrier] = useState('usps')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!trackingNumber.trim()) {
      setError('Tracking number is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/next/fulfillment-queue', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ship',
          orderId,
          carrier,
          trackingNumber: trackingNumber.trim(),
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      onShipped()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fq-dialog-overlay" onClick={onClose} />
      <div className="fq-dialog">
        <h3 className="fq-dialog__title">Ship Order</h3>
        <div className="fq-dialog__field">
          <label>Carrier</label>
          <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {CARRIERS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="fq-dialog__field">
          <label>Tracking Number *</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. 9400111899223456789012"
            autoFocus
          />
        </div>
        <div className="fq-dialog__field">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Shipped in branded mailer"
            rows={2}
          />
        </div>
        {error && <div className="fq-dialog__error">{error}</div>}
        <div className="fq-dialog__actions">
          <button className="fq-btn fq-btn--secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="fq-btn fq-btn--ship" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Shipping...' : 'Mark as Shipped'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Order Card ──

function OrderCard({
  order,
  onAction,
}: {
  order: Order
  onAction: () => void
}) {
  const [packLoading, setPackLoading] = useState(false)
  const [deliverLoading, setDeliverLoading] = useState(false)
  const [showShipDialog, setShowShipDialog] = useState(false)
  const [packNotes, setPackNotes] = useState('')
  const [error, setError] = useState('')

  const doAction = async (action: string, extra?: Record<string, any>) => {
    const setLoading = action === 'pack' ? setPackLoading : setDeliverLoading
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/next/fulfillment-queue', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, orderId: order.id, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      onAction()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const items = (order.items || []).filter((i) => i.product)

  return (
    <div className="fq-card">
      <div className="fq-card__header">
        <div className="fq-card__id">
          <a href={`/adm/collections/orders/${order.id}`} target="_blank" rel="noreferrer">
            Order #{order.id.slice(-6)}
          </a>
          <span className="fq-card__amount">
            ${((order.amount || 0) >= 1000 ? (order.amount / 100) : order.amount).toFixed(2)} {order.currency}
          </span>
        </div>
        <div className="fq-card__meta">
          <span className={statusBadgeClass(order.fulfillmentStatus)}>
            {statusLabel(order.fulfillmentStatus)}
          </span>
          <span className="fq-card__source">{order.fulfillmentSource}</span>
          <span className="fq-card__time">{timeAgo(order.createdAt)}</span>
        </div>
      </div>

      <div className="fq-card__body">
        <div className="fq-card__items">
          <h4>Items</h4>
          {items.map((item, i) => {
            const product = typeof item.product === 'object' ? item.product : null
            const variant = typeof item.variant === 'object' ? item.variant : null
            return (
              <div key={i} className="fq-card__item">
                <span className="fq-card__item-qty">{item.quantity}x</span>
                <span className="fq-card__item-title">
                  {product?.title || 'Unknown Product'}
                  {variant?.title && (
                    <span className="fq-card__item-variant">
                      {variant.title.replace(`${product?.title} — `, '')}
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>

        <div className="fq-card__address">
          <h4>Ship to</h4>
          <pre>{formatAddress(order.shippingAddress || {})}</pre>
          {order.customerEmail && (
            <span className="fq-card__email">{order.customerEmail}</span>
          )}
          {order.shippingAddress?.phone && (
            <span className="fq-card__phone">{order.shippingAddress.phone}</span>
          )}
        </div>
      </div>

      {/* Tracking info (for shipped/delivered) */}
      {order.trackingNumber && (
        <div className="fq-card__tracking">
          <span className="fq-card__tracking-label">
            {order.trackingCarrier?.toUpperCase() || 'Tracking'}:
          </span>
          {order.trackingUrl ? (
            <a href={order.trackingUrl} target="_blank" rel="noreferrer">
              {order.trackingNumber}
            </a>
          ) : (
            <span>{order.trackingNumber}</span>
          )}
        </div>
      )}

      {/* Self-fulfillment notes */}
      {order.selfFulfillment?.notes && (
        <div className="fq-card__notes">
          <strong>Notes:</strong> {order.selfFulfillment.notes}
        </div>
      )}

      {/* Timeline */}
      {(order.selfFulfillment?.packedAt || order.selfFulfillment?.shippedAt) && (
        <div className="fq-card__timeline">
          {order.selfFulfillment.packedAt && (
            <span>Packed {timeAgo(order.selfFulfillment.packedAt)}</span>
          )}
          {order.selfFulfillment.shippedAt && (
            <span>Shipped {timeAgo(order.selfFulfillment.shippedAt)}</span>
          )}
          {order.selfFulfillment.deliveredAt && (
            <span>Delivered {timeAgo(order.selfFulfillment.deliveredAt)}</span>
          )}
        </div>
      )}

      {error && <div className="fq-card__error">{error}</div>}

      {/* Actions */}
      <div className="fq-card__actions">
        {order.fulfillmentStatus === 'pending' && (
          <>
            <div className="fq-card__pack-row">
              <input
                type="text"
                className="fq-card__pack-notes"
                placeholder="Pack notes (optional)"
                value={packNotes}
                onChange={(e) => setPackNotes(e.target.value)}
              />
              <button
                className="fq-btn fq-btn--pack"
                disabled={packLoading}
                onClick={() => doAction('pack', packNotes ? { notes: packNotes } : {})}
              >
                {packLoading ? 'Packing...' : 'Mark as Packed'}
              </button>
            </div>
            <button
              className="fq-btn fq-btn--ship"
              onClick={() => setShowShipDialog(true)}
            >
              Ship Directly
            </button>
          </>
        )}

        {order.fulfillmentStatus === 'in_production' && (
          <button
            className="fq-btn fq-btn--ship"
            onClick={() => setShowShipDialog(true)}
          >
            Mark as Shipped
          </button>
        )}

        {order.fulfillmentStatus === 'shipped' && (
          <button
            className="fq-btn fq-btn--deliver"
            disabled={deliverLoading}
            onClick={() => doAction('deliver')}
          >
            {deliverLoading ? 'Updating...' : 'Mark as Delivered'}
          </button>
        )}
      </div>

      {showShipDialog && (
        <ShipDialog
          orderId={order.id}
          onClose={() => setShowShipDialog(false)}
          onShipped={() => {
            setShowShipDialog(false)
            onAction()
          }}
        />
      )}
    </div>
  )
}

// ── Main Component ──

export const FulfillmentQueue: React.FC = () => {
  const [data, setData] = useState<QueueResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<string>('pending')
  const [error, setError] = useState('')

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/next/fulfillment-queue?status=${tab}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const json: QueueResponse = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const totalActionable = data
    ? data.counts.pending + data.counts.packed
    : 0

  return (
    <div className="fq">
      <div className="fq__header">
        <h1>Fulfillment Queue</h1>
        {totalActionable > 0 && (
          <span className="fq__actionable">{totalActionable} need action</span>
        )}
      </div>

      <div className="fq__tabs">
        {TABS.map((t) => {
          const count =
            t.key === 'pending' ? data?.counts.pending :
            t.key === 'packed' ? data?.counts.packed :
            t.key === 'shipped' ? data?.counts.shipped :
            t.key === 'delivered' ? data?.counts.delivered :
            null
          return (
            <button
              key={t.key}
              className={`fq__tab ${tab === t.key ? 'fq__tab--active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {count != null && count > 0 && (
                <span className="fq__tab-count">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {error && <div className="fq__error">{error}</div>}

      {loading && <div className="fq__loading">Loading...</div>}

      {!loading && data && data.orders.length === 0 && (
        <div className="fq__empty">
          No {tab === 'all' ? '' : tab} orders to show.
          {tab === 'pending' && ' All caught up!'}
        </div>
      )}

      <div className="fq__list">
        {data?.orders.map((order) => (
          <OrderCard key={order.id} order={order} onAction={fetchQueue} />
        ))}
      </div>
    </div>
  )
}
