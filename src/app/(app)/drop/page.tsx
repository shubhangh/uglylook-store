import { getCachedGlobal } from '@/utilities/getGlobals'
import type { DropPage } from '@/payload-types'
import DropClient from './DropClient'

export default async function DropPage() {
  const data = await getCachedGlobal('dropPage', 1)() as DropPage

  return <DropClient data={data} />
}
