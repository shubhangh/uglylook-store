'use client'

import React, { useCallback, useEffect, useState } from 'react'
import './product-launcher.css'

type SkuData = {
  blueprintId: number
  blueprintTitle: string
  blueprintBrand: string
  providerId: number
  providerTitle: string
  category: string
  minCost: number
  maxCost: number
  shippingCostUs: number
  targetRetail: number
  marginPercent: number
  profitPerUnit: number
  availableColors: string[]
  availableSizes: string[]
  blueprintImages: string[]
  printAreaFront: { width: number; height: number } | null
}

type DesignOption = {
  id: string
  title: string
  designUrl: string
  thumbnailUrl: string
  type: string
  designLane: string
  emotionTier: string
  printText: string
  forCategories: string[]
  isPinned: boolean
  usageCount: number
}

type MockupImage = {
  mediaId: string
  url: string
  label: string
  source: 'printify' | 'ai'
  approved?: boolean
}

type AIModelOption = {
  modelId: string
  displayName: string
  tag?: string
  isDefault?: boolean
  costPerImage?: number
  provider: string
}

type ProductForm = {
  sku: SkuData
  title: string
  description: string
  price: number
  colors: string[]
  sizes: string[]
  designId: string
  designUrl: string
  mockups: MockupImage[]
  placement: {
    position: string
    x: number
    y: number
    scale: number
    angle: number
  }
  publishStatus: 'draft' | 'published'
}

type LaunchResult = {
  title: string
  status: 'created' | 'error'
  productId?: string
  error?: string
}

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', '2XL']

const LANE_LABELS: Record<string, string> = {
  'ironic-text': 'Ironic',
  'brutalist': 'Brutalist',
  'weirdcore': 'Weirdcore',
  'maximalist': 'Maximalist',
  'y2k': 'Y2K',
  'logo-brand': 'Logo',
}

const TIER_LABELS: Record<string, string> = {
  A: 'Flagship',
  B: 'Supporting',
  C: 'Perishable',
}

function calculateMargin(
  retail: number,
  podCost: number,
  shipping: number,
): { margin: number; profit: number; stripeFee: number } {
  const stripeFee = retail * 0.029 + 0.3
  const totalCost = podCost + shipping + stripeFee
  const profit = retail - totalCost
  const margin = retail > 0 ? (profit / retail) * 100 : 0
  return {
    margin: Math.round(margin * 10) / 10,
    profit: Math.round(profit * 100) / 100,
    stripeFee: Math.round(stripeFee * 100) / 100,
  }
}

function MarginCalc({ retail, podCost, shipping }: { retail: number; podCost: number; shipping: number }) {
  const { margin, profit, stripeFee } = calculateMargin(retail, podCost, shipping)
  return (
    <div className="margin-calc">
      <div className="margin-calc__row">
        <span>POD cost</span><span>${podCost.toFixed(2)}</span>
      </div>
      <div className="margin-calc__row">
        <span>Shipping</span><span>${shipping.toFixed(2)}</span>
      </div>
      <div className="margin-calc__row">
        <span>Stripe fee</span><span>${stripeFee.toFixed(2)}</span>
      </div>
      <div className="margin-calc__divider" />
      <div className="margin-calc__row margin-calc__row--result">
        <span>Profit</span><span>${profit.toFixed(2)}</span>
      </div>
      <div className="margin-calc__row margin-calc__row--result">
        <span>Margin</span>
        <span className={margin >= 50 ? 'stat--good' : margin >= 45 ? 'stat--ok' : 'stat--warn'}>
          {margin}%
        </span>
      </div>
    </div>
  )
}

