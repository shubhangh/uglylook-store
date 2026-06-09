import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import {
  generatePhotoPrompt,
  type PhotoPromptInput,
  type PhotoType,
  type PhotoBackground,
  type PhotoMood,
  type DetailLevel,
} from '@/lib/photo-prompt-engine'

/**
 * POST /next/photo-prompt
 *
 * Generate a photography prompt using Claude.
 * Returns the prompt text for admin review/edit before image generation.
 *
 * Body: { photoType, brief, background, mood, detailLevel, modelId, productIds?, designIds?, presetId?, environment? }
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()

    // Build product context from selected product IDs
    let productContext = ''
    if (body.productIds && Array.isArray(body.productIds) && body.productIds.length > 0) {
      const products = await payload.find({
        collection: 'products',
        where: { id: { in: body.productIds } },
        select: { title: true, description: true, categories: true },
        depth: 1,
        limit: 5,
      })
      productContext = products.docs
        .map((p: any) => {
          const cats = (p.categories || [])
            .map((c: any) => (typeof c === 'object' ? c.title : ''))
            .filter(Boolean)
            .join(', ')
          return `- ${p.title}${cats ? ` (${cats})` : ''}${p.description ? `: ${typeof p.description === 'string' ? p.description.slice(0, 200) : ''}` : ''}`
        })
        .join('\n')
    }

    // Build image reference context (product hero, design, raw/printFile)
    let imageRefContext = ''
    if (body.imageRefs) {
      const refs: string[] = []
      if (body.imageRefs.productImageUrl) refs.push(`- PRODUCT PHOTO (final product as sold): ${body.imageRefs.productImageUrl}`)
      if (body.imageRefs.designImageUrl) refs.push(`- DESIGN/PRINT GRAPHIC (the print on the garment): ${body.imageRefs.designImageUrl}`)
      if (body.imageRefs.rawImageUrl) refs.push(`- RAW CATALOG IMAGE (Printify mockup/blank): ${body.imageRefs.rawImageUrl}`)
      if (refs.length > 0) {
        imageRefContext = `REFERENCE IMAGES (use these for visual consistency — the generated image MUST match the product exactly):\n${refs.join('\n')}\nCRITICAL: The design/print on the garment must be IDENTICAL to the reference. Do NOT alter, reinterpret, or stylize the print design.`
      }
    }

    // Model type context — use persona prompt if available, otherwise build from parts
    let modelTypeContext = ''
    if (body.personaPrompt) {
      // Persona has a hand-tuned prompt description — use it directly
      modelTypeContext = body.personaPrompt + ' Describe the EXACT SAME person (same face, same skin tone, same hair, same body) across ALL shots in this batch.'
    } else if (body.modelType) {
      const genderMap: Record<string, string> = {
        boy: 'Male model',
        girl: 'Female model',
        'kid-boy': 'Boy',
        'kid-girl': 'Girl',
      }
      const buildMap: Record<string, string> = {
        boy: 'athletic-lean build, 5\'11"-6\'1"',
        girl: 'slim-athletic build, 5\'7"-5\'9"',
        'kid-boy': 'average build',
        'kid-girl': 'average build',
      }
      const hairMap: Record<string, string> = {
        boy: 'short hair, clean-shaven',
        girl: 'shoulder-length hair, no makeup',
        'kid-boy': 'short hair',
        'kid-girl': 'hair in ponytail, no makeup',
      }

      const gender = genderMap[body.modelType] || 'Model'
      const build = buildMap[body.modelType] || ''
      const hair = hairMap[body.modelType] || ''

      // Age
      let ageStr = ''
      if (body.age) {
        if (body.age.includes('-')) {
          ageStr = `age ${body.age}`
        } else {
          ageStr = `age ${body.age}`
        }
      }

      // Ethnicity
      let ethnicityStr = ''
      if (body.ethnicity && body.ethnicity !== 'any') {
        const ethnicityLabels: Record<string, string> = {
          'south-asian': 'South Asian',
          'east-asian': 'East Asian',
          'southeast-asian': 'Southeast Asian',
          black: 'Black',
          white: 'Caucasian',
          latino: 'Latino/Hispanic',
          'middle-eastern': 'Middle Eastern',
          mixed: 'mixed-race',
        }
        ethnicityStr = ethnicityLabels[body.ethnicity] || body.ethnicity
      }

      const parts = [gender]
      if (ethnicityStr) parts.push(ethnicityStr)
      if (ageStr) parts.push(ageStr)
      if (build) parts.push(build)
      if (hair) parts.push(hair)
      parts.push('neutral expression')
      modelTypeContext = parts.join(', ') + '. Describe the EXACT SAME person (same face, same skin tone, same hair, same body) across ALL shots in this batch.'
    }

    // AI-picked background
    let backgroundOverride = body.background
    if (body.background === 'hex-color' && body.hexColor) {
      backgroundOverride = 'custom'
      // Append hex color info to brief
      body.brief = (body.brief || '') + `\nBACKGROUND COLOR: Solid ${body.hexColor} background.`
    } else if (body.background === 'ai-pick') {
      backgroundOverride = 'custom'
      body.brief = (body.brief || '') + `\nBACKGROUND: Choose the best background color/setting that complements this product and the UglyLook brand palette (olive #5A6242, bone #D9D2C2, near-black #111111, cream #F5F2EC, petrol #264A4F). Pick what creates the strongest visual impact for this specific product.`
    }

    // Build design context from selected design IDs
    let designContext = ''
    if (body.designIds && Array.isArray(body.designIds) && body.designIds.length > 0) {
      const designs = await payload.find({
        collection: 'designs',
        where: { id: { in: body.designIds } },
        select: { title: true, type: true, designLane: true, printText: true },
        depth: 0,
        limit: 5,
      })
      designContext = designs.docs
        .map((d: any) => `- "${d.title}" (${d.type || 'graphic'}, lane: ${d.designLane || 'n/a'})${d.printText ? ` — text: "${d.printText}"` : ''}`)
        .join('\n')
    }

    // Load preset template if preset selected
    let presetTemplate = ''
    if (body.presetId) {
      try {
        const preset = await payload.findByID({
          collection: 'photo-presets' as any,
          id: body.presetId,
          depth: 0,
        })
        presetTemplate = (preset as any)?.promptTemplate || ''
      } catch { /* preset not found */ }
    }

    const input: PhotoPromptInput = {
      photoType: (body.photoType || 'campaign-hero') as PhotoType,
      brief: body.brief || '',
      background: (backgroundOverride || 'near-black') as PhotoBackground,
      mood: (body.mood || 'neutral') as PhotoMood,
      detailLevel: (body.detailLevel || 'medium') as DetailLevel,
      modelId: body.modelId || '',
      productContext,
      designContext,
      presetTemplate,
      environment: body.environment || '',
      imageRefContext,
      modelTypeContext,
    }

    const result = await generatePhotoPrompt(input, user.id, payload)

    return Response.json(result)
  } catch (err: any) {
    console.error('[photo-prompt] Error:', err)
    return Response.json(
      { error: err.message || 'Failed to generate prompt' },
      { status: 500 },
    )
  }
}

