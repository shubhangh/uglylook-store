import styles from './journal.module.css'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const metadata = {
  title: 'Journal',
  description: 'Stories, drops, and culture from UglyLook.',
}

export const dynamic = 'force-dynamic'

export default async function JournalPage() {
  const payload = await getPayload({ config: configPromise })
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 20,
  })

  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <div className="min-h-screen bg-card">
      <main className={styles.page}>
        <section className={styles.hero}>
          <span className={styles.label}>Journal</span>
          <h1 className={styles.title}>Stories, drops, and culture.</h1>
        </section>

        {featured && (
          <Link href={`/journal/${featured.slug}`} className={styles.featured}>
            <div className={styles.featuredImage}>
              {typeof featured.coverImage === 'object' && featured.coverImage?.url && (
                <img src={featured.coverImage.url} alt={featured.title} />
              )}
            </div>
            <div className={styles.featuredContent}>
              <span className={styles.tag}>{featured.category}</span>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className={styles.meta}>
                <span>{featured.author}</span>
                {featured.publishedAt && (
                  <time>
                    {new Date(featured.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                )}
              </div>
            </div>
          </Link>
        )}

        <section className={styles.grid}>
          {rest.map((post) => (
            <Link href={`/journal/${post.slug}`} key={post.id} className={styles.card}>
              <div className={styles.cardImage}>
                {typeof post.coverImage === 'object' && post.coverImage?.url && (
                  <img src={post.coverImage.url} alt={post.title} />
                )}
              </div>
              <div className={styles.cardContent}>
                <span className={styles.tag}>{post.category}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <time>
                  {post.publishedAt &&
                    new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                </time>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}
