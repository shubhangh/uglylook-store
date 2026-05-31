'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@payloadcms/ui'

/**
 * Applies role-based UI restrictions across the entire admin panel.
 * Registered as a provider — wraps all admin pages.
 *
 * Manager/Editor restrictions:
 * - API buttons: visible but disabled
 * - MCP nav group: hidden
 * - Automate nav group: hidden
 * - "Publish" / "Publish Changes" button: renamed to "Submit for Approval"
 */

const HIDDEN_NAV_GROUPS = ['mcp', 'automate']
const HIDDEN_NAV_LINKS = ['global keys']

// Collections that use the approval workflow
const APPROVAL_COLLECTIONS = ['products', 'posts', 'coupons', 'offers']

export const RoleRestrictions: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()

  useEffect(() => {
    const u = user as any
    if (!u?.role) return

    const isRestricted = ['manager', 'editor'].includes(u.role)
    if (!isRestricted) return

    function applyRestrictions() {
      // 1. Disable API buttons/links
      const apiLinks = document.querySelectorAll<HTMLElement>(
        'a[href*="/api/"], button[class*="api"], [class*="api-url"], a[class*="api"]',
      )
      apiLinks.forEach((el) => {
        if (el.textContent?.toLowerCase().includes('api') && !el.hasAttribute('data-role-restricted')) {
          el.setAttribute('data-role-restricted', 'true')
          el.style.opacity = '0.3'
          el.style.pointerEvents = 'none'
          el.style.cursor = 'not-allowed'
          el.setAttribute('tabindex', '-1')
          el.setAttribute('title', 'Restricted to Admin/Owner roles')
        }
      })

      const apiUrls = document.querySelectorAll<HTMLElement>('[class*="copyToClipboard"]')
      apiUrls.forEach((el) => {
        const parent = (el.closest('[class*="api"]') || el.parentElement) as HTMLElement | null
        if (parent && !parent.hasAttribute('data-role-restricted')) {
          parent.setAttribute('data-role-restricted', 'true')
          parent.style.opacity = '0.3'
          parent.style.pointerEvents = 'none'
        }
      })

      // 2. Hide MCP, Automate, API Keys nav groups and links from sidebar
      const navGroups = document.querySelectorAll<HTMLElement>('.nav-group')
      navGroups.forEach((group) => {
        const toggle = group.querySelector('.nav-group__toggle')
        const label = toggle?.textContent?.trim().toLowerCase() || ''
        if (HIDDEN_NAV_GROUPS.some((g) => label.includes(g))) {
          if (!group.hasAttribute('data-role-hidden')) {
            group.setAttribute('data-role-hidden', 'true')
            group.style.display = 'none'
          }
        }
      })

      // Also hide individual sidebar nav links that match (MCP plugin adds standalone links)
      const navLinks = document.querySelectorAll<HTMLElement>('nav a, [class*="nav"] a')
      navLinks.forEach((link) => {
        const text = link.textContent?.trim().toLowerCase() || ''
        const href = link.getAttribute('href')?.toLowerCase() || ''
        if (
          HIDDEN_NAV_GROUPS.some((g) => text.includes(g)) ||
          HIDDEN_NAV_LINKS.some((g) => text.includes(g)) ||
          href.includes('/mcp') ||
          href.includes('/collections/global-keys')
        ) {
          if (link.closest('[data-role-hidden]')) return
          // For individual links inside a visible group, hide just the link item
          const listItem = link.closest('li') as HTMLElement | null
          const target = listItem || link.parentElement as HTMLElement | null
          if (target && !target.hasAttribute('data-role-hidden')) {
            target.setAttribute('data-role-hidden', 'true')
            target.style.display = 'none'
          }
        }
      })

      // 3. Hide MCP, Automate, API Keys cards from dashboard
      const dashboardCards = document.querySelectorAll<HTMLElement>('[class*="card"], [class*="Card"]')
      dashboardCards.forEach((card) => {
        const text = card.textContent?.trim().toLowerCase() || ''
        if (HIDDEN_NAV_GROUPS.some((g) => text.includes(g))) {
          if (!card.hasAttribute('data-role-hidden')) {
            card.setAttribute('data-role-hidden', 'true')
            card.style.display = 'none'
          }
        }
      })

      // 4. On approval-workflow collections: rename publish buttons + hide approval options
      const isApprovalPage = APPROVAL_COLLECTIONS.some(
        (col) => window.location.pathname.includes(`/collections/${col}/`),
      )

      if (isApprovalPage) {
        // 4a. Rename "Publish" / "Publish Changes" buttons
        const allElements = document.querySelectorAll<HTMLElement>('button, [role="button"]')
        allElements.forEach((el) => {
          if (el.hasAttribute('data-role-relabeled')) return
          const spans = el.querySelectorAll('span')
          spans.forEach((span) => {
            const text = span.textContent?.trim()
            if (text === 'Publish' || text === 'Publish changes') {
              span.textContent = 'Submit for Approval'
              el.setAttribute('data-role-relabeled', 'true')
            }
          })
          // Also check direct text content for buttons without spans
          if (!el.hasAttribute('data-role-relabeled')) {
            const text = el.textContent?.trim()
            if (text === 'Publish' || text === 'Publish changes') {
              const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
              let node: Text | null
              while ((node = walker.nextNode() as Text | null)) {
                const t = node.textContent?.trim()
                if (t === 'Publish' || t === 'Publish changes') {
                  node.textContent = 'Submit for Approval'
                }
              }
              el.setAttribute('data-role-relabeled', 'true')
            }
          }
        })

        // 4b. Remove "Approved" and "Rejected" from approvalStatus select dropdown
        const selects = document.querySelectorAll<HTMLSelectElement>('select')
        selects.forEach((select) => {
          const options = select.querySelectorAll('option')
          options.forEach((opt) => {
            if (opt.value === 'approved' || opt.value === 'rejected') {
              if (!opt.hasAttribute('data-role-hidden')) {
                opt.setAttribute('data-role-hidden', 'true')
                opt.style.display = 'none'
                opt.disabled = true
              }
            }
          })
        })

        // 4c. Also handle Payload's custom select (non-native) — remove items from dropdown lists
        const selectOptions = document.querySelectorAll<HTMLElement>('[class*="select-option"], [class*="option"]')
        selectOptions.forEach((opt) => {
          const text = opt.textContent?.trim().toLowerCase()
          if ((text === 'approved' || text === 'rejected') && !opt.hasAttribute('data-role-hidden')) {
            opt.setAttribute('data-role-hidden', 'true')
            opt.style.display = 'none'
          }
        })
      }
    }

    applyRestrictions()
    const observer = new MutationObserver(applyRestrictions)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [user])

  return <>{children}</>
}