function DesignPicker({
  category,
  selectedId,
  onSelect,
  onManualUrl,
  manualUrl,
}: {
  category: string
  selectedId: string
  onSelect: (design: DesignOption) => void
  onManualUrl: (url: string) => void
  manualUrl: string
}) {
  const [designs, setDesigns] = useState<DesignOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showManual, setShowManual] = useState(false)

  const fetchDesigns = useCallback(async (searchTerm?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (searchTerm) params.set('search', searchTerm)
      params.set('limit', '50')

      const res = await fetch(`/next/designs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDesigns(data.designs || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    fetchDesigns()
  }, [fetchDesigns])

  const handleSearch = () => {
    fetchDesigns(search || undefined)
  }

  if (showManual) {
    return (
      <div className="design-picker__manual">
        <div className="design-picker__manual-header">
          <label>Design File URL</label>
          <button
            className="design-picker__link-btn"
            onClick={() => setShowManual(false)}
          >
            Pick from library
          </button>
        </div>
        <input
          type="text"
          value={manualUrl}
          onChange={(e) => onManualUrl(e.target.value)}
          placeholder="https://r2.dev/designs/your-design.png"
        />
      </div>
    )
  }

  return (
    <div className="design-picker">
      <div className="design-picker__header">
        <label>Design</label>
        <button
          className="design-picker__link-btn"
          onClick={() => setShowManual(true)}
        >
          Paste URL instead
        </button>
      </div>

      <div className="design-picker__search">
        <input
          type="text"
          placeholder="Search designs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {loading ? (
        <div className="design-picker__loading">Loading designs...</div>
      ) : designs.length === 0 ? (
        <div className="design-picker__empty">
          No active designs found{category ? ` for "${category}"` : ''}.
          <button className="design-picker__link-btn" onClick={() => setShowManual(true)}>
            Paste a URL instead
          </button>
        </div>
      ) : (
        <div className="design-picker__grid">
          {designs.map((d) => (
            <button
              key={d.id}
              className={`design-card ${selectedId === d.id ? 'design-card--selected' : ''}`}
              onClick={() => onSelect(d)}
              type="button"
            >
              {d.thumbnailUrl ? (
                <img
                  className="design-card__img"
                  src={d.thumbnailUrl}
                  alt={d.title}
                  loading="lazy"
                />
              ) : (
                <div className="design-card__placeholder">No preview</div>
              )}
              <div className="design-card__info">
                <span className="design-card__title">{d.title}</span>
                <div className="design-card__meta">
                  {d.designLane && (
                    <span className="design-card__badge">{LANE_LABELS[d.designLane] || d.designLane}</span>
                  )}
                  {d.emotionTier && (
                    <span className={`design-card__tier design-card__tier--${d.emotionTier}`}>
                      {TIER_LABELS[d.emotionTier] || d.emotionTier}
                    </span>
                  )}
                  {d.isPinned && <span className="design-card__pin" title="Pinned">&#9733;</span>}
                </div>
              </div>
              {selectedId === d.id && <span className="design-card__check">&#10003;</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MockupGenerator({
  designId,
  designUrl,
  blueprintId,
  providerId,
  category,
  productTitle,
  colors,
  mockups,
  onMockupsGenerated,
}: {
  designId: string
  designUrl: string
  blueprintId: number
  providerId: number
  category: string
  productTitle: string
  colors: string[]
  mockups: MockupImage[]
  onMockupsGenerated: (mockups: MockupImage[]) => void
}) {
  const [aiModels, setAiModels] = useState<Record<string, AIModelOption[]>>({})
  const [selectedModel, setSelectedModel] = useState('flux-2-pro')
  const [editorialCount, setEditorialCount] = useState(4)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Fetch available AI models on mount
  useEffect(() => {
    fetch('/next/generate-mockups')
      .then((r) => r.json())
      .then((data) => {
        if (data.models) {
          setAiModels(data.models)
          // Find default model
          for (const family of Object.values(data.models) as AIModelOption[][]) {
            const def = family.find((m) => m.isDefault)
            if (def) {
              setSelectedModel(def.modelId)
              break
            }
          }
        }
      })
      .catch(() => {})
  }, [])

  const hasDesign = !!(designId || designUrl)

  const [progressPercent, setProgressPercent] = useState(0)

  const handleGenerate = async () => {
    if (!hasDesign) return
    setGenerating(true)
    setError(null)
    setProgressPercent(5)

    const totalExpected = colors.length * editorialCount
    setProgress(`Generating ${totalExpected} mockups (${editorialCount} per color × ${colors.length} color${colors.length !== 1 ? 's' : ''})...`)

    try {
      const res = await fetch('/next/generate-mockups', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId: designId || undefined,
          designUrl: designUrl || undefined,
          blueprintId,
          providerId,
          category,
          productTitle,
          colors,
          aiModelId: selectedModel,
          editorialCount,
        }),
      })

      // Simulate progress while waiting
      const progressInterval = setInterval(() => {
        setProgressPercent((p) => Math.min(p + 3, 85))
      }, 800)

      const data = await res.json()
      clearInterval(progressInterval)

      if (!res.ok) throw new Error(data.error || 'Generation failed')

      setProgressPercent(95)

      const newMockups: MockupImage[] = []

      for (const pm of data.printifyMockups || []) {
        newMockups.push({ mediaId: pm.mediaId, url: pm.url, label: pm.label, source: 'printify' })
      }

      for (const ai of data.aiEditorialShots || []) {
        newMockups.push({ mediaId: ai.mediaId, url: ai.url, label: ai.label || 'AI Editorial', source: 'ai' })
      }

      onMockupsGenerated([...mockups, ...newMockups])
      setProgressPercent(100)

      if (data.errors?.length) {
        setError(`Generated with warnings: ${data.errors.join('; ')}`)
      } else {
        setProgress(`Done — ${data.totalMockups} mockups generated`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
      setTimeout(() => setProgressPercent(0), 2000)
    }
  }

  const removeMockup = (index: number) => {
    onMockupsGenerated(mockups.filter((_, i) => i !== index))
  }

  // Flatten model families into a list for the selector
  const allModels: AIModelOption[] = Object.values(aiModels).flat()

  return (
    <div className="mockup-gen">
      <div className="mockup-gen__header">
        <label>Mockups</label>
      </div>

      {/* Model selector + count */}
      <div className="mockup-gen__controls">
        <div className="mockup-gen__field">
          <label>AI Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={generating}
          >
            {allModels.length > 0 ? (
              allModels.map((m) => (
                <option key={m.modelId} value={m.modelId}>
                  {m.displayName}
                  {m.costPerImage ? ` ($${m.costPerImage})` : ''}
                  {m.tag ? ` [${m.tag}]` : ''}
                </option>
              ))
            ) : (
              <>
                <option value="flux-2-pro">FLUX 2.0 Pro (Default)</option>
                <option value="gpt-image-1">GPT Image 1</option>
                <option value="gemini-2.5-flash-image">Gemini 2.5 Flash</option>
                <option value="gemini-3-pro-image">Gemini 3 Pro Image</option>
                <option value="gemini-3.1-flash-image">Gemini 3.1 Flash Image</option>
              </>
            )}
          </select>
        </div>
        <div className="mockup-gen__field mockup-gen__field--small">
          <label>AI Shots</label>
          <input
            type="number"
            value={editorialCount}
            onChange={(e) => setEditorialCount(Math.max(0, Math.min(8, Number(e.target.value))))}
            min={0}
            max={8}
            disabled={generating}
          />
        </div>
        <button
          className="mockup-gen__btn"
          onClick={handleGenerate}
          disabled={generating || !hasDesign}
          title={!hasDesign ? 'Pick a design first' : ''}
        >
          {generating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {!hasDesign && (
        <div className="mockup-gen__hint">Pick a design above to generate mockups.</div>
      )}

      {generating && progressPercent > 0 && (
        <div className="mockup-gen__progress-bar">
          <div className="mockup-gen__progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      )}

      {progress && !error && (
        <div className="mockup-gen__progress">{progress}</div>
      )}

      {error && (
        <div className="mockup-gen__error">{error}</div>
      )}

      {/* Preview generated mockups */}
      {mockups.length > 0 && (
        <div className="mockup-gen__preview">
          {mockups.map((m, i) => (
            <div key={i} className={`mockup-thumb ${m.approved === false ? 'mockup-thumb--rejected' : m.approved ? 'mockup-thumb--approved' : ''}`}>
              {m.url ? (
                <img
                  src={m.url}
                  alt={m.label}
                  className="mockup-thumb__img"
                  loading="lazy"
                  onClick={() => setLightboxIndex(i)}
                  title="Click to enlarge"
                />
              ) : (
                <div className="mockup-thumb__placeholder">Uploaded</div>
              )}
              <div className="mockup-thumb__badge">
                <span className={`mockup-thumb__source mockup-thumb__source--${m.source}`}>
                  {m.source === 'printify' ? 'Printify' : 'AI'}
                </span>
              </div>
              <div className="mockup-thumb__actions">
                <button
                  className="mockup-thumb__action mockup-thumb__action--approve"
                  onClick={() => {
                    const updated = [...mockups]
                    updated[i] = { ...m, approved: true }
                    onMockupsGenerated(updated)
                  }}
                  title="Approve"
                >&#10003;</button>
                <button
                  className="mockup-thumb__action mockup-thumb__action--reject"
                  onClick={() => {
                    const updated = [...mockups]
                    updated[i] = { ...m, approved: false }
                    onMockupsGenerated(updated)
                  }}
                  title="Reject"
                >&#10007;</button>
                <button
                  className="mockup-thumb__action"
                  onClick={() => {
                    if (m.url) {
                      const a = document.createElement('a')
                      a.href = m.url
                      a.download = `mockup-${i + 1}.jpg`
                      a.target = '_blank'
                      a.click()
                    }
                  }}
                  title="Download"
                >&#8615;</button>
                <button
                  className="mockup-thumb__action mockup-thumb__action--remove"
                  onClick={() => removeMockup(i)}
                  title="Remove"
                >&#10005;</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox with navigation */}
      {lightboxIndex !== null && mockups[lightboxIndex] && (
        <div className="mockup-lightbox" onClick={() => setLightboxIndex(null)}>
          <button className="mockup-lightbox__close" onClick={() => setLightboxIndex(null)}>×</button>

          {mockups.length > 1 && lightboxIndex > 0 && (
            <button
              className="mockup-lightbox__nav mockup-lightbox__nav--prev"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
            >&#8249;</button>
          )}

          <img
            src={mockups[lightboxIndex].url}
            alt={mockups[lightboxIndex].label}
            className="mockup-lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />

          {mockups.length > 1 && lightboxIndex < mockups.length - 1 && (
            <button
              className="mockup-lightbox__nav mockup-lightbox__nav--next"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
            >&#8250;</button>
          )}

          <div className="mockup-lightbox__counter" onClick={(e) => e.stopPropagation()}>
            {lightboxIndex + 1} / {mockups.length}
          </div>
        </div>
      )}
    </div>
  )
}

export const ProductLauncher: React.FC = () => {
  const [forms, setForms] = useState<ProductForm[]>([])
  const [launching, setLaunching] = useState(false)
  const [results, setResults] = useState<LaunchResult[] | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [generatingCopy, setGeneratingCopy] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(1)

  // Load selected SKUs from sessionStorage (set by Catalog Browser)
  useEffect(() => {
    const stored = sessionStorage.getItem('printify-launch-skus')
    if (stored) {
      try {
        const skus: SkuData[] = JSON.parse(stored)
        const initialForms = skus.map((sku): ProductForm => {
          // Auto-generate title from blueprint
          const title = sku.blueprintTitle
            .replace(/^(Unisex|Men's|Women's)\s+/i, '')
            .replace(/™|®/g, '')
            .trim()

          // Use pre-selected colors from Catalog Browser, or auto-select brand colors
          const preSelectedColors = (sku as any).selectedColors as string[] | undefined
          let selectedColors: string[]
          if (preSelectedColors && preSelectedColors.length > 0) {
            selectedColors = preSelectedColors
          } else {
            const brandColorAliases: Record<string, string[]> = {
              Black: ['black', 'jet black', 'deep black'],
              Bone: ['bone', 'sand', 'natural', 'cream', 'oatmeal', 'heather dust'],
            }
            const autoColors = sku.availableColors.filter((c) => {
              const lower = c.toLowerCase()
              return Object.values(brandColorAliases).some((aliases) =>
                aliases.some((a) => lower.includes(a)),
              )
            })
            selectedColors =
              autoColors.length > 0 ? autoColors : sku.availableColors.slice(0, 1)
          }

          // Use pre-selected sizes from Catalog Browser, or auto-select standard sizes
          const preSelectedSizes = (sku as any).selectedSizes as string[] | undefined
          const selectedSizes = preSelectedSizes && preSelectedSizes.length > 0
            ? preSelectedSizes
            : sku.availableSizes.filter((s) => DEFAULT_SIZES.includes(s.toUpperCase()))

          return {
            sku,
            title,
            description: '',
            price: sku.targetRetail,
            colors: selectedColors,
            sizes: selectedSizes.length > 0 ? selectedSizes : sku.availableSizes.slice(0, 5),
            designId: '',
            designUrl: '',
            mockups: [],
            placement: {
              position: 'front',
              x: 0.5,
              y: 0.45,
              scale: 0.8,
              angle: 0,
            },
            publishStatus: 'draft',
          }
        })
        setForms(initialForms)
      } catch {
        // Invalid data
      }
    }
  }, [])

  const updateForm = (index: number, updates: Partial<ProductForm>) => {
    setForms((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f)),
    )
  }

  const toggleColor = (index: number, color: string) => {
    setForms((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f
        const colors = f.colors.includes(color)
          ? f.colors.filter((c) => c !== color)
          : [...f.colors, color]
        return { ...f, colors }
      }),
    )
  }

  const toggleSize = (index: number, size: string) => {
    setForms((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f
        const sizes = f.sizes.includes(size)
          ? f.sizes.filter((s) => s !== size)
          : [...f.sizes, size]
        return { ...f, sizes }
      }),
    )
  }

  const removeProduct = (index: number) => {
    setForms((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDesignSelect = (index: number, design: DesignOption) => {
    updateForm(index, {
      designId: design.id,
      designUrl: design.designUrl,
    })
  }

  const handleGenerateCopy = async (index: number) => {
    const form = forms[index]
    if (!form.designId) return

    setGeneratingCopy(index)
    try {
      const mockupMediaId = form.mockups.length > 0 ? form.mockups[0].mediaId : undefined

      const res = await fetch('/next/generate-copy', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId: form.designId,
          category: form.sku.category,
          blueprintTitle: `${form.sku.blueprintBrand} ${form.sku.blueprintTitle}`,
          blueprintImageUrl: form.sku.blueprintImages?.[0] || undefined,
          mockupMediaId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Copy generation failed')

      const copy = data.copy
      if (copy) {
        updateForm(index, {
          title: copy.title || form.title,
          description: copy.description || form.description,
          price: copy.suggestedPrice || form.price,
        })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Copy generation failed: ${err.message}` })
    } finally {
      setGeneratingCopy(null)
    }
  }

  const handleLaunch = async () => {
    if (forms.length === 0) return
    setLaunching(true)
    setResults(null)
    setMessage(null)

    try {
      const payload = {
        products: forms.map((f) => ({
          blueprintId: f.sku.blueprintId,
          providerId: f.sku.providerId,
          title: f.title,
          description: f.description || undefined,
          price: f.price,
          category: f.sku.category,
          designId: f.designId || undefined,
          designUrl: f.designUrl || undefined,
          galleryMediaIds: f.mockups.filter((m) => m.approved !== false).map((m) => m.mediaId).filter(Boolean),
          colors: f.colors,
          sizes: f.sizes,
          placement: f.placement,
          publishStatus: f.publishStatus,
        })),
      }

      const res = await fetch('/next/printify-launch', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)

      setResults(json.results)
      setMessage({ type: 'success', text: json.summary })

      // Clear sessionStorage after successful launch
      sessionStorage.removeItem('printify-launch-skus')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Launch failed' })
    } finally {
      setLaunching(false)
    }
  }

  if (forms.length === 0 && !results) {
    return (
      <div className="product-launcher">
        <div className="product-launcher__header">
          <h1>Product Launcher</h1>
        </div>
        <div className="product-launcher__empty">
          <p>No products selected for launch.</p>
          <p>Go to <a href="/adm/collections/printify-catalog">Catalog Browser</a> to select SKUs, then click &quot;Launch Selected&quot;.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="product-launcher">
      <div className="product-launcher__header">
        <h1>Product Launcher</h1>
        <div className="product-launcher__header-actions">
          <span className="product-launcher__count">
            {forms.length} product{forms.length !== 1 ? 's' : ''}
          </span>
          {!results && forms.length > 1 && (
            <div className="product-launcher__pagination">
              <button
                className="product-launcher__page-btn"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                ←
              </button>
              <span className="product-launcher__page-info">
                {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, forms.length)} of {forms.length}
              </span>
              <button
                className="product-launcher__page-btn"
                onClick={() => setCurrentPage(Math.min(Math.ceil(forms.length / pageSize) - 1, currentPage + 1))}
                disabled={(currentPage + 1) * pageSize >= forms.length}
              >
                →
              </button>
              <select
                className="product-launcher__page-size"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0) }}
              >
                <option value={1}>1 / page</option>
                <option value={2}>2 / page</option>
                <option value={5}>5 / page</option>
                <option value={999}>All</option>
              </select>
            </div>
          )}
          {!results && (
            <button
              className="product-launcher__btn product-launcher__btn--launch"
              onClick={handleLaunch}
              disabled={launching || forms.length === 0}
            >
              {launching ? 'Launching...' : `Launch All ${forms.length} Products`}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`product-launcher__message product-launcher__message--${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Results after launch */}
      {results && (
        <div className="product-launcher__results">
          <h2>Launch Results</h2>
          {results.map((r, i) => (
            <div
              key={i}
              className={`launch-result ${r.status === 'created' ? 'launch-result--success' : 'launch-result--error'}`}
            >
              <span className="launch-result__status">
                {r.status === 'created' ? '✓' : '✗'}
              </span>
              <span className="launch-result__title">{r.title}</span>
              {r.productId && (
                <a
                  href={`/adm/collections/products/${r.productId}`}
                  className="launch-result__link"
                >
                  View in Admin →
                </a>
              )}
              {r.error && (
                <span className="launch-result__error">{r.error}</span>
              )}
            </div>
          ))}
          <div className="product-launcher__results-actions">
            <a href="/adm/collections/products" className="product-launcher__btn">
              Go to Products
            </a>
            <a href="/adm/collections/printify-catalog" className="product-launcher__btn">
              Back to Catalog
            </a>
          </div>
        </div>
      )}

      {/* Product forms — paginated */}
      {!results && forms
        .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
        .map((form, pageIndex) => {
          const index = currentPage * pageSize + pageIndex
          return (
        <div key={index} className="launch-form">
          <div className="launch-form__header">
            <div className="launch-form__header-left">
              {form.sku.blueprintImages?.[0] && (
                <img src={form.sku.blueprintImages[0]} alt={form.sku.blueprintTitle} className="launch-form__product-thumb" />
              )}
              <div>
                <h3 className="launch-form__number">Product {index + 1} of {forms.length}</h3>
                <p className="launch-form__blueprint">
                  {form.sku.blueprintBrand} — {form.sku.blueprintTitle}
                </p>
                <p className="launch-form__provider">
                  Provider: {form.sku.providerTitle} (#{form.sku.providerId})
                  {form.sku.minCost > 0 && <span className="launch-form__pod-cost"> — POD: ${form.sku.minCost.toFixed(2)}</span>}
                </p>
              </div>
            </div>
            <button
              className="launch-form__remove"
              onClick={() => removeProduct(index)}
              title="Remove"
            >
              ×
            </button>
          </div>

          <div className="launch-form__body">
            <div className="launch-form__main">
              {/* AI Copy Generation */}
              {form.designId && (
                <div className="copy-gen">
                  <button
                    className="copy-gen__btn"
                    onClick={() => handleGenerateCopy(index)}
                    disabled={generatingCopy === index}
                  >
                    {generatingCopy === index ? 'Generating copy...' : 'Auto-Generate Copy (AI)'}
                  </button>
                  <span className="copy-gen__hint">
                    Fills title, description &amp; price from design metadata via Gemini
                  </span>
                </div>
              )}

              {/* Title */}
              <div className="launch-form__field">
                <label>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm(index, { title: e.target.value })}
                  placeholder="Product title"
                />
              </div>

              {/* Description */}
              <div className="launch-form__field">
                <label>Description <span className="optional">(optional)</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm(index, { description: e.target.value })}
                  placeholder="Short product description"
                  rows={2}
                />
              </div>

              {/* Price */}
              <div className="launch-form__field launch-form__field--price">
                <label>Retail Price (USD)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => updateForm(index, { price: Number(e.target.value) })}
                  min={1}
                  step={1}
                />
              </div>

              {/* Design Picker */}
              <DesignPicker
                category={form.sku.category}
                selectedId={form.designId}
                onSelect={(d) => handleDesignSelect(index, d)}
                onManualUrl={(url) => updateForm(index, { designUrl: url, designId: '' })}
                manualUrl={form.designUrl}
              />

              {/* Mockup Generator */}
              <MockupGenerator
                designId={form.designId}
                designUrl={form.designUrl}
                blueprintId={form.sku.blueprintId}
                providerId={form.sku.providerId}
                category={form.sku.category}
                productTitle={form.title}
                colors={form.colors}
                mockups={form.mockups}
                onMockupsGenerated={(mockups) => updateForm(index, { mockups })}
              />

              {/* Colors */}
              <div className="launch-form__field">
                <label>Colors ({form.colors.length} selected)</label>
                <div className="launch-form__toggles">
                  {form.sku.availableColors.slice(0, 20).map((color) => (
                    <button
                      key={color}
                      className={`toggle-chip ${form.colors.includes(color) ? 'toggle-chip--on' : ''}`}
                      onClick={() => toggleColor(index, color)}
                    >
                      {color}
                    </button>
                  ))}
                  {form.sku.availableColors.length > 20 && (
                    <span className="toggle-more">
                      +{form.sku.availableColors.length - 20} more
                    </span>
                  )}
                </div>
              </div>

              {/* Sizes */}
              <div className="launch-form__field">
                <label>Sizes ({form.sizes.length} selected)</label>
                <div className="launch-form__toggles">
                  {form.sku.availableSizes.map((size) => (
                    <button
                      key={size}
                      className={`toggle-chip ${form.sizes.includes(size) ? 'toggle-chip--on' : ''}`}
                      onClick={() => toggleSize(index, size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Publish status */}
              <div className="launch-form__field">
                <label>On Launch</label>
                <div className="launch-form__radio-group">
                  <label className="launch-form__radio">
                    <input
                      type="radio"
                      checked={form.publishStatus === 'draft'}
                      onChange={() => updateForm(index, { publishStatus: 'draft' })}
                    />
                    Save as Draft (review first)
                  </label>
                  <label className="launch-form__radio">
                    <input
                      type="radio"
                      checked={form.publishStatus === 'published'}
                      onChange={() => updateForm(index, { publishStatus: 'published' })}
                    />
                    Auto-publish
                  </label>
                </div>
              </div>
            </div>

            {/* Sidebar — margin calc + placement */}
            <div className="launch-form__sidebar">
              <MarginCalc
                retail={form.price}
                podCost={form.sku.minCost}
                shipping={form.sku.shippingCostUs}
              />

              <div className="launch-form__placement">
                <h4>Placement</h4>
                <div className="placement-fields">
                  <div>
                    <label>Position</label>
                    <select
                      value={form.placement.position}
                      onChange={(e) =>
                        updateForm(index, {
                          placement: { ...form.placement, position: e.target.value },
                        })
                      }
                    >
                      <option value="front">Front</option>
                      <option value="back">Back</option>
                    </select>
                  </div>
                  <div>
                    <label>X</label>
                    <input
                      type="number"
                      value={form.placement.x}
                      onChange={(e) =>
                        updateForm(index, {
                          placement: { ...form.placement, x: Number(e.target.value) },
                        })
                      }
                      min={0} max={1} step={0.05}
                    />
                  </div>
                  <div>
                    <label>Y</label>
                    <input
                      type="number"
                      value={form.placement.y}
                      onChange={(e) =>
                        updateForm(index, {
                          placement: { ...form.placement, y: Number(e.target.value) },
                        })
                      }
                      min={0} max={1} step={0.05}
                    />
                  </div>
                  <div>
                    <label>Scale</label>
                    <input
                      type="number"
                      value={form.placement.scale}
                      onChange={(e) =>
                        updateForm(index, {
                          placement: { ...form.placement, scale: Number(e.target.value) },
                        })
                      }
                      min={0.1} max={1} step={0.05}
                    />
                  </div>
                </div>
                {form.sku.printAreaFront && (
                  <p className="placement-info">
                    Print area: {form.sku.printAreaFront.width}×{form.sku.printAreaFront.height}px
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
          )
        })}
    </div>
  )
}
