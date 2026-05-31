import type { GlobalAfterChangeHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

const globalPathMap: Record<string, string[]> = {
  header: ['/'],
  footer: ['/'],
  announcementBar: ['/'],
  homepage: ['/'],
  thesisPage: ['/thesis'],
  lanesPage: ['/lanes'],
  dropPage: ['/drop'],
  contactPage: ['/contact'],
  faqPage: ['/faq'],
  shippingReturnsPage: ['/shipping-returns'],
  sizeGuidePage: ['/size-guide'],
  privacyPage: ['/privacy'],
  termsPage: ['/terms'],
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ global, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    const tag = `global_${global.slug}`
    payload.logger.info(`Revalidating global: ${tag}`)
    revalidateTag(tag, 'max')

    const paths = globalPathMap[global.slug]
    if (paths) {
      for (const path of paths) {
        payload.logger.info(`Revalidating path: ${path}`)
        revalidatePath(path)
      }
    }

    // Layout globals (header, footer, announcement) affect all pages
    if (['header', 'footer', 'announcementBar'].includes(global.slug)) {
      payload.logger.info(`Revalidating layout (all paths)`)
      revalidatePath('/', 'layout')
    }
  }
}
