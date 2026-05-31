/** Map each global slug to the frontend page it controls */
const globalPageMap: Record<string, string> = {
  announcementBar: '/',
  header: '/',
  footer: '/',
  homepage: '/',
  thesisPage: '/thesis',
  lanesPage: '/lanes',
  dropPage: '/drop',
  contactPage: '/contact',
  faqPage: '/faq',
  shippingReturnsPage: '/shipping-returns',
  sizeGuidePage: '/size-guide',
  privacyPage: '/privacy',
  termsPage: '/terms',
}

export function generateGlobalPreviewPath(slug: string): string {
  return globalPageMap[slug] || '/'
}
