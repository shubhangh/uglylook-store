'use client'

import React, { useCallback, useEffect, useState } from 'react'

type DesignOption = {
  id: string
  title: string
  designUrl: string
  thumbnailUrl: string
  type: string
  designLane: string
  emotionTier: string
  printText: string
}

type VariantRow = {
  color: string
  size: string
  price: number
}

type LaunchResult = {
  success: boolean
  productId?: string
  title?: string
  variantCount?: number
  summary?: string
  error?: string
}

const CATEGORIES = [
  { value: '', label: 'Select category...' },
  { value: 'tees', label: 'Tees' },
  { value: 'hoodies', label: 'Hoodies' },
  { value: 'hats', label: 'Hats' },
  { value: 'totes', label: 'Totes' },
  { value: 'sweatshirts', label: 'Sweatshirts' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'zines', label: 'Zines' },
  { value: 'other', label: 'Other' },
]

const COMMON_COLORS = ['Black', 'White', 'Bone', 'Olive', 'Charcoal', 'Navy']
const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

export function SelfFulfilledLauncher({ onBack }: { onBack: () => void }) {
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(35)
  const [category, setCategory] = useState('')
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('draft')

  // Design
  const [designs, setDesigns] = useState<DesignOption[]>([])
  const [designSearch, setDesignSearch] = useState('')
  const [selectedDesign, setSelectedDesign] = useState<DesignOption | null>(null)
  const [showDesignPicker, setShowDesignPicker] = useState(false)

  // Images
  const [galleryMediaIds, setGalleryMediaIds] = useState<{ id: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)

  // Variants
  const [enableVariants, setEnableVariants] = useState(false)
  const [selectedColors, setSelectedColors] = useState<string[]>(['Black'])
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL'])
  const [customColor, setCustomColor] = useState('')

  // AI Copy
  const [generatingCopy, setGeneratingCopy] = useState(false)

  // Launch
  const [launching, setLaunching] = useState(false)
  const [result, setResult] = useState<LaunchResult | null>(null)
  const [error, setError] = useState('')

  // Fetch designs for picker
  const fetchDesigns = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (designSearch) params.set('search', designSearch)
      const res = await fetch(`/next/designs?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setDesigns(data.designs || [])
      }
    } catch { /* ignore */ }
  }, [designSearch])

  useEffect(() => {
    if (showDesignPicker) fetchDesigns()
  }, [showDesignPicker, fetchDesigns])

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          setGalleryMediaIds((prev) => [...prev, {
            id: data.doc.id,
            url: data.doc.url || data.doc.thumbnailURL || '',
          }])
        }
      } catch { /* ignore */ }
    }
    setUploading(false)
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setGalleryMediaIds((prev) => prev.filter((_, i) => i !== index))
  }

  // Variant helpers
  const toggleColor = (c: string) => {
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    )
  }

  const toggleSize = (s: string) => {
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )
  }

  const addCustomColor = () => {
    const c = customColor.trim()
    if (c && !selectedColors.includes(c)) {
      setSelectedColors((prev) => [...prev, c])
      setCustomColor('')
    }
  }

  // Build variants array from colors × sizes
  const buildVariants = (): VariantRow[] => {
    if (!enableVariants) return []
    const variants: VariantRow[] = []
    for (const color of selectedColors) {
      for (const size of selectedSizes) {
        variants.push({ color, size, price })
      }
    }
    return variants
  }

  // AI Copy generation
  const handleGenerateCopy = async () => {
    if (!selectedDesign) return
    setGeneratingCopy(true)
    try {
      const res = await fetch('/next/generate-copy', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId: selectedDesign.id,
          category,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.title) setTitle(data.title)
        if (data.description) setDescription(data.description)
        if (data.price) setPrice(data.price)
      }
    } catch { /* ignore */ }
    setGeneratingCopy(false)
  }

  // Launch
  const handleLaunch = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (price <= 0) {
      setError('Price must be greater than 0')
      return
    }

    setLaunching(true)
    setError('')
    setResult(null)

    try {
      const variants = buildVariants()

      const res = await fetch('/next/self-launch', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          price,
          category: category || undefined,
          designId: selectedDesign?.id || undefined,
          galleryMediaIds: galleryMediaIds.map((g) => g.id),
          publishStatus,
          variants: variants.length > 0 ? variants : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLaunching(false)
    }
  }

  // Result view
  if (result?.success) {
    return (
      <div className="self-launcher">
        <div className="self-launcher__result">
          <h2>Product Created</h2>
          <p className="self-launcher__result-summary">{result.summary}</p>
          <div className="self-launcher__result-actions">
            <a
              href={`/adm/collections/products/${result.productId}`}
              className="fq-btn fq-btn--ship"
            >
              View Product
            </a>
            <button className="fq-btn fq-btn--secondary" onClick={() => {
              setResult(null)
              setTitle('')
              setDescription('')
              setPrice(35)
              setCategory('')
              setSelectedDesign(null)
              setGalleryMediaIds([])
              setEnableVariants(false)
              setSelectedColors(['Black'])
              setSelectedSizes(['S', 'M', 'L', 'XL'])
            }}>
              Create Another
            </button>
            <button className="fq-btn fq-btn--secondary" onClick={onBack}>
              Back to Launcher
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="self-launcher">
      <div className="self-launcher__header">
        <button className="self-launcher__back" onClick={onBack}>
          ← Back
        </button>
        <h2>Launch Self-Fulfilled Product</h2>
        <span className="self-launcher__badge">You ship it</span>
      </div>

      {/* Product Info */}
      <div className="self-launcher__section">
        <h3>Product Info</h3>

        {selectedDesign && (
          <button
            className="fq-btn fq-btn--secondary self-launcher__gen-copy"
            onClick={handleGenerateCopy}
            disabled={generatingCopy}
          >
            {generatingCopy ? 'Generating...' : 'Auto-Generate Copy (AI)'}
          </button>
        )}

        <div className="self-launcher__field">
          <label>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. UglyLook Zine Vol.1"
          />
        </div>

        <div className="self-launcher__field">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description..."
            rows={4}
          />
        </div>

        <div className="self-launcher__row">
          <div className="self-launcher__field self-launcher__field--half">
            <label>Price (USD) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min={1}
              step={0.01}
            />
          </div>
          <div className="self-launcher__field self-launcher__field--half">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Design (optional) */}
      <div className="self-launcher__section">
        <h3>Design (optional)</h3>
        {selectedDesign ? (
          <div className="self-launcher__design-selected">
            {selectedDesign.thumbnailUrl && (
              <img src={selectedDesign.thumbnailUrl} alt={selectedDesign.title} className="self-launcher__design-thumb" />
            )}
            <div>
              <strong>{selectedDesign.title}</strong>
              <span className="self-launcher__design-meta">
                {selectedDesign.designLane && ` · ${selectedDesign.designLane}`}
              </span>
            </div>
            <button className="fq-btn fq-btn--secondary" onClick={() => setSelectedDesign(null)}>
              Remove
            </button>
          </div>
        ) : (
          <button
            className="fq-btn fq-btn--secondary"
            onClick={() => setShowDesignPicker(!showDesignPicker)}
          >
            {showDesignPicker ? 'Hide Design Picker' : 'Pick from Design Library'}
          </button>
        )}

        {showDesignPicker && !selectedDesign && (
          <div className="self-launcher__design-picker">
            <input
              type="text"
              placeholder="Search designs..."
              value={designSearch}
              onChange={(e) => setDesignSearch(e.target.value)}
              className="self-launcher__design-search"
            />
            <div className="self-launcher__design-grid">
              {designs.map((d) => (
                <button
                  key={d.id}
                  className="self-launcher__design-card"
                  onClick={() => {
                    setSelectedDesign(d)
                    setShowDesignPicker(false)
                  }}
                >
                  {d.thumbnailUrl && (
                    <img src={d.thumbnailUrl} alt={d.title} />
                  )}
                  <span className="self-launcher__design-name">{d.title}</span>
                </button>
              ))}
              {designs.length === 0 && (
                <span className="self-launcher__design-empty">No designs found</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Images */}
      <div className="self-launcher__section">
        <h3>Images</h3>
        <div className="self-launcher__images">
          {galleryMediaIds.map((img, i) => (
            <div key={img.id} className="self-launcher__image-item">
              {img.url ? (
                <img src={img.url} alt={`Image ${i + 1}`} />
              ) : (
                <div className="self-launcher__image-placeholder">Uploaded</div>
              )}
              <button className="self-launcher__image-remove" onClick={() => removeImage(i)}>x</button>
            </div>
          ))}
          <label className="self-launcher__image-add">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {uploading ? 'Uploading...' : '+ Add Images'}
          </label>
        </div>
      </div>

      {/* Variants */}
      <div className="self-launcher__section">
        <h3>
          Variants
          <label className="self-launcher__toggle">
            <input
              type="checkbox"
              checked={enableVariants}
              onChange={(e) => setEnableVariants(e.target.checked)}
            />
            Enable
          </label>
        </h3>

        {enableVariants && (
          <>
            <div className="self-launcher__variant-group">
              <label>Colors</label>
              <div className="self-launcher__chips">
                {COMMON_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`toggle-chip ${selectedColors.includes(c) ? 'toggle-chip--active' : ''}`}
                    onClick={() => toggleColor(c)}
                  >
                    {c}
                  </button>
                ))}
                <div className="self-launcher__custom-add">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="Custom..."
                    onKeyDown={(e) => e.key === 'Enter' && addCustomColor()}
                  />
                  {customColor && (
                    <button className="fq-btn fq-btn--secondary" onClick={addCustomColor}>+</button>
                  )}
                </div>
              </div>
              {selectedColors.filter((c) => !COMMON_COLORS.includes(c)).length > 0 && (
                <div className="self-launcher__chips" style={{ marginTop: 4 }}>
                  {selectedColors.filter((c) => !COMMON_COLORS.includes(c)).map((c) => (
                    <button
                      key={c}
                      className="toggle-chip toggle-chip--active"
                      onClick={() => toggleColor(c)}
                    >
                      {c} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="self-launcher__variant-group">
              <label>Sizes</label>
              <div className="self-launcher__chips">
                {COMMON_SIZES.map((s) => (
                  <button
                    key={s}
                    className={`toggle-chip ${selectedSizes.includes(s) ? 'toggle-chip--active' : ''}`}
                    onClick={() => toggleSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="self-launcher__variant-summary">
              {selectedColors.length} colors × {selectedSizes.length} sizes = {selectedColors.length * selectedSizes.length} variants @ ${price.toFixed(2)} each
            </div>
          </>
        )}
      </div>

      {/* Publish Status */}
      <div className="self-launcher__section">
        <h3>Publish Status</h3>
        <div className="self-launcher__radio-group">
          <label>
            <input
              type="radio"
              checked={publishStatus === 'draft'}
              onChange={() => setPublishStatus('draft')}
            />
            Draft
          </label>
          <label>
            <input
              type="radio"
              checked={publishStatus === 'published'}
              onChange={() => setPublishStatus('published')}
            />
            Published
          </label>
        </div>
      </div>

      {/* Error */}
      {error && <div className="self-launcher__error">{error}</div>}

      {/* Launch */}
      <div className="self-launcher__footer">
        <button
          className="fq-btn fq-btn--ship self-launcher__launch-btn"
          onClick={handleLaunch}
          disabled={launching || !title.trim() || price <= 0}
        >
          {launching ? 'Creating Product...' : 'Launch Product'}
        </button>
      </div>
    </div>
  )
}