/**
 * GET /next/photo-prompt
 *
 * Returns available photo types, backgrounds, moods for the UI.
 */
export async function GET(): Promise<Response> {
  // Fetch prompt models from registry
  let promptModels: Array<{ value: string; label: string }> = []
  try {
    const payload = await getPayload({ config })
    const models = await payload.find({
      collection: 'ai-model-registry' as any,
      where: { modelType: { equals: 'prompt' }, isEnabled: { equals: true } },
      sort: 'displayName',
      depth: 0,
    })
    promptModels = models.docs.map((m: any) => ({
      value: m.modelId,
      label: m.displayName,
    }))
  } catch { /* fallback below */ }

  // Fallback if no models in registry
  if (promptModels.length === 0) {
    promptModels = [
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    ]
  }

  return Response.json({
    photoTypes: [
      { value: 'campaign-hero', label: 'Campaign Hero' },
      { value: 'on-model', label: 'On-Model' },
      { value: 'flat-lay', label: 'Flat-Lay' },
      { value: 'detail-texture', label: 'Detail / Texture' },
      { value: 'editorial', label: 'Editorial / Lookbook' },
      { value: 'group-crew', label: 'Group / Crew' },
    ],
    backgrounds: [
      { value: 'near-black', label: 'Near-Black (#111)' },
      { value: 'cream', label: 'Cream (#F5F2EC)' },
      { value: 'environment', label: 'Environment' },
      { value: 'concrete', label: 'Concrete' },
      { value: 'custom', label: 'Custom' },
      { value: 'hex-color', label: 'Hex Color' },
      { value: 'ai-pick', label: 'AI Pick' },
    ],
    moods: [
      { value: 'neutral', label: 'Neutral' },
      { value: 'dramatic', label: 'Dramatic' },
      { value: 'editorial', label: 'Editorial' },
      { value: 'raw', label: 'Raw' },
      { value: 'clinical', label: 'Clinical' },
    ],
    detailLevels: [
      { value: 'low', label: 'Low (~80 words)' },
      { value: 'medium', label: 'Medium (~150 words)' },
      { value: 'high', label: 'High (~250 words)' },
      { value: 'very-high', label: 'Very High (~400 words)' },
    ],
    promptModels,
  })
}
