'use client'

import React, { useState } from 'react'
import './styles.css'

const steps = [
  {
    number: 1,
    title: 'Create or Upload a Design',
    description: 'Start with a design — either generate one with AI or upload manually.',
    substeps: [
      {
        label: 'Option A: AI Design Studio',
        items: [
          'Go to Printify → Design Studio (AI) in the sidebar',
          'Choose "Start from Scratch" or pick a Preset for quick results',
          'Configure your design: pick type (graphic, logo, pattern), lane (brutalist, weirdcore, y2k), and emotion tier',
          'Write a description or use the AI prompt generator to craft the perfect prompt',
          'Select 1–3 image models (FLUX, GPT Image, Gemini) — they run in parallel',
          'Set image count (1–8 per model) and hit Generate',
          'Review results: AI auto-titles each image, classifies type and lane',
          'Approve the ones you like — they get saved to the Designs collection',
        ],
      },
      {
        label: 'Option B: Text Composition',
        items: [
          'In Design Studio, enable "Text Composition" checkbox',
          'Pick a Gen Z palette (muted-chaos, digital-rot, concrete-heat, faded-flash)',
          'Choose a graphic style and enter your hero/sub text',
          'Select fonts (hero + sub) with weights — AI generates a text-free graphic, then composites crisp text on top',
        ],
      },
      {
        label: 'Option C: Manual Upload',
        items: [
          'Go to Ecommerce → Designs → Create New',
          'Upload your print-ready PNG (transparent bg, 300+ DPI)',
          'Fill in the classification fields: type, lane, emotion tier, categories',
          'Set status to "Active"',
        ],
      },
    ],
    tips: [
      'Use "Best" prompt quality (3 tiers) for flagship designs — it costs ~$0.015 extra but produces significantly better results',
      'FLUX 2.0 Pro is best for graphics, GPT Image for photo-realism, Gemini for bold/colorful designs',
      'Always review the ulTitle (internal slug) — it should be unique per design',
    ],
  },
  {
    number: 2,
    title: 'Generate Product Mockups',
    description: 'Turn your design into product images showing how it looks on garments.',
    substeps: [
      {
        label: 'From the Product Launcher',
        items: [
          'Go to Printify → Product Launcher',
          'Select a design from the picker (or search by title)',
          'Click "Generate Mockups" — choose AI editorial shots or Printify mockups',
          'For AI shots: select your preferred image model and count',
          'Review the generated mockups — approve the best ones for the product gallery',
        ],
      },
    ],
    tips: [
      'AI editorial shots work best for marketing/social media',
      'Printify mockups give accurate garment representation — use for product pages',
      'You can generate both and mix them in the final gallery',
    ],
  },
  {
    number: 3,
    title: 'Generate Product Copy',
    description: 'Let AI write the product title, description, and tags in UglyLook\'s deadpan voice.',
    substeps: [
      {
        label: 'Steps',
        items: [
          'In the Product Launcher, with a design selected, click "Auto-Generate Copy (AI)"',
          'AI uses your design metadata (title, lane, tier, emotion) to generate: product title, description, features list, tags, and suggested price',
          'Review and edit the generated copy — AI nails the voice but you know the product best',
          'All fields are editable before launch',
        ],
      },
    ],
    tips: [
      'The AI writes in UglyLook\'s voice: dry, deadpan, adult. Never cute.',
      'Include a mockup image when generating copy — it gives the AI visual context',
      'Suggested price is based on the emotion tier: A ($45–65), B ($35–45), C ($25–35)',
    ],
  },
  {
    number: 4,
    title: 'Launch the Product',
    description: 'Create the product in your store and push it to Printify for fulfillment.',
    substeps: [
      {
        label: 'Steps',
        items: [
          'In the Product Launcher, fill in: title, description, price, categories, gallery images',
          'Select the Printify product template (tee, hoodie, hat, tote) and variants (sizes/colors)',
          'Hit "Launch Product" — this creates the product in Payload AND pushes to Printify',
          'The design file is automatically linked via the Design → Product sync',
          'Printify receives the design, creates variants, and prepares for fulfillment',
        ],
      },
    ],
    tips: [
      'Make sure your design URL (R2) is set — Printify needs it for printing',
      'You can launch without Printify (simulated mode) for testing',
      'Categories determine where the product shows up on the storefront',
    ],
  },
  {
    number: 5,
    title: 'Review & Publish',
    description: 'Get approval and make the product live on the store.',
    substeps: [
      {
        label: 'For Managers/Editors',
        items: [
          'After launch, the product is in "Draft" status',
          'Review all details: images, copy, pricing, variants',
          'Click "Submit for Approval" to send to admin/owner for review',
          'You\'ll see status change to "Pending Review"',
        ],
      },
      {
        label: 'For Owners/Admins',
        items: [
          'Check the "Pending Reviews" card on the dashboard',
          'Open the product, review all details',
          'Set Approval Status to "Approved"',
          'Change _status to "Published" — the product is now live on the storefront',
          'If changes needed: set to "Rejected" with review notes',
        ],
      },
    ],
    tips: [
      'Owners/admins can bypass approval and publish directly',
      'Editing a published product auto-reverts it to draft (requires fresh approval)',
      'Use Buckets to organize products for seasonal drops or campaigns',
    ],
  },
  {
    number: 6,
    title: 'Post-Launch: Orders & Fulfillment',
    description: 'Orders flow automatically to Printify for printing and shipping.',
    substeps: [
      {
        label: 'How it works',
        items: [
          'Customer places order on the storefront',
          'Order is created in Payload (status: "processing")',
          'Order is automatically pushed to Printify via webhook',
          'Printify prints, packs, and ships directly to the customer',
          'Tracking info is synced back: tracking number, carrier, URL',
          'Order status updates: sent_to_printify → in_production → shipped → delivered',
        ],
      },
      {
        label: 'If something goes wrong',
        items: [
          'Check the order\'s fulfillment status in the admin',
          'Failed orders can be retried via the Printify Retry route',
          'Manual fulfillment: set status to "manual" and handle outside Printify',
        ],
      },
    ],
    tips: [
      'Free shipping over $75 — cost is baked into product prices',
      'Printify handles all printing, packing, and shipping',
      'You can track fulfillment status from the Orders list view',
    ],
  },
]

