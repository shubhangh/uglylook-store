'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom'
import './photo-studio.css'

// ── Types ──

type ImageModel = {
  id: string
  modelId: string
  displayName: string
  provider?: string
  costPerImage?: number
  isDefault?: boolean
}

type GeneratedPhoto = {
  id: string
  base64: string
  mimeType: string
  prompt: string
  model: string
  modelDisplayName: string
  costPerImage: number
  status: 'pending' | 'approved' | 'rejected'
  title: string
  ulTitle: string
}

type ProgressEntry = {
  status: 'waiting' | 'generating' | 'done' | 'error'
  count: number
  completed: number
  error?: string
}

type Preset = {
  id: string
  name: string
  photoType?: string
  background?: string
  mood?: string
  environment?: string
}

type StepId = 'configure' | 'prompt' | 'generate' | 'review'

type Option = { value: string; label: string }

type ProductOption = {
  id: string
  title: string
  slug: string
  imageUrl?: string
  designImageUrl?: string
  designTitle?: string
  rawImageUrl?: string
}

// ── Constants ──

const STEPS: { id: StepId; num: number; title: string }[] = [
  { id: 'configure', num: 1, title: 'Configure' },
  { id: 'prompt', num: 2, title: 'Prompt' },
  { id: 'generate', num: 3, title: 'Generate' },
  { id: 'review', num: 4, title: 'Review & Approve' },
]

const MODEL_TYPES: Option[] = [
  { value: 'boy', label: 'Male' },
  { value: 'girl', label: 'Female' },
  { value: 'kid-boy', label: 'Kid Boy' },
  { value: 'kid-girl', label: 'Kid Girl' },
]

const ETHNICITY_OPTIONS: Option[] = [
  { value: 'any', label: 'Any / AI Pick' },
  { value: 'south-asian', label: 'South Asian' },
  { value: 'east-asian', label: 'East Asian' },
  { value: 'southeast-asian', label: 'Southeast Asian' },
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White / Caucasian' },
  { value: 'latino', label: 'Latino / Hispanic' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
  { value: 'mixed', label: 'Mixed Race' },
]

const AGE_RANGE_OPTIONS: Option[] = [
  { value: 'custom', label: 'Custom Age' },
  { value: '8-12', label: '8–12' },
  { value: '13-17', label: '13–17' },
  { value: '18-22', label: '18–22' },
  { value: '22-26', label: '22–26' },
  { value: '26-30', label: '26–30' },
  { value: '30-35', label: '30–35' },
]

const ANGLE_OPTIONS = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
  { value: 'three-quarter', label: '3/4 View' },
  { value: 'cool', label: 'Cool Angle' },
  { value: 'genz-vibe', label: 'GenZ Vibe' },
  { value: 'close-up', label: 'Close-Up' },
  { value: 'full-body', label: 'Full Body' },
]

type AIModelPersona = {
  id: string
  name: string
  gender: string
  ethnicity: string
  ageRange: string
  build: string
  hairStyle: string
  distinguishingFeatures?: string
  promptDescription?: string
  referenceImageUrl?: string
}

const DEFAULT_ANGLES = [
  { angle: 'front', count: 1 },
  { angle: 'side', count: 1 },
  { angle: 'cool', count: 1 },
  { angle: 'genz-vibe', count: 1 },
]

// ── Helpers ──

