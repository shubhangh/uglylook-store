'use client'

import React, { useCallback, useEffect, useState } from 'react'
import './my-keys.css'

type PersonalKeyStatus = {
  hasPersonalKey: boolean
  maskedKey: string
  label: string
  effectiveSource: 'personal' | 'global' | 'env' | 'none'
}

type ProviderKey = 'anthropic' | 'bfl' | 'gemini' | 'openai'

const PROVIDERS: { key: ProviderKey; name: string }[] = [
  { key: 'anthropic', name: 'Anthropic (Claude)' },
  { key: 'bfl', name: 'BFL (FLUX)' },
  { key: 'gemini', name: 'Google (Gemini)' },
  { key: 'openai', name: 'OpenAI (GPT Image)' },
]

export const MyKeys: React.FC = () => {
  const [providers, setProviders] = useState<Record<string, PersonalKeyStatus>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState<string | null>(null)
  const [validateResult, setValidateResult] = useState<Record<string, boolean | null>>({})

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/next/ai-keys?scope=personal')
      if (!res.ok) throw new Error('Failed to load key status')
      const data = await res.json()
      setProviders(data.providers || {})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleSetKey = async (provider: string) => {
    if (!keyInput.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/next/ai-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'personal',
          provider,
          action: 'set',
          key: keyInput.trim(),
          keyLabel: labelInput.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save key')
      }
      const data = await res.json()
      setProviders(data.providers || {})
      setEditing(null)
      setKeyInput('')
      setLabelInput('')
      setValidateResult((prev) => ({ ...prev, [provider]: null }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (provider: string) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/next/ai-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'personal', provider, action: 'remove' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove key')
      }
      const data = await res.json()
      setProviders(data.providers || {})
      setValidateResult((prev) => ({ ...prev, [provider]: null }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async (provider: string) => {
    setValidating(provider)
    setValidateResult((prev) => ({ ...prev, [provider]: null }))
    try {
      const res = await fetch('/next/ai-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, action: 'validate' }),
      })
      const data = await res.json()
      setValidateResult((prev) => ({ ...prev, [provider]: data.valid === true }))
    } catch {
      setValidateResult((prev) => ({ ...prev, [provider]: false }))
    } finally {
      setValidating(null)
    }
  }

  const startEditing = (provider: string) => {
    setEditing(provider)
    setKeyInput('')
    setLabelInput(providers[provider]?.label || '')
  }

  if (loading) return <div className="my-keys"><div className="mk-loading">Loading key status...</div></div>
  if (error && !Object.keys(providers).length) return <div className="my-keys"><div className="mk-error">{error}</div></div>

  return (
    <div className="my-keys">
      <h2>My API Keys</h2>
      <div className="mk-info">
        Personal keys override global keys for your AI generation usage. Your keys are encrypted at rest and never visible to other users.
      </div>

      {error && <div className="mk-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="mk-grid">
        {PROVIDERS.map(({ key, name }) => {
          const status = providers[key] || { hasPersonalKey: false, maskedKey: '', label: '', effectiveSource: 'none' }
          const isEditing = editing === key

          return (
            <div className="mk-card" key={key}>
              <div className="mk-card-header">
                <span className="mk-provider">{name}</span>
                {status.hasPersonalKey ? (
                  <span className="mk-status mk-status--personal">Personal</span>
                ) : status.effectiveSource !== 'none' ? (
                  <span className={`mk-status mk-status--${status.effectiveSource}`}>
                    Using {status.effectiveSource}
                  </span>
                ) : (
                  <span className="mk-status mk-status--none">Not configured</span>
                )}
              </div>

              {status.hasPersonalKey && (
                <div className="mk-key-preview">
                  <span className="mk-masked">{status.maskedKey || '••••••••'}</span>
                  {status.label && <div className="mk-label">{status.label}</div>}
                </div>
              )}

              {!status.hasPersonalKey && status.effectiveSource !== 'none' && (
                <div className="mk-fallback-note">
                  Falling back to {status.effectiveSource} key. Set a personal key to override.
                </div>
              )}

              {isEditing ? (
                <div className="mk-form">
                  <input
                    className="mk-input"
                    type="password"
                    placeholder="Paste API key..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    autoFocus
                  />
                  <input
                    className="mk-input mk-input--label"
                    type="text"
                    placeholder="Label (e.g., Production, Dev, Personal)"
                    maxLength={30}
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                  />
                  <div className="mk-form-actions">
                    <button
                      className="mk-btn"
                      onClick={() => handleSetKey(key)}
                      disabled={saving || !keyInput.trim()}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="mk-btn"
                      onClick={() => { setEditing(null); setKeyInput(''); setLabelInput('') }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mk-actions">
                  <button className="mk-btn" onClick={() => startEditing(key)}>
                    {status.hasPersonalKey ? 'Update Key' : 'Set Key'}
                  </button>
                  {(status.hasPersonalKey || status.effectiveSource !== 'none') && (
                    <button
                      className="mk-btn"
                      onClick={() => handleValidate(key)}
                      disabled={validating === key}
                    >
                      {validating === key ? 'Checking...' : 'Validate'}
                      {validateResult[key] === true && (
                        <span className="mk-validate-result mk-validate-result--valid">&#10003;</span>
                      )}
                      {validateResult[key] === false && (
                        <span className="mk-validate-result mk-validate-result--invalid">&#10007;</span>
                      )}
                    </button>
                  )}
                  {status.hasPersonalKey && (
                    <button
                      className="mk-btn mk-btn--danger"
                      onClick={() => handleRemove(key)}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
