import { getCachedGlobal } from '@/utilities/getGlobals'
import type { ContactPage } from '@/payload-types'
import ContactClient from './ContactClient'

export default async function ContactPage() {
  const data = await getCachedGlobal('contactPage', 1)() as ContactPage

  return <ContactClient data={data} />
}
