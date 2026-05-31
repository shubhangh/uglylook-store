import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { checkRole } from '@/access/utilities'

export async function GET(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { docs, totalDocs } = await payload.find({
      collection: 'products',
      limit: 200,
      sort: 'title',
      select: { title: true, slug: true, categories: true, priceInUSD: true },
    })

    const products = docs.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      price: doc.priceInUSD,
      categories: doc.categories?.map((c: any) =>
        typeof c === 'string' ? c : c.title,
      ),
    }))

    return Response.json({ count: totalDocs, products })
  } catch (err) {
    payload.logger.error({ err, message: 'Error fetching product status' })
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
