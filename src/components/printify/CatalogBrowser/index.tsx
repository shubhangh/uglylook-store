'use client'

import React, { useCallback, useEffect, useState } from 'react'
import './catalog-browser.css'

type ScoredSku = {
  blueprintId: number
  blueprintTitle: string
  blueprintBrand: string
  blueprintModel: string
  blueprintImages: string[]
  providerId: number
  providerTitle: string
  decorationMethods: string[]
  category: string
  minCost: number
  maxCost: number
  shippingCostUs: number
  handlingTime: string
  targetRetail: number
  marginPercent: number
  profitPerUnit: number
  totalVariants: number
  enabledVariants: number
  availableColors: string[]
  brandColorsAvailable: string[]
  brandColorCount: number
  availableSizes: string[]
  sizeRange: string
  hasSizeS: boolean
  hasSizeM: boolean
  hasSizeL: boolean
  hasSizeXL: boolean
  hasSize2XL: boolean
  printAreaFront: { width: number; height: number } | null
  printAreaBack: { width: number; height: number } | null
  printAreaCount: number
  isUsProvider: boolean
  score: number
  scoreBreakdown: Record<string, number>
}

type CatalogResponse = {
  results: ScoredSku[]
  total: number
  page: number
  limit: number
  totalPages: number
  categoryCounts: Record<string, number>
  cachedAt: string | null
  filters: {
    category: string
    minMargin: number
    color: string
    sort: string
    limit: number
  }
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'hoodies', label: 'Hoodies' },
  { key: 'tees', label: 'Tees' },
  { key: 'hats', label: 'Hats' },
  { key: 'totes', label: 'Totes' },
  { key: 'sweatshirts', label: 'Sweatshirts' },
]

const BRAND_COLORS = [
  { key: '', label: 'Any' },
  { key: 'black', label: 'Black' },
  { key: 'bone', label: 'Bone' },
  { key: 'white', label: 'White' },
  { key: 'olive', label: 'Olive' },
]

const SORT_OPTIONS = [
  { key: 'score', label: 'Best Match' },
  { key: 'margin', label: 'Highest Margin' },
  { key: 'cost', label: 'Lowest Cost' },
  { key: 'brand', label: 'Brand A-Z' },
]

function brandColorDots(colors: string[]): React.ReactNode {
  const colorMap: Record<string, string> = {
    black: '#111',
    bone: '#D9D2C2',
    white: '#f5f5f5',
    olive: '#5A6242',
    charcoal: '#444',
  }
  return (
    <span className="color-dots">
      {colors.map((c) => (
        <span
          key={c}
          className="color-dot"
          style={{ background: colorMap[c] || '#888' }}
          title={c}
        />
      ))}
    </span>
  )
}

const COLOR_CSS_MAP: Record<string, string> = {
  black: '#111111', 'jet black': '#0a0a0a', 'deep black': '#0a0a0a',
  white: '#f5f5f5', 'snow white': '#fafafa',
  bone: '#D9D2C2', sand: '#c2b280', natural: '#ddd5c0', cream: '#f5f0e0', oatmeal: '#d4c9a8',
  navy: '#1a2744', 'dark navy': '#0f1a2e',
  charcoal: '#3a3a3a', 'dark heather': '#4a4a4a', 'heather charcoal': '#555',
  red: '#c0392b', 'dark red': '#8b0000', maroon: '#5a1a1a',
  olive: '#5A6242', 'military green': '#4b5320', 'army green': '#4b5320', forest: '#2d4a2d',
  grey: '#888', gray: '#888', 'heather grey': '#999', 'sport grey': '#9ca3af',
  brown: '#6b4226', 'dark chocolate': '#3b2010',
  pink: '#e8a0b5', 'light pink': '#f4c2d0',
  royal: '#2e52a0', 'royal blue': '#2e52a0',
  orange: '#d35400', gold: '#c9a030', yellow: '#e8c820',
  teal: '#1a7a6d', 'dark teal': '#0f5049',
  purple: '#6b3fa0', 'heather purple': '#8b6fb0',
}

function getColorCss(colorName: string): string {
  const lower = colorName.toLowerCase()
  if (COLOR_CSS_MAP[lower]) return COLOR_CSS_MAP[lower]
  // Fuzzy match
  for (const [key, val] of Object.entries(COLOR_CSS_MAP)) {
    if (lower.includes(key)) return val
  }
  return ''
}

// ── Brand color aliases (must match sku-scorer.ts) ─────────────────

const BRAND_COLOR_ALIASES: Record<string, string[]> = {
  black: ['black', 'jet black', 'deep black'],
  bone: ['bone', 'sand', 'natural', 'cream', 'ivory', 'oatmeal', 'heather dust', 'soft cream'],
  white: ['white', 'vintage white'],
  olive: ['olive', 'military green', 'army', 'dark green', 'forest green'],
  charcoal: ['charcoal', 'dark heather', 'dark grey', 'charcoal heather'],
}

