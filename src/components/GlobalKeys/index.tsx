'use client'

import React, { useCallback, useEffect, useState } from 'react'
import './global-keys.css'

type GlobalKeyStatus = {
  hasGlobalKey: boolean
  hasEnvKey: boolean
  maskedKey: string
  label: string
}

type ProviderKey = 'anthropic' | 'bfl' | 'gemini' | 'openai'

const PROVIDERS: { key: ProviderKey; name: string }[] = [
  { key: 'anthropic', name: 'Anthropic (Claude)' },
  { key: 'bfl', name: 'BFL (FLUX)' },
  { key: 'gemini', name: 'Google (Gemini)' },
  { key: 'openai', name: 'OpenAI (GPT Image)' },
]

export const GlobalKeys: React.FC = () => {
  const [providers, setProviders] = useState<Record<string, GlobalKeyStatus>>({})
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
      const res = await fetch('/next/ai-keys?scope=global')
      if (!res.ok) {
        if (res.status === 403) throw new Error('Access denied. Only owners and admins can manage global keys.')
        throw new Error('Failed to load key status')
      }
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
          scope: 'global',
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
        body: JSON.stringify({ scope: 'global', provider, action: 'remove' }),
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

  if (loading) return <div className="global-keys"><div className="gk-loading">Loading global key status...</div></div>
  if (error && !Object.keys(providers).length) return <div className="global-keys"><div className="gk-error">{error}</div></div>

  return (
    <div className="global-keys">
      <h2>Global API Keys</h2>
      <div className="gk-info">
        Global keys are shared across all team members who don&apos;t have personal keys set. Only owners and admins can manage these.
      </div>

      {error && <div className="gk-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="gk-grid">
        {PROVIDERS.map(({ key, name }) => {
          const status = providers[key] || { hasGlobalKey: false, hasEnvKey: false, maskedKey: '', label: '' }
          const isEditing = editing === key
          const isConfigured = status.hasGlobalKey || status.hasEnvKey

          return (
            <div className="gk-card" key={key}>
              <div className="gk-card-header">
                <span className="gk-provider">{name}</span>
                {status.hasGlobalKey ? (
                  <span className="gk-status gk-status--configured">Configured</span>
                ) : status.hasEnvKey ? (
                  <span className="gk-status gk-status--env">Env var</span>
                ) : (
                  <span className="gk-status gk-status--none">Not configured</span>
                )}
              </div>

              {status.hasGlobalKey && (
                <div className="gk-key-preview">
                  <span className="gk-masked">{status.maskedKey || '••••••••'}</span>
                  {status.label && <div className="gk-label">{status.label}</div>}
                </div>
              )}

              {!status.hasGlobalKey && status.hasEnvKey && (
                <div className="gk-env-note">
                  Using environment variable. Set a global key in the database to override.
                </div>
              )}

              {isEditing ? (
                <div className="gk-form">
                  <input
                    className="gk-input"
                    type="password"
                    placeholder="Paste API key..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    autoFocus
                  />
                  <input
                    className="gk-input gk-input--label"
                    type="text"
                    placeholder="Label (e.g., Production, Dev)"
                    maxLength={30}
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                  />
                  <div className="gk-form-actions">
                    <button
                      className="gk-btn"
                      onClick={() => handleSetKey(key)}
                      disabled={saving || !keyInput.trim()}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="gk-btn"
                      onClick={() => { setEditing(null); setKeyInput(''); setLabelInput('') }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="gk-actions">
                  <button className="gk-btn" onClick={() => startEditing(key)}>
                    {status.hasGlobalKey ? 'Update Key' : 'Set Key'}
                  </button>
                  {isConfigured && (
                    <button
                      className="gk-btn"
                      onClick={() => handleValidate(key)}
                      disabled={validating === key}
                    >
                      {validating === key ? 'Checking...' : 'Validate'}
                      {validateResult[key] === true && (
                        <span className="gk-validate-result gk-validate-result--valid">&#10003;</span>
                      )}
                      {validateResult[key] === false && (
                        <span className="gk-validate-result gk-validate-result--invalid">&#10007;</span>
                      )}
                    </button>
                  )}
                  {status.hasGlobalKey && (
                    <button
                      className="gk-btn gk-btn--danger"
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
