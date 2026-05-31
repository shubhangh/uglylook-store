import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Auto-stamps new notes with addedBy (user email) and addedAt (ISO timestamp).
 * Prevents editing or deleting existing notes (append-only).
 */
export const stampOrderNotes: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  if (!data.notes) return data

  const existingNotes = originalDoc?.notes || []
  const incomingNotes = data.notes || []

  if (operation === 'update') {
    // Preserve all existing notes — cannot edit or delete
    const preserved = existingNotes.map((note: any, i: number) => ({
      ...note,
    }))

    // Find new notes (anything beyond existing count)
    const newNotes = incomingNotes.slice(existingNotes.length)

    // Stamp new notes
    const stamped = newNotes.map((note: any) => ({
      ...note,
      addedBy: note.addedBy || (req.user as any)?.email || 'system',
      addedAt: note.addedAt || new Date().toISOString(),
    }))

    data.notes = [...preserved, ...stamped]
  }

  if (operation === 'create') {
    // Stamp all notes on create
    data.notes = incomingNotes.map((note: any) => ({
      ...note,
      addedBy: note.addedBy || (req.user as any)?.email || 'system',
      addedAt: note.addedAt || new Date().toISOString(),
    }))
  }

  return data
}
