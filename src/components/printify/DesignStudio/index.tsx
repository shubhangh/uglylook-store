'use client'

import React, { useCallback, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import './design-studio.css'

// ── Gen Z Palettes + Quotes (client-safe, no server imports) ──

const GEN_Z_PALETTES = [
  {
    id: 'muted-chaos', name: 'Muted Chaos',
    colors: [
      { hex: '#5C4033', name: 'Mud Brown' },
      { hex: '#C45B28', name: 'Burnt Rust' },
      { hex: '#E8DCC8', name: 'Bone' },
      { hex: '#2B2B2B', name: 'Almost Black' },
    ],
  },
  {
    id: 'digital-rot', name: 'Digital Rot',
    colors: [
      { hex: '#A8E6CF', name: 'Sick Mint' },
      { hex: '#845EC2', name: 'Twilight Purple' },
      { hex: '#F0E6D3', name: 'Parchment' },
      { hex: '#1E1E2E', name: 'Void Navy' },
    ],
  },
  {
    id: 'concrete-heat', name: 'Concrete Heat',
    colors: [
      { hex: '#FF6B35', name: 'Traffic Orange' },
      { hex: '#B0B0B0', name: 'Raw Concrete' },
      { hex: '#F2E9E1', name: 'Plaster White' },
      { hex: '#252525', name: 'Charcoal' },
    ],
  },
  {
    id: 'faded-flash', name: 'Faded Flash',
    colors: [
      { hex: '#FF8FAB', name: 'Washed Pink' },
      { hex: '#4A6FA5', name: 'Denim Blue' },
      { hex: '#FFF5E1', name: 'Warm Cream' },
      { hex: '#2C2C34', name: 'Film Black' },
    ],
  },
]

const GRAPHIC_STYLE_OPTIONS = [
  { value: 'wireframe-cluster', label: 'Wireframe Cluster' },
  { value: 'corrupted-scan', label: 'Corrupted Scan' },
  { value: 'brutalist-grid', label: 'Brutalist Grid' },
]

const ORIENTATION_OPTIONS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'square', label: 'Square' },
]

const QUOTE_BANK = [
  { hero: 'DO NOT PERCEIVE ME', sub: 'visibility: hidden', lane: 'Ironic text' },
  { hero: 'MY THERAPIST WOULD HATE THIS', sub: 'session #47 pending', lane: 'Ironic text' },
  { hero: 'I PEAKED IN MY SCREEN TIME', sub: 'avg. 11h 42m daily', lane: 'Ironic text' },
  { hero: 'CHRONICALLY ONLINE, PHYSICALLY HERE', sub: 'last seen: just now', lane: 'Anti-design' },
  { hero: 'THIS IS MY PERSONALITY NOW', sub: 'update 4.7 / no rollback', lane: 'Weirdcore' },
  { hero: 'NOT WORTH THE EMOTIONAL LABOR', sub: 'cost-benefit: negative', lane: 'Brutalist' },
  { hero: "I'M SOMEBODY'S UNSAVED NUMBER", sub: '+1 (000) 000-0000', lane: 'Ironic text' },
  { hero: 'LOWKEY UNHINGED HIGHKEY FINE', sub: 'status: stable-ish', lane: 'Maximalist' },
  { hero: 'EMOTIONALLY UNAVAILABLE BUT HERE', sub: 'read 3:42am', lane: 'Anti-design' },
  { hero: 'MAIN CHARACTER IN A MID SHOW', sub: 'season 24 / no renewal', lane: 'Ironic text' },
  { hero: 'RUNNING ON SPITE AND WIFI', sub: 'battery: 3%', lane: 'Brutalist' },
  { hero: 'PERMANENT SOFT LAUNCH', sub: 'ETA: never', lane: 'Ironic text' },
  { hero: 'DELULU IS THE SOLULU', sub: 'prescription: refilled', lane: 'Weirdcore' },
  { hero: 'SITUATIONSHIP SURVIVOR', sub: 'damage: permanent', lane: 'Ironic text' },
  { hero: 'GAVE UP ON ADULTING', sub: 'task failed successfully', lane: 'Anti-design' },
  { hero: 'MY RED FLAG IS IGNORING RED FLAGS', sub: 'warnings: 47 dismissed', lane: 'Brutalist' },
]

const TEXT_POSITIONS = [
  { value: 'bottom-left', label: 'Bottom-Left' },
  { value: 'center', label: 'Center' },
  { value: 'bottom-center', label: 'Bottom-Center' },
]

const HERO_FONTS = [
  { value: 'Inter', label: 'Inter', weights: [700, 800, 900] },
  { value: 'Bebas Neue', label: 'Bebas Neue', weights: [400] },
  { value: 'Oswald', label: 'Oswald', weights: [500, 600, 700] },
  { value: 'Anton', label: 'Anton', weights: [400] },
  { value: 'Archivo Black', label: 'Archivo Black', weights: [400] },
  { value: 'Passion One', label: 'Passion One', weights: [400, 700, 900] },
  { value: 'Russo One', label: 'Russo One', weights: [400] },
  { value: 'Black Ops One', label: 'Black Ops One', weights: [400] },
]

const SUB_FONTS = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono', weights: [400, 500] },
  { value: 'Space Mono', label: 'Space Mono', weights: [400, 700] },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono', weights: [400, 500] },
  { value: 'Fira Code', label: 'Fira Code', weights: [400, 500] },
]

// ── Helpers ──

function isLightHex(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}

// ── Expandable Brief Textarea ──

function BriefTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  label?: string
}) {
  const [panelOpen, setPanelOpen] = useState(false)
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <>
      <div className="ds-textarea-wrap">
        <textarea
          className="ds-textarea"
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          className="ds-expand-btn"
          onClick={(e) => { e.preventDefault(); setPanelOpen(true) }}
          title="Expand to full editor"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2h5v5M7 14H2V9M14 2L9 7M2 14l5-5" />
          </svg>
        </button>
      </div>

      {panelOpen && ReactDOM.createPortal(
        <>
          <div className="ds-brief-panel-overlay" onClick={() => setPanelOpen(false)} />
          <div className="ds-brief-panel">
            <div className="ds-brief-panel__header">
              <span className="ds-brief-panel__title">{label || 'Brief'}</span>
              <button
                className="ds-brief-panel__close"
                onClick={() => setPanelOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="ds-brief-panel__body">
              <textarea
                className="ds-brief-panel__textarea"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus
              />
            </div>
            <div className="ds-brief-panel__footer">
              <span className="ds-brief-panel__wordcount">{wordCount} words</span>
              <button
                className="ds-btn ds-btn--small"
                onClick={() => setPanelOpen(false)}
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  )
}

// ── Generation Progress (polls server for per-image progress) ──

function GenerationProgress({ count, modelId }: { count: number; modelId: string }) {
  const [progress, setProgress] = useState<{
    completed: number
    failed: number
    total: number
    costSoFar: number
    costPerImage: number
    elapsedSeconds: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch('/next/design-generate', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data.queue?.progress) {
            setProgress(data.queue.progress)
          }
        }
      } catch { /* ignore */ }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const completed = progress?.completed ?? 0
  const failed = progress?.failed ?? 0
  const processed = completed + failed
  const total = progress?.total ?? count
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0
  const successPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const failPct = total > 0 ? Math.round((failed / total) * 100) : 0
  const elapsed = progress?.elapsedSeconds ?? 0
  const costSoFar = progress?.costSoFar ?? 0
  const costPerImage = progress?.costPerImage ?? 0
  const estimatedTotal = costPerImage * total

  return (
    <div className="ds-step ds-generating">
      <div className="ds-spinner" />
      <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: 4 }}>
        Generating images — {processed}/{total}
      </p>
      <p className="ds-generating-note" style={{ marginBottom: 12 }}>
        {modelId} · {elapsed}s elapsed
      </p>

      {/* Status chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 12, fontFamily: 'var(--font-mono, monospace)' }}>
        {completed > 0 && (
          <span style={{ color: '#8B9A6B' }}>{completed} completed</span>
        )}
        {failed > 0 && (
          <span style={{ color: '#e06060' }}>{failed} failed</span>
        )}
        {processed < total && (
          <span style={{ color: '#888' }}>{total - processed} remaining</span>
        )}
      </div>

      {/* Progress bar — stacked: green (success) + red (failed) + grey (remaining) */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        height: 6,
        background: 'var(--theme-elevation-200, #2a2a2a)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 16,
        display: 'flex',
      }}>
        {successPct > 0 && (
          <div style={{
            width: `${successPct}%`,
            height: '100%',
            background: '#5A6242',
            transition: 'width 0.5s ease',
          }} />
        )}
        {failPct > 0 && (
          <div style={{
            width: `${failPct}%`,
            height: '100%',
            background: '#c04040',
            transition: 'width 0.5s ease',
          }} />
        )}
      </div>

      {/* Cost tracker */}
      <div style={{
        display: 'flex',
        gap: 24,
        fontSize: 12,
        fontFamily: 'var(--font-mono, monospace)',
        color: '#888',
      }}>
        <span>Cost so far: <span style={{ color: '#8B9A6B' }}>${costSoFar.toFixed(3)}</span></span>
        <span>Estimated total: <span style={{ color: '#aaa' }}>${estimatedTotal.toFixed(3)}</span></span>
        <span>Per image: ${costPerImage.toFixed(3)}</span>
      </div>
    </div>
  )
}

