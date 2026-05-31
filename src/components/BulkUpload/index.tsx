'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { toast } from '@payloadcms/ui'
import { FileUploader } from './FileUploader'
import { ProductPreview } from './ProductPreview'
import type { PreviewProduct } from './ProductPreview'
import { StepAccordion } from './StepAccordion'

import './index.scss'

type DbStatus = {
  count: number
  products: Array<{ id: string; title: string; slug: string; price?: number }>
}

type CacheVersion = {
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

type CacheStatus = {
  number: string
  productName: string
  hash: string
  cached: boolean
  versionCount: number
  versions: CacheVersion[]
  latestModel: string | null
  latestAnalyzedAt: string | null
  existsInMedia: boolean
  existsInStore: boolean
  existingProduct: {
    title: string
    slug: string
    price: number
  } | null
}

type ActiveStep = 1 | 2 | 3 | 4
type CompletedSteps = Set<number>

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const CATEGORY_MAP: Record<string, string> = {
  hats: 'Hats', hoodies: 'Hoodies', tshirts: 'T-Shirts', totes: 'Totes',
  jackets: 'Jackets', pants: 'Pants', accessories: 'Accessories', sets: 'Sets',
}

export const BulkUpload: React.FC = () => {
  const [activeStep, setActiveStep] = useState<ActiveStep>(1)
  const [completedSteps, setCompletedSteps] = useState<CompletedSteps>(new Set())
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null)
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [products, setProducts] = useState<PreviewProduct[]>([])
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<{
    created: number
    updated: number
    updatedTitles: string[]
    errors: string[]
  } | null>(null)
  const [folderSummary, setFolderSummary] = useState<Record<string, number>>({})
  const [productCount, setProductCount] = useState(0)
  const [cacheStatus, setCacheStatus] = useState<CacheStatus[]>([])
  const [selectedVersions, setSelectedVersions] = useState<Map<string, string>>(new Map())
  const [expandedCacheItem, setExpandedCacheItem] = useState<string | null>(null)
  const [compareView, setCompareView] = useState<'cards' | 'table'>('cards')
  const [comparePageIndex, setComparePageIndex] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [stepSummaries, setStepSummaries] = useState<Record<number, string>>({})

  const refreshStatus = useCallback(() => {
    fetch('/next/bulk-upload/status', { credentials: 'include' })
      .then((res) => res.json())
      .then(setDbStatus)
      .catch(() => toast.error('Failed to fetch product status'))
  }, [])

  useEffect(() => { refreshStatus() }, [refreshStatus])

  // ── Step helpers ──
  const completeStep = useCallback((step: number, summary: string) => {
    setCompletedSteps((prev) => new Set(prev).add(step))
    setStepSummaries((prev) => ({ ...prev, [step]: summary }))
  }, [])

  const goToStep = useCallback((step: ActiveStep) => {
    setActiveStep(step)
  }, [])

  const editStep = useCallback((step: ActiveStep) => {
    // Remove completion for this step and all subsequent steps
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      for (let i = step; i <= 4; i++) next.delete(i)
      return next
    })
    setActiveStep(step)
  }, [])

  // ── Step 1: File Selection ──
  const handleFilesSelected = useCallback(async (files: File[]) => {
    setSelectedFiles(files)
    setProducts([])
    setResults(null)
    setCacheStatus([])

    // Build summary
    const summary: Record<string, number> = {}
    const productNumbers = new Set<string>()
    const productFiles = new Map<string, { name: string; primaryFile: File }>()

    for (const file of files) {
      const path = ((file as any).webkitRelativePath || file.name).replace(/\\/g, '/').split('/')
      for (const part of path) {
        const lower = part.toLowerCase()
        if (CATEGORY_MAP[lower]) {
          summary[lower] = (summary[lower] || 0) + 1
          break
        }
      }
      const match = file.name.match(/^(\d+)-/)
      if (match) {
        const num = match[1]
        productNumbers.add(num)
        if (!productFiles.has(num) || file.name.includes('-logo')) {
          const name = file.name.replace(/\.[^.]+$/, '').replace(/^(\d+)-/, '').replace(/-(logo|graphic|text|raw)$/i, '')
          productFiles.set(num, { name, primaryFile: file })
        }
      }
    }

    setFolderSummary(summary)
    setProductCount(productNumbers.size)

    // Check cache
    try {
      const hashes: Array<{ hash: string; productName: string; number: string }> = []
      for (const [num, data] of productFiles) {
        const hash = await hashFile(data.primaryFile)
        hashes.push({ hash, productName: data.name, number: num })
      }

      const res = await fetch('/next/bulk-upload/check-cache', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashes }),
      })

      if (res.ok) {
        const data = await res.json()
        setCacheStatus(data.cacheStatus || [])
      }
    } catch { /* non-critical */ }

    const folderName = Object.keys(summary).join(', ') || 'folder'
    completeStep(1, `${folderName} — ${files.length} images, ${productNumbers.size} products`)
    goToStep(2)
  }, [completeStep, goToStep])

  // ── Step 2 → Step 3: Analyze ──
  const handleAnalyze = useCallback(async (forceReanalyze: boolean) => {
    if (selectedFiles.length === 0) return

    setAnalyzing(true)
    completeStep(2, forceReanalyze ? 'Re-analyzing all with AI' : `${cacheStatus.filter((c) => c.cached).length} cached, ${cacheStatus.filter((c) => !c.cached).length} new`)
    goToStep(3)

    try {
      const formData = new FormData()
      if (forceReanalyze) formData.append('forceReanalyze', 'true')

      selectedFiles.forEach((file, idx) => {
        formData.append(`file_${idx}`, file)
        formData.append(`path_${idx}`, (file as any).webkitRelativePath || file.name)
      })

      const res = await fetch('/next/bulk-upload/analyze', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data = await res.json()

      // Build thumbnails
      const fileByName = new Map<string, globalThis.File>()
      for (const file of selectedFiles) {
        fileByName.set(file.name, file)
        const relPath = ((file as any).webkitRelativePath || '').replace(/\\/g, '/')
        const parts = relPath.split('/')
        if (parts.length >= 2) fileByName.set(parts.slice(-2).join('/'), file)
      }

      // Check which products exist in DB (by slug matching against dbStatus)
      const existingSlugs = new Map<string, { id: string; title: string; slug: string; price?: number }>()
      if (dbStatus) {
        for (const p of dbStatus.products) {
          existingSlugs.set(p.slug, p)
        }
      }

      // Also check via image hashes from cacheStatus
      const existingByHash = new Map<string, { title: string; slug: string; price: number }>()
      for (const c of cacheStatus) {
        if (c.existsInStore && c.existingProduct) {
          existingByHash.set(c.number, c.existingProduct)
        }
      }

      const previewProducts: PreviewProduct[] = data.products.map((p: any) => {
        const imageFileNames: string[] = p.imageFileNames || []
        const allUrls: string[] = []
        let primaryUrl: string | undefined

        for (const fileName of imageFileNames) {
          const file = fileByName.get(fileName) || fileByName.get(fileName.split('/').pop() || '')
          if (file) {
            const url = URL.createObjectURL(file)
            allUrls.push(url)
            if (!primaryUrl || fileName.includes('-logo')) primaryUrl = url
          }
        }

        // Detect existing product
        const slugMatch = existingSlugs.get(p.slug)
        const hashMatch = existingByHash.get(p.number)
        const existing = slugMatch || (hashMatch ? {
          id: '', // We don't have ID from hash match
          title: hashMatch.title,
          slug: hashMatch.slug,
          price: hashMatch.price,
        } : null)

        // Compute changed fields if product exists
        let changedFields: string[] = []
        if (existing) {
          if (existing.title !== p.title) changedFields.push('title')
          if ((existing as any).price !== p.pricing?.finalPrice) changedFields.push('price')
          changedFields.push('description') // Always show as potentially changed since we can't compare richtext easily
        }

        return {
          ...p,
          included: true,
          thumbnailUrl: primaryUrl,
          allThumbnailUrls: allUrls,
          existingProduct: existing ? {
            id: (existing as any).id || '',
            title: existing.title,
            slug: existing.slug,
            price: (existing as any).price || 0,
            url: `/adm/collections/products/${(existing as any).id || ''}`,
          } : null,
          action: existing ? 'update' as const : 'create' as const,
          changedFields: existing ? changedFields : undefined,
        }
      })

      // Refresh cache and attach versions
      try {
        const hashCheckBody = cacheStatus.filter((c) => c.hash).map((c) => ({ hash: c.hash, productName: c.productName, number: c.number }))
        if (hashCheckBody.length > 0) {
          const cacheRes = await fetch('/next/bulk-upload/check-cache', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hashes: hashCheckBody }),
          })
          if (cacheRes.ok) {
            const cacheData = await cacheRes.json()
            const updatedStatus: CacheStatus[] = cacheData.cacheStatus || []
            setCacheStatus(updatedStatus)
            for (const s of updatedStatus) {
              if (s.versions && s.versions.length > 0) {
                const product = previewProducts.find((pp: any) => pp.number === s.number)
                if (product) {
                  product.cachedVersions = s.versions
                  const chosenId = selectedVersions.get(s.number)
                  if (chosenId) {
                    const chosen = s.versions.find((v) => v.id === chosenId)
                    if (chosen) {
                      product.description = chosen.analysis.description
                      product.visibleText = chosen.analysis.visibleText
                      product.designStyle = chosen.analysis.designStyle
                      product.features = chosen.analysis.features
                      product.metaDescription = chosen.analysis.description
                    }
                  }
                }
              }
            }
          }
        }
      } catch { /* non-critical */ }

      setProducts(previewProducts)
      setAnalyzing(false)
      toast.success(`Analyzed ${previewProducts.length} products`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
      setAnalyzing(false)
      editStep(2)
    }
  }, [selectedFiles, productCount, cacheStatus, selectedVersions, dbStatus, completeStep, goToStep, editStep])

  const handleUpdateProduct = useCallback(
    (index: number, updates: Partial<PreviewProduct>) => {
      setProducts((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], ...updates }
        if (updates.title) {
          next[index].slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          next[index].metaTitle = `${updates.title} | UglyLook`
        }
        if (updates.description) {
          next[index].metaDescription = updates.description
        }
        return next
      })
    },
    [],
  )

  // ── Step 3 → Step 4: Upload ──
  const handleUpload = useCallback(async () => {
    const included = products.filter((p) => p.included)
    if (included.length === 0) return

    completeStep(3, `${included.length} products ready`)
    goToStep(4)
    setUploadProgress({ current: 0, total: 0 })

    try {
      // Upload images with dedup
      const fileByName = new Map<string, globalThis.File>()
      for (const file of selectedFiles) fileByName.set(file.name, file)

      let totalImages = 0
      for (const p of included) totalImages += p.imageFileNames.length
      setUploadProgress({ current: 0, total: totalImages })

      // Pre-hash files
      const fileHashCache = new Map<string, string>()
      const filesToHash: Array<{ bare: string; file: globalThis.File }> = []
      for (const p of included) {
        for (const serverFileName of p.imageFileNames) {
          const bare = serverFileName.split('/').pop() || ''
          const file = fileByName.get(bare) || fileByName.get(serverFileName)
          if (file && !fileHashCache.has(bare)) filesToHash.push({ bare, file })
        }
      }
      await Promise.all(filesToHash.map(async ({ bare, file }) => {
        fileHashCache.set(bare, await hashFile(file))
      }))

      // Batch check existing media
      const allHashes = [...new Set(fileHashCache.values())]
      const existingMediaByHash = new Map<string, string>()
      for (let i = 0; i < allHashes.length; i += 50) {
        const batch = allHashes.slice(i, i + 50)
        try {
          const params = new URLSearchParams()
          params.set('where[imageHash][in]', batch.join(','))
          params.set('limit', String(batch.length))
          params.set('select[imageHash]', 'true')
          const checkRes = await fetch(`/api/media?${params}`, { credentials: 'include' })
          if (checkRes.ok) {
            const checkData = await checkRes.json()
            for (const doc of checkData.docs || []) {
              if (doc.imageHash) existingMediaByHash.set(doc.imageHash, doc.id)
            }
          }
        } catch { /* continue */ }
      }

      const mediaIdsByProduct = new Map<string, string[]>()
      let uploaded = 0
      let reusedCount = 0

      for (const p of included) {
        const mediaIds: string[] = []
        for (const serverFileName of p.imageFileNames) {
          const bare = serverFileName.split('/').pop() || ''
          const file = fileByName.get(bare) || fileByName.get(serverFileName)
          if (!file) { uploaded++; setUploadProgress({ current: uploaded, total: totalImages }); continue }

          const fileHash = fileHashCache.get(bare)
          const existingId = fileHash ? existingMediaByHash.get(fileHash) : null

          if (existingId) {
            mediaIds.push(existingId)
            reusedCount++
          } else {
            const mediaForm = new FormData()
            mediaForm.append('file', file)
            mediaForm.append('_payload', JSON.stringify({ alt: `${p.title} — ${bare}` }))
            const mediaRes = await fetch('/api/media', { method: 'POST', credentials: 'include', body: mediaForm })
            if (mediaRes.ok) {
              const mediaDoc = await mediaRes.json()
              mediaIds.push(mediaDoc.doc.id)
              if (fileHash) existingMediaByHash.set(fileHash, mediaDoc.doc.id)
            }
          }
          uploaded++
          setUploadProgress({ current: uploaded, total: totalImages })
        }
        mediaIdsByProduct.set(p.number, mediaIds)
      }

      if (reusedCount > 0) toast.info(`Reused ${reusedCount} existing images from media library.`)

      // Send confirm
      const confirmPayload = {
        products: products.map((p) => ({
          number: p.number,
          title: p.title,
          slug: p.slug,
          description: p.description,
          category: p.category,
          finalPrice: p.pricing.finalPrice,
          hasSizeVariants: p.hasSizeVariants,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          included: p.included,
          mediaIds: mediaIdsByProduct.get(p.number) || [],
          action: p.action,
          existingProductId: p.existingProduct?.id || null,
        })),
        replaceExisting,
      }

      const res = await fetch('/next/bulk-upload/confirm', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmPayload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      const data = await res.json()
      setResults(data)

      if (data.errors.length === 0) {
        toast.success(`Created ${data.created}, Updated ${data.updated} products!`)
      } else {
        toast.info(`Created ${data.created}, Updated ${data.updated} with ${data.errors.length} errors`)
      }

      refreshStatus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      editStep(3)
    }
  }, [products, selectedFiles, replaceExisting, refreshStatus, completeStep, goToStep, editStep])

  const handleReset = useCallback(() => {
    products.forEach((p) => { if (p.thumbnailUrl) URL.revokeObjectURL(p.thumbnailUrl) })
    setActiveStep(1)
    setCompletedSteps(new Set())
    setStepSummaries({})
    setSelectedFiles([])
    setProducts([])
    setResults(null)
    setFolderSummary({})
    setProductCount(0)
    setReplaceExisting(false)
    setCacheStatus([])
    setSelectedVersions(new Map())
    setExpandedCacheItem(null)
    setComparePageIndex(0)
    setAnalyzing(false)
    refreshStatus()
  }, [products, refreshStatus])

  const cachedCount = cacheStatus.filter((c) => c.cached).length
  const newCount = cacheStatus.length - cachedCount

  const stepStatus = (step: number) => {
    if (activeStep === step) return 'active' as const
    if (completedSteps.has(step)) return 'completed' as const
    return 'pending' as const
  }

  return (
    <div className="bulk-upload">
      <div className="bulk-upload__header">
        <h3>Bulk Product Upload</h3>
        <p>Upload a product image folder, analyze with AI, review, and push to the store.</p>
      </div>

      {dbStatus && (
        <div className="bulk-upload__status">
          <div className="bulk-upload__status-count">
            <strong>{dbStatus.count}</strong> products currently in database
          </div>
          {dbStatus.count > 0 && (
            <details className="bulk-upload__status-details">
              <summary>View existing products</summary>
              <ul>
                {dbStatus.products.map((p) => (
                  <li key={p.id}>{p.title} <span className="bulk-upload__slug">({p.slug})</span></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* ═══ STEP 1: Select Folder ═══ */}
      <StepAccordion
        step={1}
        title="Select Product Folder"
        summary={stepSummaries[1]}
        status={stepStatus(1)}
        onEdit={() => editStep(1)}
      >
        <FileUploader onFilesSelected={handleFilesSelected} disabled={false} />
      </StepAccordion>

      {/* ═══ STEP 2: Review & Configure ═══ */}
      <StepAccordion
        step={2}
        title="Review & Configure"
        summary={stepSummaries[2]}
        status={stepStatus(2)}
        onEdit={() => editStep(2)}
        onGoBack={() => editStep(1)}
      >
        <div className="bulk-upload__confirm">
          <div className="bulk-upload__confirm-summary">
            <div className="bulk-upload__confirm-stat"><strong>{selectedFiles.length}</strong><span>images</span></div>
            <div className="bulk-upload__confirm-stat"><strong>{productCount}</strong><span>products</span></div>
            <div className="bulk-upload__confirm-stat"><strong>{Object.keys(folderSummary).length}</strong><span>categories</span></div>
            {dbStatus && <div className="bulk-upload__confirm-stat"><strong>{dbStatus.count}</strong><span>in DB</span></div>}
          </div>

          <div className="bulk-upload__confirm-section">
            <h5>Categories &amp; Products</h5>
            <div className="bulk-upload__confirm-categories">
              {Object.entries(folderSummary).sort(([a], [b]) => a.localeCompare(b)).map(([folder, count]) => {
                const productsInFolder = new Set<string>()
                for (const file of selectedFiles) {
                  const path = ((file as any).webkitRelativePath || '').toLowerCase()
                  if (path.includes(`/${folder}/`)) {
                    const match = file.name.match(/^(\d+)-/)
                    if (match) productsInFolder.add(match[1])
                  }
                }
                return (
                  <div key={folder} className="bulk-upload__confirm-cat-row">
                    <span className="bulk-upload__category-tag">{CATEGORY_MAP[folder] || folder}</span>
                    <span>{productsInFolder.size} products</span>
                    <span className="bulk-upload__slug">{count} images</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Store Status */}
          {cacheStatus.some((c) => c.existsInStore) && (
            <div className="bulk-upload__confirm-section">
              <h5>Store Status</h5>
              <div className="bulk-upload__cache-summary">
                <span className="bulk-upload__cache-badge bulk-upload__cache-badge--exists">{cacheStatus.filter((c) => c.existsInStore).length} already in store</span>
                {cacheStatus.some((c) => !c.existsInStore) && <span className="bulk-upload__cache-badge bulk-upload__cache-badge--miss">{cacheStatus.filter((c) => !c.existsInStore).length} new</span>}
              </div>
              <div className="bulk-upload__cache-list">
                {cacheStatus.filter((c) => c.existsInStore).map((c) => (
                  <div key={`store-${c.number}`} className="bulk-upload__cache-item">
                    <span className="bulk-upload__cache-dot bulk-upload__cache-dot--exists" />
                    <span className="bulk-upload__cache-name">{c.existingProduct?.title || c.productName}</span>
                    <span className="bulk-upload__cache-info">published — ${((c.existingProduct?.price || 0) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Cache */}
          {cacheStatus.length > 0 && (
            <div className="bulk-upload__confirm-section">
              <h5>AI Analysis Cache</h5>
              <div className="bulk-upload__cache-summary">
                {cachedCount > 0 && <span className="bulk-upload__cache-badge bulk-upload__cache-badge--hit">{cachedCount} cached</span>}
                {newCount > 0 && <span className="bulk-upload__cache-badge bulk-upload__cache-badge--miss">{newCount} new</span>}
              </div>
              <div className="bulk-upload__cache-list">
                {cacheStatus.map((c) => (
                  <div key={c.number} className="bulk-upload__cache-item-wrap">
                    <div className="bulk-upload__cache-item">
                      <span className={`bulk-upload__cache-dot ${c.cached ? 'bulk-upload__cache-dot--hit' : 'bulk-upload__cache-dot--miss'}`} />
                      <span className="bulk-upload__cache-name">{c.productName}</span>
                      {c.cached ? (
                        <>
                          <span className="bulk-upload__cache-info">
                            {c.versionCount} {c.versionCount === 1 ? 'version' : 'versions'} — {c.latestModel} — {c.latestAnalyzedAt ? timeAgo(c.latestAnalyzedAt) : ''}
                          </span>
                          {c.versionCount > 1 && (
                            <button className="bulk-upload__cache-compare-btn" onClick={() => { setExpandedCacheItem(expandedCacheItem === c.number ? null : c.number); setComparePageIndex(0) }}>
                              {expandedCacheItem === c.number ? 'Hide' : 'Compare'}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="bulk-upload__cache-info bulk-upload__cache-info--new">new — will call Gemini</span>
                      )}
                    </div>
                    {/* Version comparison */}
                    {expandedCacheItem === c.number && c.versions && c.versions.length > 1 && (() => {
                      const versions = c.versions
                      const selectedId = selectedVersions.get(c.number) || versions[0]?.id
                      const fields = ['Description', 'Visible Text', 'Style', 'Features', 'Price Adj.'] as const
                      const getField = (v: typeof versions[0], field: typeof fields[number]) => {
                        switch (field) {
                          case 'Description': return v.analysis.description
                          case 'Visible Text': return v.analysis.visibleText || '—'
                          case 'Style': return v.analysis.designStyle
                          case 'Features': return v.analysis.features?.join(', ') || '—'
                          case 'Price Adj.': return `${v.analysis.suggestedPriceAdjustment > 0 ? '+' : ''}${v.analysis.suggestedPriceAdjustment} — ${v.analysis.priceReason}`
                        }
                      }
                      const useTable = compareView === 'table' && versions.length >= 3

                      return (
                        <div className="bulk-upload__cache-versions-wrap">
                          {versions.length >= 3 && (
                            <div className="bulk-upload__cache-versions-toggle">
                              <button className={compareView === 'cards' ? 'active' : ''} onClick={() => setCompareView('cards')}>Cards</button>
                              <button className={compareView === 'table' ? 'active' : ''} onClick={() => setCompareView('table')}>Table</button>
                            </div>
                          )}

                          {!useTable && (() => {
                            const pageSize = 2
                            const totalPages = Math.ceil(versions.length / pageSize)
                            const page = Math.min(comparePageIndex, totalPages - 1)
                            const visible = versions.slice(page * pageSize, page * pageSize + pageSize)
                            return (
                              <>
                                {totalPages > 1 && (
                                  <div className="bulk-upload__cache-versions-nav">
                                    <button disabled={page === 0} onClick={() => setComparePageIndex(page - 1)}>←</button>
                                    <span>v{visible[0]?.version}{visible[1] ? `–v${visible[1].version}` : ''} of {versions.length}</span>
                                    <button disabled={page >= totalPages - 1} onClick={() => setComparePageIndex(page + 1)}>→</button>
                                  </div>
                                )}
                                <div className="bulk-upload__cache-versions">
                                  {visible.map((v) => (
                                    <div key={v.id} className={`bulk-upload__cache-version-card ${selectedId === v.id ? 'bulk-upload__cache-version-card--selected' : ''}`}>
                                      <div className="bulk-upload__cache-version-header">
                                        <span className="bulk-upload__cache-version-badge">v{v.version}</span>
                                        <span>{v.model}</span>
                                        <span>{timeAgo(v.createdAt)}</span>
                                        <button className={`bulk-upload__cache-version-select ${selectedId === v.id ? 'bulk-upload__cache-version-select--active' : ''}`} onClick={() => setSelectedVersions((prev) => new Map(prev).set(c.number, v.id))}>
                                          {selectedId === v.id ? '● Selected' : 'Use this'}
                                        </button>
                                      </div>
                                      <div className="bulk-upload__cache-version-body">
                                        {fields.map((field) => (
                                          <div key={field} className="bulk-upload__cache-version-field">
                                            <span className="bulk-upload__cache-version-label">{field}</span>
                                            <p>{getField(v, field)}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )
                          })()}

                          {useTable && (
                            <div className="bulk-upload__cache-versions-table-wrap">
                              <table className="bulk-upload__cache-versions-table">
                                <thead>
                                  <tr>
                                    <th></th>
                                    {versions.map((v) => (
                                      <th key={v.id} className={selectedId === v.id ? 'bulk-upload__cache-versions-table--selected' : ''}>
                                        <span className="bulk-upload__cache-version-badge">v{v.version}</span>
                                        <span>{timeAgo(v.createdAt)}</span>
                                        <button className={`bulk-upload__cache-version-select ${selectedId === v.id ? 'bulk-upload__cache-version-select--active' : ''}`} onClick={() => setSelectedVersions((prev) => new Map(prev).set(c.number, v.id))}>
                                          {selectedId === v.id ? '● Selected' : 'Use'}
                                        </button>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {fields.map((field) => (
                                    <tr key={field}>
                                      <td className="bulk-upload__cache-versions-table-label">{field}</td>
                                      {versions.map((v) => (
                                        <td key={v.id} className={selectedId === v.id ? 'bulk-upload__cache-versions-table--selected' : ''}>{getField(v, field)}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="bulk-upload__toggle">
            <input type="checkbox" checked={replaceExisting} onChange={(e) => setReplaceExisting(e.target.checked)} />
            <span>Replace existing products <small>(deletes all current products, variants, and variant options)</small></span>
          </label>

          <div className="bulk-upload__confirm-actions">
            {cachedCount > 0 && cachedCount === cacheStatus.length ? (
              <>
                <button className="bulk-upload__btn bulk-upload__btn--primary" onClick={() => handleAnalyze(false)}>
                  Use Cached Analysis ({cachedCount} products — 0 AI calls)
                </button>
                <button className="bulk-upload__btn bulk-upload__btn--secondary" onClick={() => { if (window.confirm(`This will make ${cacheStatus.length} AI API calls.\n\nProceed?`)) handleAnalyze(true) }}>
                  Force Re-analyze All ({cacheStatus.length} AI calls)
                </button>
              </>
            ) : cachedCount > 0 ? (
              <>
                <button className="bulk-upload__btn bulk-upload__btn--primary" onClick={() => handleAnalyze(false)}>
                  Use Cache + Analyze New ({newCount} AI {newCount === 1 ? 'call' : 'calls'})
                </button>
                <button className="bulk-upload__btn bulk-upload__btn--secondary" onClick={() => { if (window.confirm(`This will make ${cacheStatus.length} AI API calls.\n\nProceed?`)) handleAnalyze(true) }}>
                  Force Re-analyze All ({cacheStatus.length} AI calls)
                </button>
              </>
            ) : (
              <button className="bulk-upload__btn bulk-upload__btn--primary" onClick={() => handleAnalyze(false)}>
                Analyze {productCount} Products with AI
              </button>
            )}
          </div>
        </div>
      </StepAccordion>

      {/* ═══ STEP 3: Product Preview ═══ */}
      <StepAccordion
        step={3}
        title="Product Preview"
        summary={stepSummaries[3]}
        status={stepStatus(3)}
        onEdit={() => editStep(3)}
        onGoBack={() => editStep(2)}
      >
        {analyzing ? (
          <div className="bulk-upload__analyzing">
            <div className="bulk-upload__spinner" />
            <h4>Analyzing {productCount} products...</h4>
            <p>{cachedCount > 0 ? `${cachedCount} from cache, ${newCount} via Gemini.` : `Sending to Gemini Flash.`}</p>
            <p className="bulk-upload__analyzing-hint">Do not close this page.</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <ProductPreview
              products={products}
              onUpdate={handleUpdateProduct}
              onUpload={handleUpload}
              uploading={false}
            />
            <div className="bulk-upload__preview-cancel">
              <button className="bulk-upload__btn" onClick={handleReset}>Cancel &amp; Start Over</button>
            </div>
          </>
        ) : null}
      </StepAccordion>

      {/* ═══ STEP 4: Upload & Results ═══ */}
      <StepAccordion
        step={4}
        title="Upload & Results"
        summary={results ? `${results.created} created, ${results.updated} updated` : undefined}
        status={stepStatus(4)}
      >
        {!results ? (
          <div className="bulk-upload__uploading">
            <div className="bulk-upload__spinner" />
            <h4>
              {uploadProgress.total > 0
                ? `Processing images: ${uploadProgress.current} / ${uploadProgress.total}`
                : 'Preparing upload...'}
            </h4>
            {uploadProgress.total > 0 && (
              <div className="bulk-upload__progress">
                <div className="bulk-upload__progress-bar">
                  <div className="bulk-upload__progress-fill" style={{ width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` }} />
                </div>
                <div className="bulk-upload__progress-percent">{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</div>
              </div>
            )}
            <p>{uploadProgress.current < uploadProgress.total ? 'Checking for duplicates and uploading new images...' : 'Creating products, variants, and linking...'}</p>
            <p className="bulk-upload__analyzing-hint">Do not close this page.</p>
          </div>
        ) : (
          <div className="bulk-upload__results">
            <div className="bulk-upload__results-summary">
              <h4>Upload Complete</h4>
              <p>
                <strong>{results.created}</strong> created,{' '}
                <strong>{results.updated}</strong> updated
                {results.errors.length > 0 && <>, <strong>{results.errors.length}</strong> errors</>}
              </p>
              {results.updatedTitles && results.updatedTitles.length > 0 && (
                <p style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>
                  Updated: {results.updatedTitles.join(', ')}
                </p>
              )}
            </div>
            {results.errors.length > 0 && (
              <div className="bulk-upload__results-errors">
                <h5>Errors:</h5>
                <ul>{results.errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
              </div>
            )}
            <div className="bulk-upload__results-actions">
              <a href="/adm/collections/products" className="bulk-upload__btn">View Products</a>
              <button className="bulk-upload__btn bulk-upload__btn--primary" onClick={handleReset}>Upload Another Batch</button>
            </div>
          </div>
        )}
      </StepAccordion>
    </div>
  )
}
