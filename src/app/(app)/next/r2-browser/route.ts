import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { isOwnerOrAdmin } from '@/access/utilities'
import crypto from 'crypto'

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  })
}

const BUCKET = process.env.R2_BUCKET || ''
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

// Auth helper: verify request is from owner/admin
async function authenticateAdmin(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || !isOwnerOrAdmin(user)) return null
  return { payload, user }
}

// GET — List all R2 objects, cross-reference with media collection
export async function GET(req: NextRequest) {
  const auth = await authenticateAdmin(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { payload } = auth
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const cursor = searchParams.get('cursor') || undefined

  if (!BUCKET) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 500 })
  }

  const s3 = getS3Client()

  // List R2 objects
  const listResult = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      MaxKeys: 200,
      ContinuationToken: cursor,
      Prefix: search || undefined,
    }),
  )

  const r2Files = (listResult.Contents || []).map((obj) => ({
    key: obj.Key || '',
    size: obj.Size || 0,
    lastModified: obj.LastModified?.toISOString() || '',
  }))

  // Get all media docs (filenames + urls)
  const allMedia = await payload.find({
    collection: 'media',
    limit: 0,
    pagination: false,
    select: { filename: true, url: true, id: true },
  })

  const mediaByFilename = new Map<string, { id: string; url: string }>()
  for (const doc of allMedia.docs) {
    if (doc.filename) {
      mediaByFilename.set(doc.filename, {
        id: typeof doc.id === 'string' ? doc.id : String(doc.id),
        url: (doc as any).url || '',
      })
    }
  }

  // Cross-reference
  const files = r2Files.map((f) => {
    const media = mediaByFilename.get(f.key)
    return {
      key: f.key,
      size: f.size,
      lastModified: f.lastModified,
      url: `${PUBLIC_URL}/${f.key}`,
      linked: !!media,
      mediaId: media?.id || null,
    }
  })

  // Find orphaned media docs (in MongoDB but not in R2)
  const r2Keys = new Set(r2Files.map((f) => f.key))
  const orphaned = allMedia.docs
    .filter((doc) => doc.filename && !r2Keys.has(doc.filename))
    .map((doc) => ({
      id: typeof doc.id === 'string' ? doc.id : String(doc.id),
      filename: doc.filename,
      url: (doc as any).url || '',
    }))

  return NextResponse.json({
    files,
    orphaned: cursor ? [] : orphaned, // Only send orphaned on first page
    nextCursor: listResult.NextContinuationToken || null,
    totalR2: listResult.KeyCount || 0,
    isTruncated: listResult.IsTruncated || false,
  })
}

// POST — Import unlinked R2 files into media collection
export async function POST(req: NextRequest) {
  const auth = await authenticateAdmin(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { payload } = auth
  const { keys } = (await req.json()) as { keys: string[] }

  if (!keys?.length) {
    return NextResponse.json({ error: 'No keys provided' }, { status: 400 })
  }

  const s3 = getS3Client()
  const imported: string[] = []
  const failed: { key: string; error: string }[] = []

  for (const key of keys) {
    try {
      // Check if already linked
      const existing = await payload.find({
        collection: 'media',
        where: { filename: { equals: key } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        imported.push(key) // Already exists, skip
        continue
      }

      // HEAD request for metadata
      const head = await s3.send(
        new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
      )

      const contentType = head.ContentType || 'application/octet-stream'
      const filesize = head.ContentLength || 0

      // Determine dimensions for images
      let width: number | undefined
      let height: number | undefined

      if (contentType.startsWith('image/')) {
        try {
          // Fetch file to get dimensions and hash
          const fileRes = await fetch(`${PUBLIC_URL}/${key}`)
          const buffer = Buffer.from(await fileRes.arrayBuffer())

          // Get dimensions via sharp
          const sharp = (await import('sharp')).default
          const metadata = await sharp(buffer).metadata()
          width = metadata.width
          height = metadata.height

          // Compute hash
          const hash = crypto.createHash('sha256').update(buffer).digest('hex')

          // Create media doc
          await payload.create({
            collection: 'media',
            data: {
              filename: key,
              url: `${PUBLIC_URL}/${key}`,
              mimeType: contentType,
              filesize,
              width,
              height,
              imageHash: hash,
            } as any,
            filePath: undefined as any, // Skip file upload — already in R2
          })

          imported.push(key)
        } catch (imgErr: any) {
          // Fallback: create without dimensions
          await payload.create({
            collection: 'media',
            data: {
              filename: key,
              url: `${PUBLIC_URL}/${key}`,
              mimeType: contentType,
              filesize,
            } as any,
            filePath: undefined as any,
          })
          imported.push(key)
        }
      } else {
        // Non-image file
        await payload.create({
          collection: 'media',
          data: {
            filename: key,
            url: `${PUBLIC_URL}/${key}`,
            mimeType: contentType,
            filesize,
          } as any,
          filePath: undefined as any,
        })
        imported.push(key)
      }
    } catch (err: any) {
      failed.push({ key, error: err.message || 'Unknown error' })
    }
  }

  return NextResponse.json({ imported, failed })
}

// DELETE — Remove files from R2 bucket
export async function DELETE(req: NextRequest) {
  const auth = await authenticateAdmin(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { keys } = (await req.json()) as { keys: string[] }

  if (!keys?.length) {
    return NextResponse.json({ error: 'No keys provided' }, { status: 400 })
  }

  const s3 = getS3Client()
  const deleted: string[] = []
  const failed: { key: string; error: string }[] = []

  for (const key of keys) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
      deleted.push(key)
    } catch (err: any) {
      failed.push({ key, error: err.message || 'Unknown error' })
    }
  }

  return NextResponse.json({ deleted, failed })
}
