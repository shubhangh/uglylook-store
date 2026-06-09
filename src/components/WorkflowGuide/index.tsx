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
          'Pick a Gen Z palette (Muted Chaos, Digital Rot, Concrete Heat, Faded Flash) or choose "Custom" to create your own palette with 4 editable hex colors',
          'Custom palette: click color swatches to edit with color picker or type hex codes — colors update live in the preview',
          'Choose a graphic style and enter your hero/sub text',
          'Select fonts (hero + sub) with weights — AI generates a text-free graphic, then composites crisp text on top',
          'During generation, a progress log shows real-time status: model start, image completion, errors, and warnings',
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
      'FLUX 2.0 Pro is best for graphics, GPT Image for photo-realism, Gemini for bold/colorful designs',
      'Always review the ulTitle (internal slug) — it should be unique per design',
      'Custom palette: use brand colors or experiment with new combinations — the 4 swatches control text overlay colors',
      'Generation log shows errors inline (red) — if text compositor fails with "Unsupported OpenType signature", switch to a different font',
    ],
  },
  {
    number: 2,
    title: 'Generate Fashion Photography',
    description: 'Use Photo Studio to create campaign heroes, on-model shots, editorial lookbooks, and detail close-ups.',
    substeps: [
      {
        label: 'Step 1 — Configure',
        items: [
          'Go to Content → Photo Studio (AI) in the sidebar',
          'Select photo type: Campaign Hero, On-Model, Editorial, Flat-Lay, Detail/Texture, Group/Crew',
          'Choose background: Near-Black, Cream, Concrete, Environment, Hex Color (enter color code), or AI Pick (AI chooses best fit)',
          'Set mood: Neutral, Dramatic, Editorial, Raw, Clinical',
          'Select a product (optional) — auto-fetches 3 reference images: Product, Design, Raw/Catalog',
          'Override any reference image by pasting a URL, or use the auto-detected ones',
        ],
      },
      {
        label: 'Step 1 — Model Configuration',
        items: [
          'Select a Model Persona from the dropdown — pre-configured models with locked-down appearance for consistency',
          'Or choose "Custom" and configure manually: Model Type (Male/Female/Kid), Ethnicity, Age (range or exact)',
          'Create reusable model personas in Automate → AI Model Personas',
          'Hand-tune the promptDescription field on a persona for best cross-session consistency',
          'Configure angles & shot count: Front, Side, Back, 3/4, Cool, GenZ Vibe, Close-Up, Full Body',
          'Toggle "Same model across all shots" for consistent appearance',
        ],
      },
      {
        label: 'Step 2 — Prompt',
        items: [
          'Select a Prompt Model from the dropdown (Haiku = fast/cheap, Sonnet = better quality)',
          'Choose detail level (Low/Medium/High/Very High) and hit "Generate Prompt"',
          'Or toggle "Write my own" to type a custom prompt',
          'Review and edit the generated prompt before proceeding',
        ],
      },
      {
        label: 'Step 3 — Generate',
        items: [
          'Select 1+ image models (FLUX, GPT Image, Gemini)',
          'Set image count per model (defaults to total shot count from angles)',
          'Each model has its own +/- count control for fine-grained control',
          'Review cost estimate, then hit "Generate Photos"',
          'Per-model progress cards show real-time status',
        ],
      },
      {
        label: 'Step 4 — Review & Approve',
        items: [
          'AI auto-generates titles and ul-titles (slugs) for every image — both editable',
          'Images grouped by model when multiple models used',
          'Approve individually or use "Bulk Approve" for all titled photos',
          'Download individual images with ↓ button, or "Download All" for the full batch',
          '"Bulk Reject" to reject all pending at once',
          'Approved photos are saved to the Photos collection + Media library + R2',
        ],
      },
      {
        label: 'Photo Types',
        items: [
          'Campaign Hero: flagship image — the primary brand shot, highest quality',
          'On-Model: standard e-commerce product photography for listing pages',
          'Editorial: deliberately "wrong" environments — parking garages, loading docks',
          'Detail/Texture: macro close-ups of fabric, print, stitching',
          'Flat-Lay: garment laid flat, shot from above',
          'Group/Crew: 2-4 models wearing different pieces',
        ],
      },
    ],
    tips: [
      'Consistency is everything: use Model Personas to ensure the same model appears across all shoots',
      'Strict prompt rules are enforced: solid background, no props, no equipment, neutral expression, exact garment reproduction',
      'The prompt engine targets SSENSE/END/Mr Porter quality — clean, professional e-commerce photography',
      'Photo Studio shares the generation queue with Design Studio — one generation at a time',
      'Approved photos appear in both the Photos collection AND the Media library',
      '"AI Pick" background lets the AI choose the best background based on the product and brand palette',
      'Hex Color background lets you specify any exact color code for the background',
    ],
  },
  {
    number: 3,
    title: 'Generate Product Mockups & Copy',
    description: 'Turn your design into product images and write product copy in UglyLook\'s voice.',
    substeps: [
      {
        label: 'Mockups (Product Launcher)',
        items: [
          'Go to Printify → Product Launcher',
          'Select a design from the picker (grid with search, category filter, lane/tier badges)',
          'Select a Model Persona (optional) — pre-configured virtual model for consistent AI shots',
          'Select garment colors — AI generates shots for EACH color × angle combination',
          'Set AI Shots count and pick an AI model — Gemini recommended when using persona references (✦ Ref badge)',
          'Warning shown if selected model doesn\'t support image input when persona has reference photos',
          'Review results: Approve All / Reject Pending / Download All with bulk action buttons',
          'Use "+ More Shots" to generate additional images while keeping approved ones',
          'Minimum 3 approved images required per product before launch is enabled',
          'Printify mockups are saved to the product\'s catalogImages field for future Photo Studio reference',
        ],
      },
      {
        label: 'Pricing',
        items: [
          'Recommended price shown (read-only) with full breakdown: POD cost + shipping + Stripe fee + margin %',
          'Set "Your Price" — admin controls the retail price with live margin calculation',
          '"Use Rec" button to accept the recommended price',
          'Product Info card in sidebar shows: blueprint, provider, print area, colors, sizes, variant count',
        ],
      },
      {
        label: 'Product Copy',
        items: [
          'In the Product Launcher, with a design selected, click "Auto-Generate Copy (AI)"',
          'AI receives full product context: colors, sizes, provider, print area, price, variant count — for better copy',
          'AI generates: product title, description, features, tags, and suggested price',
          'Review and edit — AI nails the voice but you know the product best',
          'All fields are editable before launch',
        ],
      },
    ],
    tips: [
      'The AI writes in UglyLook\'s voice: dry, deadpan, adult. Never cute.',
      'When a Model Persona with reference images is selected, Gemini models are auto-selected for best image-to-image consistency',
      'Only explicitly approved images (✓) are included in the launched product gallery — rejected images are excluded',
      'Categories are matched from existing collections — the launcher never creates new categories',
      'Variants (size × color) are automatically created on launch — they show up on the storefront immediately',
      'Suggested price is based on emotion tier: A ($45–65), B ($35–45), C ($25–35)',
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
          'In the Product Launcher, fill in: title, description, and set your retail price',
          'Ensure at least 3 images are approved (✓) — launch button is disabled until this is met',
          'Hit "Launch All Products" — creates product in Payload with variants AND pushes to Printify',
          'Hero image auto-set from first approved gallery image',
          'Variants (size × color) auto-created from your selections — they appear on the storefront immediately',
          'Design file automatically linked via Design → Product sync',
          'Catalog/mockup images saved to product\'s catalogImages field',
          'Only approved images included in gallery — rejected images excluded',
          'Categories matched from existing collection — never auto-created',
        ],
      },
    ],
    tips: [
      'Hero Image is required for the product to appear on the storefront — pick the single best shot',
      'To change the hero image: click the swap icon (↗↙) next to edit — it removes the current and opens the media picker in one click',
      'The media picker has two tabs: "Product Images" (filtered to this product\'s gallery) and "All Media" (full library)',
      'On the storefront, the hero image always appears as the first/main image on the product detail page',
      'Products need at least 3 approved images to launch — use "+ More Shots" if you need more',
      'The Product Info card in the sidebar shows all technical details: blueprint, provider, print area, variant count',
      'Categories determine where the product shows up on the storefront — only existing categories are used',
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
          'Click "Submit for Approval" to send to admin/owner',
        ],
      },
      {
        label: 'For Owners/Admins',
        items: [
          'Check "Pending Reviews" on the dashboard',
          'Review product details, set Approval Status to "Approved"',
          'Change _status to "Published" — the product is now live',
        ],
      },
    ],
    tips: [
      'Owners/admins can bypass approval and publish directly',
      'Editing a published product auto-reverts it to draft (requires fresh approval)',
    ],
  },
  {
    number: 6,
    title: 'Manage Site Content',
    description: 'Update the homepage, about page, navigation, and all site content from the admin.',
    substeps: [
      {
        label: 'Homepage Sections',
        items: [
          'Globals → Homepage: edit hero headline, CTAs, marquee words, featured products, brand statement, image carousel',
          'Each section has a show/hide toggle — turn off sections you don\'t need',
          'Featured Products: select specific products or leave empty for auto-newest',
          'Hero Carousel: control auto-slide speed, tilt angle, stamp badge text',
          'Image Carousel: control scroll speed, slide dimensions, label text',
          'Brand Statement: edit lede text, spec pills, watermark, floating stamps',
        ],
      },
      {
        label: 'About Page',
        items: [
          'Globals → About Page: controls hero heading, subtext, section visibility',
          'Content comes from Thesis Page + Lanes Page globals (edit those for philosophy/lanes content)',
          'Specs come from Homepage global (spec rows)',
          'Upload editorial images between sections via About Page → Section Images',
        ],
      },
      {
        label: 'Navigation & Footer',
        items: [
          'Globals → Header: edit nav items (Shop, Collections, Journal, About)',
          'Globals → Footer: edit columns (Shop, Brand, Help, Legal), email signup, bottom bar',
          'Globals → Announcement Bar: set banner text, color, dismissibility',
        ],
      },
      {
        label: 'Other Pages',
        items: [
          'Collections page: Globals → Collections Page → configure which categories appear and how each card displays',
          'Display modes: "Single Image" (admin picks thumbnail) or "Product Carousel" (hero images from up to 5 products, auto-scrolling)',
          'Carousel: pick specific products or leave empty to auto-use latest 5 published products in that category',
          'Leave the collections array empty to auto-show all storefront categories (backwards compatible)',
          'Journal: posts are managed in Content → Posts. Route is /journal.',
          'Drop page: edit via Globals → Drop Page. Not in main nav — linked from announcement bar.',
          'Contact, FAQ, Shipping, Size Guide, Privacy, Terms — all editable via their globals.',
        ],
      },
    ],
    tips: [
      'All images have admin-controlled display size (33%/50%/75%/100%) and aspect ratio',
      'Live preview works for all globals — changes reflect in real-time without page refresh',
      'Frame marks (corner brackets) are toggleable from Homepage settings',
    ],
  },
  {
    number: 7,
    title: 'Orders & Fulfillment',
    description: 'Orders flow automatically to Printify for printing and shipping.',
    substeps: [
      {
        label: 'How it works',
        items: [
          'Customer places order on the storefront (guest checkout — no login required)',
          'Order is created in Payload (status: "processing")',
          'Order is automatically pushed to Printify via webhook',
          'Printify prints, packs, and ships directly to the customer',
          'Tracking info syncs back: tracking number, carrier, URL',
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
      'Guest checkout is the default — no login/signup required',
    ],
  },
  {
    number: 8,
    title: 'AI Model Personas',
    description: 'Create reusable model personas for consistent AI-generated photography across sessions.',
    substeps: [
      {
        label: 'Creating a Persona',
        items: [
          'Go to Automate → AI Model Personas → Create New',
          'Set name (e.g. "Arun", "Model A", "UL-M-01")',
          'Configure: gender, ethnicity, age range, build, hair style',
          'Optional: add distinguishing features (e.g. "sharp jawline, light stubble")',
          'Write a promptDescription — this exact text is injected into every prompt that uses this persona',
          'Save reference images — best generated images for image-to-image consistency (see "Reference Images" below)',
        ],
      },
      {
        label: 'Using in Photo Studio',
        items: [
          'In Configure step, select a persona from the "Model Persona" dropdown',
          'Fields auto-fill with the persona\'s settings (gender, ethnicity, age)',
          'Manual fields remain visible — override any setting if needed for a specific shoot',
          'The persona\'s promptDescription takes priority over auto-composed descriptions',
        ],
      },
      {
        label: 'Reference Images (Image-to-Image)',
        items: [
          'Generate photos with a persona selected → approve the best shots',
          'On approved photos, click the "★ Ref" button to save as a reference image for that persona',
          'The image is uploaded to media and appended to the persona\'s referenceImages array',
          'Next generation with that persona automatically passes the first reference image to the AI model',
          'Gemini: receives the reference as an actual image input — best consistency',
          'GPT Image: receives reference URL in text prompt (best-effort, no native image input)',
          'Flux/BFL: text prompt only — no image reference support',
          'In the Generate step, models show badges when references are active: "✦ Ref" (supports image reference) or "text only" (prompt only)',
          'When you select a persona with references, only ref-supported models (Gemini) are auto-selected — you can still manually add others',
          'Progressive improvement: the more reference images you save, the better consistency becomes',
        ],
      },
    ],
    tips: [
      'Build a roster of 4-6 model personas for brand consistency',
      'Hand-tune the promptDescription field — find phrasing that produces the most consistent face across generations',
      'Save your best shots as references using the ★ Ref button — Gemini uses these for true image-to-image consistency',
      'Use the same persona across Photo Studio, Design Studio, and Product Launcher for unified brand imagery',
      'Gemini models are recommended when using reference images — they support actual image input for the best results',
    ],
  },
  {
    number: 9,
    title: 'Media & CDN',
    description: 'All media is stored in Cloudflare R2 and served via the media.uglylook.com CDN.',
    substeps: [
      {
        label: 'How Media Works',
        items: [
          'All uploads go to Cloudflare R2 bucket (uglylook-store)',
          'Served via custom domain: media.uglylook.com (CDN-cached globally)',
          'Next.js Image Optimization handles resizing/WebP conversion on demand',
          'SHA-256 dedup: identical files are not uploaded twice',
        ],
      },
      {
        label: 'Product Images',
        items: [
          'Hero Image: the canonical thumbnail — shown in grids, carousels, cart, OG tags',
          'Gallery: full image set shown only on the product detail page',
          'Catalog Images: raw Printify mockups (blank garment) — used by Photo Studio as AI reference',
          'Print File: the design artwork file sent to Printify for printing',
        ],
      },
    ],
    tips: [
      'Hero Image is the most important field — always set it for every product',
      'Products without hero image or gallery are filtered out of the shop grid',
      'media.uglylook.com is ~4x faster than the old pub-xxx.r2.dev URL',
      'R2 custom domain caching works internally — cf-cache-status shows DYNAMIC but caching is active',
    ],
  },
]

const quickLinks = [
  { label: 'Design Studio', path: '/adm/collections/printify-design-studio' },
  { label: 'Photo Studio', path: '/adm/collections/photo-studio' },
  { label: 'Model Personas', path: '/adm/collections/ai-models' },
  { label: 'Designs', path: '/adm/collections/designs' },
  { label: 'Photos', path: '/adm/collections/photos' },
  { label: 'Products', path: '/adm/collections/products' },
  { label: 'Orders', path: '/adm/collections/orders' },
  { label: 'Homepage', path: '/adm/globals/homepage' },
  { label: 'About Page', path: '/adm/globals/aboutPage' },
  { label: 'Header', path: '/adm/globals/header' },
  { label: 'Footer', path: '/adm/globals/footer' },
  { label: 'AI Models', path: '/adm/collections/ai-model-registry' },
  { label: 'API Keys', path: '/adm/collections/global-keys' },
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
          <span className="wg-subtitle">Design → Photos → Product → Store — step by step</span>
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

                  {step.tips && step.tips.length > 0 && (
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
            <span className="wg-role__desc">Full access. Can publish directly, approve/reject, manage API keys, manage globals, create model personas, delete products.</span>
          </div>
          <div className="wg-role">
            <span className="wg-role__name">Manager</span>
            <span className="wg-role__desc">Can create products, designs, and photos. Can use Design Studio, Photo Studio, and model personas. Submit for approval. Cannot publish or delete.</span>
          </div>
          <div className="wg-role">
            <span className="wg-role__name">Editor</span>
            <span className="wg-role__desc">Can create journal posts and upload media. Read-only access to products and orders.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