/** Given available Printify color names, return the ones that match any brand color alias */
function getBrandPaletteColors(availableColors: string[]): string[] {
  const matched: string[] = []
  for (const color of availableColors) {
    const lower = color.toLowerCase()
    for (const aliases of Object.values(BRAND_COLOR_ALIASES)) {
      if (aliases.some((a) => lower.includes(a))) {
        matched.push(color)
        break
      }
    }
  }
  return matched
}

// ── Detail Drawer ──────────────────────────────────────────────────

// Per-SKU launch config: selected colors, sizes, provider override
type LaunchConfig = { colors: Set<string>; sizes: Set<string>; providerId?: number }

function DetailDrawer({
  sku,
  isSelected,
  onSelect,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  currentIndex,
  totalCount,
  launchConfig,
  onUpdateLaunchConfig,
}: {
  sku: ScoredSku
  isSelected: boolean
  onSelect: () => void
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  currentIndex: number
  totalCount: number
  launchConfig: LaunchConfig | undefined
  onUpdateLaunchConfig: (config: LaunchConfig) => void
}) {
  const [heroImage, setHeroImage] = useState(0)
  const [imageSize, setImageSize] = useState<'S' | 'M' | 'L' | 'XL'>('M')
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [altProviders, setAltProviders] = useState<ScoredSku[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [activeProvider, setActiveProvider] = useState<ScoredSku | null>(null)

  // Per-SKU multi-select for colors and sizes
  const [pickedColors, setPickedColors] = useState<Set<string>>(
    () => launchConfig?.colors || new Set(),
  )
  const [pickedSizes, setPickedSizes] = useState<Set<string>>(
    () => launchConfig?.sizes || new Set(),
  )
  // On-demand cost data: keyed by providerId
  const [costData, setCostData] = useState<Map<number, { minCost: number; maxCost: number }>>(new Map())
  const [loadingCosts, setLoadingCosts] = useState(false)

  // The displayed SKU — either the original or a selected alt provider
  const displaySku = activeProvider || sku

  // Persist picks back to parent whenever they change
  useEffect(() => {
    onUpdateLaunchConfig({
      colors: pickedColors,
      sizes: pickedSizes,
      providerId: activeProvider?.providerId,
    })
  }, [pickedColors, pickedSizes, activeProvider]) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePickedColor = (c: string) => {
    setPickedColors((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  const togglePickedSize = (s: string) => {
    setPickedSizes((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  // Reset hero image and fetch alternative providers when SKU changes
  useEffect(() => {
    setHeroImage(0)
    setSelectedColor(null)
    setAltProviders([])
    setActiveProvider(null)
    setCostData(new Map())
    setPickedColors(launchConfig?.colors || new Set())
    setPickedSizes(launchConfig?.sizes || new Set())
    setLoadingProviders(true)

    // Fetch all providers for this blueprint from catalog cache
    const params = new URLSearchParams()
    params.set('category', 'all')
    params.set('limit', '200')
    params.set('minMargin', '0')
    params.set('sort', 'score')

    fetch(`/next/printify-catalog?${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const allForBlueprint = (data.results || [])
          .filter((s: ScoredSku) => s.blueprintId === sku.blueprintId && s.providerId !== sku.providerId)
          .sort((a: ScoredSku, b: ScoredSku) => b.score - a.score)
          .slice(0, 5)
        setAltProviders(allForBlueprint)
      })
      .catch(() => {})
      .finally(() => setLoadingProviders(false))
  }, [sku.blueprintId, sku.providerId])

  // Probe costs on-demand for the current SKU (and alt providers once loaded)
  useEffect(() => {
    // Gather all provider IDs to probe
    const providers = [sku, ...altProviders]
    const toProbe = providers.filter((p) => {
      // Skip if we already have cost data or the cached minCost is > 0
      if (costData.has(p.providerId)) return false
      if (p.minCost > 0) return false
      return true
    })

    if (toProbe.length === 0) return

    setLoadingCosts(true)
    let cancelled = false

    // Probe each provider sequentially to avoid hammering the API
    ;(async () => {
      for (const p of toProbe) {
        if (cancelled) break
        try {
          const res = await fetch(
            `/next/printify-costs?blueprintId=${p.blueprintId}&providerId=${p.providerId}`,
            { credentials: 'include' },
          )
          if (res.ok) {
            const data = await res.json()
            if (!cancelled) {
              setCostData((prev) => {
                const next = new Map(prev)
                next.set(p.providerId, { minCost: data.minCost, maxCost: data.maxCost })
                return next
              })
            }
          }
        } catch { /* ignore */ }
      }
      if (!cancelled) setLoadingCosts(false)
    })()

    return () => { cancelled = true }
  }, [sku.blueprintId, sku.providerId, altProviders.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 's' || e.key === 'S') onSelect()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext, onSelect])

  // Helper: get effective cost for a provider (probed > cached)
  const getEffectiveCost = (p: ScoredSku) => {
    const probed = costData.get(p.providerId)
    return {
      minCost: probed?.minCost ?? (p.minCost > 0 ? p.minCost : null),
      maxCost: probed?.maxCost ?? (p.maxCost > 0 ? p.maxCost : null),
    }
  }

  const displayCosts = getEffectiveCost(displaySku)
  const effectiveMinCost = displayCosts.minCost ?? 0
  const effectiveMaxCost = displayCosts.maxCost ?? 0
  const stripeFee = displaySku.targetRetail * 0.029 + 0.3
  const effectiveTotalCost = effectiveMinCost + displaySku.shippingCostUs + stripeFee
  const effectiveProfit = displaySku.targetRetail - effectiveTotalCost
  const effectiveMargin = displaySku.targetRetail > 0
    ? Math.round((effectiveProfit / displaySku.targetRetail) * 1000) / 10
    : 0
  const images = displaySku.blueprintImages || []

  // All providers: current sku + alt providers, for the comparison table
  const allProviders = [sku, ...altProviders]

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        {/* Header */}
        <div className="drawer__header">
          <button className="drawer__close" onClick={onClose}>← Back to Grid</button>
          <span className="drawer__position">{currentIndex + 1} / {totalCount}</span>
          <div className="drawer__nav">
            <button disabled={!hasPrev} onClick={onPrev}>← Prev</button>
            <button disabled={!hasNext} onClick={onNext}>Next →</button>
          </div>
        </div>

        <div className="drawer__body">
          {/* Image Gallery */}
          <div className="drawer__gallery">
            <div className="drawer__hero-wrap">
              <div className={`drawer__hero drawer__hero--${imageSize}`}>
                {images[heroImage] ? (
                  <>
                    <img src={images[heroImage]} alt={displaySku.blueprintTitle} />
                    {selectedColor && getColorCss(selectedColor) && (
                      <div
                        className="drawer__hero-tint"
                        style={{ backgroundColor: getColorCss(selectedColor) }}
                      />
                    )}
                  </>
                ) : (
                  <div className="drawer__hero-placeholder">No image</div>
                )}
                {selectedColor && (
                  <div className="drawer__hero-color-label">{selectedColor}</div>
                )}
              </div>
              <div className="drawer__size-toggle">
                {(['S', 'M', 'L', 'XL'] as const).map((s) => (
                  <button
                    key={s}
                    className={`drawer__size-btn ${imageSize === s ? 'drawer__size-btn--active' : ''}`}
                    onClick={() => setImageSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {images.length > 1 && (
              <div className="drawer__thumbnails">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`drawer__thumb ${i === heroImage ? 'drawer__thumb--active' : ''}`}
                    onClick={() => setHeroImage(i)}
                  >
                    <img src={img} alt={`View ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="drawer__section">
            <div className="drawer__title-row">
              <div>
                <h2 className="drawer__title">{displaySku.blueprintTitle}</h2>
                <p className="drawer__subtitle">
                  {displaySku.blueprintBrand} {displaySku.blueprintModel && `— ${displaySku.blueprintModel}`}
                </p>
                <span className="drawer__category-badge">{displaySku.category}</span>
              </div>
              <div className="drawer__score-big">{displaySku.score}</div>
            </div>
          </div>

          {/* Provider Comparison — selectable rows */}
          <div className="drawer__section">
            <h3 className="drawer__section-title">
              Providers ({allProviders.length})
              {activeProvider && (
                <button className="drawer__provider-reset" onClick={() => setActiveProvider(null)}>
                  Reset to Best
                </button>
              )}
              <button
                className={`drawer__refresh-btn ${loadingCosts ? 'drawer__refresh-btn--loading' : ''}`}
                disabled={loadingCosts}
                title="Refresh prices from Printify"
                onClick={() => {
                  setCostData(new Map())
                  setLoadingCosts(true)
                  ;(async () => {
                    for (const p of [sku, ...altProviders]) {
                      try {
                        const res = await fetch(
                          `/next/printify-costs?blueprintId=${p.blueprintId}&providerId=${p.providerId}&refresh=1`,
                          { credentials: 'include' },
                        )
                        if (res.ok) {
                          const data = await res.json()
                          setCostData((prev) => {
                            const next = new Map(prev)
                            next.set(p.providerId, { minCost: data.minCost, maxCost: data.maxCost })
                            return next
                          })
                        }
                      } catch { /* ignore */ }
                    }
                    setLoadingCosts(false)
                  })()
                }}
              >
                <svg className="drawer__refresh-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.5 8a6.5 6.5 0 0 1 11.25-4.5M14.5 8a6.5 6.5 0 0 1-11.25 4.5" />
                  <path d="M13.5 1v3.5H10M2.5 15v-3.5H6" />
                </svg>
              </button>
            </h3>
            {loadingProviders ? (
              <span className="drawer__loading-text">Loading providers...</span>
            ) : (
              <div className="drawer__providers-table">
                <div className="drawer__providers-header">
                  <span>Provider</span>
                  <span>Method</span>
                  <span>Cost</span>
                  <span>Ship</span>
                  <span>Total</span>
                  <span>Margin</span>
                  <span>Days</span>
                  <span>Score</span>
                </div>
                {allProviders.map((p) => {
                  const isActive = p.providerId === displaySku.providerId
                  const pc = getEffectiveCost(p)
                  const pMinCost = pc.minCost ?? 0
                  const pShip = p.shippingCostUs || 0
                  const pCostPlusShip = pMinCost + pShip
                  const pStripe = p.targetRetail * 0.029 + 0.3
                  const pTotal = pMinCost + pShip + pStripe
                  const pProfit = p.targetRetail - pTotal
                  const pMargin = pc.minCost !== null && p.targetRetail > 0
                    ? Math.round((pProfit / p.targetRetail) * 1000) / 10
                    : p.marginPercent
                  const costLoading = pc.minCost === null && loadingCosts
                  return (
                    <button
                      key={p.providerId}
                      className={`drawer__provider-row ${isActive ? 'drawer__provider-row--active' : ''}`}
                      onClick={() => setActiveProvider(p.providerId === sku.providerId ? null : p)}
                    >
                      <span className="drawer__provider-name">
                        {p.providerTitle}
                        {p.providerId === sku.providerId && <span className="drawer__provider-best">★</span>}
                      </span>
                      <span className="drawer__provider-method">
                        {(p.decorationMethods || []).map((m: any) => typeof m === 'object' ? m.title : m).join(', ') || '—'}
                      </span>
                      <span>{costLoading ? '...' : `$${pMinCost.toFixed(2)}`}</span>
                      <span>${pShip.toFixed(2)}</span>
                      <span className="drawer__provider-total">
                        {costLoading ? '...' : `$${pCostPlusShip.toFixed(2)}`}
                      </span>
                      <span className={pMargin >= 50 ? 'stat--good' : pMargin >= 45 ? 'stat--ok' : 'stat--warn'}>
                        {costLoading ? '...' : `${pMargin}%`}
                      </span>
                      <span>{p.handlingTime || '—'}</span>
                      <span className="drawer__provider-score">{p.score}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pricing Breakdown for selected provider */}
          <div className="drawer__section">
            <h3 className="drawer__section-title">
              Pricing — {displaySku.providerTitle}
            </h3>
            <div className="drawer__info-grid">
              <div className="drawer__info-item">
                <span className="drawer__info-label">Provider</span>
                <span>{displaySku.providerTitle} (#{displaySku.providerId})</span>
              </div>
              <div className="drawer__info-item">
                <span className="drawer__info-label">Method</span>
                <span>{(displaySku.decorationMethods || []).map((m: any) => typeof m === 'object' ? m.title : m).join(', ') || 'N/A'}</span>
              </div>
              <div className="drawer__info-item">
                <span className="drawer__info-label">Handling</span>
                <span>{displaySku.handlingTime || 'N/A'}</span>
              </div>
              <div className="drawer__info-item">
                <span className="drawer__info-label">Location</span>
                <span>{displaySku.isUsProvider ? 'US-based' : 'International'}</span>
              </div>
            </div>

            <div className="drawer__cost-breakdown">
              <div className="drawer__cost-row">
                <span>POD Cost</span>
                <span>
                  {displayCosts.minCost !== null ? (
                    <>
                      ${effectiveMinCost.toFixed(2)}
                      {effectiveMaxCost > effectiveMinCost && ` – $${effectiveMaxCost.toFixed(2)}`}
                    </>
                  ) : loadingCosts ? (
                    <span className="drawer__cost-loading">probing...</span>
                  ) : (
                    <span className="drawer__cost-loading">unavailable</span>
                  )}
                </span>
              </div>
              <div className="drawer__cost-row">
                <span>US Shipping</span>
                <span>${displaySku.shippingCostUs.toFixed(2)}</span>
              </div>
              <div className="drawer__cost-row">
                <span>Stripe Fee (@ ${displaySku.targetRetail})</span>
                <span>${stripeFee.toFixed(2)}</span>
              </div>
              <div className="drawer__cost-divider" />
              <div className="drawer__cost-row drawer__cost-row--bold">
                <span>Profit (@ ${displaySku.targetRetail})</span>
                <span>
                  {displayCosts.minCost !== null
                    ? `$${effectiveProfit.toFixed(2)}`
                    : loadingCosts ? '...' : '—'}
                </span>
              </div>
              <div className="drawer__cost-row drawer__cost-row--bold">
                <span>Margin</span>
                <span className={effectiveMargin >= 50 ? 'stat--good' : effectiveMargin >= 45 ? 'stat--ok' : 'stat--warn'}>
                  {displayCosts.minCost !== null
                    ? `${effectiveMargin}%`
                    : loadingCosts ? '...' : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="drawer__section">
            <h3 className="drawer__section-title">Score Breakdown</h3>
            <div className="score-bars">
              {Object.entries(displaySku.scoreBreakdown).map(([key, value]) => (
                <div key={key} className="score-bar">
                  <span className="score-bar__label">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="score-bar__track">
                    <div className="score-bar__fill" style={{ width: `${value}%` }} />
                  </div>
                  <span className="score-bar__value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Colors — multi-select for launch */}
          <div className="drawer__section">
            <h3 className="drawer__section-title">
              Colors
              {pickedColors.size > 0 && (
                <span className="drawer__pick-count">{pickedColors.size}/{displaySku.availableColors.length}</span>
              )}
            </h3>
            <div className="drawer__quick-actions">
              <button
                className="drawer__quick-btn"
                onClick={() => setPickedColors(new Set(displaySku.availableColors))}
              >
                All
              </button>
              {displaySku.brandColorsAvailable.length > 0 && (
                <button
                  className="drawer__quick-btn drawer__quick-btn--brand"
                  onClick={() => setPickedColors(new Set(getBrandPaletteColors(displaySku.availableColors)))}
                >
                  Brand Palette
                </button>
              )}
              {pickedColors.size > 0 && (
                <button className="drawer__quick-btn drawer__quick-btn--clear" onClick={() => setPickedColors(new Set())}>
                  Clear
                </button>
              )}
              <span className="drawer__brand-colors-inline">
                {brandColorDots(displaySku.brandColorsAvailable)}
                {displaySku.brandColorsAvailable.length > 0 && (
                  <span className="drawer__matched">{displaySku.brandColorsAvailable.join(', ')}</span>
                )}
                {displaySku.brandColorsAvailable.length === 0 && <span className="drawer__none">No brand matches</span>}
              </span>
            </div>
            <div className="drawer__color-list">
              {displaySku.availableColors.map((c) => {
                const cssColor = getColorCss(c)
                const isPicked = pickedColors.has(c)
                return (
                  <button
                    key={c}
                    className={`drawer__color-chip ${isPicked ? 'drawer__color-chip--picked' : ''} ${selectedColor === c ? 'drawer__color-chip--preview' : ''}`}
                    onClick={() => togglePickedColor(c)}
                    onMouseEnter={() => setSelectedColor(c)}
                    onMouseLeave={() => setSelectedColor(null)}
                  >
                    {isPicked && <span className="drawer__color-check">✓</span>}
                    {cssColor && (
                      <span className="drawer__color-swatch" style={{ backgroundColor: cssColor }} />
                    )}
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sizes — multi-select for launch */}
          <div className="drawer__section">
            <h3 className="drawer__section-title">
              Sizes
              {pickedSizes.size > 0 && (
                <span className="drawer__pick-count">{pickedSizes.size}/{displaySku.availableSizes.length}</span>
              )}
            </h3>
            <div className="drawer__quick-actions">
              <button
                className="drawer__quick-btn"
                onClick={() => setPickedSizes(new Set(displaySku.availableSizes))}
              >
                All
              </button>
              {pickedSizes.size > 0 && (
                <button className="drawer__quick-btn drawer__quick-btn--clear" onClick={() => setPickedSizes(new Set())}>
                  Clear
                </button>
              )}
            </div>
            <div className="drawer__size-list">
              {displaySku.availableSizes.map((s) => (
                <button
                  key={s}
                  className={`drawer__size-chip ${pickedSizes.has(s) ? 'drawer__size-chip--picked' : ''}`}
                  onClick={() => togglePickedSize(s)}
                >
                  {pickedSizes.has(s) && <span className="drawer__size-check">✓</span>}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Print Areas */}
          <div className="drawer__section">
            <h3 className="drawer__section-title">Print Areas</h3>
            <div className="drawer__info-grid">
              {displaySku.printAreaFront && (
                <div className="drawer__info-item">
                  <span className="drawer__info-label">Front</span>
                  <span>{displaySku.printAreaFront.width} × {displaySku.printAreaFront.height} px</span>
                </div>
              )}
              {displaySku.printAreaBack && (
                <div className="drawer__info-item">
                  <span className="drawer__info-label">Back</span>
                  <span>{displaySku.printAreaBack.width} × {displaySku.printAreaBack.height} px</span>
                </div>
              )}
              <div className="drawer__info-item">
                <span className="drawer__info-label">Total areas</span>
                <span>{displaySku.printAreaCount}</span>
              </div>
            </div>
          </div>

          {/* IDs */}
          <div className="drawer__section">
            <h3 className="drawer__section-title">Reference IDs</h3>
            <div className="drawer__info-grid">
              <div className="drawer__info-item">
                <span className="drawer__info-label">Blueprint ID</span>
                <span className="drawer__mono">{displaySku.blueprintId}</span>
              </div>
              <div className="drawer__info-item">
                <span className="drawer__info-label">Provider ID</span>
                <span className="drawer__mono">{displaySku.providerId}</span>
              </div>
              <div className="drawer__info-item">
                <span className="drawer__info-label">Total Variants</span>
                <span>{displaySku.totalVariants} ({displaySku.enabledVariants} enabled)</span>
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="drawer__footer">
            <button
              className={`drawer__select-btn ${isSelected ? 'drawer__select-btn--selected' : ''}`}
              onClick={onSelect}
            >
              {isSelected ? '✓ Selected for Launch' : 'Select for Launch'}
            </button>
            <div className="drawer__footer-nav">
              <button disabled={!hasPrev} onClick={onPrev}>← Prev</button>
              <button disabled={!hasNext} onClick={onNext}>Next →</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main Component ─────────────────────────────────────────────────

type SyncStatus = {
  progress: {
    isRunning: boolean
    phase: string
    totalBlueprints: number
    processedBlueprints: number
    percentComplete: number
    currentBlueprint: string
    skusScoredSoFar: number
    newSkus: number
    updatedSkus: number
    unchangedSkus: number
    errorsSoFar: number
    apiCallsSoFar: number
    startedAt: string
    lastMessage: string
    estimatedSecondsRemaining: number
  }
  lastSync: {
    completedAt: string
    type: string
    skusScored: number
    skusNew: number
    skusUpdated: number
  } | null
  cachedSkus: number
}

export const CatalogBrowser: React.FC = () => {
  const [data, setData] = useState<CatalogResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('all')
  const [color, setColor] = useState('')
  const [sort, setSort] = useState('score')
  const [minMargin, setMinMargin] = useState(45)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [launchConfigs, setLaunchConfigs] = useState<Map<string, LaunchConfig>>(new Map())
  const [drawerIndex, setDrawerIndex] = useState<number | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(24)

  const fetchCatalog = useCallback(
    async (pageNum?: number) => {
      setLoading(true)
      setError(null)
      const p = pageNum || page
      try {
        const params = new URLSearchParams()
        params.set('category', category)
        params.set('sort', sort)
        params.set('minMargin', String(minMargin))
        params.set('limit', String(perPage))
        params.set('page', String(p))
        if (color) params.set('color', color)

        const res = await fetch(`/next/printify-catalog?${params}`, {
          credentials: 'include',
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `HTTP ${res.status}`)
        }

        const json: CatalogResponse = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch catalog')
      } finally {
        setLoading(false)
      }
    },
    [category, sort, minMargin, color, page, perPage],
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [category, sort, minMargin, color, perPage])

  // Fetch sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch('/next/printify-sync-status', { credentials: 'include' })
      if (res.ok) {
        const json: SyncStatus = await res.json()
        setSyncStatus(json)
        return json
      }
    } catch { /* ignore */ }
    return null
  }, [])

  // Poll sync status while syncing
  useEffect(() => {
    if (!syncing) return
    const interval = setInterval(async () => {
      const status = await fetchSyncStatus()
      if (status && !status.progress.isRunning) {
        setSyncing(false)
        clearInterval(interval)
        fetchCatalog() // Refresh catalog data after sync completes
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [syncing, fetchSyncStatus, fetchCatalog])

  // Initial load
  useEffect(() => {
    fetchCatalog()
    fetchSyncStatus()
  }, [fetchCatalog, fetchSyncStatus])

  const triggerSync = async (mode: 'full' | 'incremental' | 'clear-resync') => {
    try {
      const res = await fetch('/next/printify-sync', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const json = await res.json()
      if (res.ok) {
        setSyncing(true)
        fetchSyncStatus()
      } else if (res.status === 409) {
        // Sync already running — just show progress
        setSyncing(true)
        fetchSyncStatus()
      } else {
        setError(json.error || 'Failed to start sync')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const cancelSync = async () => {
    try {
      await fetch('/next/printify-sync', { method: 'DELETE', credentials: 'include' })
      setSyncing(false)
    } catch { /* ignore */ }
  }

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const skuKey = (s: ScoredSku) => `${s.blueprintId}-${s.providerId}`

  const openDrawer = (index: number) => setDrawerIndex(index)
  const closeDrawer = () => setDrawerIndex(null)

  return (
    <div className="catalog-browser">
      <div className="catalog-browser__header">
        <h1>Printify Catalog Browser</h1>
        <div className="catalog-browser__header-actions">
          {(data as any)?.lastSyncedAt && (
            <span className="catalog-browser__cache-info">
              Last synced: {(data as any).syncAge || new Date((data as any).lastSyncedAt).toLocaleString()}
              {(data as any).isStale && <span className="catalog-browser__stale"> (stale)</span>}
            </span>
          )}
          <button
            className="catalog-browser__btn"
            onClick={() => triggerSync('incremental')}
            disabled={syncing}
          >
            Quick Sync
          </button>
          <button
            className="catalog-browser__btn catalog-browser__btn--refresh"
            onClick={() => triggerSync('full')}
            disabled={syncing}
          >
            Full Rescan
          </button>
          <button
            className="catalog-browser__btn catalog-browser__btn--danger"
            onClick={() => {
              if (window.confirm('This will delete all cached catalog data and resync from scratch. Continue?')) {
                triggerSync('clear-resync')
              }
            }}
            disabled={syncing}
          >
            Clear &amp; Resync
          </button>
        </div>
      </div>

      {/* Sync Progress Panel */}
      {syncing && (
        <div className="sync-progress">
          <div className="sync-progress__header">
            <span className="sync-progress__title">
              <span className="sync-progress__spinner" />
              Sync in progress...
            </span>
            <button className="sync-progress__cancel" onClick={cancelSync}>Cancel</button>
          </div>
          {syncStatus?.progress ? (
            <>
              <div className="sync-progress__bar-track">
                <div
                  className="sync-progress__bar-fill"
                  style={{ width: `${syncStatus.progress.percentComplete}%` }}
                />
              </div>
              <div className="sync-progress__stats">
                <span>{syncStatus.progress.percentComplete}% — {syncStatus.progress.processedBlueprints}/{syncStatus.progress.totalBlueprints} blueprints</span>
                <span>{syncStatus.progress.skusScoredSoFar} SKUs scored</span>
              </div>
              <div className="sync-progress__detail">
                {syncStatus.progress.currentBlueprint && (
                  <span>Processing: {syncStatus.progress.currentBlueprint}</span>
                )}
                {syncStatus.progress.estimatedSecondsRemaining > 0 && (
                  <span>ETA: ~{Math.ceil(syncStatus.progress.estimatedSecondsRemaining / 60)} min</span>
                )}
              </div>
              <div className="sync-progress__counts">
                <span className="sync-count sync-count--new">{syncStatus.progress.newSkus} new</span>
                <span className="sync-count sync-count--updated">{syncStatus.progress.updatedSkus} updated</span>
                <span className="sync-count sync-count--unchanged">{syncStatus.progress.unchangedSkus} unchanged</span>
                {syncStatus.progress.errorsSoFar > 0 && (
                  <span className="sync-count sync-count--error">{syncStatus.progress.errorsSoFar} errors</span>
                )}
              </div>
            </>
          ) : (
            <div className="sync-progress__stats">
              <span>Starting sync, please wait...</span>
            </div>
          )}
        </div>
      )}

      {/* Sync completed banner */}
      {!syncing && syncStatus?.progress?.phase === 'completed' && syncStatus?.progress?.lastMessage && (
        <div className="sync-complete">
          {syncStatus.progress.lastMessage}
        </div>
      )}

      {/* Empty state — no cached data yet */}
      {!loading && data?.total === 0 && !syncing && (
        <div className="catalog-browser__scanning">
          <p>No catalog data yet. Run a sync to fetch Printify blueprints.</p>
          <button
            className="catalog-browser__btn catalog-browser__btn--refresh"
            onClick={() => triggerSync('full')}
          >
            Start Full Sync
          </button>
          <p className="catalog-browser__scanning-note">
            First sync takes 5-10 minutes. Subsequent syncs are much faster (30-60 seconds).
          </p>
        </div>
      )}

      {error && (
        <div className="catalog-browser__error">{error}</div>
      )}

      {/* Filters */}
      <div className="catalog-browser__filters">
        <div className="filter-group">
          <label>Category</label>
          <div className="filter-pills">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                className={`filter-pill ${category === c.key ? 'filter-pill--active' : ''}`}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
                {data?.categoryCounts[c.key] != null && (
                  <span className="filter-pill__count">{data.categoryCounts[c.key]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Must Have Color</label>
          <div className="filter-pills">
            {BRAND_COLORS.map((c) => (
              <button
                key={c.key}
                className={`filter-pill ${color === c.key ? 'filter-pill--active' : ''}`}
                onClick={() => setColor(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group filter-group--row">
          <div>
            <label>Min Margin</label>
            <select value={minMargin} onChange={(e) => setMinMargin(Number(e.target.value))}>
              <option value={0}>Any</option>
              <option value={35}>35%+</option>
              <option value={40}>40%+</option>
              <option value={45}>45%+</option>
              <option value={50}>50%+</option>
              <option value={55}>55%+</option>
            </select>
          </div>
          <div>
            <label>Sort By</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results bar: count + pagination + selected — all in one row */}
      {data && (
        <div className="catalog-browser__results-bar">
          <span className="catalog-browser__results-count">
            {data.total} SKUs found
            <span className="catalog-browser__page-info">
              Page {data.page} of {data.totalPages} ({(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)})
            </span>
          </span>

          {data.totalPages > 1 && (
            <div className="catalog-browser__pagination">
              <button className="catalog-browser__page-btn" disabled={page <= 1} onClick={() => { setPage(1); fetchCatalog(1) }}>««</button>
              <button className="catalog-browser__page-btn" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchCatalog(p) }}>‹</button>

              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.totalPages || Math.abs(p - page) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="catalog-browser__page-ellipsis">…</span>}
                    <button
                      className={`catalog-browser__page-btn ${p === page ? 'catalog-browser__page-btn--active' : ''}`}
                      onClick={() => { setPage(p); fetchCatalog(p) }}
                    >{p}</button>
                  </React.Fragment>
                ))}

              <button className="catalog-browser__page-btn" disabled={page >= data.totalPages} onClick={() => { const p = page + 1; setPage(p); fetchCatalog(p) }}>›</button>
              <button className="catalog-browser__page-btn" disabled={page >= data.totalPages} onClick={() => { setPage(data.totalPages); fetchCatalog(data.totalPages) }}>»»</button>

              <select className="catalog-browser__per-page" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>
          )}

          {selected.size > 0 && (
            <span className="catalog-browser__selected-count">
              {selected.size} selected
              <button
                className="catalog-browser__btn catalog-browser__btn--launch"
                onClick={() => {
                  const selectedSkus = data.results.filter((s) => selected.has(skuKey(s))).map((s) => {
                    const key = skuKey(s)
                    const config = launchConfigs.get(key)
                    return {
                      ...s,
                      selectedColors: config?.colors ? Array.from(config.colors) : undefined,
                      selectedSizes: config?.sizes ? Array.from(config.sizes) : undefined,
                      selectedProviderId: config?.providerId,
                    }
                  })
                  sessionStorage.setItem('printify-launch-skus', JSON.stringify(selectedSkus))
                  window.location.href = '/adm/collections/printify-launcher'
                }}
              >
                Launch Selected →
              </button>
            </span>
          )}
        </div>
      )}

      {/* SKU Cards */}
      <div className="catalog-browser__grid">
        {data?.results.map((sku, index) => {
          const key = skuKey(sku)
          const isSelected = selected.has(key)

          return (
            <div
              key={`${key}-${index}`}
              className={`sku-card ${isSelected ? 'sku-card--selected' : ''}`}
            >
              {/* Clickable card area — opens drawer */}
              <div className="sku-card__clickable" onClick={() => openDrawer(index)}>
                <div className="sku-card__header">
                  <div className="sku-card__score-badge">{sku.score}</div>
                  <div className="sku-card__title-area">
                    <h3 className="sku-card__title">{sku.blueprintTitle}</h3>
                    <p className="sku-card__brand">{sku.blueprintBrand}</p>
                    <p className="sku-card__provider">{sku.providerTitle} — {(sku.decorationMethods || []).map((m: any) => typeof m === 'object' ? m.title : m).join(', ')}</p>
                  </div>
                  {sku.blueprintImages[0] && (
                    <img src={sku.blueprintImages[0]} alt={sku.blueprintTitle} className="sku-card__image" />
                  )}
                </div>

                <div className="sku-card__stats">
                  <div className="sku-card__stat">
                    <span className="sku-card__stat-label">Cost</span>
                    <span className="sku-card__stat-value">
                      ${sku.minCost.toFixed(2)}
                      {sku.maxCost > sku.minCost && (
                        <span className="sku-card__stat-range"> - ${sku.maxCost.toFixed(2)}</span>
                      )}
                    </span>
                  </div>
                  <div className="sku-card__stat">
                    <span className="sku-card__stat-label">Ship</span>
                    <span className="sku-card__stat-value">${sku.shippingCostUs.toFixed(2)}</span>
                  </div>
                  <div className="sku-card__stat">
                    <span className="sku-card__stat-label">Margin @ ${sku.targetRetail}</span>
                    <span className={`sku-card__stat-value ${sku.marginPercent >= 50 ? 'stat--good' : sku.marginPercent >= 45 ? 'stat--ok' : 'stat--warn'}`}>
                      {sku.marginPercent}%
                    </span>
                  </div>
                  <div className="sku-card__stat">
                    <span className="sku-card__stat-label">Profit</span>
                    <span className="sku-card__stat-value">${sku.profitPerUnit.toFixed(2)}</span>
                  </div>
                </div>

                <div className="sku-card__meta">
                  <div className="sku-card__meta-item">
                    <span className="sku-card__meta-label">Colors</span>
                    <span>{sku.availableColors.length} {brandColorDots(sku.brandColorsAvailable)}</span>
                  </div>
                  <div className="sku-card__meta-item">
                    <span className="sku-card__meta-label">Sizes</span>
                    <span>{sku.sizeRange}</span>
                  </div>
                  <div className="sku-card__meta-item">
                    <span className="sku-card__meta-label">Print</span>
                    <span>
                      {sku.printAreaFront ? `${sku.printAreaFront.width}×${sku.printAreaFront.height}` : 'N/A'}
                      {sku.printAreaBack && ' + back'}
                    </span>
                  </div>
                  <div className="sku-card__meta-item">
                    <span className="sku-card__meta-label">Images</span>
                    <span>{sku.blueprintImages.length}</span>
                  </div>
                </div>
              </div>

              <div className="sku-card__actions">
                <button
                  className={`sku-card__action ${isSelected ? 'sku-card__action--deselect' : 'sku-card__action--select'}`}
                  onClick={(e) => { e.stopPropagation(); toggleSelect(key) }}
                >
                  {isSelected ? '✓ Selected' : 'Select'}
                </button>
                <button
                  className="sku-card__action sku-card__action--details"
                  onClick={(e) => { e.stopPropagation(); openDrawer(index) }}
                >
                  View Details
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {data && data.results.length === 0 && !loading && (
        <div className="catalog-browser__empty">
          No SKUs match your filters. Try relaxing the margin or color requirements.
        </div>
      )}

      {/* Detail Drawer */}
      {drawerIndex !== null && data?.results[drawerIndex] && (
        <DetailDrawer
          sku={data.results[drawerIndex]}
          isSelected={selected.has(skuKey(data.results[drawerIndex]))}
          onSelect={() => toggleSelect(skuKey(data.results[drawerIndex]))}
          onClose={closeDrawer}
          onPrev={() => setDrawerIndex(Math.max(0, drawerIndex - 1))}
          onNext={() => setDrawerIndex(Math.min(data.results.length - 1, drawerIndex + 1))}
          hasPrev={drawerIndex > 0}
          hasNext={drawerIndex < data.results.length - 1}
          currentIndex={drawerIndex}
          totalCount={data.results.length}
          launchConfig={launchConfigs.get(skuKey(data.results[drawerIndex]))}
          onUpdateLaunchConfig={(config) => {
            const key = skuKey(data.results[drawerIndex])
            setLaunchConfigs((prev) => new Map(prev).set(key, config))
          }}
        />
      )}
    </div>
  )
}
