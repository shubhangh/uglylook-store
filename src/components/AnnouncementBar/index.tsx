import { getCachedGlobal } from '@/utilities/getGlobals'
import type { AnnouncementBar as AnnouncementBarType } from '@/payload-types'
import { AnnouncementBarClient } from './index.client'

export async function AnnouncementBar() {
  const data = (await getCachedGlobal('announcementBar', 1)()) as AnnouncementBarType
  // Always render the client component so useLivePreview can receive draft data.
  // The client component handles the enabled/dismissed logic.
  return <AnnouncementBarClient data={data} />
}
