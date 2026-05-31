'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'

import './PendingReviews.scss'

type PendingItem = {
  id: string
  title: string
  collection: string
  collectionLabel: string
  submittedAt: string | null
}

export const PendingReviews: React.FC = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)

  const u = user as any
  const isAdmin = u?.role && ['owner', 'admin'].includes(u.role)

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    async function fetchPending() {
      try {
        const collections = [
          { slug: 'products', label: 'Product' },
          { slug: 'posts', label: 'Post' },
          { slug: 'coupons', label: 'Coupon' },
          { slug: 'offers', label: 'Offer' },
        ]

        const responses = await Promise.all(
          collections.map(({ slug }) =>
            fetch(`/api/${slug}?where[approvalStatus][equals]=pending_review&limit=20&select[title]=true&select[submittedForReviewAt]=true`, {
              credentials: 'include',
            }).catch(() => null),
          ),
        )

        const pending: PendingItem[] = []

        for (let i = 0; i < responses.length; i++) {
          const res = responses[i]
          if (!res || !res.ok) continue
          const data = await res.json()
          for (const doc of data.docs || []) {
            pending.push({
              id: doc.id,
              title: doc.title || 'Untitled',
              collection: collections[i].slug,
              collectionLabel: collections[i].label,
              submittedAt: doc.submittedForReviewAt || null,
            })
          }
        }

        // Sort by submission date (newest first)
        pending.sort((a, b) => {
          if (!a.submittedAt) return 1
          if (!b.submittedAt) return -1
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        })

        setItems(pending)
      } catch {
        // Non-critical
      }
      setLoading(false)
    }

    fetchPending()
  }, [isAdmin])

  if (!isAdmin || loading) return null
  if (items.length === 0) return null

  return (
    <div className="pending-reviews">
      <div className="pending-reviews__header">
        <h4>Pending Reviews</h4>
        <span className="pending-reviews__count">{items.length}</span>
      </div>
      <div className="pending-reviews__list">
        {items.map((item) => (
          <a
            key={`${item.collection}-${item.id}`}
            href={`/adm/collections/${item.collection}/${item.id}`}
            className="pending-reviews__item"
          >
            <span className="pending-reviews__item-type">{item.collectionLabel}</span>
            <span className="pending-reviews__item-title">{item.title}</span>
            {item.submittedAt && (
              <span className="pending-reviews__item-time">
                {timeAgo(item.submittedAt)}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
