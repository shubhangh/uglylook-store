import type { Metadata } from 'next'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { AboutPage, ThesisPage, LanesPage, Homepage } from '@/payload-types'
import { AboutClient } from './AboutClient'

export async function generateMetadata(): Promise<Metadata> {
  const data = (await getCachedGlobal('aboutPage', 1)()) as AboutPage
  return {
    title: data.metaTitle || 'About',
    description:
      data.metaDescription ||
      "The brand behind the name. UglyLook's philosophy, design lanes, and quality standards.",
  }
}

export default async function AboutPageRoute() {
  const [aboutData, thesisData, lanesData, homepageData] = await Promise.all([
    getCachedGlobal('aboutPage', 1)() as Promise<AboutPage>,
    getCachedGlobal('thesisPage', 1)() as Promise<ThesisPage>,
    getCachedGlobal('lanesPage', 1)() as Promise<LanesPage>,
    getCachedGlobal('homepage', 1)() as Promise<Homepage>,
  ])

  return (
    <AboutClient
      aboutData={aboutData}
      thesisData={thesisData}
      lanesData={lanesData}
      homepageData={homepageData}
    />
  )
}
