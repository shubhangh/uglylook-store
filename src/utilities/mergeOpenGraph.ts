import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Streetwear tees, hoodies and objects. 240gsm cotton, boxy fit, printed when you order. Ugly is the new sick.',
  images: [
    {
      url: '/og-image.jpg',
    },
  ],
  siteName: 'UglyLook',
  title: 'UglyLook — Ugly is the new sick.',
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