// ── Types ──

type ModelVersion = {
  id: string
  modelId: string
  displayName: string
  version: string
  tag: string | null
  isDefault: boolean
  costPer1kInput?: number
  costPer1kOutput?: number
  costPerImage?: number
  provider?: string
  modelType?: string
  shortDescription?: string
}

type KeyStatus = Record<string, { configured: boolean; source: string }>

type GeneratedImage = {
  id: string
  base64: string
  mimeType: string
  prompt: string
  model: string
  modelDisplayName: string
  index: number
  costPerImage: number
  status: 'pending' | 'approved' | 'rejected'
  // Per-image metadata
  title: string
  ulTitle: string
  type: string
  lane: string
  emotion: string
  categories: string[]
  tags: string
  generatedAt: string
}

type CostTracking = {
  totalSpent: number
  monthlySpent: number
  monthlyBudget: number
}

// ── Constants ──

const MODES = [
  { key: 'free-brief', label: 'Free Brief' },
  { key: 'fashion-doc', label: 'Fashion Doc' },
  { key: 'sku-based', label: 'SKU-Based' },
]

const CATEGORIES = [
  { value: '', label: 'Any' },
  { value: 'tees', label: 'Tees' },
  { value: 'hoodies', label: 'Hoodies' },
  { value: 'hats', label: 'Hats' },
  { value: 'totes', label: 'Totes' },
  { value: 'sweatshirts', label: 'Sweatshirts' },
]