const quickLinks = [
  { label: 'Design Studio', path: '/adm/collections/printify-design-studio' },
  { label: 'Designs Library', path: '/adm/collections/designs' },
  { label: 'Product Launcher', path: '/adm/collections/printify-launcher' },
  { label: 'Products', path: '/adm/collections/products' },
  { label: 'Orders', path: '/adm/collections/orders' },
  { label: 'Buckets', path: '/adm/collections/buckets' },
  { label: 'AI Model Registry', path: '/adm/collections/ai-model-registry' },
  { label: 'Global API Keys', path: '/adm/collections/global-keys' },
]

export const WorkflowGuide: React.FC = () => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]))

  const toggleStep = (stepNum: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepNum)) next.delete(stepNum)
      else next.add(stepNum)
      return next
    })
  }

  const expandAll = () => setExpandedSteps(new Set(steps.map((s) => s.number)))
  const collapseAll = () => setExpandedSteps(new Set())

  return (
    <div className="wg-container">
      <div className="wg-header">
        <div className="wg-header__top">
          <h1 className="wg-title">Workflow Guide</h1>
          <span className="wg-subtitle">Design → Product → Store — step by step</span>
        </div>
        <div className="wg-header__actions">
          <button className="wg-btn wg-btn--ghost" onClick={expandAll}>Expand All</button>
          <button className="wg-btn wg-btn--ghost" onClick={collapseAll}>Collapse All</button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="wg-quick-links">
        <span className="wg-quick-links__label">Quick Links:</span>
        {quickLinks.map((link) => (
          <a key={link.path} href={link.path} className="wg-quick-link">{link.label}</a>
        ))}
      </div>

      {/* Steps */}
      <div className="wg-steps">
        {steps.map((step) => {
          const isExpanded = expandedSteps.has(step.number)
          return (
            <div key={step.number} className={`wg-step ${isExpanded ? 'wg-step--expanded' : ''}`}>
              <button className="wg-step__header" onClick={() => toggleStep(step.number)}>
                <span className="wg-step__number">{step.number}</span>
                <div className="wg-step__title-block">
                  <span className="wg-step__title">{step.title}</span>
                  <span className="wg-step__desc">{step.description}</span>
                </div>
                <span className="wg-step__chevron">{isExpanded ? '−' : '+'}</span>
              </button>

              {isExpanded && (
                <div className="wg-step__body">
                  {step.substeps.map((sub, i) => (
                    <div key={i} className="wg-substep">
                      <h4 className="wg-substep__label">{sub.label}</h4>
                      <ol className="wg-substep__list">
                        {sub.items.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ol>
                    </div>
                  ))}

                  {step.tips.length > 0 && (
                    <div className="wg-tips">
                      <h4 className="wg-tips__label">Tips</h4>
                      <ul className="wg-tips__list">
                        {step.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Role info */}
      <div className="wg-roles">
        <h3 className="wg-roles__title">Role Permissions</h3>
        <div className="wg-roles__grid">
          <div className="wg-role">
            <span className="wg-role__name">Owner / Admin</span>
            <span className="wg-role__desc">Full access. Can publish directly, approve/reject, manage API keys, delete products.</span>
          </div>
          <div className="wg-role">
            <span className="wg-role__name">Manager</span>
            <span className="wg-role__desc">Can create products and designs, submit for approval. Cannot publish or delete.</span>
          </div>
          <div className="wg-role">
            <span className="wg-role__name">Editor</span>
            <span className="wg-role__desc">Can create posts and upload media. Read-only access to products and orders.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
