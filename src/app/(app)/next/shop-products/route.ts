import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import type { Where } from 'payload'

const ALLOWED_SORTS = new Set([
  'title',
  '-title',
  'createdAt',
  '-createdAt',
  'priceInUSD',
  '-priceInUSD',
])

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const rawLimit = parseInt(searchParams.get('limit') || '12', 10)
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 48)) : 12
  const sort = ALLOWED_SORTS.has(searchParams.get('sort') || '') ? searchParams.get('sort')! : 'title'
  const category = searchParams.get('category') || ''
  const q = searchParams.get('q') || ''

  const payload = await getPayload({ config: configPromise })

  // If category is a slug (not an ObjectID), resolve it
  let categoryId = category
  if (category && !/^[a-f\d]{24}$/i.test(category)) {
    const cats = await payload.find({
      collection: 'categories',
      where: {
        and: [
          { slug: { equals: category } },
          { showOnStorefront: { equals: true } },
        ],
      },
      limit: 1,
    })
    categoryId = cats.docs[0]?.id || ''
  }

  // Only return published products with a displayable image
  const whereConditions: Where[] = [
    { _status: { equals: 'published' } },
    { heroImage: { exists: true } },
  ]

  if (q) {
    whereConditions.push({
      or: [
        { title: { like: q } },
        { description: { like: q } },
      ],
    })
  }

  if (categoryId) {
    whereConditions.push({
      categories: { contains: categoryId },
    })
  }

  const products = await payload.find({
    collection: 'products',
    depth: 2,
    limit,
    page,
    sort,
    select: {
      title: true,
      slug: true,
      heroImage: true,
      gallery: true,
      categories: true,
      priceInUSD: true,
      createdAt: true,
    },
    where: { and: whereConditions },
  })

  return NextResponse.json({
    docs: products.docs,
    totalDocs: products.totalDocs,
    hasNextPage: products.hasNextPage,
    nextPage: products.nextPage,
  })
}