const GARMENT_COLORS = [
  { value: '', label: 'Any' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

const DESIGN_TYPES = [
  { value: '', label: 'Any' },
  { value: 'logo', label: 'Logo' },
  { value: 'text-composition', label: 'Text Composition' },
  { value: 'graphic', label: 'Graphic' },
  { value: 'typography', label: 'Typography Only' },
  { value: 'pattern', label: 'Pattern' },
]

const LANES = [
  { value: '', label: 'Any' },
  { value: 'ironic-text', label: 'Ironic Text-Only' },
  { value: 'brutalist', label: 'Brutalist' },
  { value: 'weirdcore', label: 'Weirdcore' },
  { value: 'maximalist', label: 'Maximalist' },
  { value: 'y2k', label: 'Y2K' },
  { value: 'logo-brand', label: 'Logo / Brand' },
]

const EMOTIONS = [
  { value: '', label: 'Any' },
  { value: 'A', label: 'Tier A — Flagship' },
  { value: 'B', label: 'Tier B — Supporting' },
  { value: 'C', label: 'Tier C — Perishable' },
]

const DETAIL_LEVELS = [
  { value: 'low', label: 'Low (~100 words)', cost: 0.0006 },
  { value: 'medium', label: 'Medium (~200 words)', cost: 0.001 },
  { value: 'high', label: 'High (~350 words)', cost: 0.0015 },
  { value: 'very-high', label: 'Very High (~500 words)', cost: 0.002 },
]

// ── Main Component ──

export const DesignStudio: React.FC = () => {
  // Data
  const [promptModels, setPromptModels] = useState<Record<string, ModelVersion[]>>({})
  const [imageModels, setImageModels] = useState<Record<string, ModelVersion[]>>({})
  const [keyStatus, setKeyStatus] = useState<KeyStatus>({})
  const [costTracking, setCostTracking] = useState<CostTracking | null>(null)
  const [presets, setPresets] = useState<any[]>([])

  // Form state
  const [mode, setMode] = useState('free-brief')
  const [brief, setBrief] = useState('')
  const [category, setCategory] = useState('')
  const [garmentColor, setGarmentColor] = useState('dark')
  const [designType, setDesignType] = useState('')
  const [designLane, setDesignLane] = useState('')
  const [emotionTier, setEmotionTier] = useState('')
  const [printText, setPrintText] = useState('')
  const [bulkTexts, setBulkTexts] = useState('')
  const [isBulkText, setIsBulkText] = useState(false)
  const [count, setCount] = useState(4)

  // Fashion Doc mode
  const [fashionDocFile, setFashionDocFile] = useState<File | null>(null)
  const [fashionDocPreview, setFashionDocPreview] = useState<string | null>(null)
  const [fashionDocMediaId, setFashionDocMediaId] = useState<string | null>(null)
  const [fashionDocUrl, setFashionDocUrl] = useState<string | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [dragging, setDragging] = useState(false)

  // SKU-Based mode
  const [skuResults, setSkuResults] = useState<any[]>([])
  const [selectedSku, setSelectedSku] = useState<any>(null)
  const [skuSearch, setSkuSearch] = useState('')
  const [loadingSkus, setLoadingSkus] = useState(false)

  // Prompt config
  const [promptModelId, setPromptModelId] = useState('')
  const [detailLevel, setDetailLevel] = useState('medium')
  const [skipAiPrompt, setSkipAiPrompt] = useState(false)

  // Image config — multi-model support
  const [imageModelId, setImageModelId] = useState('') // primary/default model
  const [selectedImageModelIds, setSelectedImageModelIds] = useState<Set<string>>(new Set())
  const [modelProgress, setModelProgress] = useState<Record<string, { status: 'pending' | 'generating' | 'done' | 'error'; count: number; completed: number; error?: string }>>({})

  // Text Composition config (available for any design type)
  const [tcEnabled, setTcEnabled] = useState(false)
  const [tcPaletteId, setTcPaletteId] = useState('muted-chaos')
  const [tcStyleId, setTcStyleId] = useState('wireframe-cluster')
  const [tcOrientation, setTcOrientation] = useState<'vertical' | 'horizontal' | 'square'>('vertical')
  const [tcHeroText, setTcHeroText] = useState('')
  const [tcSubText, setTcSubText] = useState('')
  const [tcPosition, setTcPosition] = useState<'bottom-left' | 'center' | 'bottom-center'>('bottom-left')
  const [tcGarmentColor, setTcGarmentColor] = useState<'dark' | 'light'>('dark')
  const [tcQuoteIdx, setTcQuoteIdx] = useState(-1) // -1 = custom
  const [tcHeroFont, setTcHeroFont] = useState('Inter')
  const [tcHeroWeight, setTcHeroWeight] = useState(900)
  const [tcSubFont, setTcSubFont] = useState('JetBrains Mono')
  const [tcSubWeight, setTcSubWeight] = useState(400)
  const [rawGraphics, setRawGraphics] = useState<any[]>([])

  // Preset
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [usePreset, setUsePreset] = useState(false)

  // Flow state
  const [step, setStep] = useState<'input' | 'prompt-review' | 'generating' | 'results' | 'saving'>('input')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [promptCost, setPromptCost] = useState(0)
  const [promptModelUsed, setPromptModelUsed] = useState('')
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [generationCost, setGenerationCost] = useState(0)
  const [generationTime, setGenerationTime] = useState(0)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Load initial data ──

  useEffect(() => {
    loadModelsAndKeys()
    loadPresets()
  }, [])

  const loadModelsAndKeys = async () => {
    try {
      const [promptRes, imageRes, keysRes] = await Promise.all([
        fetch('/next/design-prompt', { credentials: 'include' }),
        fetch('/next/design-generate', { credentials: 'include' }),
        fetch('/next/ai-keys', { credentials: 'include' }),
      ])

      if (promptRes.ok) {
        const data = await promptRes.json()
        setPromptModels(data.promptModels || {})
        // Set default prompt model
        for (const versions of Object.values(data.promptModels || {})) {
          const def = (versions as ModelVersion[]).find((v) => v.isDefault)
          if (def) { setPromptModelId(def.modelId); break }
        }
      }

      if (imageRes.ok) {
        const data = await imageRes.json()
        setImageModels(data.imageModels || {})
        setCostTracking(data.costTracking)
        // Set default image model
        for (const versions of Object.values(data.imageModels || {})) {
          const def = (versions as ModelVersion[]).find((v) => v.isDefault)
          if (def) {
            setImageModelId(def.modelId)
            setSelectedImageModelIds((prev) => prev.size === 0 ? new Set([def.modelId]) : prev)
            break
          }
        }
      }

      if (keysRes.ok) {
        const data = await keysRes.json()
        setKeyStatus(data.providers || {})
      }
    } catch { /* */ }
  }

  const loadPresets = async () => {
    try {
      const res = await fetch('/api/design-presets?limit=50&sort=name', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setPresets(data.docs || [])
      }
    } catch { /* */ }
  }

  // ── Fashion Doc Upload ──

  const processDocFile = async (file: File) => {
    setFashionDocFile(file)
    setFashionDocPreview(null)
    setFashionDocMediaId(null)
    setFashionDocUrl(null)

    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setFashionDocPreview(reader.result as string)
      reader.readAsDataURL(file)
    }

    // Upload to Payload media (stored on R2)
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', `Fashion doc: ${file.name}`)

      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setFashionDocMediaId(data.doc?.id || null)
        setFashionDocUrl(data.doc?.url || null)
      }
    } catch { /* non-critical */ }
    finally { setUploadingDoc(false) }
  }

  const handleFashionDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processDocFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processDocFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  const clearFashionDoc = () => {
    setFashionDocFile(null)
    setFashionDocPreview(null)
    setFashionDocMediaId(null)
    setFashionDocUrl(null)
  }

  // ── SKU Search for SKU-Based mode ──

  const fetchSkus = useCallback(async (search?: string) => {
    setLoadingSkus(true)
    try {
      const params = new URLSearchParams()
      params.set('category', category || 'all')
      params.set('limit', '20')
      params.set('minMargin', '0')
      params.set('sort', 'score')

      const res = await fetch(`/next/printify-catalog?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        let results = data.results || []
        if (search) {
          const lower = search.toLowerCase()
          results = results.filter((s: any) =>
            s.blueprintTitle?.toLowerCase().includes(lower) ||
            s.blueprintBrand?.toLowerCase().includes(lower),
          )
        }
        setSkuResults(results)
      }
    } catch { /* */ }
    finally { setLoadingSkus(false) }
  }, [category])

  useEffect(() => {
    if (mode === 'sku-based') fetchSkus()
  }, [mode, fetchSkus])

  // ── Prompt Generation ──

  const handleGeneratePrompt = async () => {
    setLoading(true)
    setError(null)
    try {
      const useTextCompositor = tcEnabled && tcHeroText.trim()

      const body: any = {
        mode,
        brief,
        category,
        garmentColor,
        designType,
        designLane,
        emotionTier,
        printText: useTextCompositor ? tcHeroText : printText,
        detailLevel,
        modelId: promptModelId,
      }

      // Text composition: use graphics-only template when type is text-composition,
      // otherwise keep the normal prompt flow (AI generates full graphic, text added after)
      if (useTextCompositor && designType === 'text-composition') {
        body.textComposite = {
          paletteId: tcPaletteId,
          styleId: tcStyleId,
          orientation: tcOrientation,
        }
      }

      if (isBulkText && bulkTexts.trim()) {
        body.bulkTexts = bulkTexts.split('\n').map((t: string) => t.trim()).filter(Boolean)
      }

      // Fashion Doc: extract text content and pass as documentContent
      if (mode === 'fashion-doc' && fashionDocFile) {
        body.additionalContext = `Fashion document: "${fashionDocFile.name}". The user uploaded this as creative direction — use it as the primary design reference.`
        if (fashionDocPreview) {
          // Read file as text if it's markdown/text, or pass base64 for image/PDF
          if (fashionDocFile.type.startsWith('text/') || fashionDocFile.name.endsWith('.md')) {
            try {
              const textContent = await fashionDocFile.text()
              body.documentContent = textContent
            } catch {
              body.documentContent = `[File: ${fashionDocFile.name} — could not extract text]`
            }
          } else {
            body.fashionDocBase64 = fashionDocPreview.split(',')[1] || ''
            body.fashionDocMimeType = fashionDocFile.type
            body.documentContent = `[Binary file: ${fashionDocFile.name} (${fashionDocFile.type}). Treat the additional brief as the primary creative direction.]`
          }
        }
        if (brief) {
          body.brief = brief
        }
      }

      // SKU-Based: send full SKU context so AI understands the exact product
      if (mode === 'sku-based' && selectedSku) {
        const sku = selectedSku
        const skuContext = [
          `PRODUCT SKU CONTEXT:`,
          `Product: ${sku.blueprintBrand} ${sku.blueprintTitle}`,
          `Category: ${sku.category}`,
          `Provider: ${sku.providerTitle || 'N/A'}`,
          `Decoration: ${(sku.decorationMethods || []).map((m: any) => typeof m === 'object' ? m.title : m).join(', ') || 'DTG'}`,
          `Print area: ${sku.printAreaFront ? `${sku.printAreaFront.width}×${sku.printAreaFront.height}px` : '4500×5400px'} (front)${sku.printAreaBack ? `, ${sku.printAreaBack.width}×${sku.printAreaBack.height}px (back)` : ''}`,
          `Available colors: ${(sku.availableColors || []).join(', ') || 'black, bone'}`,
          `Brand palette colors available: ${(sku.brandColorsAvailable || []).join(', ') || 'none'}`,
          `Available sizes: ${(sku.availableSizes || []).join(', ') || 'S-2XL'}`,
          `Score: ${sku.score || 'N/A'}/100`,
        ].join('\n')

        body.additionalContext = skuContext
        body.category = sku.category || category
        body.garmentColor = garmentColor || (sku.brandColorsAvailable?.[0]) || 'black'

        if (sku.printAreaFront) {
          body.printAreaWidth = sku.printAreaFront.width
          body.printAreaHeight = sku.printAreaFront.height
        }
      }

      const res = await fetch('/next/design-prompt', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Prompt generation failed')

      if (data.bulk) {
        // Bulk mode — join prompts
        const allPrompts = data.prompts.map((p: any) => p.prompt).join('\n\n---\n\n')
        setGeneratedPrompt(allPrompts)
        setPromptCost(data.prompts.reduce((sum: number, p: any) => sum + (p.estimatedCost || 0), 0))
      } else {
        setGeneratedPrompt(data.prompt)
        setPromptCost(data.estimatedCost || 0)
      }
      setPromptModelUsed(data.modelUsed || promptModelId)
      setStep('prompt-review')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Image Generation ──

  const handleGenerateImages = async () => {
    const modelIds = Array.from(selectedImageModelIds).filter((id) => isModelAvailable(id))
    if (modelIds.length === 0) return

    setStep('generating')
    setLoading(true)
    setError(null)

    // Initialize per-model progress
    const initialProgress: typeof modelProgress = {}
    for (const id of modelIds) {
      initialProgress[id] = { status: 'pending', count, completed: 0 }
    }
    setModelProgress(initialProgress)

    // Split prompt into array (for bulk, split on ---)
    let prompts: string[]
    if (generatedPrompt.includes('---')) {
      prompts = generatedPrompt.split(/\n*---\n*/).map((p) => p.trim()).filter(Boolean)
    } else {
      prompts = Array(count).fill(generatedPrompt)
    }

    // Build text composite config for the API (works with any design type)
    const textCompositePayload = (tcEnabled && tcHeroText.trim()) ? {
      heroText: tcHeroText,
      subText: tcSubText || undefined,
      paletteId: tcPaletteId,
      position: tcPosition,
      garmentColor: tcGarmentColor,
      heroFont: tcHeroFont !== 'Inter' ? tcHeroFont : undefined,
      heroWeight: tcHeroWeight !== 900 ? tcHeroWeight : undefined,
      subFont: tcSubFont !== 'JetBrains Mono' ? tcSubFont : undefined,
      subWeight: tcSubWeight !== 400 ? tcSubWeight : undefined,
    } : undefined

    // Run all models in parallel
    const generateForModel = async (modelId: string): Promise<{
      modelId: string
      images: GeneratedImage[]
      cost: number
      duration: number
      rawGraphics: any[]
      error?: string
    }> => {
      setModelProgress((prev) => ({
        ...prev,
        [modelId]: { ...prev[modelId], status: 'generating' },
      }))

      try {
        const res = await fetch('/next/design-generate', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts,
            modelId,
            metadata: { mode, promptModelUsed, promptCost },
            textComposite: textCompositePayload,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          if (res.status === 429 && data.busy) {
            throw new Error('Generation queue busy. Try again shortly.')
          }
          throw new Error(data.error || 'Image generation failed')
        }

        const images: GeneratedImage[] = (data.images || []).map((img: any) => ({
          ...img,
          status: 'pending' as const,
          title: '',
          ulTitle: '',
          type: designType || 'graphic',
          lane: designLane || '',
          emotion: emotionTier || '',
          categories: category ? [category] : [],
          tags: '',
          generatedAt: new Date().toISOString(),
        }))

        setModelProgress((prev) => ({
          ...prev,
          [modelId]: { status: 'done', count: images.length, completed: images.length },
        }))

        return {
          modelId,
          images,
          cost: data.grandTotalCost || 0,
          duration: data.durationSeconds || 0,
          rawGraphics: data.rawGraphics || [],
        }
      } catch (err: any) {
        setModelProgress((prev) => ({
          ...prev,
          [modelId]: { ...prev[modelId], status: 'error', error: err.message },
        }))
        return { modelId, images: [], cost: 0, duration: 0, rawGraphics: [], error: err.message }
      }
    }

    try {
      const results = await Promise.all(modelIds.map(generateForModel))

      const allImages = results.flatMap((r) => r.images)
      const totalCost = results.reduce((sum, r) => sum + r.cost, 0)
      const maxDuration = Math.max(...results.map((r) => r.duration), 0)
      const allRawGraphics = results.flatMap((r) => r.rawGraphics)
      const errors = results.filter((r) => r.error).map((r) => `${r.modelId}: ${r.error}`)

      if (allImages.length === 0) {
        setError(errors.join('\n') || 'All models failed to generate images.')
        setStep('prompt-review')
      } else {
        setGeneratedImages(allImages)
        setGenerationCost(totalCost)
        setGenerationTime(maxDuration)
        if (allRawGraphics.length) setRawGraphics(allRawGraphics)
        if (errors.length) setError(`Some models failed:\n${errors.join('\n')}`)
        setStep('results')

        // Auto-generate titles in the background
        autoGenerateTitles(allImages)
      }

      // Refresh cost tracking
      loadModelsAndKeys()
    } catch (err: any) {
      setError(err.message)
      setStep('prompt-review')
    } finally {
      setLoading(false)
    }
  }

  // ── Auto-generate titles ──

  const [titlesLoading, setTitlesLoading] = useState(false)

  const autoGenerateTitles = async (images: GeneratedImage[]) => {
    setTitlesLoading(true)
    try {
      const res = await fetch('/next/design-titles', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img) => ({
            id: img.id,
            index: img.index,
            model: img.model,
            modelDisplayName: img.modelDisplayName,
            type: img.type,
            lane: img.lane,
            emotion: img.emotion,
          })),
          designContext: generatedPrompt.slice(0, 200),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.titles?.length) {
          setGeneratedImages((prev) =>
            prev.map((img) => {
              const match = data.titles.find((t: any) => t.id === img.id)
              if (!match) return img
              return {
                ...img,
                title: match.title || img.title,
                ulTitle: match.ulTitle || img.ulTitle,
                type: match.type || img.type,
                lane: match.lane || img.lane,
              }
            }),
          )
        }
      }
    } catch {
      // Non-critical — metadata can be set manually
    }
    setTitlesLoading(false)
  }

  // ── Approval & Selection ──

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [saveColors, setSaveColors] = useState<string[]>(['dark'])

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(generatedImages.map((img) => img.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const approveImage = (id: string) => {
    setGeneratedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, status: 'approved' as const } : img)),
    )
  }

  const rejectImage = (id: string) => {
    setGeneratedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, status: 'rejected' as const } : img)),
    )
  }

  const downloadImage = (img: GeneratedImage) => {
    const link = document.createElement('a')
    link.href = `data:${img.mimeType};base64,${img.base64}`
    link.download = `design-${img.title || img.id}.png`
    link.click()
  }

  // Bulk actions
  const bulkApprove = () => {
    const ids = selectedIds.size > 0 ? selectedIds : new Set(generatedImages.map((i) => i.id))
    setGeneratedImages((prev) => prev.map((img) => ids.has(img.id) ? { ...img, status: 'approved' as const } : img))
  }
  const bulkReject = () => {
    const ids = selectedIds.size > 0 ? selectedIds : new Set(generatedImages.map((i) => i.id))
    setGeneratedImages((prev) => prev.map((img) => ids.has(img.id) ? { ...img, status: 'rejected' as const } : img))
  }
  const bulkDownload = () => {
    const targets = selectedIds.size > 0
      ? generatedImages.filter((img) => selectedIds.has(img.id))
      : generatedImages
    targets.forEach((img) => downloadImage(img))
  }

  // Bulk assign metadata to selected (or all)
  const [bulkMeta, setBulkMeta] = useState({ type: '', lane: '', emotion: '', categories: [] as string[], tags: '' })
  const [showBulkAssign, setShowBulkAssign] = useState(false)

  const applyBulkMeta = () => {
    const ids = selectedIds.size > 0 ? selectedIds : new Set(generatedImages.map((i) => i.id))
    setGeneratedImages((prev) => prev.map((img) => {
      if (!ids.has(img.id)) return img
      return {
        ...img,
        type: bulkMeta.type || img.type,
        lane: bulkMeta.lane || img.lane,
        emotion: bulkMeta.emotion || img.emotion,
        categories: bulkMeta.categories.length > 0 ? bulkMeta.categories : img.categories,
        tags: bulkMeta.tags || img.tags,
      }
    }))
    setShowBulkAssign(false)
  }

  // Update per-image field
  const updateImageField = (id: string, field: string, value: any) => {
    setGeneratedImages((prev) => prev.map((img) =>
      img.id === id ? { ...img, [field]: value } : img,
    ))
  }

  // ── Save Approved ──

  const handleSaveDesigns = async () => {
    const approved = generatedImages.filter((img) => img.status === 'approved')
    if (approved.length === 0) return

    setLoading(true)
    setMessage(null)
    let savedCount = 0

    for (const img of approved) {
      try {
        // Find corresponding raw graphic for text-composition saves
        const rawGraphic = rawGraphics.find((r: any) => r.index === img.index)

        const res = await fetch('/next/design-approve', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: img.base64,
            mimeType: img.mimeType,
            metadata: {
              title: img.title || `Design ${img.index + 1}`,
              type: img.type || 'graphic',
              designLane: img.lane || undefined,
              emotionTier: img.emotion || undefined,
              forCategories: img.categories,
              forGarmentColors: saveColors,
              printText: (tcEnabled && tcHeroText.trim()) ? tcHeroText : (printText || undefined),
              tags: img.tags ? img.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
              generatedBy: img.model,
              generationPrompt: img.prompt,
              generationCost: generationCost / approved.length,
              promptModel: promptModelUsed,
              imageModel: img.model,
              presetId: usePreset && selectedPresetId ? selectedPresetId : undefined,
              // Pass raw graphic for ai-graphics collection (when text overlay was used)
              sourceGraphic: (rawGraphic && tcEnabled) ? {
                base64: rawGraphic.base64,
                mimeType: rawGraphic.mimeType,
                palette: tcPaletteId,
                style: designType === 'text-composition' ? tcStyleId : undefined,
                orientation: designType === 'text-composition' ? tcOrientation : undefined,
              } : undefined,
            },
          }),
        })

        if (res.ok) savedCount++
      } catch { /* */ }
    }

    setLoading(false)
    setMessage({
      type: savedCount > 0 ? 'success' : 'error',
      text: `${savedCount}/${approved.length} designs saved to collection`,
    })

    if (savedCount > 0) {
      setTimeout(() => {
        setStep('input')
        setGeneratedImages([])
        setGeneratedPrompt('')
        setBrief('')
        setPrintText('')
        setBulkTexts('')
        setSelectedIds(new Set())
        setRawGraphics([])
      }, 2000)
    }
  }

  // ── Cost Estimate ──

  const getModelCostPerImage = (modelId: string): number => {
    for (const versions of Object.values(imageModels)) {
      const m = versions.find((v) => v.modelId === modelId)
      if (m?.costPerImage) return m.costPerImage
    }
    return 0.075
  }

  // Legacy single-model helper (used by some UI)
  const getImageModelCost = (): number => getModelCostPerImage(imageModelId)

  const estimatedTotalCost = () => {
    const activeModels = Array.from(selectedImageModelIds)
    const imgCost = activeModels.reduce((sum, id) => sum + getModelCostPerImage(id) * count, 0)
    const pCost = skipAiPrompt ? 0 : (DETAIL_LEVELS.find((d) => d.value === detailLevel)?.cost || 0.001) * count
    return Math.round((imgCost + pCost) * 1000) / 1000
  }

  // ── Provider availability check ──

  const getModelProvider = (modelId: string): string => {
    for (const versions of Object.values(imageModels)) {
      const m = versions.find((v) => v.modelId === modelId)
      if (m?.provider) return m.provider
    }
    return ''
  }

  const isModelAvailable = (modelId: string): boolean => {
    const provider = getModelProvider(modelId)
    if (!provider) return false
    return keyStatus[provider]?.configured || false
  }

  // ── Render ──

  return (
    <div className="design-studio">
      <div className="ds-header">
        <h1>Design Studio</h1>
        {costTracking && (
          <div className="ds-cost-badge">
            ${costTracking.monthlySpent.toFixed(2)} / ${costTracking.monthlyBudget} this month
          </div>
        )}
      </div>

      {message && (
        <div className={`ds-message ds-message--${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>x</button>
        </div>
      )}

      {error && <div className="ds-message ds-message--error">{error}</div>}

      {/* ── STEP 1: Input ── */}
      {step === 'input' && (
        <div className="ds-step">
          {/* Preset or Scratch */}
          <div className="ds-section">
            <div className="ds-radio-row">
              <label className="ds-radio">
                <input type="radio" checked={!usePreset} onChange={() => setUsePreset(false)} />
                Start from Scratch
              </label>
              <label className="ds-radio">
                <input type="radio" checked={usePreset} onChange={() => setUsePreset(true)} />
                Use Preset
              </label>
              {usePreset && (
                <select value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)}>
                  <option value="">Select preset...</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Mode */}
          <div className="ds-section">
            <label className="ds-label">Generation Mode</label>
            <div className="ds-pills">
              {MODES.map((m) => (
                <button key={m.key} className={`ds-pill ${mode === m.key ? 'ds-pill--active' : ''}`} onClick={() => setMode(m.key)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Mode-specific content ── */}

          {/* Fashion Doc Mode */}
          {mode === 'fashion-doc' && (
            <div className="ds-section ds-fashion-doc">
              <label className="ds-label">Upload Fashion Document / Mood Board</label>
              <p className="ds-hint">Drag &amp; drop or click to upload. Supports images, PDFs, and Markdown (.md) files. Files are stored on R2.</p>
              <div
                className={`ds-upload-zone ${dragging ? 'ds-upload-zone--dragging' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept="image/*,.pdf,.md,text/markdown"
                  onChange={handleFashionDocUpload}
                  id="fashion-doc-upload"
                  className="ds-upload-input"
                />
                <label htmlFor="fashion-doc-upload" className="ds-upload-label">
                  {uploadingDoc ? (
                    <span className="ds-upload-uploading">
                      <span className="ds-upload-spinner" />
                      Uploading to R2...
                    </span>
                  ) : fashionDocFile ? (
                    <span className="ds-upload-file">
                      {fashionDocPreview && <img src={fashionDocPreview} alt="Preview" className="ds-upload-preview" />}
                      {!fashionDocPreview && (
                        <span className="ds-upload-file-icon">
                          {fashionDocFile.name.endsWith('.md') ? 'MD' : fashionDocFile.name.endsWith('.pdf') ? 'PDF' : '📄'}
                        </span>
                      )}
                      <span className="ds-upload-file-info">
                        <span className="ds-upload-file-name">{fashionDocFile.name}</span>
                        <span className="ds-upload-file-size">{(fashionDocFile.size / 1024).toFixed(1)} KB</span>
                        {fashionDocUrl && <span className="ds-upload-file-stored">Stored on R2</span>}
                      </span>
                      <button className="ds-upload-clear" onClick={(e) => { e.preventDefault(); clearFashionDoc() }}>×</button>
                    </span>
                  ) : (
                    <span className="ds-upload-placeholder">
                      Drop file here or click to browse<br />
                      <span className="ds-upload-formats">Images, PDF, Markdown (.md)</span>
                    </span>
                  )}
                </label>
              </div>
              <div className="ds-section" style={{ marginTop: 12 }}>
                <label className="ds-label">Additional Brief <span className="ds-optional">(optional)</span></label>
                <BriefTextarea
                  value={brief}
                  onChange={setBrief}
                  placeholder="Any specific instructions beyond the document..."
                  rows={2}
                  label="Additional Brief"
                />
              </div>
            </div>
          )}

          {/* SKU-Based Mode */}
          {mode === 'sku-based' && (
            <div className="ds-section ds-sku-picker">
              <label className="ds-label">Select Product SKU</label>
              <p className="ds-hint">Pick a Printify product. The AI will generate designs optimized for the garment type, print area, and brand colors.</p>
              <div className="ds-sku-search">
                <input
                  type="text"
                  className="ds-input"
                  placeholder="Search by name or brand..."
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchSkus(skuSearch || undefined)}
                />
                <button className="ds-btn ds-btn--small" onClick={() => fetchSkus(skuSearch || undefined)}>Search</button>
              </div>
              {loadingSkus ? (
                <div className="ds-hint">Loading SKUs...</div>
              ) : (
                <div className="ds-sku-grid">
                  {skuResults.slice(0, 12).map((sku: any) => (
                    <button
                      key={`${sku.blueprintId}-${sku.providerId}`}
                      className={`ds-sku-card ${selectedSku?.blueprintId === sku.blueprintId && selectedSku?.providerId === sku.providerId ? 'ds-sku-card--selected' : ''}`}
                      onClick={() => {
                        setSelectedSku(sku)
                        setCategory(sku.category || '')
                        setGarmentColor(sku.brandColorsAvailable?.includes('black') ? 'dark' : 'light')
                      }}
                    >
                      {sku.blueprintImages?.[0] && (
                        <img src={sku.blueprintImages[0]} alt={sku.blueprintTitle} className="ds-sku-card__img" />
                      )}
                      <div className="ds-sku-card__info">
                        <span className="ds-sku-card__title">{sku.blueprintTitle}</span>
                        <span className="ds-sku-card__brand">{sku.blueprintBrand}</span>
                        <span className="ds-sku-card__meta">
                          {sku.category} · {sku.printAreaFront ? `${sku.printAreaFront.width}×${sku.printAreaFront.height}` : 'N/A'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedSku && (
                <div className="ds-sku-selected">
                  Selected: <strong>{selectedSku.blueprintBrand} — {selectedSku.blueprintTitle}</strong>
                  <button className="ds-upload-clear" onClick={() => setSelectedSku(null)}>×</button>
                </div>
              )}
              <div className="ds-section" style={{ marginTop: 12 }}>
                <label className="ds-label">Design Brief</label>
                <BriefTextarea
                  value={brief}
                  onChange={setBrief}
                  placeholder="What kind of design? e.g., 'Ironic text saying DO NOT PERCEIVE ME in distressed font'"
                  rows={2}
                  label="Design Brief"
                />
              </div>
            </div>
          )}

          {/* Free Brief Mode */}
          {mode === 'free-brief' && (
            <div className="ds-section">
              <label className="ds-label">Brief</label>
              <BriefTextarea
                value={brief}
                onChange={setBrief}
                placeholder="Describe the design you want... e.g., 'Brutalist text saying EMOTIONALLY UNAVAILABLE in heavy gothic font, cream on transparent bg'"
                rows={3}
                label="Brief"
              />
            </div>
          )}

          {/* Design params */}
          <div className="ds-section ds-grid-4">
            <div>
              <label className="ds-label">Category</label>
              <select className="ds-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="ds-label">Garment Color</label>
              <select className="ds-select" value={garmentColor} onChange={(e) => setGarmentColor(e.target.value)}>
                {GARMENT_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="ds-label">Design Type</label>
              <select className="ds-select" value={designType} onChange={(e) => setDesignType(e.target.value)}>
                {DESIGN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="ds-label">Lane</label>
              <select className="ds-select" value={designLane} onChange={(e) => setDesignLane(e.target.value)}>
                {LANES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div className="ds-section ds-grid-4">
            <div>
              <label className="ds-label">Emotion Tier</label>
              <select className="ds-select" value={emotionTier} onChange={(e) => setEmotionTier(e.target.value)}>
                {EMOTIONS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="ds-label">Print Text</label>
              <input className="ds-input" type="text" value={printText} onChange={(e) => setPrintText(e.target.value)} placeholder="EMOTIONALLY UNAVAILABLE" />
            </div>
            <div>
              <label className="ds-label">Count</label>
              <select className="ds-select" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="ds-label">Bulk Text</label>
              <label className="ds-checkbox">
                <input type="checkbox" checked={isBulkText} onChange={(e) => setIsBulkText(e.target.checked)} />
                Multiple texts (one per line)
              </label>
            </div>
          </div>

          {/* ── Text Composition Panel ── */}
          <div className="ds-section">
            <label className="ds-checkbox">
              <input
                type="checkbox"
                checked={tcEnabled}
                onChange={(e) => setTcEnabled(e.target.checked)}
              />
              Add Text Overlay (compositor)
            </label>
            {designType === 'text-composition' && !tcEnabled && (
              <p className="ds-hint" style={{ color: '#f87171', marginTop: 4 }}>Text Composition type selected — enable text overlay to composite crisp text</p>
            )}
          </div>
          {tcEnabled && (
            <div className="ds-section ds-tc-panel">
              <h3 className="ds-config-title">Text Composition</h3>
              <p className="ds-hint">
                {designType === 'text-composition'
                  ? 'AI generates graphics only (no text). Text is composited in post via Satori + Sharp — crisp, pixel-perfect, no garbled letters.'
                  : 'Text will be composited over the AI-generated design after generation. No garbled AI text.'}
              </p>

              {/* Palette selector — always shown (affects text colors) */}
              <div className="ds-tc-row">
                <label className="ds-label">Gen Z Palette <span className="ds-optional">(controls text colors)</span></label>
                <div className="ds-tc-palettes">
                  {GEN_Z_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      className={`ds-tc-palette-btn ${tcPaletteId === p.id ? 'ds-tc-palette-btn--active' : ''}`}
                      onClick={() => setTcPaletteId(p.id)}
                      type="button"
                    >
                      <span className="ds-tc-palette-dots">
                        {p.colors.slice(0, 3).map((c) => (
                          <span key={c.hex} className="ds-tc-palette-dot" style={{ backgroundColor: c.hex }} />
                        ))}
                      </span>
                      {p.name}
                    </button>
                  ))}
                </div>
                {/* Swatch preview */}
                <div className="ds-tc-swatches">
                  {GEN_Z_PALETTES.find((p) => p.id === tcPaletteId)?.colors.map((c) => (
                    <div key={c.hex} className="ds-tc-swatch" style={{ backgroundColor: c.hex }}>
                      <span className="ds-tc-swatch-label" style={{ color: isLightHex(c.hex) ? '#1a1a1a' : '#f0f0f0' }}>
                        {c.name} {c.hex}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Style + Orientation — only for text-composition (controls graphics-only prompt) */}
              {designType === 'text-composition' && (
                <div className="ds-grid-2" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="ds-label">Graphic Style</label>
                    <div className="ds-pills">
                      {GRAPHIC_STYLE_OPTIONS.map((s) => (
                        <button key={s.value} className={`ds-pill ${tcStyleId === s.value ? 'ds-pill--active' : ''}`} onClick={() => setTcStyleId(s.value)} type="button">
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="ds-label">Orientation</label>
                    <div className="ds-pills">
                      {ORIENTATION_OPTIONS.map((o) => (
                        <button key={o.value} className={`ds-pill ${tcOrientation === o.value ? 'ds-pill--active' : ''}`} onClick={() => setTcOrientation(o.value as any)} type="button">
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quote bank */}
              <div className="ds-tc-row">
                <label className="ds-label">Quote</label>
                <select
                  className="ds-select"
                  value={tcQuoteIdx}
                  onChange={(e) => {
                    const idx = Number(e.target.value)
                    setTcQuoteIdx(idx)
                    if (idx >= 0) {
                      setTcHeroText(QUOTE_BANK[idx].hero)
                      setTcSubText(QUOTE_BANK[idx].sub)
                    }
                  }}
                >
                  <option value={-1}>Custom text</option>
                  {QUOTE_BANK.map((q, i) => (
                    <option key={i} value={i}>{q.hero} — {q.lane}</option>
                  ))}
                </select>
              </div>

              {/* Hero + Sub text */}
              <div className="ds-grid-2" style={{ marginBottom: 12 }}>
                <div>
                  <label className="ds-label">Hero Text</label>
                  <input className="ds-input" type="text" value={tcHeroText} onChange={(e) => { setTcHeroText(e.target.value); setTcQuoteIdx(-1) }} placeholder="DO NOT PERCEIVE ME" />
                </div>
                <div>
                  <label className="ds-label">Sub Text <span className="ds-optional">(optional)</span></label>
                  <input className="ds-input" type="text" value={tcSubText} onChange={(e) => { setTcSubText(e.target.value); setTcQuoteIdx(-1) }} placeholder="visibility: hidden" />
                </div>
              </div>

              {/* Font selectors */}
              <div className="ds-grid-2" style={{ marginBottom: 12 }}>
                <div>
                  <label className="ds-label">Hero Font</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      className="ds-select"
                      value={tcHeroFont}
                      onChange={(e) => {
                        const font = HERO_FONTS.find((f) => f.value === e.target.value)
                        setTcHeroFont(e.target.value)
                        if (font && !font.weights.includes(tcHeroWeight)) {
                          setTcHeroWeight(font.weights[font.weights.length - 1])
                        }
                      }}
                      style={{ flex: 1 }}
                    >
                      {HERO_FONTS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <select
                      className="ds-select"
                      value={tcHeroWeight}
                      onChange={(e) => setTcHeroWeight(Number(e.target.value))}
                      style={{ width: 80 }}
                    >
                      {(HERO_FONTS.find((f) => f.value === tcHeroFont)?.weights || [900]).map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="ds-label">Sub Font</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      className="ds-select"
                      value={tcSubFont}
                      onChange={(e) => {
                        const font = SUB_FONTS.find((f) => f.value === e.target.value)
                        setTcSubFont(e.target.value)
                        if (font && !font.weights.includes(tcSubWeight)) {
                          setTcSubWeight(font.weights[0])
                        }
                      }}
                      style={{ flex: 1 }}
                    >
                      {SUB_FONTS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <select
                      className="ds-select"
                      value={tcSubWeight}
                      onChange={(e) => setTcSubWeight(Number(e.target.value))}
                      style={{ width: 80 }}
                    >
                      {(SUB_FONTS.find((f) => f.value === tcSubFont)?.weights || [400]).map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Position + Garment color */}
              <div className="ds-grid-2">
                <div>
                  <label className="ds-label">Text Position</label>
                  <div className="ds-pills">
                    {TEXT_POSITIONS.map((p) => (
                      <button key={p.value} className={`ds-pill ${tcPosition === p.value ? 'ds-pill--active' : ''}`} onClick={() => setTcPosition(p.value as any)} type="button">
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="ds-label">Garment Color</label>
                  <div className="ds-pills">
                    <button className={`ds-pill ${tcGarmentColor === 'dark' ? 'ds-pill--active' : ''}`} onClick={() => setTcGarmentColor('dark')} type="button">
                      Dark
                    </button>
                    <button className={`ds-pill ${tcGarmentColor === 'light' ? 'ds-pill--active' : ''}`} onClick={() => setTcGarmentColor('light')} type="button">
                      Light
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isBulkText && (
            <div className="ds-section">
              <label className="ds-label">Bulk Texts (one per line, max 10)</label>
              <textarea className="ds-textarea" rows={5} value={bulkTexts} onChange={(e) => setBulkTexts(e.target.value)}
                placeholder={"EMOTIONALLY UNAVAILABLE\nDO NOT PERCEIVE ME\nERROR 404\nUGLY ON PURPOSE"}
              />
            </div>
          )}

          {/* Prompt Config */}
          <div className="ds-section ds-config-box">
            <h3 className="ds-config-title">Step 1 — Prompt Engineering</h3>
            <p className="ds-hint" style={{ marginTop: 2 }}>
              A text model crafts a detailed image prompt from your brief. Cheaper models work fine for most designs.
            </p>
            <div className="ds-grid-3">
              <div>
                <label className="ds-label">Text Model</label>
                <select className="ds-select" value={promptModelId} onChange={(e) => setPromptModelId(e.target.value)} disabled={skipAiPrompt}>
                  {Object.entries(promptModels).map(([family, versions]) => (
                    <optgroup key={family} label={family}>
                      {versions.map((v) => (
                        <option key={v.modelId} value={v.modelId}>
                          {v.displayName} {v.tag ? `(${v.tag.toUpperCase()})` : ''} {v.isDefault ? '— default' : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {(() => {
                  const selected = Object.values(promptModels).flat().find((v) => v.modelId === promptModelId)
                  return selected?.shortDescription ? (
                    <p className="ds-hint" style={{ marginTop: 4, color: '#888' }}>{selected.shortDescription}</p>
                  ) : null
                })()}
              </div>
              <div>
                <label className="ds-label">Detail Level</label>
                <select className="ds-select" value={detailLevel} onChange={(e) => setDetailLevel(e.target.value)} disabled={skipAiPrompt}>
                  {DETAIL_LEVELS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="ds-label">&nbsp;</label>
                <label className="ds-checkbox">
                  <input type="checkbox" checked={skipAiPrompt} onChange={(e) => setSkipAiPrompt(e.target.checked)} />
                  Skip AI — write my own prompt
                </label>
              </div>
            </div>
          </div>

          {/* Image Config — Multi-model */}
          <div className="ds-section ds-config-box">
            <h3 className="ds-config-title">Step 2 — Image Generation</h3>
            <p className="ds-hint" style={{ marginTop: 2 }}>
              An image model generates designs from the prompt. Pick up to 3 models to compare results side-by-side.
            </p>
            <div>
              <label className="ds-label">Select Models <span style={{ color: '#666', fontWeight: 400 }}>(max 3 — each generates {count} images)</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {Object.entries(imageModels).map(([family, versions]) => (
                  <React.Fragment key={family}>
                    {versions.map((v) => {
                      const available = isModelAvailable(v.modelId)
                      const checked = selectedImageModelIds.has(v.modelId)
                      return (
                        <label
                          key={v.modelId}
                          className="ds-checkbox"
                          style={{
                            opacity: available ? 1 : 0.4,
                            cursor: available ? 'pointer' : 'not-allowed',
                            padding: '8px 10px',
                            borderRadius: 4,
                            background: checked ? 'rgba(90, 98, 66, 0.12)' : 'transparent',
                            border: `1px solid ${checked ? '#5A6242' : 'var(--theme-elevation-200, #2a2a2a)'}`,
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!available || (!checked && selectedImageModelIds.size >= 3)}
                            onChange={(e) => {
                              setSelectedImageModelIds((prev) => {
                                const next = new Set(prev)
                                if (e.target.checked) {
                                  next.add(v.modelId)
                                  if (next.size === 1) setImageModelId(v.modelId)
                                } else {
                                  next.delete(v.modelId)
                                  if (imageModelId === v.modelId && next.size > 0) {
                                    setImageModelId(Array.from(next)[0])
                                  }
                                }
                                return next
                              })
                            }}
                            style={{ marginTop: 2 }}
                          />
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span>
                              {v.displayName}
                              <span style={{ color: '#8B9A6B', marginLeft: 6 }}>${v.costPerImage}/img</span>
                              {v.tag && <span style={{ color: '#666', marginLeft: 6 }}>({v.tag.toUpperCase()})</span>}
                              {!available && <span style={{ color: '#e06060', marginLeft: 6 }}>— key missing</span>}
                            </span>
                            {v.shortDescription && (
                              <span style={{ fontSize: 11, color: '#777', lineHeight: 1.3 }}>{v.shortDescription}</span>
                            )}
                          </span>
                        </label>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="ds-label">Estimated Cost</label>
              <div className="ds-cost-estimate">
                <span className="ds-cost-total">${estimatedTotalCost().toFixed(3)}</span>
                <span className="ds-cost-detail">
                  {selectedImageModelIds.size} model{selectedImageModelIds.size !== 1 ? 's' : ''} × {count} images
                  {selectedImageModelIds.size > 0 && (
                    <> = {selectedImageModelIds.size * count} total</>
                  )}
                  {!skipAiPrompt && ` + prompt`}
                </span>
              </div>
            </div>
            {/* Provider key status */}
            {Object.keys(keyStatus).length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, fontFamily: 'var(--font-mono, monospace)' }}>
                {Object.entries(keyStatus).map(([provider, status]) => (
                  <span key={provider} style={{ color: (status as any).configured ? '#8B9A6B' : '#666' }}>
                    {provider}: {(status as any).configured ? (status as any).source : 'not set'}
                  </span>
                ))}
                <a href="/adm/collections/global-keys" style={{ color: '#8B9A6B', textDecoration: 'underline' }}>Manage keys</a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="ds-actions">
            {skipAiPrompt ? (
              <button className="ds-btn ds-btn--primary" onClick={() => { setGeneratedPrompt(brief); setStep('prompt-review') }} disabled={!brief.trim()}>
                Continue with My Prompt
              </button>
            ) : (
              <button className="ds-btn ds-btn--primary" onClick={handleGeneratePrompt} disabled={
                loading ||
                (mode === 'free-brief' && !brief.trim() && !isBulkText && !(tcEnabled && designType === 'text-composition')) ||
                (mode === 'fashion-doc' && !fashionDocFile && !brief.trim()) ||
                (mode === 'sku-based' && !selectedSku) ||
                (tcEnabled && !tcHeroText.trim())
              }>
                {loading ? 'Generating Prompt...' : (tcEnabled && designType === 'text-composition') ? 'Generate Graphics-Only Prompt' : tcEnabled ? 'Generate Prompt + Text Overlay' : 'Generate Prompt'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Prompt Review ── */}
      {step === 'prompt-review' && (
        <div className="ds-step">
          <div className="ds-section">
            <div className="ds-prompt-header">
              <h3>Generated Prompt</h3>
              {!skipAiPrompt && (
                <span className="ds-prompt-meta">
                  Model: {promptModelUsed} | Detail: {detailLevel} | Cost: ${promptCost.toFixed(4)}
                </span>
              )}
            </div>
            <textarea className="ds-textarea ds-textarea--prompt" rows={12} value={generatedPrompt} onChange={(e) => setGeneratedPrompt(e.target.value)} />
          </div>

          <div className="ds-actions">
            <button className="ds-btn" onClick={() => setStep('input')}>Back</button>
            {!skipAiPrompt && (
              <button className="ds-btn" onClick={handleGeneratePrompt} disabled={loading}>
                {loading ? 'Regenerating...' : 'Regenerate Prompt'}
              </button>
            )}
            <button className="ds-btn ds-btn--primary" onClick={handleGenerateImages} disabled={!generatedPrompt.trim() || selectedImageModelIds.size === 0}>
              Generate {count * selectedImageModelIds.size} Images with {selectedImageModelIds.size} Model{selectedImageModelIds.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Generating with per-model progress ── */}
      {step === 'generating' && (
        <div className="ds-step ds-generating">
          <div className="ds-spinner" />
          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>
            Generating images — {Object.keys(modelProgress).length} model{Object.keys(modelProgress).length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 500 }}>
            {Object.entries(modelProgress).map(([modelId, prog]) => {
              const displayName = (() => {
                for (const versions of Object.values(imageModels)) {
                  const m = versions.find((v) => v.modelId === modelId)
                  if (m) return m.displayName
                }
                return modelId
              })()
              return (
                <div key={modelId} style={{
                  padding: '10px 14px',
                  background: 'var(--theme-elevation-100, #1e1e1e)',
                  borderRadius: 6,
                  border: `1px solid ${prog.status === 'done' ? 'rgba(90, 98, 66, 0.4)' : prog.status === 'error' ? 'rgba(220, 38, 38, 0.3)' : 'var(--theme-elevation-200, #2a2a2a)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{displayName}</span>
                    <span style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono, monospace)',
                      color: prog.status === 'done' ? '#8B9A6B'
                        : prog.status === 'error' ? '#e06060'
                        : prog.status === 'generating' ? '#aaa' : '#666',
                    }}>
                      {prog.status === 'pending' && 'waiting...'}
                      {prog.status === 'generating' && 'generating...'}
                      {prog.status === 'done' && `✓ ${prog.completed} images`}
                      {prog.status === 'error' && `✗ ${prog.error?.slice(0, 40) || 'failed'}`}
                    </span>
                  </div>
                  <div style={{
                    width: '100%', height: 4, background: 'var(--theme-elevation-200, #2a2a2a)',
                    borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: prog.status === 'done' ? '100%'
                        : prog.status === 'generating' ? '60%'
                        : prog.status === 'error' ? '100%' : '0%',
                      height: '100%',
                      background: prog.status === 'done' ? '#5A6242'
                        : prog.status === 'error' ? '#c04040'
                        : '#5A6242',
                      transition: 'width 0.5s ease',
                      animation: prog.status === 'generating' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 4: Results ── */}
      {step === 'results' && (
        <div className="ds-step">
          <div className="ds-results-header">
            <h3>Generated Images</h3>
            <span className="ds-results-meta">
              {generatedImages.length} images
              {(() => {
                const models = new Set(generatedImages.map((img) => img.modelDisplayName))
                return models.size > 1 ? ` from ${models.size} models` : ''
              })()}
              {' '}| {generationTime}s | Cost: ${generationCost.toFixed(3)}
              {rawGraphics.length > 0 && <span style={{ color: '#8B9A6B', marginLeft: 8 }}>· text composited</span>}
              {titlesLoading && <span style={{ color: '#8B9A6B', marginLeft: 8 }}>· generating titles...</span>}
            </span>
          </div>

          {/* Bulk actions toolbar */}
          <div className="ds-bulk-bar">
            <div className="ds-bulk-bar__left">
              <label className="ds-checkbox ds-checkbox--inline">
                <input
                  type="checkbox"
                  checked={selectedIds.size === generatedImages.length && generatedImages.length > 0}
                  onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                />
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
              </label>
            </div>
            <div className="ds-bulk-bar__actions">
              <button className="ds-btn ds-btn--small ds-btn--approve" onClick={bulkApprove} disabled={(() => {
                const targets = selectedIds.size > 0
                  ? generatedImages.filter((img) => selectedIds.has(img.id))
                  : generatedImages
                return targets.some((img) => !img.title.trim()) || titlesLoading
              })()} title={titlesLoading ? 'Generating titles...' : 'All images need titles before approval'}>
                {titlesLoading ? 'Titling...' : selectedIds.size > 0 ? `Approve ${selectedIds.size}` : 'Approve All'}
              </button>
              <button className="ds-btn ds-btn--small ds-btn--reject" onClick={bulkReject}>
                {selectedIds.size > 0 ? `Reject ${selectedIds.size}` : 'Reject All'}
              </button>
              <button className="ds-btn ds-btn--small" onClick={bulkDownload}>
                {selectedIds.size > 0 ? `Download ${selectedIds.size}` : 'Download All'}
              </button>
              <button className="ds-btn ds-btn--small" onClick={() => setShowBulkAssign(!showBulkAssign)}>
                Bulk Assign Metadata
              </button>
            </div>
          </div>

          {/* Bulk metadata assignment panel */}
          {showBulkAssign && (
            <div className="ds-bulk-assign">
              <div className="ds-grid-4">
                <div>
                  <label className="ds-label">Type</label>
                  <select className="ds-select" value={bulkMeta.type} onChange={(e) => setBulkMeta({ ...bulkMeta, type: e.target.value })}>
                    <option value="">— Keep existing —</option>
                    {DESIGN_TYPES.filter((t) => t.value).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ds-label">Lane</label>
                  <select className="ds-select" value={bulkMeta.lane} onChange={(e) => setBulkMeta({ ...bulkMeta, lane: e.target.value })}>
                    <option value="">— Keep existing —</option>
                    {LANES.filter((l) => l.value).map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ds-label">Emotion Tier</label>
                  <select className="ds-select" value={bulkMeta.emotion} onChange={(e) => setBulkMeta({ ...bulkMeta, emotion: e.target.value })}>
                    <option value="">— Keep existing —</option>
                    {EMOTIONS.filter((em) => em.value).map((em) => <option key={em.value} value={em.value}>{em.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ds-label">Tags</label>
                  <input className="ds-input" type="text" value={bulkMeta.tags} onChange={(e) => setBulkMeta({ ...bulkMeta, tags: e.target.value })} placeholder="tag1, tag2" />
                </div>
              </div>
              <div className="ds-bulk-assign__footer">
                <div className="ds-chip-group">
                  {['tees', 'hoodies', 'hats', 'totes'].map((c) => (
                    <button key={c} className={`ds-chip ${bulkMeta.categories.includes(c) ? 'ds-chip--on' : ''}`}
                      onClick={() => setBulkMeta({ ...bulkMeta, categories: bulkMeta.categories.includes(c) ? bulkMeta.categories.filter((x) => x !== c) : [...bulkMeta.categories, c] })}>
                      {c}
                    </button>
                  ))}
                </div>
                <button className="ds-btn ds-btn--primary ds-btn--small" onClick={applyBulkMeta}>
                  Apply to {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'all'}
                </button>
              </div>
            </div>
          )}

          {/* Image grid with per-image metadata */}
          <div className="ds-image-grid">
            {generatedImages.map((img, idx) => (
              <div key={img.id} className={`ds-image-card ds-image-card--${img.status} ${selectedIds.has(img.id) ? 'ds-image-card--checked' : ''}`}>
                {/* Selection checkbox */}
                <label className="ds-image-check">
                  <input type="checkbox" checked={selectedIds.has(img.id)} onChange={() => toggleSelected(img.id)} />
                </label>

                {/* Image preview — click to open lightbox */}
                <div className="ds-image-preview" onClick={() => setLightboxIdx(idx)} title="Click to enlarge">
                  <img src={`data:${img.mimeType};base64,${img.base64}`} alt={img.title || `Design ${img.index + 1}`} />
                </div>

                {/* Per-image metadata */}
                <div className="ds-image-meta">
                  <input
                    className="ds-input ds-input--compact"
                    type="text"
                    value={img.title}
                    onChange={(e) => {
                      updateImageField(img.id, 'title', e.target.value)
                      // Auto-update ulTitle when title changes
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      const modelSlug = (img.modelDisplayName || img.model || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      updateImageField(img.id, 'ulTitle', `${slug}-${modelSlug}`)
                    }}
                    placeholder={`Design ${img.index + 1} title`}
                  />
                  {img.ulTitle && (
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: '#666', marginTop: 2, display: 'block' }}>
                      {img.ulTitle}
                    </span>
                  )}
                  <div className="ds-image-meta__row">
                    <select className="ds-select ds-select--compact" value={img.type} onChange={(e) => updateImageField(img.id, 'type', e.target.value)}>
                      {DESIGN_TYPES.filter((t) => t.value).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <select className="ds-select ds-select--compact" value={img.lane} onChange={(e) => updateImageField(img.id, 'lane', e.target.value)}>
                      <option value="">Lane</option>
                      {LANES.filter((l) => l.value).map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Status info */}
                <div className="ds-image-info">
                  <span className="ds-image-model">{img.modelDisplayName}</span>
                  <span className="ds-image-cost">${img.costPerImage.toFixed(3)}</span>
                </div>

                {/* Actions */}
                <div className="ds-image-actions">
                  {img.status === 'pending' && (
                    <>
                      <button className="ds-btn ds-btn--approve ds-btn--small" onClick={() => approveImage(img.id)} disabled={!img.title.trim()} title={!img.title.trim() ? 'Add a title first' : 'Approve'}>&#10003;</button>
                      <button className="ds-btn ds-btn--small" onClick={() => downloadImage(img)}>&#8615;</button>
                      <button className="ds-btn ds-btn--reject ds-btn--small" onClick={() => rejectImage(img.id)}>&#10007;</button>
                    </>
                  )}
                  {img.status === 'approved' && (
                    <span className="ds-image-status ds-image-status--approved" onClick={() => updateImageField(img.id, 'status', 'pending')}>
                      &#10003; Approved
                    </span>
                  )}
                  {img.status === 'rejected' && (
                    <span className="ds-image-status ds-image-status--rejected" onClick={() => updateImageField(img.id, 'status', 'pending')}>
                      &#10007; Rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Save section */}
          {generatedImages.some((img) => img.status === 'approved') && (
            <div className="ds-save-section">
              <h3>Save {generatedImages.filter((img) => img.status === 'approved').length} Approved Design(s)</h3>
              <p className="ds-hint">Each design will be saved with its own title, type, lane, and tags. Make sure titles are filled in above.</p>
              <div className="ds-actions">
                <button className="ds-btn" onClick={() => setStep('input')}>Start Over</button>
                <button className="ds-btn ds-btn--primary" onClick={handleSaveDesigns} disabled={loading || generatedImages.filter((i) => i.status === 'approved' && !i.title.trim()).length > 0}>
                  {loading ? 'Saving...' : `Save ${generatedImages.filter((img) => img.status === 'approved').length} to Designs`}
                </button>
                {generatedImages.some((i) => i.status === 'approved' && !i.title.trim()) && (
                  <span className="ds-hint" style={{ color: '#f87171' }}>All approved designs need a title</span>
                )}
              </div>
            </div>
          )}

          {/* No approved — back button */}
          {!generatedImages.some((img) => img.status === 'approved') && generatedImages.every((img) => img.status !== 'pending') && (
            <div className="ds-actions">
              <button className="ds-btn" onClick={() => setStep('input')}>Start Over</button>
              <button className="ds-btn" onClick={() => setStep('prompt-review')}>Edit Prompt & Retry</button>
            </div>
          )}

          {/* Lightbox with navigation */}
          {lightboxIdx !== null && generatedImages[lightboxIdx] && (
            <div className="ds-lightbox" onClick={() => setLightboxIdx(null)}>
              <button className="ds-lightbox__close" onClick={() => setLightboxIdx(null)}>×</button>

              {generatedImages.length > 1 && lightboxIdx > 0 && (
                <button className="ds-lightbox__nav ds-lightbox__nav--prev" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1) }}>&#8249;</button>
              )}

              <img
                src={`data:${generatedImages[lightboxIdx].mimeType};base64,${generatedImages[lightboxIdx].base64}`}
                alt={generatedImages[lightboxIdx].title || `Design ${lightboxIdx + 1}`}
                className="ds-lightbox__img"
                onClick={(e) => e.stopPropagation()}
              />

              {generatedImages.length > 1 && lightboxIdx < generatedImages.length - 1 && (
                <button className="ds-lightbox__nav ds-lightbox__nav--next" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1) }}>&#8250;</button>
              )}

              <div className="ds-lightbox__info" onClick={(e) => e.stopPropagation()}>
                <span>{lightboxIdx + 1} / {generatedImages.length}</span>
                {generatedImages[lightboxIdx].title && <span> — {generatedImages[lightboxIdx].title}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
