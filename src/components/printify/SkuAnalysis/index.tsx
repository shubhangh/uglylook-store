'use client'

import React, { useCallback, useEffect, useState } from 'react'
import './sku-analysis.css'

type Recommendation = {
  type: 'cost_saving' | 'margin_alert' | 'new_product' | 'missing_config' | 'info'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  productId?: string
  productTitle?: string
  data?: Record<string, any>
}

type ProductHealth = {
  id: string
  title: string
  price: number
  category: string
  hasPrintifyConfig: boolean
  hasPrintFile: boolean
  hasDesignUrl: boolean
  blueprintId: number | null
  providerId: number | null
  variantCount: number
  marginPercent: number | null
  status: 'ready' | 'missing_config' | 'missing_design' | 'low_margin' | 'no_variants'
}

type AnalysisData = {
  summary: {
    totalProducts: number
    readyProducts: number
    missingConfigProducts: number
    missingDesignProducts: number
    lowMarginProducts: number
    avgMargin: number | null
    allHealthy: boolean
  }
  recommendations: Recommendation[]
  productHealth: ProductHealth[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ready: { label: 'Ready', color: '#4ade80' },
  missing_config: { label: 'No Config', color: '#f87171' },
  missing_design: { label: 'No Design', color: '#fb923c' },
  low_margin: { label: 'Low Margin', color: '#d4a017' },
  no_variants: { label: 'No Variants', color: '#f87171' },
}

const SEVERITY_ICONS: Record<string, string> = {
  high: '!',
  medium: '~',
  low: 'i',
}

export const SkuAnalysis: React.FC = () => {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'recommendations' | 'health'>('recommendations')
  const [healthFilter, setHealthFilter] = useState<string>('all')
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/next/printify-analysis', {
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const json: AnalysisData = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Failed to load analysis')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const dismiss = (index: number) => {
    setDismissed((prev) => new Set(prev).add(index))
  }

  const visibleRecs = data?.recommendations.filter((_, i) => !dismissed.has(i)) || []
  const highCount = visibleRecs.filter((r) => r.severity === 'high').length
  const mediumCount = visibleRecs.filter((r) => r.severity === 'medium').length

  const filteredHealth = data?.productHealth.filter((p) => {
    if (healthFilter === 'all') return true
    return p.status === healthFilter
  }) || []

  return (
    <div className="sku-analysis">
      <div className="sku-analysis__header">
        <h1>SKU Analysis</h1>
        <button
          className="sku-analysis__refresh"
          onClick={fetchAnalysis}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      {error && (
        <div className="sku-analysis__error">{error}</div>
      )}

      {loading && !data && (
        <div className="sku-analysis__loading">Analyzing products...</div>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="sku-analysis__summary">
          <div className="summary-card">
            <span className="summary-card__value">{data.summary.totalProducts}</span>
            <span className="summary-card__label">Total Products</span>
          </div>
          <div className="summary-card summary-card--good">
            <span className="summary-card__value">{data.summary.readyProducts}</span>
            <span className="summary-card__label">Ready</span>
          </div>
          <div className={`summary-card ${data.summary.missingConfigProducts > 0 ? 'summary-card--bad' : ''}`}>
            <span className="summary-card__value">{data.summary.missingConfigProducts}</span>
            <span className="summary-card__label">Missing Config</span>
          </div>
          <div className={`summary-card ${data.summary.missingDesignProducts > 0 ? 'summary-card--warn' : ''}`}>
            <span className="summary-card__value">{data.summary.missingDesignProducts}</span>
            <span className="summary-card__label">Missing Design</span>
          </div>
          <div className={`summary-card ${data.summary.lowMarginProducts > 0 ? 'summary-card--warn' : ''}`}>
            <span className="summary-card__value">{data.summary.lowMarginProducts}</span>
            <span className="summary-card__label">Low Margin</span>
          </div>
          <div className="summary-card">
            <span className="summary-card__value">
              {data.summary.avgMargin !== null ? `${data.summary.avgMargin}%` : '—'}
            </span>
            <span className="summary-card__label">Avg Margin</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      {data && (
        <div className="sku-analysis__tabs">
          <button
            className={`sku-analysis__tab ${tab === 'recommendations' ? 'sku-analysis__tab--active' : ''}`}
            onClick={() => setTab('recommendations')}
          >
            Recommendations
            {highCount > 0 && <span className="tab-badge tab-badge--high">{highCount}</span>}
            {mediumCount > 0 && <span className="tab-badge tab-badge--medium">{mediumCount}</span>}
          </button>
          <button
            className={`sku-analysis__tab ${tab === 'health' ? 'sku-analysis__tab--active' : ''}`}
            onClick={() => setTab('health')}
          >
            Catalog Health ({data.summary.totalProducts})
          </button>
        </div>
      )}

      {/* Recommendations Tab */}
      {data && tab === 'recommendations' && (
        <div className="sku-analysis__recs">
          {visibleRecs.length === 0 && (
            <div className="sku-analysis__empty">
              No recommendations. All products look good.
            </div>
          )}
          {visibleRecs.map((rec, i) => {
            const originalIndex = data.recommendations.indexOf(rec)
            return (
              <div key={originalIndex} className={`rec-card rec-card--${rec.severity}`}>
                <div className="rec-card__header">
                  <span className={`rec-card__severity rec-card__severity--${rec.severity}`}>
                    {SEVERITY_ICONS[rec.severity]}
                  </span>
                  <div className="rec-card__content">
                    <h3 className="rec-card__title">{rec.title}</h3>
                    <p className="rec-card__desc">{rec.description}</p>
                  </div>
                  <div className="rec-card__actions">
                    {rec.productId && (
                      <a
                        href={`/adm/collections/products/${rec.productId}`}
                        className="rec-card__btn"
                      >
                        Edit Product
                      </a>
                    )}
                    <button
                      className="rec-card__dismiss"
                      onClick={() => dismiss(originalIndex)}
                      title="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Catalog Health Tab */}
      {data && tab === 'health' && (
        <div className="sku-analysis__health">
          <div className="health-filters">
            {['all', 'ready', 'missing_config', 'missing_design', 'low_margin', 'no_variants'].map((f) => (
              <button
                key={f}
                className={`health-filter ${healthFilter === f ? 'health-filter--active' : ''}`}
                onClick={() => setHealthFilter(f)}
              >
                {f === 'all' ? 'All' : STATUS_LABELS[f]?.label || f}
              </button>
            ))}
          </div>

          <div className="health-table-wrap">
            <table className="health-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Margin</th>
                  <th>Config</th>
                  <th>Design</th>
                  <th>Variants</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredHealth.map((p) => {
                  const statusInfo = STATUS_LABELS[p.status] || { label: p.status, color: '#888' }
                  return (
                    <tr key={p.id}>
                      <td>
                        <a href={`/adm/collections/products/${p.id}`} className="health-link">
                          {p.title}
                        </a>
                      </td>
                      <td className="health-cat">{p.category || '—'}</td>
                      <td className="health-price">${p.price.toFixed(2)}</td>
                      <td>
                        {p.marginPercent !== null ? (
                          <span className={p.marginPercent >= 50 ? 'stat--good' : p.marginPercent >= 45 ? 'stat--ok' : 'stat--warn'}>
                            {p.marginPercent}%
                          </span>
                        ) : '—'}
                      </td>
                      <td>{p.hasPrintifyConfig ? <span className="check check--yes">Y</span> : <span className="check check--no">N</span>}</td>
                      <td>{p.hasPrintFile || p.hasDesignUrl ? <span className="check check--yes">Y</span> : <span className="check check--no">N</span>}</td>
                      <td className="health-variants">{p.variantCount}</td>
                      <td>
                        <span className="health-status" style={{ color: statusInfo.color }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <a href={`/adm/collections/products/${p.id}`} className="health-edit">Edit</a>
                      </td>
                    </tr>
                  )
                })}
                {filteredHealth.length === 0 && (
                  <tr>
                    <td colSpan={9} className="health-empty">
                      No products match this filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
