'use client'

import React, { useCallback, useState } from 'react'

export type CachedVersionInfo = {
  id: string
  version: number
  model: string
  createdAt: string
  analysis: {
    visibleText: string
    description: string
    features: string[]
    suggestedPriceAdjustment: number
    priceReason: string
    productType: string
    primaryColor: string
    designStyle: string
  }
}

export type ExistingProductInfo = {
  id: string
  title: string
  slug: string
  price: number
  url: string
}

export type PreviewProduct = {
  number: string
  title: string
  slug: string
  description: string
  category: string
  pricing: {
    basePrice: number
    knownPrice: number | null
    aiSuggestedPrice: number | null
    aiPriceReason: string | null
    finalPrice: number
  }
  hasSizeVariants: boolean
  imageCount: number
  imageFileNames: string[]
  primaryImageFileName: string
  visibleText: string
  designStyle: string
  features: string[]
  metaTitle: string
  metaDescription: string
  included: boolean
  thumbnailUrl?: string
  allThumbnailUrls?: string[]
  cachedVersions?: CachedVersionInfo[]
  existingProduct?: ExistingProductInfo | null
  action: 'create' | 'update'
  changedFields?: string[]
}

type Props = {
  products: PreviewProduct[]
  onUpdate: (index: number, updates: Partial<PreviewProduct>) => void
  onUpload: () => void
  uploading: boolean
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export const ProductPreview: React.FC<Props> = ({
  products,
  onUpdate,
  onUpload,
  uploading,
}) => {
  const includedCount = products.filter((p) => p.included).length
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const updateCount = products.filter((p) => p.included && p.action === 'update').length
  const createCount = products.filter((p) => p.included && p.action === 'create').length

  const handlePriceChange = useCallback(
    (index: number, value: string) => {
      const dollars = parseFloat(value)
      if (!isNaN(dollars) && dollars >= 1) {
        onUpdate(index, {
          pricing: {
            ...products[index].pricing,
            finalPrice: Math.round(dollars * 100),
          },
        })
      }
    },
    [onUpdate, products],
  )

  const totalPrice = products
    .filter((p) => p.included)
    .reduce((sum, p) => sum + p.pricing.finalPrice, 0)

  const totalImages = products
    .filter((p) => p.included)
    .reduce((sum, p) => sum + p.imageCount, 0)

  return (
    <div className="bulk-upload__preview">
      <div className="bulk-upload__preview-header">
        <div>
          <h4>Product Preview — {includedCount} selected</h4>
          {(updateCount > 0 || createCount > 0) && (
            <div className="bulk-upload__preview-action-summary">
              {createCount > 0 && (
                <span className="bulk-upload__cache-badge bulk-upload__cache-badge--miss">
                  {createCount} new
                </span>
              )}
              {updateCount > 0 && (
                <span className="bulk-upload__cache-badge bulk-upload__cache-badge--exists">
                  {updateCount} update
                </span>
              )}
            </div>
          )}
        </div>
        <button
          className="bulk-upload__btn bulk-upload__btn--primary"
          onClick={onUpload}
          disabled={uploading || includedCount === 0}
        >
          {uploading
            ? 'Uploading...'
            : `Upload ${includedCount} Products${updateCount > 0 ? ` (${updateCount} updates, ${createCount} new)` : ''}`}
        </button>
      </div>

      <div className="bulk-upload__table-wrap">
        <table className="bulk-upload__table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th style={{ width: 70 }}>Images</th>
              <th>Title</th>
              <th>Description</th>
              <th>Category</th>
              <th style={{ width: 200 }}>Price</th>
              <th style={{ width: 80 }}>Variants</th>
              <th style={{ width: 130 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <React.Fragment key={product.number}>
                <tr
                  className={!product.included ? 'bulk-upload__row--excluded' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={product.included}
                      onChange={(e) => onUpdate(idx, { included: e.target.checked })}
                    />
                  </td>
                  <td>
                    <div
                      className="bulk-upload__img-cell"
                      onClick={() =>
                        setExpandedRow(expandedRow === product.number ? null : product.number)
                      }
                    >
                      {product.thumbnailUrl ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.title}
                          className="bulk-upload__thumbnail"
                        />
                      ) : (
                        <div className="bulk-upload__thumbnail-placeholder" />
                      )}
                      <span className="bulk-upload__img-count">
                        {product.imageCount}
                        <span className="bulk-upload__img-expand">
                          {expandedRow === product.number ? '▲' : '▼'}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="bulk-upload__input"
                      value={product.title}
                      onChange={(e) => onUpdate(idx, { title: e.target.value })}
                    />
                    <div className="bulk-upload__slug">{product.slug}</div>
                    {product.visibleText && (
                      <div className="bulk-upload__visible-text">
                        "{product.visibleText}"
                      </div>
                    )}
                  </td>
                  <td>
                    <textarea
                      className="bulk-upload__textarea"
                      value={product.description}
                      onChange={(e) => onUpdate(idx, { description: e.target.value })}
                      rows={3}
                    />
                    {product.cachedVersions && product.cachedVersions.length > 1 && (
                      <div className="bulk-upload__versions">
                        <select
                          className="bulk-upload__versions-select"
                          value=""
                          onChange={(e) => {
                            const vId = e.target.value
                            const v = product.cachedVersions?.find((cv) => cv.id === vId)
                            if (v) {
                              onUpdate(idx, {
                                description: v.analysis.description,
                                visibleText: v.analysis.visibleText,
                                designStyle: v.analysis.designStyle,
                                features: v.analysis.features,
                              })
                            }
                          }}
                        >
                          <option value="" disabled>
                            Switch version ({product.cachedVersions.length} available)
                          </option>
                          {product.cachedVersions.map((v) => (
                            <option key={v.id} value={v.id}>
                              v{v.version} — {v.model} — {timeAgo(v.createdAt)}
                              {product.description === v.analysis.description ? ' (current)' : ''}
                              {' — '}{v.analysis.description.slice(0, 50)}...
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="bulk-upload__category-tag">{product.category}</span>
                  </td>
                  <td>
                    <div className="bulk-upload__price-stack">
                      <div className="bulk-upload__price-row">
                        <span className="bulk-upload__price-label">Base:</span>
                        <span>{formatPrice(product.pricing.basePrice)}</span>
                      </div>
                      {product.pricing.knownPrice !== null && (
                        <div className="bulk-upload__price-row">
                          <span className="bulk-upload__price-label">Seed:</span>
                          <span>{formatPrice(product.pricing.knownPrice)}</span>
                        </div>
                      )}
                      {product.pricing.aiSuggestedPrice !== null && (
                        <div className="bulk-upload__price-row">
                          <span className="bulk-upload__price-label">AI:</span>
                          <span>{formatPrice(product.pricing.aiSuggestedPrice)}</span>
                          {product.pricing.aiPriceReason && (
                            <span
                              className="bulk-upload__price-reason"
                              title={product.pricing.aiPriceReason}
                            >
                              ?
                            </span>
                          )}
                        </div>
                      )}
                      <div className="bulk-upload__price-row bulk-upload__price-row--final">
                        <span className="bulk-upload__price-label">Final:</span>
                        <span>$</span>
                        <input
                          type="number"
                          className="bulk-upload__price-input"
                          value={(product.pricing.finalPrice / 100).toFixed(2)}
                          onChange={(e) => handlePriceChange(idx, e.target.value)}
                          min="1"
                          step="0.50"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="bulk-upload__center">
                    {product.hasSizeVariants ? 'S/M/L/XL' : '—'}
                  </td>
                  <td>
                    {product.existingProduct ? (
                      <div className="bulk-upload__action-cell">
                        <select
                          className="bulk-upload__action-select"
                          value={product.action}
                          onChange={(e) =>
                            onUpdate(idx, { action: e.target.value as 'create' | 'update' })
                          }
                        >
                          <option value="update">Update existing</option>
                          <option value="create">Create new</option>
                        </select>
                        <a
                          href={product.existingProduct.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bulk-upload__action-link"
                          title={`View: ${product.existingProduct.title}`}
                        >
                          View in store →
                        </a>
                        {product.changedFields && product.changedFields.length > 0 && product.action === 'update' && (
                          <div className="bulk-upload__action-changes">
                            {product.changedFields.length} field{product.changedFields.length > 1 ? 's' : ''} changed: {product.changedFields.join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="bulk-upload__action-new">New product</span>
                    )}
                  </td>
                </tr>
                {/* Expanded image row */}
                {expandedRow === product.number && product.allThumbnailUrls && product.allThumbnailUrls.length > 0 && (
                  <tr className="bulk-upload__row--images">
                    <td></td>
                    <td colSpan={7}>
                      <div className="bulk-upload__img-grid">
                        {product.allThumbnailUrls.map((url, i) => (
                          <div key={i} className="bulk-upload__img-grid-item">
                            <img src={url} alt={`${product.title} — ${product.imageFileNames[i] || `image ${i + 1}`}`} />
                            <span className="bulk-upload__img-grid-name">
                              {product.imageFileNames[i]?.split('/').pop() || `image-${i + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="bulk-upload__table-totals">
              <td></td>
              <td className="bulk-upload__center">
                <strong>{totalImages}</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--theme-elevation-400)' }}>images</div>
              </td>
              <td><strong>{includedCount} products</strong></td>
              <td></td>
              <td></td>
              <td>
                <strong>{formatPrice(totalPrice)}</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--theme-elevation-400)' }}>total catalog value</div>
              </td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
