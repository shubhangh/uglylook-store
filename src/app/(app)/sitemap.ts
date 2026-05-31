import type { MetadataRoute } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = getServerSideURL()
  const payload = await getPayload({ config: configPromise })

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${url}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${url}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${url}/thesis`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${url}/lanes`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${url}/drop`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${url}/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${url}/faq`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${url}/shipping-returns`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${url}/size-guide`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${url}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${url}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${url}/blog`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  // Products
  const products = await payload.find({
    collection: 'products',
    where: { _status: { equals: 'published' } },
    select: { slug: true, updatedAt: true },
    limit: 1000,
    pagination: false,
  })

  const productPages: MetadataRoute.Sitemap = products.docs.map((product) => ({
    url: `${url}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Blog posts
  const posts = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    select: { slug: true, updatedAt: true },
    limit: 1000,
    pagination: false,
  })

  const postPages: MetadataRoute.Sitemap = posts.docs.map((post) => ({
    url: `${url}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Categories
  const categories = await payload.find({
    collection: 'categories',
    select: { slug: true },
    where: { showOnStorefront: { equals: true } },
    limit: 100,
    pagination: false,
  })

  const categoryPages: MetadataRoute.Sitemap = categories.docs.map((cat) => ({
    url: `${url}/shop/${cat.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...postPages, ...categoryPages]
}
