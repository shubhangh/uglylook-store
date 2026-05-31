import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { checkRole } from '@/access/utilities'
import {
  parseUploadedFiles,
  analyzeProducts,
  buildProductPreviews,
} from '@/endpoints/bulk-upload'
import type { UploadedFile } from '@/endpoints/bulk-upload'

export const maxDuration = 300 // 5 min — AI analysis takes time

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const files: UploadedFile[] = []
    const forceReanalyze = formData.get('forceReanalyze') === 'true'

    // Process all uploaded files
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        const buffer = Buffer.from(await value.arrayBuffer())
        const relativePath =
          formData.get(`path_${files.length}`)?.toString() ||
          value.name
        files.push({
          name: value.name,
          relativePath,
          buffer,
        })
      }
    }

    // Handle indexed file entries (file_0, file_1, etc.)
    let idx = 0
    while (formData.has(`file_${idx}`)) {
      const file = formData.get(`file_${idx}`) as File
      const path = formData.get(`path_${idx}`)?.toString() || file.name
      const buffer = Buffer.from(await file.arrayBuffer())
      files.push({
        name: file.name,
        relativePath: path,
        buffer,
      })
      idx++
    }

    if (files.length === 0) {
      return Response.json({ error: 'No files uploaded' }, { status: 400 })
    }

    payload.logger.info(`[bulk-upload] Received ${files.length} files, parsing...`)

    // Step 1: Parse files into product groups
    const parsedProducts = parseUploadedFiles(files)
    payload.logger.info(
      `[bulk-upload] Parsed ${parsedProducts.length} products from ${files.length} files`,
    )

    if (parsedProducts.length === 0) {
      return Response.json(
        {
          error:
            'No valid products found. Ensure files are in category subfolders (hats/, hoodies/, tshirts/, etc.)',
        },
        { status: 400 },
      )
    }

    // Step 2: AI analysis with cache (send primary image of each product to Gemini)
    payload.logger.info(
      `[bulk-upload] Starting AI analysis (forceReanalyze: ${forceReanalyze})...`,
    )
    const analysisInput = parsedProducts.map((p) => ({
      number: p.number,
      name: p.name,
      category: p.category,
      imageBuffer: p.primaryImage.buffer,
      mimeType: p.primaryImage.mimeType,
    }))

    const analyses = await analyzeProducts(
      analysisInput,
      payload,
      forceReanalyze,
      (current, total, name) => {
        payload.logger.info(`[bulk-upload] Analyzing ${current}/${total}: ${name}`)
      },
    )

    // Step 3: Build product previews
    const previews = buildProductPreviews(parsedProducts, analyses)

    payload.logger.info(
      `[bulk-upload] Analysis complete. ${previews.length} products ready for review.`,
    )

    return Response.json({
      products: previews,
      totalFiles: files.length,
      totalProducts: previews.length,
    })
  } catch (err) {
    payload.logger.error({ err, message: 'Error in bulk upload analysis' })
    return Response.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 },
    )
  }
}
