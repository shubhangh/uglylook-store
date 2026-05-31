import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Post } from '@/payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc.status === 'published') {
      const path = `/blog/${doc.slug}`
      payload.logger.info(`Revalidating post at path: ${path}`)
      revalidatePath(path)
      revalidatePath('/blog')
      revalidateTag(`posts_${doc.slug}`, 'max')
    }

    if (previousDoc?.status === 'published' && doc.status !== 'published') {
      const oldPath = `/blog/${previousDoc.slug}`
      payload.logger.info(`Revalidating old post at path: ${oldPath}`)
      revalidatePath(oldPath)
      revalidatePath('/blog')
      revalidateTag(`posts_${previousDoc.slug}`, 'max')
    }
  }
  return doc
}

export const revalidateDeletePost: CollectionAfterDeleteHook<Post> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const path = `/blog/${doc?.slug}`
    payload.logger.info(`Revalidating deleted post at path: ${path}`)
    revalidatePath(path)
    revalidatePath('/blog')
    revalidateTag(`posts_${doc?.slug}`, 'max')
  }
  return doc
}
