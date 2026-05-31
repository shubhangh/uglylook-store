'use client'

import React, { useEffect } from 'react'

/**
 * Adds show/hide toggle buttons to all password inputs across the entire admin panel.
 * Registered as a provider so it wraps all admin pages (login, create-first-user,
 * dashboard, collection views, etc.)
 */
export const PasswordToggle: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    function addToggles() {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        'input[type="password"]:not([data-pw-toggle])',
      )

      inputs.forEach((input) => {
        input.setAttribute('data-pw-toggle', 'true')

        const wrapper = input.parentElement
        if (!wrapper) return

        // Ensure wrapper is positioned for the toggle button
        if (getComputedStyle(wrapper).position === 'static') {
          wrapper.style.position = 'relative'
        }

        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'pw-toggle-btn'
        btn.textContent = 'Show'
        btn.setAttribute('tabindex', '-1')

        btn.addEventListener('click', (e) => {
          e.preventDefault()
          if (input.type === 'password') {
            input.type = 'text'
            btn.textContent = 'Hide'
          } else {
            input.type = 'password'
            btn.textContent = 'Show'
          }
        })

        wrapper.appendChild(btn)
      })
    }

    // Run on mount and observe DOM changes (for modals, new forms, route changes)
    addToggles()
    const observer = new MutationObserver(addToggles)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return <>{children}</>
}
