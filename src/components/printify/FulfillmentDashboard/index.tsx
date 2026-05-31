'use client'

import React, { useCallback, useEffect, useState } from 'react'
import './fulfillment-dashboard.css'

type StatusCounts = Record<string, number>

type OrderRow = {
  id: string
  status: string | null
  fulfillmentStatus: string | null
  amount: number | null
  currency: string | null
  customerEmail: string | null
  createdAt: string
  printifyOrderId: string | null
  trackingNumber: string | null
  trackingCarrier: string | null
  trackingUrl: string | null
  fulfillmentNote: string | null
  itemCount: number
  itemSummary: string
}

type DashboardData = {
  statusCounts: StatusCounts
  orders: OrderRow[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const STATUS_CARDS: { key: string; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: '#666' },
  { key: 'sent_to_printify', label: 'Sent', color: '#5A6242' },
  { key: 'in_production', label: 'Printing', color: '#b8860b' },
  { key: 'shipped', label: 'Shipped', color: '#2563eb' },
  { key: 'delivered', label: 'Delivered', color: '#16a34a' },
  { key: 'failed', label: 'Failed', color: '#dc2626' },
  { key: 'on_hold', label: 'On Hold', color: '#ea580c' },
  { key: 'cancelled', label: 'Cancelled', color: '#991b1b' },
  { key: 'manual', label: 'Manual', color: '#ea580c' },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(amount: number | null, currency: string | null): string {
  if (!amount) return '—'
  return `$${amount.toFixed(2)}`
}

function statusBadgeClass(status: string | null): string {
  switch (status) {
    case 'pending':
      return 'badge--pending'
    case 'sent_to_printify':
      return 'badge--sent'
    case 'in_production':
      return 'badge--printing'
    case 'shipped':
      return 'badge--shipped'
    case 'delivered':
      return 'badge--delivered'
    case 'failed':
      return 'badge--failed'
    case 'on_hold':
    case 'manual':
      return 'badge--hold'
    case 'cancelled':
      return 'badge--cancelled'
    default:
      return 'badge--none'
  }
}

export const FulfillmentDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const fetchData = useCallback(
    async (statusFilter = filter, pageNum = page) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.set('status', statusFilter)
        params.set('page', String(pageNum))
        params.set('limit', '20')

        const res = await fetch(`/next/printify-fulfillment?${params}`, {
          credentials: 'include',
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `HTTP ${res.status}`)
        }

        const json: DashboardData = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    },
    [filter, page],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRetry = async (orderId: string) => {
    setActionLoading(orderId)
    setMessage(null)
    try {
      const res = await fetch('/next/printify-retry', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'retry' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Retry failed')
      setMessage({ type: 'success', text: `Order ${orderId} retried successfully` })
      fetchData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSync = async (orderId: string) => {
    setActionLoading(orderId)
    setMessage(null)
    try {
      const res = await fetch('/next/printify-retry', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'sync' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Sync failed')
      setMessage({
        type: 'success',
        text: `Order ${orderId} synced — status: ${json.printifyStatus}`,
      })
      fetchData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRetryAllFailed = async () => {
    if (!data) return
    const failedOrders = data.orders.filter(
      (o) => o.fulfillmentStatus === 'failed' && !o.printifyOrderId,
    )
    if (failedOrders.length === 0) return

    setMessage(null)
    let successCount = 0
    let failCount = 0

    for (const order of failedOrders) {
      try {
        const res = await fetch('/next/printify-retry', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, action: 'retry' }),
        })
        if (res.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }
    }

    setMessage({
      type: failCount === 0 ? 'success' : 'error',
      text: `Retried ${failedOrders.length} orders: ${successCount} succeeded, ${failCount} failed`,
    })
    fetchData()
  }

  const handleFilterClick = (status: string) => {
    const newFilter = filter === status ? 'all' : status
    setFilter(newFilter)
    setPage(1)
    fetchData(newFilter, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchData(filter, newPage)
  }

  return (
    <div className="fulfillment-dashboard">
      <div className="fulfillment-dashboard__header">
        <h1>Fulfillment Dashboard</h1>
        <button
          className="fulfillment-dashboard__refresh"
          onClick={() => fetchData()}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {message && (
        <div
          className={`fulfillment-dashboard__message fulfillment-dashboard__message--${message.type}`}
        >
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="fulfillment-dashboard__message fulfillment-dashboard__message--error">
          {error}
        </div>
      )}

      {/* Status Cards */}
      <div className="fulfillment-dashboard__cards">
        {STATUS_CARDS.map((card) => {
          const count = data?.statusCounts[card.key] || 0
          const isActive = filter === card.key
          return (
            <button
              key={card.key}
              className={`status-card ${isActive ? 'status-card--active' : ''} ${count > 0 && (card.key === 'failed' || card.key === 'on_hold' || card.key === 'manual') ? 'status-card--alert' : ''}`}
              style={{ '--card-color': card.color } as React.CSSProperties}
              onClick={() => handleFilterClick(card.key)}
            >
              <span className="status-card__count">{count}</span>
              <span className="status-card__label">{card.label}</span>
            </button>
          )
        })}
      </div>

      {/* Failed orders action bar */}
      {(data?.statusCounts['failed'] || 0) > 0 && (
        <div className="fulfillment-dashboard__action-bar">
          <span>
            {data?.statusCounts['failed']} failed order
            {(data?.statusCounts['failed'] || 0) > 1 ? 's' : ''}
          </span>
          <button
            className="fulfillment-dashboard__btn fulfillment-dashboard__btn--retry"
            onClick={handleRetryAllFailed}
          >
            Retry All Failed
          </button>
        </div>
      )}

      {/* Filter indicator */}
      {filter !== 'all' && (
        <div className="fulfillment-dashboard__filter-bar">
          Showing: <strong>{filter.replace(/_/g, ' ')}</strong>
          <button onClick={() => handleFilterClick(filter)}>Clear filter</button>
        </div>
      )}

      {/* Orders Table */}
      <div className="fulfillment-dashboard__table-wrap">
        <table className="fulfillment-dashboard__table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Tracking</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data ? (
              <tr>
                <td colSpan={7} className="fulfillment-dashboard__loading">
                  Loading orders...
                </td>
              </tr>
            ) : data?.orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="fulfillment-dashboard__empty">
                  No orders found
                  {filter !== 'all' ? ` with status "${filter.replace(/_/g, ' ')}"` : ''}
                </td>
              </tr>
            ) : (
              data?.orders.map((order) => (
                <tr key={order.id} className={order.fulfillmentStatus === 'failed' ? 'row--failed' : ''}>
                  <td>
                    <a
                      href={`/adm/collections/orders/${order.id}`}
                      className="order-link"
                    >
                      #{order.id.slice(-6)}
                    </a>
                    {order.customerEmail && (
                      <div className="order-email">{order.customerEmail}</div>
                    )}
                  </td>
                  <td>
                    <span className="item-summary" title={order.itemSummary}>
                      {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                    </span>
                    {order.itemSummary && (
                      <div className="item-detail">{order.itemSummary}</div>
                    )}
                  </td>
                  <td>{formatPrice(order.amount, order.currency)}</td>
                  <td>
                    <span
                      className={`badge ${statusBadgeClass(order.fulfillmentStatus)}`}
                    >
                      {(order.fulfillmentStatus || 'none').replace(/_/g, ' ')}
                    </span>
                    {order.fulfillmentNote && (
                      <div className="note" title={order.fulfillmentNote}>
                        {order.fulfillmentNote.length > 60
                          ? order.fulfillmentNote.slice(0, 60) + '...'
                          : order.fulfillmentNote}
                      </div>
                    )}
                  </td>
                  <td>
                    {order.trackingNumber ? (
                      <div className="tracking">
                        {order.trackingCarrier && (
                          <span className="tracking__carrier">
                            {order.trackingCarrier}
                          </span>
                        )}
                        {order.trackingUrl ? (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tracking__number"
                          >
                            {order.trackingNumber}
                          </a>
                        ) : (
                          <span className="tracking__number">
                            {order.trackingNumber}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="tracking--none">—</span>
                    )}
                  </td>
                  <td className="date-cell">{formatDate(order.createdAt)}</td>
                  <td>
                    <div className="actions">
                      {order.fulfillmentStatus === 'failed' &&
                        !order.printifyOrderId && (
                          <button
                            className="action-btn action-btn--retry"
                            onClick={() => handleRetry(order.id)}
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? '...' : 'Retry'}
                          </button>
                        )}
                      {order.printifyOrderId && (
                        <button
                          className="action-btn action-btn--sync"
                          onClick={() => handleSync(order.id)}
                          disabled={actionLoading === order.id}
                        >
                          {actionLoading === order.id ? '...' : 'Sync'}
                        </button>
                      )}
                      <a
                        href={`/adm/collections/orders/${order.id}`}
                        className="action-btn action-btn--view"
                      >
                        View
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="fulfillment-dashboard__pagination">
          <button
            disabled={!data.hasPrevPage}
            onClick={() => handlePageChange(page - 1)}
          >
            ← Prev
          </button>
          <span>
            Page {data.page} of {data.totalPages} ({data.totalDocs} orders)
          </span>
          <button
            disabled={!data.hasNextPage}
            onClick={() => handlePageChange(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
