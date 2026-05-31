import { getServerSideURL } from './getURL'

export function getOrganizationJsonLd() {
  const url = getServerSideURL()
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UglyLook',
    url,
    logo: `${url}/favicon.svg`,
    description:
      'Streetwear tees, hoodies and objects. 240gsm cotton, boxy fit, printed when you order. Ugly is the new sick.',
    foundingDate: '2026',
  }
}

export function getWebsiteJsonLd() {
  const url = getServerSideURL()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UglyLook',
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  const url = getServerSideURL()
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${url}${item.url}`,
    })),
  }
}