function downloadBase64(base64: string, mimeType: string, filename: string) {
  const byteStr = atob(base64)
  const bytes = new Uint8Array(byteStr.length)
  for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i)
  const blob = new Blob([bytes], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main Component ──

export const PhotoStudio: React.FC = () => {
  // ── Dropdown data from API ──
  const [photoTypes, setPhotoTypes] = useState<Option[]>([])
  const [backgrounds, setBackgrounds] = useState<Option[]>([])
  const [moods, setMoods] = useState<Option[]>([])
  const [detailLevels, setDetailLevels] = useState<Option[]>([])
  const [imageModels, setImageModels] = useState<ImageModel[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [promptModels, setPromptModels] = useState<Option[]>([])

  // ── Step 1: Configure state ──
  const [photoType, setPhotoType] = useState('')
  const [background, setBackground] = useState('near-black')
  const [hexColor, setHexColor] = useState('#5A6242')
  const [mood, setMood] = useState('neutral')
  const [brief, setBrief] = useState('')
  const [environment, setEnvironment] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [modelType, setModelType] = useState('boy')
  const [ethnicity, setEthnicity] = useState('any')
  const [ageRange, setAgeRange] = useState('22-26')
  const [customAge, setCustomAge] = useState(24)
  const [modelPersonas, setModelPersonas] = useState<AIModelPersona[]>([])
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('') // '' = custom/manual

  // ── Product + Context ──
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<ProductOption[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null)
  const [productSearchLoading, setProductSearchLoading] = useState(false)
  // Override URLs (admin can manually change)
  const [overrideProductImg, setOverrideProductImg] = useState('')
  const [overrideDesignImg, setOverrideDesignImg] = useState('')
  const [overrideRawImg, setOverrideRawImg] = useState('')

  // ── Angle config ──
  const [sameModel, setSameModel] = useState(true)
  const [angleConfig, setAngleConfig] = useState<{ angle: string; count: number }[]>(DEFAULT_ANGLES)

  // ── Step 2: Prompt state ──
  const [promptModelId, setPromptModelId] = useState('claude-haiku-4-5-20251001')
  const [detailLevel, setDetailLevel] = useState('medium')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [writeOwn, setWriteOwn] = useState(false)

  // ── Step 3: Generate state ──
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set())
  // Per-model image count: { [modelId]: count }
  const [perModelCount, setPerModelCount] = useState<Record<string, number>>({})
  const [modelProgress, setModelProgress] = useState<Record<string, ProgressEntry>>({})

  // ── Step 4: Review state ──
  const [generatedPhotos, setGeneratedPhotos] = useState<GeneratedPhoto[]>([])
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [titlesLoading, setTitlesLoading] = useState(false)

  // ── Flow state ──
  const [activeStep, setActiveStep] = useState<StepId>('configure')
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null)

  // ── Derived ──
  const totalImages = angleConfig.reduce((sum, a) => sum + a.count, 0)

  const getModelId = (model: ImageModel): string => model.modelId || model.id

  const getImagesForModel = (modelId: string): number => {
    return perModelCount[modelId] ?? totalImages
  }

  const getCostPerImage = (modelId: string): number => {
    const model = imageModels.find((m) => getModelId(m) === modelId)
    return model?.costPerImage ?? 0.075
  }

  const getModelDisplayName = (modelId: string): string => {
    const model = imageModels.find((m) => getModelId(m) === modelId)
    return model?.displayName || modelId
  }

  // Providers that support image-to-image reference
  const REF_SUPPORTED_PROVIDERS = new Set(['gemini'])

  const supportsImageRef = (modelId: string): boolean => {
    const model = imageModels.find((m) => getModelId(m) === modelId)
    return REF_SUPPORTED_PROVIDERS.has(model?.provider || '')
  }

  const hasActiveReference = !!selectedPersonaId &&
    !!modelPersonas.find((p) => p.id === selectedPersonaId)?.referenceImageUrl

  const estimatedTotalCost = (): number => {
    return Array.from(selectedModelIds).reduce(
      (sum, id) => sum + getCostPerImage(id) * getImagesForModel(id),
      0,
    )
  }

  const totalGeneratedCount = (): number => {
    return Array.from(selectedModelIds).reduce((sum, id) => sum + getImagesForModel(id), 0)
  }

  // Group photos by model for review
  const photosByModel = useMemo(() => {
    const grouped: Record<string, GeneratedPhoto[]> = {}
    for (const photo of generatedPhotos) {
      const key = photo.model
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(photo)
    }
    return grouped
  }, [generatedPhotos])

  const pendingPhotos = generatedPhotos.filter((p) => p.status === 'pending')
  const approvedPhotos = generatedPhotos.filter((p) => p.status === 'approved')
  const bulkApprovable = pendingPhotos.filter((p) => p.title.trim())

  // ── Load initial data ──

  useEffect(() => {
    loadDropdownData()
    loadImageModels()
    loadPresets()
    loadModelPersonas()
  }, [])

  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [pollInterval])

  const toOptions = (arr: any[]): Option[] =>
    arr.map((item) =>
      typeof item === 'string' ? { value: item, label: item } : { value: item.value, label: item.label },
    )

  const loadDropdownData = async () => {
    try {
      const res = await fetch('/next/photo-prompt', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.photoTypes?.length) setPhotoTypes(toOptions(data.photoTypes))
        if (data.backgrounds?.length) setBackgrounds(toOptions(data.backgrounds))
        if (data.moods?.length) setMoods(toOptions(data.moods))
        if (data.detailLevels?.length) setDetailLevels(toOptions(data.detailLevels))
        if (data.promptModels?.length) setPromptModels(toOptions(data.promptModels))
        const types = toOptions(data.photoTypes || [])
        if (types.length && !photoType) setPhotoType(types[0].value)
      }
    } catch { /* non-critical */ }
  }

  const loadImageModels = async () => {
    try {
      const res = await fetch('/next/photo-generate', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const models: ImageModel[] = []
        if (Array.isArray(data.imageModels)) {
          models.push(...data.imageModels)
        } else if (data.imageModels && typeof data.imageModels === 'object') {
          for (const group of Object.values(data.imageModels)) {
            if (Array.isArray(group)) models.push(...group)
          }
        }
        setImageModels(models)
        const defaultModel = models.find((m) => m.isDefault)
        if (defaultModel) {
          setSelectedModelIds(new Set([defaultModel.modelId || defaultModel.id]))
        } else if (models.length > 0) {
          setSelectedModelIds(new Set([models[0].modelId || models[0].id]))
        }
      }
    } catch { /* non-critical */ }
  }

  const loadPresets = async () => {
    try {
      const res = await fetch('/api/photo-presets?where[isActive][equals]=true&limit=20', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setPresets(data.docs || [])
      }
    } catch { /* non-critical */ }
  }

  const loadModelPersonas = async () => {
    try {
      const res = await fetch('/api/ai-models?where[isActive][equals]=true&limit=50&sort=name&depth=2', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setModelPersonas(
          (data.docs || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            gender: d.gender || 'male',
            ethnicity: d.ethnicity || 'any',
            ageRange: d.ageRange || '22-26',
            build: d.build || '',
            hairStyle: d.hairStyle || '',
            distinguishingFeatures: d.distinguishingFeatures || '',
            promptDescription: d.promptDescription || '',
            referenceImageUrl: d.referenceImages?.[0]?.image?.url || d.referenceImages?.[0]?.image || undefined,
          })),
        )
      }
    } catch { /* non-critical */ }
  }

  const applyPersona = (personaId: string) => {
    setSelectedPersonaId(personaId)
    if (!personaId) return // "Custom" selected — keep manual fields
    const persona = modelPersonas.find((p) => p.id === personaId)
    if (!persona) return
    setModelType(persona.gender === 'female' ? 'girl' : 'boy')
    setEthnicity(persona.ethnicity)
    setAgeRange(persona.ageRange.includes('-') ? persona.ageRange : 'custom')
    if (!persona.ageRange.includes('-')) setCustomAge(parseInt(persona.ageRange) || 24)

    // If persona has reference images, auto-select only ref-supported models
    if (persona.referenceImageUrl) {
      const refModels = imageModels.filter((m) => REF_SUPPORTED_PROVIDERS.has(m.provider || ''))
      if (refModels.length > 0) {
        setSelectedModelIds(new Set(refModels.map((m) => getModelId(m))))
      }
    }
  }

  // ── Product search ──

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProductResults([])
      return
    }
    setProductSearchLoading(true)
    try {
      const res = await fetch(
        `/api/products?where[title][like]=${encodeURIComponent(query)}&limit=8&depth=2&select[title]=true&select[slug]=true&select[heroImage]=true&select[gallery]=true&select[design]=true&select[printFile]=true&select[catalogImages]=true`,
        { credentials: 'include' },
      )
      if (res.ok) {
        const data = await res.json()
        setProductResults(
          (data.docs || []).map((d: any) => {
            // Product image (heroImage or gallery[0])
            const heroImg = d.heroImage && typeof d.heroImage === 'object' ? d.heroImage?.url : undefined
            const galleryImg = d.gallery?.[0]?.image
            const imageUrl = heroImg || (typeof galleryImg === 'object' ? galleryImg?.url : undefined)

            // Design image (from linked design)
            let designImageUrl: string | undefined
            let designTitle: string | undefined
            if (d.design && typeof d.design === 'object') {
              designTitle = d.design.title
              if (d.design.designFile && typeof d.design.designFile === 'object') {
                designImageUrl = d.design.designFile.url
              } else if (d.design.thumbnail && typeof d.design.thumbnail === 'object') {
                designImageUrl = d.design.thumbnail.url
              }
            }

            // Raw/catalog image (from catalogImages array or printFile as fallback)
            let rawImageUrl: string | undefined
            if (d.catalogImages?.length) {
              const firstCatalog = d.catalogImages[0]?.image
              if (firstCatalog && typeof firstCatalog === 'object') {
                rawImageUrl = firstCatalog.url
              }
            }
            if (!rawImageUrl && d.printFile && typeof d.printFile === 'object') {
              rawImageUrl = d.printFile.url
            }

            return {
              id: d.id,
              title: d.title,
              slug: d.slug,
              imageUrl,
              designImageUrl,
              designTitle,
              rawImageUrl,
            }
          }),
        )
      }
    } catch { /* */ }
    setProductSearchLoading(false)
  }, [])

  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([])
      return
    }
    const timer = setTimeout(() => searchProducts(productSearch), 300)
    return () => clearTimeout(timer)
  }, [productSearch, searchProducts])

  // ── When product is selected, reset overrides ──

  const selectProduct = (p: ProductOption) => {
    setSelectedProduct(p)
    setProductSearch('')
    setProductResults([])
    setOverrideProductImg('')
    setOverrideDesignImg('')
    setOverrideRawImg('')
  }

  const clearProduct = () => {
    setSelectedProduct(null)
    setProductSearch('')
    setOverrideProductImg('')
    setOverrideDesignImg('')
    setOverrideRawImg('')
  }

  // Resolved image URLs (override > auto-detected)
  const resolvedProductImg = overrideProductImg || selectedProduct?.imageUrl || ''
  const resolvedDesignImg = overrideDesignImg || selectedProduct?.designImageUrl || ''
  const resolvedRawImg = overrideRawImg || selectedProduct?.rawImageUrl || ''

  // ── Angle helpers ──

  const toggleAngle = (angleValue: string) => {
    setAngleConfig((prev) => {
      const exists = prev.find((a) => a.angle === angleValue)
      if (exists) return prev.filter((a) => a.angle !== angleValue)
      return [...prev, { angle: angleValue, count: 1 }]
    })
  }

  const setAngleCount = (angleValue: string, count: number) => {
    setAngleConfig((prev) =>
      prev.map((a) => (a.angle === angleValue ? { ...a, count: Math.max(1, Math.min(4, count)) } : a)),
    )
  }

  // ── Step navigation ──

  const goToStep = useCallback((stepId: StepId) => {
    setActiveStep(stepId)
    setError(null)
  }, [])

  const completeStep = useCallback((stepId: StepId) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]))
  }, [])

  const getStepSummary = (stepId: StepId): string => {
    switch (stepId) {
      case 'configure':
        if (!completedSteps.has('configure')) return ''
        return `${photoType || 'photo'} / ${background} / ${mood}${selectedProduct ? ` / ${selectedProduct.title}` : ''} / ${totalImages} shots`
      case 'prompt':
        if (!completedSteps.has('prompt')) return ''
        return generatedPrompt ? `${generatedPrompt.length} chars` : 'no prompt'
      case 'generate':
        if (!completedSteps.has('generate')) return ''
        return `${generatedPhotos.length} photos`
      case 'review': {
        const approved = generatedPhotos.filter((p) => p.status === 'approved').length
        if (!approved) return ''
        return `${approved} approved`
      }
      default:
        return ''
    }
  }

  const isStepAccessible = (stepId: StepId): boolean => {
    const stepIndex = STEPS.findIndex((s) => s.id === stepId)
    if (stepIndex === 0) return true
    const prevStepId = STEPS[stepIndex - 1].id
    return completedSteps.has(prevStepId)
  }

  // ── Apply preset ──

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId)
      if (!preset) return
      if (preset.photoType) setPhotoType(preset.photoType)
      if (preset.background) setBackground(preset.background)
      if (preset.mood) setMood(preset.mood)
      if (preset.environment) setEnvironment(preset.environment)
    },
    [presets],
  )

  // ── Step 1 → Step 2 ──

  const handleConfigureDone = () => {
    if (!photoType) {
      setError('Please select a photo type.')
      return
    }
    completeStep('configure')
    goToStep('prompt')
  }

  // ── Step 2: Generate Prompt ──

  const handleGeneratePrompt = async () => {
    setLoading(true)
    setError(null)
    try {
      const angleDirective =
        angleConfig.length > 0
          ? `\n\nSHOT LIST (${totalImages} total images):\n${angleConfig
              .map((a) => {
                const label = ANGLE_OPTIONS.find((o) => o.value === a.angle)?.label || a.angle
                return `- ${a.count}x ${label} angle`
              })
              .join('\n')}${sameModel ? '\nIMPORTANT: Use the SAME model (consistent appearance) across all shots.' : '\nUse DIFFERENT models for variety.'}`
          : ''

      const body: Record<string, any> = {
        photoType,
        brief: (brief || '') + angleDirective,
        background,
        mood,
        detailLevel,
        modelId: promptModelId,
        modelType,
        ethnicity,
        age: ageRange === 'custom' ? String(customAge) : ageRange,
        personaId: selectedPersonaId || undefined,
        personaPrompt: selectedPersonaId
          ? modelPersonas.find((p) => p.id === selectedPersonaId)?.promptDescription || undefined
          : undefined,
      }
      if (background === 'hex-color') body.hexColor = hexColor
      if (selectedProduct) {
        body.productIds = [selectedProduct.id]
        body.imageRefs = {
          productImageUrl: resolvedProductImg || undefined,
          designImageUrl: resolvedDesignImg || undefined,
          rawImageUrl: resolvedRawImg || undefined,
        }
      }
      if (environment && photoType === 'editorial') body.environment = environment
      if (selectedPresetId) body.presetId = selectedPresetId

      const res = await fetch('/next/photo-prompt', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Prompt generation failed')

      setGeneratedPrompt(data.prompt || '')
      completeStep('prompt')
      goToStep('generate')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePromptDone = () => {
    if (!generatedPrompt.trim()) {
      setError('Prompt cannot be empty.')
      return
    }
    completeStep('prompt')
    goToStep('generate')
  }

  // ── Step 3: Generate Images ──

  const toggleModelSelection = (modelId: string) => {
    setSelectedModelIds((prev) => {
      const next = new Set(prev)
      if (next.has(modelId)) next.delete(modelId)
      else next.add(modelId)
      return next
    })
  }

  const setModelCount = (modelId: string, count: number) => {
    setPerModelCount((prev) => ({ ...prev, [modelId]: Math.max(1, Math.min(10, count)) }))
  }

  const handleGeneratePhotos = async () => {
    const modelIds = Array.from(selectedModelIds)
    if (modelIds.length === 0) {
      setError('Select at least one image model.')
      return
    }
    if (!generatedPrompt.trim()) {
      setError('No prompt available. Go back to Step 2.')
      return
    }

    setIsGenerating(true)
    setLoading(true)
    setError(null)

    const initProgress: Record<string, ProgressEntry> = {}
    for (const id of modelIds) {
      initProgress[id] = { status: 'waiting', count: getImagesForModel(id), completed: 0 }
    }
    setModelProgress(initProgress)

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/next/photo-generate', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.queue?.progress) {
            setModelProgress((prev) => {
              const updated = { ...prev }
              for (const id of Object.keys(updated)) {
                if (updated[id].status === 'generating' && data.queue.progress.completed > 0) {
                  updated[id] = {
                    ...updated[id],
                    completed: Math.min(data.queue.progress.completed, updated[id].count),
                  }
                }
              }
              return updated
            })
          }
        }
      } catch { /* ignore */ }
    }, 2000)
    setPollInterval(interval)

    const generateForModel = async (
      modelId: string,
    ): Promise<{ modelId: string; images: GeneratedPhoto[]; error?: string }> => {
      setModelProgress((prev) => ({
        ...prev,
        [modelId]: { ...prev[modelId], status: 'generating' },
      }))

      const count = getImagesForModel(modelId)
      const prompts = Array(count).fill(generatedPrompt)

      try {
        const res = await fetch('/next/photo-generate', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts,
            modelId,
            metadata: { photoType, background, mood, brief },
            referenceImageUrl: selectedPersonaId
              ? modelPersonas.find((p) => p.id === selectedPersonaId)?.referenceImageUrl
              : undefined,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Generation failed')

        const images: GeneratedPhoto[] = (data.images || []).map((img: any, idx: number) => ({
          id: img.id || `${modelId}-${idx}-${Date.now()}`,
          base64: img.base64,
          mimeType: img.mimeType || 'image/png',
          prompt: img.prompt || generatedPrompt,
          model: modelId,
          modelDisplayName: getModelDisplayName(modelId),
          costPerImage: img.costPerImage ?? getCostPerImage(modelId),
          status: 'pending' as const,
          title: '',
          ulTitle: '',
        }))

        setModelProgress((prev) => ({
          ...prev,
          [modelId]: { status: 'done', count: images.length, completed: images.length },
        }))

        return { modelId, images }
      } catch (err: any) {
        setModelProgress((prev) => ({
          ...prev,
          [modelId]: { ...prev[modelId], status: 'error', error: err.message },
        }))
        return { modelId, images: [], error: err.message }
      }
    }

    try {
      const results = await Promise.all(modelIds.map(generateForModel))
      const allImages = results.flatMap((r) => r.images)
      const errors = results
        .filter((r) => r.error)
        .map((r) => `${getModelDisplayName(r.modelId)}: ${r.error}`)

      if (allImages.length === 0) {
        setError(errors.join('\n') || 'All models failed to generate images.')
      } else {
        setGeneratedPhotos(allImages)
        completeStep('generate')
        goToStep('review')
        // Auto-generate titles
        autoGenerateTitles(allImages)
        if (errors.length) {
          setError(`Some models failed:\n${errors.join('\n')}`)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setIsGenerating(false)
      if (interval) clearInterval(interval)
      setPollInterval(null)
    }
  }

  // ── Auto-generate titles ──

  const autoGenerateTitles = async (photos: GeneratedPhoto[]) => {
    setTitlesLoading(true)
    try {
      const res = await fetch('/next/photo-titles', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: photos.map((p, i) => ({
            id: p.id,
            photoType,
            modelDisplayName: p.modelDisplayName,
            productTitle: selectedProduct?.title,
            index: i,
          })),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.titles?.length) {
          setGeneratedPhotos((prev) =>
            prev.map((photo) => {
              const match = data.titles.find((t: any) => t.id === photo.id)
              if (match) {
                return {
                  ...photo,
                  title: match.title || photo.title,
                  ulTitle: match.ulTitle || photo.ulTitle,
                }
              }
              return photo
            }),
          )
        }
      }
    } catch {
      /* non-critical — admin can type titles manually */
    }
    setTitlesLoading(false)
  }

  // ── Step 4: Review & Approve ──

  const updatePhotoTitle = (id: string, title: string) => {
    setGeneratedPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)))
  }

  const updatePhotoUlTitle = (id: string, ulTitle: string) => {
    setGeneratedPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ulTitle } : p)))
  }

  const approvePhoto = async (photo: GeneratedPhoto) => {
    if (!photo.title.trim()) {
      setError('Title is required before approving.')
      return
    }

    try {
      const res = await fetch('/next/photo-approve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: photo.base64,
          mimeType: photo.mimeType,
          title: photo.title,
          photoType,
          background,
          mood,
          prompt: photo.prompt,
          model: {
            provider: imageModels.find((m) => getModelId(m) === photo.model)?.provider || 'unknown',
            id: photo.model,
            displayName: photo.modelDisplayName,
          },
          cost: photo.costPerImage,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Approval failed')

      setGeneratedPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, status: 'approved' as const } : p)),
      )
      setMessage({ type: 'success', text: `"${photo.title}" saved to media library.` })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveAsModelReference = async (photo: GeneratedPhoto) => {
    if (!selectedPersonaId) {
      setError('Select a Model Persona first to save a reference image.')
      return
    }
    try {
      // Upload the image to media library
      const ext = photo.mimeType.includes('png') ? 'png' : 'jpg'
      const byteStr = atob(photo.base64)
      const bytes = new Uint8Array(byteStr.length)
      for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i)
      const blob = new Blob([bytes], { type: photo.mimeType })
      const file = new File([blob], `ref-${photo.title || 'model'}.${ext}`, { type: photo.mimeType })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', `Model reference — ${photo.title}`)

      const uploadRes = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Failed to upload reference image')
      const uploadData = await uploadRes.json()
      const mediaId = uploadData.doc?.id

      if (!mediaId) throw new Error('No media ID returned')

      // Fetch current persona to get existing reference images
      const personaRes = await fetch(`/api/ai-models/${selectedPersonaId}?depth=0`, { credentials: 'include' })
      if (!personaRes.ok) throw new Error('Failed to fetch persona')
      const persona = await personaRes.json()
      const existingRefs = persona.referenceImages || []

      // Append to referenceImages
      await fetch(`/api/ai-models/${selectedPersonaId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceImages: [...existingRefs, { image: mediaId }],
        }),
      })

      // Update local persona state
      setModelPersonas((prev) =>
        prev.map((p) =>
          p.id === selectedPersonaId
            ? { ...p, referenceImageUrl: p.referenceImageUrl || uploadData.doc?.url }
            : p,
        ),
      )

      setMessage({ type: 'success', text: `Saved as reference for "${modelPersonas.find((p) => p.id === selectedPersonaId)?.name}".` })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const rejectPhoto = (id: string) => {
    setGeneratedPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected' as const } : p)),
    )
  }

  const handleBulkApprove = async () => {
    const pending = generatedPhotos.filter((p) => p.status === 'pending' && p.title.trim())
    if (pending.length === 0) {
      setError('No photos with titles to approve.')
      return
    }

    setLoading(true)
    let savedCount = 0

    for (const photo of pending) {
      try {
        const res = await fetch('/next/photo-approve', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: photo.base64,
            mimeType: photo.mimeType,
            title: photo.title,
            photoType,
            background,
            mood,
            prompt: photo.prompt,
            model: {
              provider: imageModels.find((m) => getModelId(m) === photo.model)?.provider || 'unknown',
              id: photo.model,
              displayName: photo.modelDisplayName,
            },
            cost: photo.costPerImage,
          }),
        })

        if (res.ok) {
          savedCount++
          setGeneratedPhotos((prev) =>
            prev.map((p) => (p.id === photo.id ? { ...p, status: 'approved' as const } : p)),
          )
        }
      } catch {
        /* continue */
      }
    }

    setLoading(false)
    setMessage({
      type: savedCount > 0 ? 'success' : 'error',
      text: `${savedCount}/${pending.length} photos saved.`,
    })
  }

  const handleBulkReject = () => {
    setGeneratedPhotos((prev) =>
      prev.map((p) => (p.status === 'pending' ? { ...p, status: 'rejected' as const } : p)),
    )
  }

  const handleBulkDownload = () => {
    const downloadable = generatedPhotos.filter((p) => p.status !== 'rejected')
    downloadable.forEach((photo, i) => {
      const ext = photo.mimeType.includes('png') ? 'png' : 'jpg'
      const name = photo.title || photo.ulTitle || `photo-${i + 1}`
      setTimeout(() => downloadBase64(photo.base64, photo.mimeType, `${name}.${ext}`), i * 200)
    })
  }

  // ── Reset flow ──

  const resetAll = () => {
    setActiveStep('configure')
    setCompletedSteps(new Set())
    setGeneratedPrompt('')
    setGeneratedPhotos([])
    setModelProgress({})
    setError(null)
    setMessage(null)
    setWriteOwn(false)
    setBrief('')
    setEnvironment('')
    setSelectedPresetId('')
    clearProduct()
    setSelectedPersonaId('')
    setSameModel(true)
    setAngleConfig(DEFAULT_ANGLES)
    setPerModelCount({})
  }

  // ── Render ──

  return (
    <div className="ps-page">
      {/* ── Header ── */}
      <div className="ps-header">
        <h1>Photo Studio</h1>
        <p>AI fashion photography generator. Campaign heroes, on-model shots, editorial images, and more.</p>
      </div>

      {/* ── Messages ── */}
      {message && (
        <div className={`ps-message ps-message--${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} type="button">x</button>
        </div>
      )}

      {error && (
        <div className="ps-message ps-message--error">
          <span style={{ whiteSpace: 'pre-wrap' }}>{error}</span>
          <button onClick={() => setError(null)} type="button">x</button>
        </div>
      )}

      {/* ══════════════════════════════════
          STEP 1: Configure
          ══════════════════════════════════ */}
      <div className={`ps-step ${activeStep === 'configure' ? 'ps-step--active' : ''} ${completedSteps.has('configure') ? 'ps-step--completed' : ''}`}>
        <div className="ps-step__header" onClick={() => isStepAccessible('configure') && goToStep('configure')}>
          <span className="ps-step__number">1</span>
          <span className="ps-step__title">Configure</span>
          {completedSteps.has('configure') && activeStep !== 'configure' && (
            <span className="ps-step__summary">{getStepSummary('configure')}</span>
          )}
          <span className="ps-step__chevron">{activeStep === 'configure' ? '\u25B2' : '\u25BC'}</span>
        </div>

        {activeStep === 'configure' && (
          <div className="ps-step__body">
            {/* Photo Type */}
            <div className="ps-field">
              <label className="ps-field__label">Photo Type</label>
              <select className="ps-select" value={photoType} onChange={(e) => setPhotoType(e.target.value)}>
                <option value="">Select type...</option>
                {(photoTypes.length > 0
                  ? photoTypes
                  : [
                      { value: 'campaign-hero', label: 'Campaign Hero' },
                      { value: 'on-model', label: 'On-Model' },
                      { value: 'editorial', label: 'Editorial' },
                      { value: 'flat-lay', label: 'Flat-Lay' },
                      { value: 'detail-texture', label: 'Detail / Texture' },
                      { value: 'group-crew', label: 'Group / Crew' },
                    ]
                ).map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Background */}
            <div className="ps-field">
              <label className="ps-field__label">Background</label>
              <div className="ps-pills">
                {(backgrounds.length > 0
                  ? backgrounds
                  : [
                      { value: 'near-black', label: 'Near-Black' },
                      { value: 'cream', label: 'Cream' },
                      { value: 'environment', label: 'Environment' },
                      { value: 'concrete', label: 'Concrete' },
                      { value: 'custom', label: 'Custom' },
                      { value: 'hex-color', label: 'Hex Color' },
                      { value: 'ai-pick', label: 'AI Pick' },
                    ]
                ).map((bg) => (
                  <button
                    key={bg.value}
                    type="button"
                    className={`ps-pill ${background === bg.value ? 'ps-pill--active' : ''}`}
                    onClick={() => setBackground(bg.value)}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
              {/* Hex color input */}
              {background === 'hex-color' && (
                <div className="ps-hex-input" style={{ marginTop: 8 }}>
                  <input
                    type="color"
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    className="ps-color-picker"
                  />
                  <input
                    type="text"
                    className="ps-input"
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    placeholder="#5A6242"
                    style={{ width: 120 }}
                  />
                </div>
              )}
              {background === 'ai-pick' && (
                <span className="ps-field__hint">AI will choose the best background based on the product, design, and brand palette.</span>
              )}
            </div>

            {/* Mood */}
            <div className="ps-field">
              <label className="ps-field__label">Mood</label>
              <div className="ps-pills">
                {(moods.length > 0
                  ? moods
                  : [
                      { value: 'neutral', label: 'Neutral' },
                      { value: 'dramatic', label: 'Dramatic' },
                      { value: 'editorial', label: 'Editorial' },
                      { value: 'raw', label: 'Raw' },
                      { value: 'clinical', label: 'Clinical' },
                    ]
                ).map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`ps-pill ${mood === m.value ? 'ps-pill--active' : ''}`}
                    onClick={() => setMood(m.value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Environment (editorial only) */}
            {photoType === 'editorial' && (
              <div className="ps-field">
                <label className="ps-field__label">Environment</label>
                <input
                  type="text"
                  className="ps-input"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  placeholder="e.g. abandoned warehouse, neon-lit alley, brutalist rooftop..."
                />
                <span className="ps-field__hint">Describe the setting for the editorial shoot.</span>
              </div>
            )}

            {/* ── Model Shoot Config ── */}
            <div className="ps-config-box">
              <div className="ps-config-box__header">Model Shoot Settings</div>

              {/* Product Picker */}
              <div className="ps-field">
                <label className="ps-field__label">
                  Product{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', color: '#555' }}>
                    (optional — model wears this product)
                  </span>
                </label>
                {selectedProduct ? (
                  <div className="ps-selected-product">
                    {selectedProduct.imageUrl && (
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="ps-selected-product__img" />
                    )}
                    <span className="ps-selected-product__title">{selectedProduct.title}</span>
                    <button type="button" onClick={clearProduct} className="ps-selected-product__remove">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="ps-product-search">
                    <input
                      type="text"
                      className="ps-input"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products by name..."
                    />
                    {productSearchLoading && <span className="ps-field__hint">Searching...</span>}
                    {productResults.length > 0 && (
                      <div className="ps-product-results">
                        {productResults.map((p) => (
                          <button key={p.id} type="button" className="ps-product-result" onClick={() => selectProduct(p)}>
                            {p.imageUrl && <img src={p.imageUrl} alt={p.title} className="ps-product-result__img" />}
                            <span>{p.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Product Context Panel ── */}
              {selectedProduct && (
                <div className="ps-context-panel">
                  <label className="ps-field__label">Reference Images</label>
                  <span className="ps-field__hint" style={{ marginBottom: 8, display: 'block' }}>
                    Auto-detected from product. Override by pasting a URL.
                  </span>
                  <div className="ps-context-grid">
                    {/* Product Image */}
                    <div className="ps-context-card">
                      <div className="ps-context-card__label">Product</div>
                      <div className="ps-context-card__preview">
                        {resolvedProductImg ? (
                          <img src={resolvedProductImg} alt="Product" />
                        ) : (
                          <span className="ps-context-card__empty">No image</span>
                        )}
                      </div>
                      <input
                        type="text"
                        className="ps-input"
                        value={overrideProductImg}
                        onChange={(e) => setOverrideProductImg(e.target.value)}
                        placeholder={selectedProduct.imageUrl || 'Paste URL to override...'}
                        style={{ fontSize: 11 }}
                      />
                    </div>

                    {/* Design Image */}
                    <div className="ps-context-card">
                      <div className="ps-context-card__label">Design</div>
                      <div className="ps-context-card__preview">
                        {resolvedDesignImg ? (
                          <img src={resolvedDesignImg} alt="Design" />
                        ) : (
                          <span className="ps-context-card__empty">No design linked</span>
                        )}
                      </div>
                      <input
                        type="text"
                        className="ps-input"
                        value={overrideDesignImg}
                        onChange={(e) => setOverrideDesignImg(e.target.value)}
                        placeholder={selectedProduct.designImageUrl || 'Paste URL to override...'}
                        style={{ fontSize: 11 }}
                      />
                    </div>

                    {/* Raw / Print File */}
                    <div className="ps-context-card">
                      <div className="ps-context-card__label">Raw / Catalog</div>
                      <div className="ps-context-card__preview">
                        {resolvedRawImg ? (
                          <img src={resolvedRawImg} alt="Raw" />
                        ) : (
                          <span className="ps-context-card__empty">No raw image</span>
                        )}
                      </div>
                      <input
                        type="text"
                        className="ps-input"
                        value={overrideRawImg}
                        onChange={(e) => setOverrideRawImg(e.target.value)}
                        placeholder={selectedProduct.rawImageUrl || 'Paste URL to override...'}
                        style={{ fontSize: 11 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Model Type */}
              {/* Model Persona Selector */}
              <div className="ps-field">
                <label className="ps-field__label">Model Persona</label>
                <select
                  className="ps-select"
                  value={selectedPersonaId}
                  onChange={(e) => applyPersona(e.target.value)}
                >
                  <option value="">Custom (manual config below)</option>
                  {modelPersonas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.gender === 'female' ? 'F' : 'M'}, {p.ethnicity !== 'any' ? p.ethnicity : 'any'}, {p.ageRange}
                    </option>
                  ))}
                </select>
                {selectedPersonaId && (() => {
                  const p = modelPersonas.find((p) => p.id === selectedPersonaId)
                  return p?.promptDescription ? (
                    <span className="ps-field__hint" style={{ marginTop: 4, display: 'block', lineHeight: 1.5 }}>
                      {p.promptDescription.slice(0, 120)}{p.promptDescription.length > 120 ? '...' : ''}
                    </span>
                  ) : null
                })()}
              </div>

              {/* Model Type + Ethnicity + Age (manual or overrides persona) */}
              <div className="ps-grid-3">
                <div className="ps-field">
                  <label className="ps-field__label">Model Type</label>
                  <select
                    className="ps-select"
                    value={modelType}
                    onChange={(e) => {
                      setModelType(e.target.value)
                      // Auto-set age range for kids
                      if (e.target.value.startsWith('kid')) setAgeRange('8-12')
                      else if (ageRange === '8-12') setAgeRange('22-26')
                    }}
                  >
                    {MODEL_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="ps-field">
                  <label className="ps-field__label">Ethnicity</label>
                  <select className="ps-select" value={ethnicity} onChange={(e) => setEthnicity(e.target.value)}>
                    {ETHNICITY_OPTIONS.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>

                <div className="ps-field">
                  <label className="ps-field__label">Age</label>
                  <select
                    className="ps-select"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                  >
                    {AGE_RANGE_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                  {ageRange === 'custom' && (
                    <input
                      type="number"
                      className="ps-input"
                      min={5}
                      max={60}
                      value={customAge}
                      onChange={(e) => setCustomAge(Math.max(5, Math.min(60, parseInt(e.target.value) || 24)))}
                      style={{ width: 70, marginTop: 6 }}
                    />
                  )}
                </div>
              </div>

              {/* Same Model Toggle */}
              <div className="ps-field">
                <label className="ps-toggle">
                  <input type="checkbox" checked={sameModel} onChange={(e) => setSameModel(e.target.checked)} />
                  Same model across all shots (consistent appearance)
                </label>
              </div>

              {/* Angles */}
              <div className="ps-field">
                <label className="ps-field__label">Angles & Shot Count</label>
                <div className="ps-angle-grid">
                  {ANGLE_OPTIONS.map((angle) => {
                    const config = angleConfig.find((a) => a.angle === angle.value)
                    const isActive = !!config
                    return (
                      <div key={angle.value} className={`ps-angle-card ${isActive ? 'ps-angle-card--active' : ''}`}>
                        <button type="button" className="ps-angle-card__toggle" onClick={() => toggleAngle(angle.value)}>
                          <span className="ps-angle-card__check">{isActive ? '✓' : ''}</span>
                          <span>{angle.label}</span>
                        </button>
                        {isActive && (
                          <div className="ps-angle-card__count">
                            <button type="button" onClick={() => setAngleCount(angle.value, (config?.count || 1) - 1)} disabled={(config?.count || 1) <= 1}>−</button>
                            <span>{config?.count || 1}</span>
                            <button type="button" onClick={() => setAngleCount(angle.value, (config?.count || 1) + 1)} disabled={(config?.count || 1) >= 4}>+</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <span className="ps-field__hint">
                  Total: {totalImages} image{totalImages !== 1 ? 's' : ''}
                  {totalImages === 0 && ' — select at least one angle'}
                </span>
              </div>
            </div>

            {/* Brief */}
            <div className="ps-field">
              <label className="ps-field__label">
                Brief <span style={{ fontWeight: 400, textTransform: 'none', color: '#555' }}>(optional)</span>
              </label>
              <textarea
                className="ps-textarea"
                rows={3}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Additional creative direction: specific garments, poses, lighting, styling notes..."
              />
            </div>

            {/* Preset */}
            {presets.length > 0 && (
              <div className="ps-field">
                <label className="ps-field__label">Preset</label>
                <select
                  className="ps-select"
                  value={selectedPresetId}
                  onChange={(e) => {
                    setSelectedPresetId(e.target.value)
                    if (e.target.value) applyPreset(e.target.value)
                  }}
                >
                  <option value="">None (manual config)</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="ps-actions ps-actions--right">
              <button type="button" className="ps-btn ps-btn--primary" onClick={handleConfigureDone} disabled={!photoType}>
                Continue to Prompt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════
          STEP 2: Prompt
          ══════════════════════════════════ */}
      <div className={`ps-step ${activeStep === 'prompt' ? 'ps-step--active' : ''} ${completedSteps.has('prompt') ? 'ps-step--completed' : ''}`}>
        <div className="ps-step__header" onClick={() => isStepAccessible('prompt') && goToStep('prompt')}>
          <span className="ps-step__number">2</span>
          <span className="ps-step__title">Prompt</span>
          {completedSteps.has('prompt') && activeStep !== 'prompt' && (
            <span className="ps-step__summary">{getStepSummary('prompt')}</span>
          )}
          <span className="ps-step__chevron">{activeStep === 'prompt' ? '\u25B2' : '\u25BC'}</span>
        </div>

        {activeStep === 'prompt' && isStepAccessible('prompt') && (
          <div className="ps-step__body">
            {/* Write own toggle */}
            <div className="ps-field">
              <label className="ps-toggle">
                <input type="checkbox" checked={writeOwn} onChange={(e) => setWriteOwn(e.target.checked)} />
                Write my own prompt (skip AI generation)
              </label>
            </div>

            {!writeOwn && (
              <>
                <div className="ps-grid-2">
                  <div className="ps-field">
                    <label className="ps-field__label">Detail Level</label>
                    <select className="ps-select" value={detailLevel} onChange={(e) => setDetailLevel(e.target.value)}>
                      {(detailLevels.length > 0
                        ? detailLevels
                        : [
                            { value: 'low', label: 'Low' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High' },
                            { value: 'very-high', label: 'Very High' },
                          ]
                      ).map((dl) => (
                        <option key={dl.value} value={dl.value}>{dl.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="ps-field">
                    <label className="ps-field__label">Prompt Model</label>
                    <select className="ps-select" value={promptModelId} onChange={(e) => setPromptModelId(e.target.value)}>
                      {(promptModels.length > 0
                        ? promptModels
                        : [
                            { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
                            { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
                          ]
                      ).map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ps-actions">
                  <button type="button" className="ps-btn ps-btn--primary" onClick={handleGeneratePrompt} disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Prompt'}
                  </button>
                </div>
              </>
            )}

            {/* Prompt textarea */}
            {(generatedPrompt || writeOwn) && (
              <div className="ps-field" style={{ marginTop: 16 }}>
                <label className="ps-field__label">
                  {writeOwn ? 'Your Prompt' : 'Generated Prompt'}{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', color: '#555' }}>(editable)</span>
                </label>
                <textarea
                  className="ps-textarea ps-textarea--prompt"
                  rows={8}
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  placeholder={writeOwn ? 'Write your photo generation prompt here...' : 'AI-generated prompt will appear here...'}
                />
              </div>
            )}

            {(generatedPrompt || writeOwn) && (
              <div className="ps-actions ps-actions--right">
                <button type="button" className="ps-btn ps-btn--secondary" onClick={() => goToStep('configure')}>
                  Back
                </button>
                <button type="button" className="ps-btn ps-btn--primary" onClick={handlePromptDone} disabled={!generatedPrompt.trim()}>
                  Continue to Generate
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════
          STEP 3: Generate
          ══════════════════════════════════ */}
      <div className={`ps-step ${activeStep === 'generate' ? 'ps-step--active' : ''} ${completedSteps.has('generate') ? 'ps-step--completed' : ''}`}>
        <div className="ps-step__header" onClick={() => isStepAccessible('generate') && goToStep('generate')}>
          <span className="ps-step__number">3</span>
          <span className="ps-step__title">Generate</span>
          {completedSteps.has('generate') && activeStep !== 'generate' && (
            <span className="ps-step__summary">{getStepSummary('generate')}</span>
          )}
          <span className="ps-step__chevron">{activeStep === 'generate' ? '\u25B2' : '\u25BC'}</span>
        </div>

        {activeStep === 'generate' && isStepAccessible('generate') && (
          <div className="ps-step__body">
            {/* Image Model Checkboxes with per-model count */}
            <div className="ps-field">
              <label className="ps-field__label">Image Models</label>
              <div className="ps-checkboxes">
                {imageModels.map((model) => {
                  const mid = getModelId(model)
                  const checked = selectedModelIds.has(mid)
                  const count = getImagesForModel(mid)
                  return (
                    <label key={mid} className={`ps-checkbox ${checked ? 'ps-checkbox--checked' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleModelSelection(mid)} />
                      <div className="ps-checkbox__info">
                        <span className="ps-checkbox__name">
                          {model.displayName}
                          {hasActiveReference && (
                            supportsImageRef(mid)
                              ? <span className="ps-ref-badge ps-ref-badge--supported" title="Supports image reference — will use persona's reference photo">✦ Ref</span>
                              : <span className="ps-ref-badge ps-ref-badge--text-only" title="Text prompt only — cannot use reference image">text only</span>
                          )}
                        </span>
                        <span className="ps-checkbox__detail">
                          {model.provider || 'unknown'} &middot; ${(model.costPerImage ?? 0.075).toFixed(3)}/img
                        </span>
                      </div>
                      {checked && (
                        <div className="ps-model-count">
                          <button type="button" onClick={(e) => { e.preventDefault(); setModelCount(mid, count - 1) }} disabled={count <= 1}>−</button>
                          <span>{count}</span>
                          <button type="button" onClick={(e) => { e.preventDefault(); setModelCount(mid, count + 1) }} disabled={count >= 10}>+</button>
                          <span className="ps-model-count__label">imgs</span>
                        </div>
                      )}
                    </label>
                  )
                })}

                {imageModels.length === 0 && (
                  <div className="ps-empty">No image models available. Check your API keys.</div>
                )}
              </div>
            </div>

            {/* Cost Estimate */}
            {selectedModelIds.size > 0 && (
              <div className="ps-cost">
                <div className="ps-cost__total">${estimatedTotalCost().toFixed(3)}</div>
                <span className="ps-cost__detail">
                  {Array.from(selectedModelIds)
                    .map((id) => `${getModelDisplayName(id)}: ${getImagesForModel(id)}`)
                    .join(' + ')}{' '}
                  = {totalGeneratedCount()} total
                </span>
              </div>
            )}

            {/* Generate button or progress */}
            {!isGenerating ? (
              <div className="ps-actions ps-actions--right" style={{ marginTop: 16 }}>
                <button type="button" className="ps-btn ps-btn--secondary" onClick={() => goToStep('prompt')}>
                  Back
                </button>
                <button
                  type="button"
                  className="ps-btn ps-btn--primary"
                  onClick={handleGeneratePhotos}
                  disabled={loading || selectedModelIds.size === 0}
                >
                  Generate Photos
                </button>
              </div>
            ) : (
              <div className="ps-generating" style={{ marginTop: 16 }}>
                <div className="ps-spinner" />
                <p className="ps-generating__text">Generating photos...</p>
                <p className="ps-generating__sub">This may take 10-30 seconds per image.</p>
              </div>
            )}

            {/* Per-model progress cards */}
            {Object.keys(modelProgress).length > 0 && (
              <div className="ps-progress-cards">
                {Object.entries(modelProgress).map(([modelId, prog]) => (
                  <div key={modelId} className="ps-progress">
                    <span className="ps-progress__name">{getModelDisplayName(modelId)}</span>
                    <div className="ps-progress__bar">
                      <div
                        className={`ps-progress__fill ${prog.status === 'error' ? 'ps-progress__fill--error' : ''}`}
                        style={{
                          width:
                            prog.count > 0
                              ? `${Math.round((prog.completed / prog.count) * 100)}%`
                              : prog.status === 'done'
                                ? '100%'
                                : '0%',
                        }}
                      />
                    </div>
                    <span className={`ps-badge ps-badge--${prog.status}`}>{prog.status}</span>
                    {prog.error && (
                      <span style={{ fontSize: 11, color: '#f87171', marginLeft: 4 }} title={prog.error}>
                        !
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════
          STEP 4: Review & Approve
          ══════════════════════════════════ */}
      <div className={`ps-step ${activeStep === 'review' ? 'ps-step--active' : ''} ${completedSteps.has('review') ? 'ps-step--completed' : ''}`}>
        <div className="ps-step__header" onClick={() => isStepAccessible('review') && goToStep('review')}>
          <span className="ps-step__number">4</span>
          <span className="ps-step__title">Review & Approve</span>
          {approvedPhotos.length > 0 && activeStep !== 'review' && (
            <span className="ps-step__summary">{approvedPhotos.length} approved</span>
          )}
          <span className="ps-step__chevron">{activeStep === 'review' ? '\u25B2' : '\u25BC'}</span>
        </div>

        {activeStep === 'review' && isStepAccessible('review') && (
          <div className="ps-step__body">
            {generatedPhotos.length === 0 ? (
              <div className="ps-empty">No photos generated yet. Complete Step 3 first.</div>
            ) : (
              <>
                {/* Bulk bar */}
                <div className="ps-bulk-bar">
                  <span className="ps-bulk-bar__count">
                    {generatedPhotos.length} photo{generatedPhotos.length !== 1 ? 's' : ''} &middot;{' '}
                    {approvedPhotos.length} approved &middot; {pendingPhotos.length} pending
                    {titlesLoading && ' · generating titles...'}
                  </span>
                  <div className="ps-bulk-bar__actions">
                    <button
                      type="button"
                      className="ps-btn ps-btn--approve ps-btn--small"
                      onClick={handleBulkApprove}
                      disabled={loading || bulkApprovable.length === 0}
                      title={bulkApprovable.length === 0 ? 'Add titles to pending photos first' : `Approve ${bulkApprovable.length} photos with titles`}
                    >
                      Bulk Approve ({bulkApprovable.length})
                    </button>
                    <button
                      type="button"
                      className="ps-btn ps-btn--reject ps-btn--small"
                      onClick={handleBulkReject}
                      disabled={pendingPhotos.length === 0}
                    >
                      Bulk Reject
                    </button>
                    <button
                      type="button"
                      className="ps-btn ps-btn--secondary ps-btn--small"
                      onClick={handleBulkDownload}
                      disabled={generatedPhotos.filter((p) => p.status !== 'rejected').length === 0}
                    >
                      Download All
                    </button>
                    <button type="button" className="ps-btn ps-btn--secondary ps-btn--small" onClick={resetAll}>
                      Start Over
                    </button>
                  </div>
                </div>

                {/* Images grouped by model */}
                {Object.keys(photosByModel).length > 1 ? (
                  // Multiple models — show grouped
                  Object.entries(photosByModel).map(([modelId, photos]) => (
                    <div key={modelId} className="ps-model-group">
                      <div className="ps-model-group__header">
                        <span className="ps-model-group__name">{getModelDisplayName(modelId)}</span>
                        <span className="ps-model-group__count">{photos.length} images</span>
                      </div>
                      <div className="ps-grid">
                        {photos.map((photo) => renderPhotoCard(photo, generatedPhotos.indexOf(photo)))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Single model — flat grid
                  <div className="ps-grid">
                    {generatedPhotos.map((photo, idx) => renderPhotoCard(photo, idx))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null &&
        generatedPhotos[lightboxIdx] &&
        ReactDOM.createPortal(
          <div className="ps-lightbox-overlay" onClick={() => setLightboxIdx(null)}>
            <img
              className="ps-lightbox-img"
              src={`data:${generatedPhotos[lightboxIdx].mimeType};base64,${generatedPhotos[lightboxIdx].base64}`}
              alt={generatedPhotos[lightboxIdx].title || 'Preview'}
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </div>
  )

  // ── Photo Card Renderer ──

  function renderPhotoCard(photo: GeneratedPhoto, idx: number) {
    return (
      <div
        key={photo.id}
        className={`ps-image-card ${photo.status === 'approved' ? 'ps-image-card--approved' : ''} ${photo.status === 'rejected' ? 'ps-image-card--rejected' : ''}`}
      >
        {/* Preview */}
        <div className="ps-image-card__preview" onClick={() => setLightboxIdx(idx)} style={{ cursor: 'pointer' }}>
          <img
            src={`data:${photo.mimeType};base64,${photo.base64}`}
            alt={photo.title || `Generated photo ${idx + 1}`}
            loading="lazy"
          />
        </div>

        {/* Body */}
        <div className="ps-image-card__body">
          <input
            type="text"
            className="ps-image-card__title-input"
            value={photo.title}
            onChange={(e) => updatePhotoTitle(photo.id, e.target.value)}
            placeholder="Title..."
            disabled={photo.status !== 'pending'}
          />
          <input
            type="text"
            className="ps-image-card__title-input ps-image-card__ul-title"
            value={photo.ulTitle}
            onChange={(e) => updatePhotoUlTitle(photo.id, e.target.value)}
            placeholder="ul-title (slug)..."
            disabled={photo.status !== 'pending'}
          />
          <div className="ps-image-card__meta">
            <span className="ps-image-card__type">{photoType}</span>
            <span className="ps-image-card__model">{photo.modelDisplayName}</span>
          </div>
        </div>

        {/* Actions */}
        {photo.status === 'pending' && (
          <div className="ps-image-card__actions">
            <button
              type="button"
              className="ps-btn ps-btn--approve ps-btn--small"
              onClick={() => approvePhoto(photo)}
              disabled={!photo.title.trim() || loading}
              title={!photo.title.trim() ? 'Add a title first' : 'Approve and save'}
            >
              Approve
            </button>
            <button type="button" className="ps-btn ps-btn--reject ps-btn--small" onClick={() => rejectPhoto(photo.id)}>
              Reject
            </button>
            <button
              type="button"
              className="ps-btn ps-btn--secondary ps-btn--small"
              onClick={() => {
                const ext = photo.mimeType.includes('png') ? 'png' : 'jpg'
                downloadBase64(photo.base64, photo.mimeType, `${photo.title || photo.ulTitle || `photo-${idx + 1}`}.${ext}`)
              }}
              title="Download this image"
            >
              ↓
            </button>
          </div>
        )}

        {photo.status === 'approved' && (
          <div className="ps-image-card__actions">
            <span className="ps-image-card__status ps-image-card__status--approved">Approved</span>
            {selectedPersonaId && (
              <button
                type="button"
                className="ps-btn ps-btn--small"
                onClick={() => saveAsModelReference(photo)}
                title="Save this image as a reference for the selected model persona"
                style={{ borderColor: 'rgba(90, 98, 66, 0.4)', color: '#8B9A6B' }}
              >
                ★ Ref
              </button>
            )}
            <button
              type="button"
              className="ps-btn ps-btn--secondary ps-btn--small"
              onClick={() => {
                const ext = photo.mimeType.includes('png') ? 'png' : 'jpg'
                downloadBase64(photo.base64, photo.mimeType, `${photo.title || `photo-${idx + 1}`}.${ext}`)
              }}
              title="Download"
            >
              ↓
            </button>
          </div>
        )}
      </div>
    )
  }
}
