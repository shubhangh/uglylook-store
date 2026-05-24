import styles from './post.module.css'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const post = docs[0]
  if (!post) return { title: 'Post Not Found | UglyLook' }
  return {
    title: `${post.title} | UglyLook Reads`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const post = docs[0]
  if (!post) return notFound()

  return (
    <div className="min-h-screen bg-card">
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/blog" className={styles.back}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </Link>
          <span className={styles.tag}>{post.category}</span>
        </div>
        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.excerpt}>{post.excerpt}</p>
        <div className={styles.meta}>
          <span className={styles.author}>{post.author}</span>
          {post.publishedAt && (
            <time>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
          )}
        </div>
      </header>

      {typeof post.coverImage === 'object' && post.coverImage?.url && (
        <div className={styles.cover}>
          <img src={post.coverImage.url} alt={post.title} />
        </div>
      )}

      <article className={styles.content}>
        {post.content && <RichText data={post.content} />}
      </article>

      <footer className={styles.footer}>
        <Link href="/blog" className={styles.backLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          All reads
        </Link>
      </footer>
    </main>
    </div>
  )
}
