import { getCachedGlobal } from '@/utilities/getGlobals'
import { FooterClient } from './index.client'

export async function Footer() {
  const footer = await getCachedGlobal('footer', 1)()
  return <FooterClient footer={footer} />
}
