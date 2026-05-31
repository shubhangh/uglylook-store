'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

type ProductInfo = {
  id: string
  title: string
  status: string
}

type Stats = {
  total: number
  published: number
  draft: number
  products: ProductInfo[]
}

export const BucketActions: React.FC = () => {
  const { id } = useDocumentInfo()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchStats()
  }, [id])

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/buckets/${id}?depth=0`, { credentials: 'include' })
      if (!res.ok) return
      const bucket = await res.json()
      const productIds: string[] = (bucket.products || []).map((p: any) =>
        typeof p === 'object' ? p.id : String(p),
      )

      if (productIds.length === 0) {
        setStats({ total: 0, published: 0, draft: 0, products: [] })
        return
      }

      const productsRes = await fetch(
        `/api/products?where[id][in]=${productIds.join(',')}&limit=500&depth=0&select[_status]=true&select[title]=true`,
        { credentials: 'include' },
      )
      if (!productsRes.ok) return
      const productsData = await productsRes.json()

      const products: ProductInfo[] = productsData.docs.map((p: any) => ({
        id: p.id,
        title: p.title || 'Untitled',
        status: p._status || 'draft',
      }))

      const published = products.filter((p) => p.status === 'published').length

      setStats({
        total: products.length,
        published,
        draft: products.length - published,
        products,
      })
    } catch { /* ignore */ }
  }

  const runAction = async (action: string, extra?: Record<string, any>) => {
    if (!id) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/next/bucket-actions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, bucketId: id, ...extra }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const count = data.affected || data.deletedProducts || data.moved || data.copied || 0
        setResult(`${action}: ${count} products affected`)
        fetchStats()
      } else {
        setResult(`Error: ${data.error}`)
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`)
    }

    setLoading(false)
  }

  const handlePublish = () => {
    if (!confirm(`Publish all ${stats?.total || 0} products in this bucket?`)) return
    runAction('publish')
  }

  const handleUnpublish = () => {
    if (!confirm(`Unpublish all ${stats?.total || 0} products? They'll be hidden from the store.`)) return
    runAction('unpublish')
  }

  const handleDelete = () => {
    const input = prompt(
      `This permanently deletes ${stats?.total || 0} products and all their variants.\n\nType DELETE to confirm:`,
    )
    if (input !== 'DELETE') return
    runAction('delete', { confirm: 'DELETE' })
  }

  if (!id) return null

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Actions bar */}
      <div style={{
        padding: '16px',
        background: 'var(--theme-elevation-50, #0d0d0d)',
        border: '1px solid var(--theme-elevation-200, #2a2a2a)',
        borderRadius: '6px',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: stats ? '12px' : '0',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--theme-elevation-500, #888)',
          }}>
            Bucket Actions
          </span>

          {stats && (
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span>{stats.total} total</span>
              <span style={{ color: '#8B9A6B' }}>{stats.published} published</span>
              <span style={{ color: '#888' }}>{stats.draft} draft</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handlePublish} disabled={loading || !stats?.total} style={btnStyle('#5A6242')}>
            Publish All
          </button>
          <button onClick={handleUnpublish} disabled={loading || !stats?.total} style={btnStyle('#888')}>
            Unpublish All
          </button>
          <button onClick={handleDelete} disabled={loading || !stats?.total} style={btnStyle('#c04040')}>
            Delete All
          </button>
        </div>

        {loading && <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>Processing...</div>}
        {result && (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: result.startsWith('Error') ? '#e06060' : '#8B9A6B',
          }}>
            {result}
          </div>
        )}
      </div>

      {/* Product list with links */}
      {stats && stats.products.length > 0 && (
        <div style={{
          border: '1px solid var(--theme-elevation-200, #2a2a2a)',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 16px',
            background: 'var(--theme-elevation-50, #0d0d0d)',
            borderBottom: '1px solid var(--theme-elevation-200, #2a2a2a)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--theme-elevation-500, #888)',
          }}>
            Products in this bucket ({stats.total})
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {stats.products.map((product) => (
              <a
                key={product.id}
                href={`/adm/collections/products/${product.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--theme-elevation-100, #1a1a1a)',
                  textDecoration: 'none',
                  color: 'var(--theme-text, #e0e0e0)',
                  fontSize: '13px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-elevation-100, #1a1a1a)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontWeight: 500 }}>{product.title}</span>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  background: product.status === 'published'
                    ? 'rgba(90, 98, 66, 0.15)'
                    : 'var(--theme-elevation-100, #1a1a1a)',
                  color: product.status === 'published' ? '#8B9A6B' : '#888',
                }}>
                  {product.status}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'inherit',
    background: `${color}18`,
    border: `1px solid ${color}66`,
    borderRadius: '4px',
    color,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  }
}
