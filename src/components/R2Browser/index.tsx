'use client'

import React, { useCallback, useEffect, useState } from 'react'
import './r2-browser.scss'

type R2File = {
  key: string
  size: number
  lastModified: string
  url: string
  linked: boolean
  mediaId: string | null
}

type OrphanedMedia = {
  id: string
  filename: string
  url: string
}

type ApiResponse = {
  files: R2File[]
  orphaned: OrphanedMedia[]
  nextCursor: string | null
  totalR2: number
  isTruncated: boolean
}

export const R2Browser: React.FC = () => {
  const [files, setFiles] = useState<R2File[]>([])
  const [orphaned, setOrphaned] = useState<OrphanedMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'unlinked' | 'linked'>('all')

  const fetchFiles = useCallback(
    async (cursor?: string) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (cursor) params.set('cursor', cursor)

        const res = await fetch(`/next/r2-browser?${params}`, { credentials: 'include' })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to fetch')
        }
        const data: ApiResponse = await res.json()

        if (cursor) {
          setFiles((prev) => [...prev, ...data.files])
        } else {
          setFiles(data.files)
          setOrphaned(data.orphaned)
        }
        setNextCursor(data.nextCursor)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [search],
  )

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setFiles([])
    setNextCursor(null)
  }

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAllUnlinked = () => {
    const unlinked = filteredFiles.filter((f) => !f.linked).map((f) => f.key)
    setSelected(new Set(unlinked))
  }

  const clearSelection = () => setSelected(new Set())

  const handleImport = async () => {
    const keys = Array.from(selected).filter((key) => {
      const file = files.find((f) => f.key === key)
      return file && !file.linked
    })

    if (!keys.length) {
      setMessage({ type: 'error', text: 'No unlinked files selected' })
      return
    }

    setImporting(true)
    setMessage(null)
    try {
      const res = await fetch('/next/r2-browser', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      })
      const data = await res.json()

      if (data.imported?.length) {
        setMessage({
          type: 'success',
          text: `Imported ${data.imported.length} file(s)${data.failed?.length ? `, ${data.failed.length} failed` : ''}`,
        })
        // Refresh list
        setFiles([])
        setNextCursor(null)
        await fetchFiles()
      } else if (data.failed?.length) {
        setMessage({ type: 'error', text: `Failed to import: ${data.failed.map((f: any) => f.key).join(', ')}` })
      }

      setSelected(new Set())
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async () => {
    const keys = Array.from(selected)
    if (!keys.length) return

    const linkedKeys = keys.filter((key) => files.find((f) => f.key === key)?.linked)
    if (linkedKeys.length) {
      const ok = window.confirm(
        `${linkedKeys.length} selected file(s) are linked to Media docs. Deleting from R2 will break those references. Continue?`,
      )
      if (!ok) return
    } else {
      if (!window.confirm(`Delete ${keys.length} file(s) from R2? This cannot be undone.`)) return
    }

    setDeleting(true)
    setMessage(null)
    try {
      const res = await fetch('/next/r2-browser', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      })
      const data = await res.json()

      if (data.deleted?.length) {
        setMessage({ type: 'success', text: `Deleted ${data.deleted.length} file(s) from R2` })
        setFiles([])
        setNextCursor(null)
        await fetchFiles()
      }
      setSelected(new Set())
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setDeleting(false)
    }
  }

  const filteredFiles = files.filter((f) => {
    if (filter === 'unlinked') return !f.linked
    if (filter === 'linked') return f.linked
    return true
  })

  const unlinkedCount = files.filter((f) => !f.linked).length
  const linkedCount = files.filter((f) => f.linked).length
  const selectedUnlinked = Array.from(selected).filter((key) => !files.find((f) => f.key === key)?.linked).length

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImage = (key: string) => /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(key)

  return (
    <div className="r2-browser">
      <div className="r2-browser__header">
        <h2>R2 Media Browser</h2>
        <p className="r2-browser__subtitle">
          Browse and manage files in your Cloudflare R2 bucket. Import unlinked files into the Media collection.
        </p>
      </div>

      {/* Stats bar */}
      <div className="r2-browser__stats">
        <span className="r2-browser__stat">
          <strong>{files.length}</strong> files in R2
        </span>
        <span className="r2-browser__stat r2-browser__stat--linked">
          <strong>{linkedCount}</strong> linked
        </span>
        <span className="r2-browser__stat r2-browser__stat--unlinked">
          <strong>{unlinkedCount}</strong> unlinked
        </span>
        {orphaned.length > 0 && (
          <span className="r2-browser__stat r2-browser__stat--orphaned">
            <strong>{orphaned.length}</strong> orphaned refs
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="r2-browser__controls">
        <form onSubmit={handleSearch} className="r2-browser__search">
          <input
            type="text"
            placeholder="Filter by filename prefix..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="r2-browser__filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'unlinked' ? 'active' : ''}
            onClick={() => setFilter('unlinked')}
          >
            Unlinked
          </button>
          <button
            className={filter === 'linked' ? 'active' : ''}
            onClick={() => setFilter('linked')}
          >
            Linked
          </button>
        </div>

        <div className="r2-browser__actions">
          {selected.size > 0 ? (
            <>
              <span className="r2-browser__selection-count">
                {selected.size} selected ({selectedUnlinked} importable)
              </span>
              <button onClick={clearSelection} className="r2-browser__btn r2-browser__btn--secondary">
                Clear
              </button>
              <button
                onClick={handleImport}
                disabled={importing || selectedUnlinked === 0}
                className="r2-browser__btn r2-browser__btn--primary"
              >
                {importing ? 'Importing...' : `Import ${selectedUnlinked}`}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="r2-browser__btn r2-browser__btn--danger"
              >
                {deleting ? 'Deleting...' : `Delete ${selected.size}`}
              </button>
            </>
          ) : (
            <>
              <button onClick={selectAllUnlinked} className="r2-browser__btn r2-browser__btn--secondary">
                Select All Unlinked
              </button>
              <button onClick={() => { setFiles([]); setNextCursor(null); fetchFiles() }} className="r2-browser__btn r2-browser__btn--secondary">
                Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`r2-browser__message r2-browser__message--${message.type}`}>
          {message.text}
        </div>
      )}
      {error && <div className="r2-browser__message r2-browser__message--error">{error}</div>}

      {/* Grid */}
      {loading && files.length === 0 ? (
        <div className="r2-browser__loading">Loading R2 bucket...</div>
      ) : (
        <>
          <div className="r2-browser__grid">
            {filteredFiles.map((file) => (
              <div
                key={file.key}
                className={`r2-browser__card ${selected.has(file.key) ? 'r2-browser__card--selected' : ''}`}
                onClick={() => toggleSelect(file.key)}
              >
                <div className="r2-browser__card-thumb">
                  {isImage(file.key) ? (
                    <img
                      src={file.url}
                      alt={file.key}
                      loading="lazy"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreview(file.url)
                      }}
                    />
                  ) : (
                    <div className="r2-browser__card-icon">FILE</div>
                  )}
                  <span
                    className={`r2-browser__badge ${file.linked ? 'r2-browser__badge--linked' : 'r2-browser__badge--unlinked'}`}
                  >
                    {file.linked ? 'Linked' : 'Unlinked'}
                  </span>
                  {selected.has(file.key) && <span className="r2-browser__check">✓</span>}
                </div>
                <div className="r2-browser__card-info">
                  <span className="r2-browser__card-name" title={file.key}>
                    {file.key}
                  </span>
                  <span className="r2-browser__card-size">{formatSize(file.size)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {nextCursor && (
            <div className="r2-browser__loadmore">
              <button
                onClick={() => fetchFiles(nextCursor)}
                disabled={loading}
                className="r2-browser__btn r2-browser__btn--secondary"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Orphaned references warning */}
      {orphaned.length > 0 && (
        <div className="r2-browser__orphaned">
          <h3>Orphaned Media References</h3>
          <p>These media docs in MongoDB reference files that don&apos;t exist in R2:</p>
          <ul>
            {orphaned.map((o) => (
              <li key={o.id}>
                <code>{o.filename}</code> (ID: {o.id})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview lightbox */}
      {preview && (
        <div className="r2-browser__lightbox" onClick={() => setPreview(null)}>
          <div className="r2-browser__lightbox-close">&times;</div>
          <img src={preview} alt="Preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
