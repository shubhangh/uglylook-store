import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { resolveApiKey } from '@/lib/ai-key-encryption'

/**
 * POST /next/photo-titles
 *
 * Auto-generate titles and ulTitles for generated photos using the cheapest AI model.
 *
 * Body: {
 *   photos: Array<{ id: string, photoType: string, modelDisplayName: string, productTitle?: string }>
 * }
 *
 * Returns: { titles: Array<{ id: string, title: string, ulTitle: string }> }
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
    const { photos } = body as {
      photos: Array<{
        id: string
        photoType: string
        modelDisplayName: string
        productTitle?: string
        index?: number
      }>
    }

    if (!photos?.length) {
      return Response.json({ error: 'No photos provided' }, { status: 400 })
    }

    const apiKey = await resolveApiKey('anthropic', user.id, payload)
    if (!apiKey) {
      return Response.json({ error: 'No Anthropic API key configured' }, { status: 400 })
    }

    const photoList = photos
      .map(
        (p, i) =>
          `${i + 1}. id="${p.id}" type="${p.photoType}" model="${p.modelDisplayName}"${p.productTitle ? ` product="${p.productTitle}"` : ''}${p.index !== undefined ? ` shot=${p.index + 1}` : ''}`,
      )
      .join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You name AI-generated fashion photos for UglyLook, a Gen Z streetwear brand.

For each photo, generate:
- title: Short, descriptive name (2-5 words). E.g. "Kranti Tee Front View", "Static Collapse Editorial".
- ulTitle: kebab-case slug with model suffix. E.g. "kranti-tee-front-flux-2-0-pro", "static-collapse-editorial-gpt-image-1".

Rules:
- Include the product name in the title if provided.
- The ulTitle must be unique — include shot number or angle if multiple photos for same product.
- Keep it concise and professional.

Output ONLY valid JSON array: [{"id":"...","title":"...","ulTitle":"..."},...]
No markdown, no explanation.`,
        messages: [{ role: 'user', content: `Generate titles for these ${photos.length} photos:\n${photoList}` }],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Claude API error ${res.status}: ${errBody}`)
    }

    const data = await res.json()
    const text = data.content?.[0]?.text?.trim() || '[]'

    let titles: Array<{ id: string; title: string; ulTitle: string }>
    try {
      titles = JSON.parse(text)
    } catch {
      // Try extracting JSON from response
      const match = text.match(/\[[\s\S]*\]/)
      titles = match ? JSON.parse(match[0]) : []
    }

    return Response.json({ titles })
  } catch (error: any) {
    console.error('[photo-titles] Error:', error)
    return Response.json({ error: error?.message || 'Title generation failed' }, { status: 500 })
  }
}
