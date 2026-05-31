'use client'

import React, { useCallback, useRef, useState } from 'react'

type Props = {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export const FileUploader: React.FC<Props> = ({ onFilesSelected, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedCount, setSelectedCount] = useState(0)
  const [folderSummary, setFolderSummary] = useState<Record<string, number>>({})

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => {
        const ext = f.name.toLowerCase().split('.').pop()
        return ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')
      })

      if (files.length === 0) return

      // Build folder summary
      const summary: Record<string, number> = {}
      for (const file of files) {
        // webkitRelativePath: "5/hats/01-file.jpg" or "hats/01-file.jpg"
        const path = (file as any).webkitRelativePath || file.name
        const parts = path.replace(/\\/g, '/').split('/')
        // Find the category folder
        for (const part of parts) {
          const lower = part.toLowerCase()
          if (
            [
              'hats',
              'hoodies',
              'tshirts',
              'totes',
              'jackets',
              'pants',
              'accessories',
              'sets',
              'neon',
            ].includes(lower)
          ) {
            summary[lower] = (summary[lower] || 0) + 1
            break
          }
        }
      }

      setSelectedCount(files.length)
      setFolderSummary(summary)
      onFilesSelected(files)
    },
    [onFilesSelected],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files)
    },
    [processFiles],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files) processFiles(e.dataTransfer.files)
    },
    [processFiles],
  )

  return (
    <div className="bulk-upload__uploader">
      <div
        className={`bulk-upload__dropzone ${dragOver ? 'bulk-upload__dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          /* @ts-expect-error webkitdirectory is non-standard */
          webkitdirectory=""
          multiple
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        <div className="bulk-upload__dropzone-content">
          <div className="bulk-upload__dropzone-icon">+</div>
          <div className="bulk-upload__dropzone-text">
            Click to select product folder
          </div>
          <div className="bulk-upload__dropzone-hint">
            Select the folder containing category subfolders (hats/, hoodies/, tshirts/, etc.)
          </div>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="bulk-upload__file-summary">
          <strong>{selectedCount} images selected</strong>
          <div className="bulk-upload__folder-list">
            {Object.entries(folderSummary)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([folder, count]) => (
                <span key={folder} className="bulk-upload__folder-tag">
                  {folder}: {count}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
