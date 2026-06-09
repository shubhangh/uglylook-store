'use client'

import React, { useEffect, useRef } from 'react'

/**
 * HeroImageSwap — admin provider for product pages.
 *
 * 1. Injects a "Swap" button on the hero image upload field.
 * 2. Injects "Product Images" / "All Media" tabs into the media picker drawer.
 */
export const HeroImageSwap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const galleryFilenames = useRef<string[]>([])

  useEffect(() => {
    if (!window.location.pathname.includes('/collections/products/')) return

    const interval = setInterval(() => {
      collectGalleryFilenames()
      injectSwapButton()
      injectDrawerTabs()
    }, 2000)

    return () => clearInterval(interval)

    // Collect gallery filenames from the page (before drawer opens)
    function collectGalleryFilenames() {
      const names: string[] = []

      // Find the Gallery array section by its heading
      const headings = document.querySelectorAll('h3')
      let gallerySection: HTMLElement | null = null
      for (const h of headings) {
        if (h.textContent?.trim() === 'Gallery') {
          // The gallery array container is the parent field-type
          gallerySection = h.closest('.field-type') as HTMLElement
          break
        }
      }

      if (gallerySection) {
        // Get filenames from upload detail links within the gallery section
        gallerySection.querySelectorAll('.upload-relationship-details a').forEach((a) => {
          const text = a.textContent?.trim()
          if (text && /\.(jpg|jpeg|png|webp|gif)$/i.test(text)) {
            names.push(text)
          }
        })
        // Fallback: get from img src
        if (names.length === 0) {
          gallerySection.querySelectorAll('.upload-relationship-details img').forEach((img) => {
            const src = (img as HTMLImageElement).src
            if (src) {
              const name = src.split('/').pop()?.split('?')[0]
              if (name && !names.includes(name)) names.push(name)
            }
          })
        }
      }

      // Also include catalog images section
      for (const h of headings) {
        if (h.textContent?.trim() === 'Catalog Images') {
          const section = h.closest('.field-type') as HTMLElement
          if (section) {
            section.querySelectorAll('.upload-relationship-details a').forEach((a) => {
              const text = a.textContent?.trim()
              if (text && /\.(jpg|jpeg|png|webp|gif)$/i.test(text) && !names.includes(text)) {
                names.push(text)
              }
            })
          }
          break
        }
      }

      if (names.length > 0) {
        galleryFilenames.current = names
      }
    }

    function injectSwapButton() {
      const labels = document.querySelectorAll('label, .field-label')
      let heroField: HTMLElement | null = null
      for (const label of labels) {
        if (label.textContent?.trim() === 'Hero Image') {
          heroField = label.closest('.field-type') as HTMLElement
          break
        }
      }
      if (!heroField) return

      const details = heroField.querySelector('.upload-relationship-details')
      if (!details || heroField.querySelector('.hero-swap-btn')) return

      const removeBtn = heroField.querySelector('.upload-relationship-details__remove') as HTMLButtonElement
      if (!removeBtn) return

      const swapBtn = document.createElement('button')
      swapBtn.type = 'button'
      swapBtn.className = 'btn btn--icon btn--icon-style-none btn--icon-only btn--size-medium hero-swap-btn'
      swapBtn.title = 'Swap — choose a different image'
      swapBtn.style.cssText = 'order: -1; color: var(--theme-elevation-600, #aaa); cursor: pointer;'
      swapBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M21 3L9 15"/><path d="M8 21H3v-5"/><path d="M3 21l12-12"/></svg>'

      swapBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        collectGalleryFilenames() // refresh before opening
        removeBtn.click()
        setTimeout(() => {
          const listToggler = heroField?.querySelector('.upload__listToggler') as HTMLButtonElement
          if (listToggler) listToggler.click()
        }, 300)
      })

      const editBtn = heroField.querySelector('.upload-relationship-details__edit')
      if (editBtn?.parentElement) {
        editBtn.parentElement.insertBefore(swapBtn, editBtn)
      }
    }

    function injectDrawerTabs() {
      const drawer = document.querySelector('.list-drawer.drawer--is-open') as HTMLElement
      if (!drawer || drawer.querySelector('.hero-drawer-tabs')) return

      const header = drawer.querySelector('.list-drawer__header') ||
        drawer.querySelector('[class*="header"]') ||
        drawer.querySelector('h1')?.parentElement
      if (!header) return

      const names = galleryFilenames.current
      const count = names.length

      const tabs = document.createElement('div')
      tabs.className = 'hero-drawer-tabs'
      tabs.style.cssText =
        'display:flex;gap:0;padding:0 20px;border-bottom:1px solid var(--theme-elevation-200,#2a2a2a);'

      function makeTab(label: string, key: string, active: boolean): HTMLButtonElement {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.textContent = label
        btn.dataset.tab = key
        setTabStyle(btn, active)
        return btn
      }

      function setTabStyle(btn: HTMLElement, active: boolean) {
        btn.style.cssText =
          'padding:8px 16px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;' +
          'border:none;background:none;cursor:pointer;margin-bottom:-1px;transition:all 0.15s;' +
          `color:${active ? 'var(--theme-text,#f5f2ec)' : 'var(--theme-elevation-500,#888)'};` +
          `border-bottom:2px solid ${active ? '#5A6242' : 'transparent'};`
      }

      const productTab = makeTab(`Product Images (${count})`, 'product', count > 0)
      const allTab = makeTab('All Media', 'all', count === 0)

      function filterRows(mode: 'product' | 'all') {
        setTabStyle(productTab, mode === 'product')
        setTabStyle(allTab, mode === 'all')

        const tbody = drawer.querySelector('tbody')
        if (!tbody) return

        const rows = tbody.querySelectorAll('tr')
        rows.forEach((row) => {
          if (mode === 'all') {
            row.style.display = ''
            return
          }
          // Match by filename text in any cell
          const rowText = row.textContent || ''
          const match = names.some((name) => rowText.includes(name.replace(/\.[^.]+$/, '')))
          row.style.display = match ? '' : 'none'
        })
      }

      productTab.addEventListener('click', () => filterRows('product'))
      allTab.addEventListener('click', () => filterRows('all'))

      tabs.appendChild(productTab)
      tabs.appendChild(allTab)

      // Insert after header
      if (header.nextSibling) {
        header.parentElement?.insertBefore(tabs, header.nextSibling)
      } else {
        header.parentElement?.appendChild(tabs)
      }

      // Auto-filter to product images if we have any
      if (count > 0) {
        setTimeout(() => filterRows('product'), 500)
      }
    }
  }, [])

  return <>{children}</>
}
