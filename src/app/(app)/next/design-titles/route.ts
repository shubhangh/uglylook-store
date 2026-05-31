import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { resolveApiKey } from '@/lib/ai-key-encryption'

/**
 * POST /next/design-titles
 *
 * Auto-generate titles, ul-titles, type classification, and lane classification
 * for generated design images. Uses Claude Haiku 4.5 (cheapest/fastest).
 *
 * Body: {
 *   images: { id, index, model, modelDisplayName, type, lane, emotion }[]
 *   designContext?: string
 * }
 *
 * Returns: { titles: { id, title, ulTitle, type, lane }[] }
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
    const { images, designContext } = body

    if (!images?.length) {
      return Response.json({ error: 'No images provided' }, { status: 400 })
    }

    const apiKey = await resolveApiKey('anthropic', user?.id || null, payload)
    if (!apiKey) {
      payload.logger.error('[design-titles] No Anthropic API key found for user ' + user?.id)
      return Response.json({ error: 'Anthropic API key not configured. Add it in Global Keys or My API Keys.' }, { status: 400 })
    }

    const count = images.length

    const prompt = `You are a creative director for UglyLook, a streetwear brand. Voice: dry, deadpan, adult.

For each of the ${count} design images below, provide:
1. **title** — 2-5 words, evocative, art-director-style. No two titles should share the same structure. Mix: noun-based ("Melt Protocol"), adjective-noun ("Scorched Monolith"), action ("Override Everything"), abstract ("System Crash Chic"). No generic words like "design", "mockup", "image".
2. **type** — classify the design: "logo", "graphic", "text-composition", "pattern", "typography", "illustration", or a custom string if none fit.
3. **lane** — classify the design lane: "ironic-text", "brutalist", "weirdcore", "maximalist", "y2k", "logo-brand", or a custom string if none fit.

${designContext ? `Design context: ${designContext}\n` : ''}
Images:
${images.map((img: any, i: number) => `${i + 1}. Model: ${img.modelDisplayName || img.model || 'unknown'}, Current type: ${img.type || 'unset'}, Current lane: ${img.lane || 'unset'}, Mood: ${img.emotion || 'unset'}`).join('\n')}

Return ONLY a JSON array of objects, one per image, in the same order:
[
  { "title": "Melt Protocol", "type": "graphic", "lane": "brutalist" },
  { "title": "Dead Signal", "type": "typography", "lane": "ironic-text" }
]`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      payload.logger.error(`Haiku title generation failed: ${err}`)
      return Response.json({ error: 'Title generation failed' }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    const match = text.match(/\[[\s\S]*\]/)
    if (!match) {
      payload.logger.error(`[design-titles] No JSON array in response: ${text.slice(0, 300)}`)
      return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    let parsed: { title: string; type?: string; lane?: string }[]
    try {
      parsed = JSON.parse(match[0])
    } catch (parseErr) {
      payload.logger.error(`[design-titles] JSON parse failed: ${match[0].slice(0, 300)}`)
      return Response.json({ error: 'Failed to parse AI JSON' }, { status: 500 })
    }

    // Build ul-title: slugified title + model name suffix + index for uniqueness
    const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const seenSlugs = new Set<string>()
    const result = images.map((img: any, i: number) => {
      const entry = parsed[i] || { title: `Design ${img.index + 1}` }
      const titleSlug = slugify(entry.title)
      const modelSlug = slugify(img.modelDisplayName || img.model || 'unknown')
      let ulTitle = `${titleSlug}-${modelSlug}`

      // Deduplicate within this batch
      if (seenSlugs.has(ulTitle)) {
        ulTitle = `${ulTitle}-${i + 1}`
      }
      seenSlugs.add(ulTitle)

      return {
        id: img.id,
        title: entry.title,
        ulTitle,
        type: entry.type || img.type || 'graphic',
        lane: entry.lane || img.lane || '',
      }
    })

    return Response.json({ titles: result })
  } catch (error: any) {
    console.error('Design titles error:', error)
    return Response.json({ error: error?.message || 'Failed to generate titles' }, { status: 500 })
  }
}
