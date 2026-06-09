import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'
import fs from 'fs'
import path from 'path'

import { contactFormData } from './contact-form'
import { contactPageData } from './contact-page'
import { homePageData } from './home'
import { Address, Transaction, VariantOption } from '@/payload-types'

// ── Image base path ──────────────────────────────────────────────────────────
// Resolve relative to project root (works in both dev server and compiled contexts)
const IMAGE_BASE = path.resolve(
  process.cwd(),
  '../../cgpt/img-gen/inventories',
)

// ── Helpers ──────────────────────────────────────────────────────────────────

function readLocalFile(relativePath: string): File {
  const fullPath = path.join(IMAGE_BASE, relativePath)
  const data = fs.readFileSync(fullPath)
  const name = path.basename(relativePath)
  return {
    name,
    data: Buffer.from(data),
    mimetype: 'image/png',
    size: data.byteLength,
  }
}

function richText(text: string) {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr' as const,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

// ── Catalog ──────────────────────────────────────────────────────────────────

type ProductDef = {
  title: string
  slug: string
  description: string
  price: number // cents
  image: string // relative to IMAGE_BASE
  category: string
  hasSizeVariants: boolean
  inventory?: number // 0 = sold out
}

const PRODUCTS: ProductDef[] = [
  // ── Hats ($25) ──
  {
    title: 'Icon Snapback — Black',
    slug: 'icon-snapback-black',
    description:
      'Black snapback. UglyLook icon patch. Adjustable. Covers the part of your head you\u2019re insecure about.',
    price: 2500,
    image: '2/hats/1-black-snapback-logo.png',
    category: 'Hats',
    hasSizeVariants: false,
  },
  {
    title: 'Icon Snapback — Bone',
    slug: 'icon-snapback-bone',
    description:
      'Same hat, lighter existential dread. Bone colorway with contrast icon patch.',
    price: 2500,
    image: '2/hats/2-bone-snapback-logo.png',
    category: 'Hats',
    hasSizeVariants: false,
  },
  {
    title: 'Olive Dad Cap',
    slug: 'olive-dad-cap',
    description:
      'Olive dad cap with woven icon patch. Unstructured. Like your life plan.',
    price: 2500,
    image: '2/hats/3-olive-dad-cap-logo.png',
    category: 'Hats',
    hasSizeVariants: false,
  },
  {
    title: 'Ugly On Purpose Beanie',
    slug: 'ugly-on-purpose-beanie',
    description:
      'Ribbed knit beanie with icon patch. Warm enough for the cold shoulder you\u2019re giving everyone.',
    price: 2500,
    image: '2/hats/4-black-beanie-logo.png',
    category: 'Hats',
    hasSizeVariants: false,
  },

  // ── Hoodies ($65) ──
  {
    title: 'Icon Hoodie — Black',
    slug: 'icon-hoodie-black',
    description:
      'Black heavyweight hoodie. Full icon and wordmark. The one you\u2019ll wear until it disintegrates.',
    price: 6500,
    image: '2/hoodies/1-black-hoodie-uglylook-logo.png',
    category: 'Hoodies',
    hasSizeVariants: true,
  },
  {
    title: 'Icon Hoodie — Bone',
    slug: 'icon-hoodie-bone',
    description:
      'Bone heavyweight hoodie. Full icon and wordmark. Stains easily. We know.',
    price: 6500,
    image: '2/hoodies/2-bone-hoodie-uglylook-logo.png',
    category: 'Hoodies',
    hasSizeVariants: true,
  },
  {
    title: 'Unavailable Hoodie',
    slug: 'unavailable-hoodie',
    description:
      '\u201COUT OF OFFICE permanently.\u201D Currently unavailable. The hoodie understands the assignment.',
    price: 6500,
    image: '2/hoodies/3-out-of-office-hoodie.png',
    category: 'Hoodies',
    hasSizeVariants: true,
    inventory: 0,
  },
  {
    title: 'Do Not Disturb Hoodie',
    slug: 'do-not-disturb-hoodie',
    description:
      '\u201CDO NOT DISTURB \u2014 or do, I don\u2019t care.\u201D Passive-aggressive outerwear at its finest.',
    price: 6500,
    image: '2/hoodies/5-do-not-disturb-hoodie.png',
    category: 'Hoodies',
    hasSizeVariants: true,
  },
  {
    title: 'Olive Chest Logo Hoodie',
    slug: 'olive-chest-logo-hoodie',
    description:
      'Olive heavyweight hoodie. Chest icon. For when you want the brand but not the conversation.',
    price: 6500,
    image: '2/hoodies/4-olive-hoodie-chest-logo.png',
    category: 'Hoodies',
    hasSizeVariants: true,
  },

  // ── T-Shirts ($35) ──
  {
    title: 'Icon Tee — Black',
    slug: 'icon-tee-black',
    description:
      'Black oversized tee. Full icon and wordmark. 100% cotton. 0% trying.',
    price: 3500,
    image: '2/tshirts/1-black-tee-uglylook-logo.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },
  {
    title: 'Icon Tee — White',
    slug: 'icon-tee-white',
    description:
      'White oversized tee. Full icon and wordmark. Will absorb every food stain you throw at it.',
    price: 3500,
    image: '2/tshirts/2-white-tee-uglylook-logo.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },
  {
    title: 'Overqualified Tee',
    slug: 'overqualified-tee',
    description:
      '\u201CUGLY IS THE NEW SICK.\u201D The tagline tee. Explains itself. Or doesn\u2019t. We\u2019re fine either way.',
    price: 3500,
    image: '2/tshirts/3-ugly-is-the-new-sick-tee.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },
  {
    title: 'Error 404 Tee',
    slug: 'error-404-tee',
    description:
      'Full back print icon. Small front label. For people who prefer to leave an impression on the way out.',
    price: 3500,
    image: '2/tshirts/4-back-print-tee.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },
  {
    title: 'Ugly Collage Tee',
    slug: 'ugly-collage-tee',
    description:
      'Olive oversized tee. Icon and wordmark in the brand\u2019s signature green. Earthy and unbothered.',
    price: 3500,
    image: '2/tshirts/5-olive-tee-uglylook-logo.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },
  {
    title: 'Full Lockup Tee',
    slug: 'full-lockup-tee',
    description:
      'Full brand lockup with tagline. The company bio on a shirt. Wear it to interviews you don\u2019t want.',
    price: 3500,
    image: '2/tshirts/6-full-lockup-tee.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },

  // ── Tote ($20) ──
  {
    title: 'Exit Strategy Tote',
    slug: 'exit-strategy-tote',
    description:
      'Canvas tote. Full icon and wordmark. Carries your groceries and your emotional baggage.',
    price: 2000,
    image: '2/tote/1-canvas-tote-uglylook-logo.png',
    category: 'Tote',
    hasSizeVariants: false,
  },
  {
    title: 'Cope Tote',
    slug: 'cope-tote',
    description:
      'Black tote. Full lockup with tagline. The bag you bring when you need a mechanism.',
    price: 2000,
    image: '2/tote/2-black-tote-full-lockup.png',
    category: 'Tote',
    hasSizeVariants: false,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INVENTORY 3 — Pinterest-inspired collection
  // ══════════════════════════════════════════════════════════════════════════

  // ── T-Shirts ($40) ──
  {
    title: 'Neon Psychedelic Tee',
    slug: 'neon-psychedelic-tee',
    description:
      'All-over neon splatter with monster faces. The UL logo is in there somewhere. So is your dignity.',
    price: 4000,
    image: '3/tshirts/1-neon-psychedelic-tee.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },
  {
    title: 'Harajuku Monster Tee',
    slug: 'harajuku-monster-tee',
    description:
      'Sky blue oversized tee with an ugly-cute monster. It has one horn. It has feelings. Don\u2019t ask about either.',
    price: 4000,
    image: '3/tshirts/2-harajuku-monster-tee.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },
  {
    title: 'Melting Smiley Tee',
    slug: 'melting-smiley-tee',
    description:
      'Hot pink tee. Melting smiley with dripping eyes and jagged teeth. Says \u201CUGLY\u201D underneath. In case the face wasn\u2019t clear enough.',
    price: 4000,
    image: '3/tshirts/3-melting-smiley-pink-tee.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },
  {
    title: 'Distressed Pink Logo Tee',
    slug: 'distressed-pink-logo-tee',
    description:
      'Washed black tee with hot pink UL logo and paint splatter. Looks like it survived a paint fight. It did.',
    price: 4000,
    image: '3/tshirts/4-distressed-pink-logo-tee.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },
  {
    title: 'Melting Neon Logo Tee',
    slug: 'melting-neon-logo-tee',
    description:
      'Black tee with the UL logo melting in neon. Eyeballs watching. The logo is having a moment.',
    price: 4000,
    image: '3/tshirts/5-melting-logo-back-print-tee.png',
    category: 'T-Shirts',
    hasSizeVariants: true,
  },

  // ── Hoodies ($75) ──
  {
    title: 'Techwear Cargo Hoodie',
    slug: 'techwear-cargo-hoodie',
    description:
      'Distressed black hoodie with pink cargo pockets bolted on. More storage than your apartment. Less rent.',
    price: 7500,
    image: '3/hoodies/1-techwear-cargo-hoodie.png',
    category: 'Hoodies',
    hasSizeVariants: true,
  },
  {
    title: 'Neon Psychedelic Hoodie',
    slug: 'neon-psychedelic-hoodie',
    description:
      'All-over neon print hoodie with monster faces and the full UglyLook lockup. Visible from space.',
    price: 7500,
    image: '3/hoodies/2-neon-psychedelic-hoodie.png',
    category: 'Hoodies',
    hasSizeVariants: true,
  },
  {
    title: 'Distressed Pink Logo Hoodie',
    slug: 'distressed-pink-logo-hoodie',
    description:
      'Washed black hoodie with massive hot pink UL logo. Paint splatter included free of charge.',
    price: 7500,
    image: '3/hoodies/3-distressed-pink-logo-hoodie.png',
    category: 'Hoodies',
    hasSizeVariants: true,
  },
  {
    title: 'Distressed Crewneck',
    slug: 'distressed-crewneck',
    description:
      'Washed black crewneck with pink splatter and full brand lockup. For when a hoodie feels like too much commitment.',
    price: 6500,
    image: '3/hoodies/4-distressed-crewneck-sweatshirt.png',
    category: 'Hoodies',
    hasSizeVariants: true,
  },

  // ── Jackets ($85) ──
  {
    title: 'Neon Psychedelic Windbreaker',
    slug: 'neon-psychedelic-windbreaker',
    description:
      'Neon all-over print zip-up with the full UglyLook lockup. Wind-resistant. Compliment-resistant. Nothing-resistant.',
    price: 8500,
    image: '3/jackets/1-neon-psychedelic-windbreaker.png',
    category: 'Jackets',
    hasSizeVariants: true,
  },
  {
    title: 'Utility Cargo Vest',
    slug: 'utility-cargo-vest',
    description:
      'Black tactical vest with olive cargo pockets and UL patch. Holds your phone, keys, and trust issues.',
    price: 7500,
    image: '3/jackets/2-utility-cargo-vest.png',
    category: 'Jackets',
    hasSizeVariants: true,
  },
  {
    title: 'Distressed Bomber Jacket',
    slug: 'distressed-bomber-jacket',
    description:
      'Black bomber with olive splatter and massive UL back print. The jacket equivalent of a mic drop.',
    price: 9500,
    image: '3/jackets/3-distressed-bomber-jacket.png',
    category: 'Jackets',
    hasSizeVariants: true,
  },

  // ── Pants ($55) ──
  {
    title: 'Techwear Cargo Pants',
    slug: 'techwear-cargo-pants',
    description:
      'Distressed black joggers with pink cargo pockets. Pair with the cargo hoodie if you want to be a walking storage unit.',
    price: 5500,
    image: '3/pants/1-techwear-cargo-pants.png',
    category: 'Pants',
    hasSizeVariants: true,
  },
  {
    title: 'Neon Psychedelic Shorts',
    slug: 'neon-psychedelic-shorts',
    description:
      'Neon all-over print shorts with monster faces. Your legs have never been this loud.',
    price: 4500,
    image: '3/pants/2-neon-psychedelic-shorts.png',
    category: 'Pants',
    hasSizeVariants: true,
  },
  {
    title: 'Monster Face Sweatpants',
    slug: 'monster-face-sweatpants',
    description:
      'Black sweatpants with neon monster faces down the legs. Lounge ugly. Live ugly.',
    price: 5000,
    image: '3/pants/3-monster-face-sweatpants.png',
    category: 'Pants',
    hasSizeVariants: true,
  },

  // ── Accessories ($30) ──
  {
    title: 'Graffiti Messenger Bag',
    slug: 'graffiti-messenger-bag',
    description:
      'Black crossbody with neon paint splatter and UL rubber patch. Carries your stuff. Announces your presence.',
    price: 3500,
    image: '3/accessories/1-graffiti-messenger-bag.png',
    category: 'Accessories',
    hasSizeVariants: false,
  },
  {
    title: 'Techwear Bucket Hat',
    slug: 'techwear-bucket-hat',
    description:
      'Distressed black bucket hat with pink pockets and UL patch. For tactical shade.',
    price: 3000,
    image: '3/accessories/2-techwear-bucket-hat.png',
    category: 'Accessories',
    hasSizeVariants: false,
  },
  {
    title: 'Neon Psychedelic Bucket Hat',
    slug: 'neon-psychedelic-bucket-hat',
    description:
      'Neon all-over print bucket hat with monster faces and UglyLook patch. Sun protection meets sensory overload.',
    price: 3000,
    image: '3/accessories/3-neon-psychedelic-bucket-hat.png',
    category: 'Accessories',
    hasSizeVariants: false,
  },
  {
    title: 'Monster Tote Bag',
    slug: 'monster-tote-bag',
    description:
      'Canvas tote covered in ugly-cute monster characters. UL logo at the bottom. Your groceries deserve chaos.',
    price: 2500,
    image: '3/accessories/4-monster-tote-bag.png',
    category: 'Accessories',
    hasSizeVariants: false,
  },

  // ── Sets ($120) ──
  {
    title: 'Techwear Cargo Set',
    slug: 'techwear-cargo-set',
    description:
      'Matching distressed hoodie + cargo joggers with pink pockets. Full UglyLook lockup. Double the pockets, double the personality disorder.',
    price: 12000,
    image: '3/sets/1-techwear-cargo-set.png',
    category: 'Sets',
    hasSizeVariants: true,
  },
  {
    title: 'Neon Psychedelic Set',
    slug: 'neon-psychedelic-set',
    description:
      'Matching neon zip-up jacket + wide-leg pants. Full monster print. Wear both pieces if you want to be visible from the International Space Station.',
    price: 13000,
    image: '3/sets/2-neon-psychedelic-set.png',
    category: 'Sets',
    hasSizeVariants: true,
  },
]

const CATEGORY_NAMES = ['Hats', 'Hoodies', 'T-Shirts', 'Tote', 'Jackets', 'Pants', 'Accessories', 'Sets']

const SIZE_OPTIONS = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'X Large', value: 'xlarge' },
]

// ── Collections to clear ─────────────────────────────────────────────────────

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'products',
  'forms',
  'form-submissions',
  'variants',
  'variantOptions',
  'variantTypes',
  'carts',
  'transactions',
  'addresses',
  'orders',
]

const globals: GlobalSlug[] = ['header', 'footer']

const baseAddressUSData: Transaction['billingAddress'] = {
  title: 'Dr.',
  firstName: 'Otto',
  lastName: 'Octavius',
  phone: '1234567890',
  company: 'Oscorp',
  addressLine1: '123 Main St',
  addressLine2: 'Suite 100',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
}

const baseAddressUKData: Transaction['billingAddress'] = {
  title: 'Mr.',
  firstName: 'Oliver',
  lastName: 'Twist',
  phone: '1234567890',
  addressLine1: '48 Great Portland St',
  city: 'London',
  postalCode: 'W1W 7ND',
  country: 'GB',
}

// ── Seed ─────────────────────────────────────────────────────────────────────

export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // ── Clear existing data ──
  payload.logger.info('— Clearing collections and globals...')

  // Reset header
  await payload.updateGlobal({
    slug: 'header',
    data: { navItems: [] },
    depth: 0,
    context: { disableRevalidate: true },
  })

  // Reset footer
  await payload.updateGlobal({
    slug: 'footer',
    data: {
      showBrandColumn: false,
      showColumns: false,
      columns: [],
      showBottomBar: false,
    },
    depth: 0,
    context: { disableRevalidate: true },
  })

  for (const collection of collections) {
    await payload.db.deleteMany({ collection, req, where: {} })
    if (payload.collections[collection].config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} })
    }
  }

  // ── Categories ──
  payload.logger.info('— Seeding categories...')

  const categoryMap: Record<string, any> = {}
  for (const name of CATEGORY_NAMES) {
    categoryMap[name] = await payload.create({
      collection: 'categories',
      data: { title: name, slug: name.toLowerCase().replace(/\s+/g, '-') },
    })
  }

  // ── Upload media & create products ──
  payload.logger.info('— Seeding media and products...')

  const productRecords: Record<string, any> = {}

  // Size variant type (shared across sized products)
  const sizeVariantType = await payload.create({
    collection: 'variantTypes',
    data: { name: 'size', label: 'Size' },
  })

  const sizeVariantOptions: VariantOption[] = []
  for (const option of SIZE_OPTIONS) {
    const result = await payload.create({
      collection: 'variantOptions',
      data: { ...option, variantType: sizeVariantType.id },
    })
    sizeVariantOptions.push(result)
  }

  for (const def of PRODUCTS) {
    try {
      // Upload image
      const fileBuffer = readLocalFile(def.image)
      const media = await payload.create({
        collection: 'media',
        data: { alt: def.title },
        file: fileBuffer,
      })

      // Create product
      const productData: any = {
        _status: 'published',
        title: def.title,
        slug: def.slug,
        description: richText(def.description),
        heroImage: media.id,
        gallery: [{ image: media.id }],
        categories: [categoryMap[def.category].id],
        relatedProducts: [],
        layout: [],
        meta: {
          title: `${def.title} | UglyLook`,
          image: media.id,
          description: def.description,
        },
        priceInUSDEnabled: true,
        priceInUSD: def.price,
      }

      if (def.hasSizeVariants) {
        productData.enableVariants = true
        productData.variantTypes = [sizeVariantType.id]
        productData.inventory = 0 // inventory lives on variants
      }

      const product = await payload.create({
        collection: 'products',
        depth: 0,
        data: productData,
      })

      productRecords[def.slug] = product

      // Create size variants for sized products
      if (def.hasSizeVariants) {
        for (const sizeOption of sizeVariantOptions) {
          await payload.create({
            collection: 'variants',
            depth: 0,
            data: {
              product: product.id,
              options: [sizeOption.id],
              inventory: def.inventory ?? 492,
              priceInUSDEnabled: true,
              priceInUSD: def.price,
              _status: 'published',
            },
          })
        }
      }

      payload.logger.info(`  ✓ ${def.title}`)
    } catch (err) {
      payload.logger.error(`  ✗ Failed to seed "${def.title}": ${err}`)
    }
  }

  // ── Wire up related products ──
  payload.logger.info('— Linking related products...')

  // Group products by category for related product linking
  const groupedByCategory: Record<string, string[]> = {}
  for (const p of PRODUCTS) {
    if (!groupedByCategory[p.category]) groupedByCategory[p.category] = []
    groupedByCategory[p.category].push(p.slug)
  }

  const relatedGroups = Object.values(groupedByCategory)

  for (const group of relatedGroups) {
    for (const slug of group) {
      const others = group.filter((s) => s !== slug).slice(0, 3)
      await payload.update({
        collection: 'products',
        id: productRecords[slug].id,
        data: {
          relatedProducts: others.map((s) => productRecords[s].id),
        },
      })
    }
  }

  // ── Contact form ──
  payload.logger.info('— Seeding contact form...')

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData(),
  })

  // ── Pages ──
  payload.logger.info('— Seeding pages...')

  // Use the first product image as hero/meta placeholder
  const heroImage = await payload.find({
    collection: 'media',
    limit: 1,
  })
  const firstMedia = heroImage.docs[0]

  await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: homePageData({
        contentImage: firstMedia,
        metaImage: firstMedia,
      }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({ contactForm }),
    }),
  ])

  // ── Globals (header / footer) ──
  payload.logger.info('— Seeding globals...')

  await payload.updateGlobal({
    slug: 'header',
    data: {
      showLogo: true,
      showWordmark: true,
      showNav: true,
      showCart: true,
      navItems: [
        { visible: true, link: { type: 'custom', label: 'Home', url: '/' } },
        { visible: true, link: { type: 'custom', label: 'Shop', url: '/shop' } },
        { visible: true, link: { type: 'custom', label: 'Thesis', url: '/thesis' } },
        { visible: true, link: { type: 'custom', label: 'Lanes', url: '/lanes' } },
        { visible: true, link: { type: 'custom', label: 'Reads', url: '/blog' } },
        { visible: true, link: { type: 'custom', label: 'Drop', url: '/drop' } },
        { visible: true, link: { type: 'custom', label: 'Contact', url: '/contact' } },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'footer',
    data: {
      // Brand column
      showBrandColumn: true,
      showLogo: true,
      showTagline: true,
      tagline: 'UGLY IS THE NEW SICK',
      showEmailSignup: true,
      emailPlaceholder: 'your@email.com',
      emailButtonText: 'Subscribe',
      emailSuccessMessage: 'Got it. No welcome email. Just drops.',
      showEmailNote: true,
      emailNote: 'no discount. no welcome series. just drops when they drop.',
      // Link columns
      showColumns: true,
      columns: [
        {
          visible: true,
          title: 'Shop',
          links: [
            { visible: true, label: 'All products', url: '/shop' },
            { visible: true, label: 'Tees', url: '/shop/t-shirts' },
            { visible: true, label: 'Hoodies', url: '/shop/hoodies' },
            { visible: true, label: 'Jackets', url: '/shop/jackets' },
            { visible: true, label: 'Pants', url: '/shop/pants' },
            { visible: true, label: 'Hats', url: '/shop/hats' },
            { visible: true, label: 'Accessories', url: '/shop/accessories' },
            { visible: true, label: 'Sets', url: '/shop/sets' },
          ],
        },
        {
          visible: true,
          title: 'Brand',
          links: [
            { visible: true, label: 'Thesis', url: '/thesis' },
            { visible: true, label: 'Lanes', url: '/lanes' },
            { visible: true, label: 'Contact', url: '/contact' },
            { visible: true, label: 'FAQ', url: '/faq' },
          ],
        },
        {
          visible: true,
          title: 'Less interesting',
          links: [
            { visible: true, label: 'Shipping & returns', url: '/shipping-returns' },
            { visible: true, label: 'Size guide', url: '/size-guide' },
            { visible: true, label: 'Privacy', url: '/privacy' },
            { visible: true, label: 'Terms', url: '/terms' },
            { visible: true, label: 'hello@uglylook.com', url: 'mailto:hello@uglylook.com' },
          ],
        },
      ],
      // Bottom bar
      showBottomBar: true,
      showCopyright: true,
      copyrightText: '\u00A9 2026 UglyLook \u00B7 POD partners: Printful + Gelato',
      showThemeToggle: true,
      themeToggleAlignment: 'center',
      showBottomNote: true,
      bottomNote: 'printed when you ordered it',
    },
  })

  // ── Page globals ──
  payload.logger.info('— Seeding page globals...')

  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      metaTitle: 'UglyLook \u2014 Ugly is the new sick.',
      metaDescription: 'Tees, hoodies and objects too loud for the For You page. 240gsm cotton, boxy fit, dry copy, printed when you order.',
      showFrameMarks: true,
      showHero: true,
      heroStamp: 'SS27 \u00B7 QUIET BUILD',
      heroClock: '23:14 UTC',
      heroFileLabel: 'FILE / 01 \u2014 LANDING',
      heroLine1: 'Good is over.',
      heroLine2: 'Ugly is the new',
      heroLine3: 'sick.',
      heroSubtitle: "Tees, hoodies and objects too loud for the For You page. 240gsm cotton, boxy fit, dry copy, printed when you order. None of it is for the people who\u2019ll call it ugly. All of it is for the people who\u2019ll call it ugly and mean it.",
      heroCta1Text: 'See the catalog',
      heroCta1Url: '/shop',
      heroCta2Text: 'Read the thesis',
      heroCta2Url: '#manifesto',
      heroNote: 'no email required \u00B7 no popup \u00B7 ever.',
      showTagCard: true,
      heroTagRows: [
        { visible: true, label: 'Brand', value: 'UglyLook', highlight: false },
        { visible: true, label: 'Founded', value: 'Internet, 2026', highlight: false },
        { visible: true, label: 'Catalog', value: '17 SKUs \u00B7 5 lanes', highlight: true },
        { visible: true, label: 'Made', value: 'POD \u00B7 DTG \u00B7 ringspun cotton', highlight: false },
        { visible: true, label: 'Filter', value: 'Aggressive', highlight: true },
      ],
      showMarquee: true,
      marqueeWords: [
        { word: 'Sick', highlight: false },
        { word: 'Wicked', highlight: false },
        { word: 'Bad', highlight: false },
        { word: 'Killer', highlight: false },
        { word: 'Dope', highlight: false },
        { word: 'Filthy', highlight: false },
        { word: 'Nasty', highlight: false },
        { word: 'Gnarly', highlight: false },
        { word: 'Ugly', highlight: true },
      ],
      marqueeSeparator: '\u2715',
      showPullQuote: true,
      pullQuoteMetaLeft: 'FN.01',
      pullQuoteText: 'Coolness is always the inversion of an insult.',
      pullQuoteEmWord: 'inversion',
      pullQuoteMetaRight: 'UL \u00B7 SS27',
      showManifesto: true,
      manifestoNumber: 'SEC / 03',
      manifestoTitle: 'The thesis.\nIn writing.',
      manifestoLede: 'Every generation inverts new slang for \u201Cgood,\u201D and every word started its life meaning bad. We\u2019re just the first ones putting it on the chest.',
      manifestoColumns: [
        { visible: true, heading: '01. The inversion', paragraph1: 'Sick. Wicked. Bad. Killer. Dope. Filthy. Nasty. Gnarly. Every generation picks a word that means \u201Cterrible\u201D and decides it actually means \u201Cexcellent.\u201D', paragraph2: 'Ugly is just the latest flip. We didn\u2019t invent the pattern \u2014 we named the brand after it.' },
        { visible: true, heading: '02. The filter', paragraph1: 'The name is a gate. People who take \u201Cugly\u201D at face value self-eject. That\u2019s not a bug \u2014 it\u2019s the entire brand strategy.', paragraph2: 'Mainstream will never adopt the word sincerely. Which means mainstream will never dilute the label. The filter is permanent.' },
        { visible: true, heading: '03. The discipline', paragraph1: 'Loud product. Calm frame. The garment screams so the brand doesn\u2019t have to.', paragraph2: 'No influencer seeding. No urgency timers. No lifestyle photography. The copy is dry, the cotton is heavy, and the design earns the name.' },
      ],
      showRules: true,
      rulesTerm: 'What we don\u2019t do',
      rulesDefinition: '\u201CCurated.\u201D Founder selfies. Points programs. Referral wheels. 10%-off-for-your-email popups. Mountain hero shots. Coffee-cup lifestyle. Black Friday in the standard way. Performing Gen\u00A0Z in the copy. Soft pastel anything. Recoloring the logo. Explaining the joke.',
      showSpec: true,
      specNumber: 'SEC / 05',
      specHeading: 'The joke has weight. Literally.',
      specSubtext: 'The line is dry on purpose. The garment is heavy on purpose. If the irony floats, the brand floats with it. So we anchor every product in one concrete number.',
      specRows: [
        { visible: true, label: 'Tee weight', value: '240 GSM \u00B7 ringspun cotton' },
        { visible: true, label: 'Hoodie weight', value: '380 GSM \u00B7 brushed fleece' },
        { visible: true, label: 'Cut', value: 'Boxy / dropped shoulder' },
        { visible: true, label: 'Printing', value: 'DTG (direct to garment)' },
        { visible: true, label: 'Ships from', value: 'Berlin \u00B7 Riga \u00B7 Charlotte' },
        { visible: true, label: 'Returns', value: '30 days, unworn, tags on' },
        { visible: true, label: 'Care label', value: 'Cold wash \u00B7 hang dry \u00B7 iron inside out' },
        { visible: true, label: 'Editions', value: 'Limited runs \u00B7 no restocks' },
      ],
      showDrop: true,
      dropLabel: "SEC / 06 \u00B7 Next drop \u00B7 we\u2019re not counting because urgency is for amateurs but here\u2019s the number anyway.",
      dropHeading: 'SS27 / 01 \u2014 opens when it opens.',
      dropTargetDate: '2027-01-14T14:00:00.000Z',
    },
  })

  await payload.updateGlobal({
    slug: 'thesisPage',
    data: {
      metaTitle: 'Thesis \u2014 UglyLook',
      showHeader: true, sectionNumber: 'SEC / 03', heading: 'The thesis. In writing.', subheading: 'Why the name works \u00B7 why the filter is permanent',
      showLede: true, lede: 'Every generation invents new slang for \u201Cgood,\u201D and every word started its life meaning bad. We\u2019re just the first ones putting it on the chest.',
      showColumns: true,
      columns: [
        { visible: true, heading: '01. The inversion', paragraph1: 'Sick. Wicked. Bad. Killer. Dope. Filthy. Nasty. Gnarly. Every generation picks a word that means \u201Cterrible\u201D and decides it actually means \u201Cexcellent.\u201D', paragraph2: 'Ugly is just the latest flip. We didn\u2019t invent the pattern \u2014 we named the brand after it.' },
        { visible: true, heading: '02. The filter', paragraph1: 'The name is a gate. People who take \u201Cugly\u201D at face value self-eject. That\u2019s not a bug \u2014 it\u2019s the entire brand strategy.', paragraph2: 'Mainstream will never adopt the word sincerely. Which means mainstream will never dilute the label. The filter is permanent.' },
        { visible: true, heading: '03. The discipline', paragraph1: 'Loud product. Calm frame. The garment screams so the brand doesn\u2019t have to.', paragraph2: 'No influencer seeding. No urgency timers. No lifestyle photography. The copy is dry, the cotton is heavy, and the design earns the name.' },
      ],
      showRules: true, rulesTerm: 'What we don\u2019t do', rulesDefinition: '\u201CCurated.\u201D Founder selfies. Points programs. Referral wheels. 10%-off-for-your-email popups. Mountain hero shots. Coffee-cup lifestyle. Black Friday in the standard way. Performing Gen\u00A0Z in the copy. Soft pastel anything. Recoloring the logo. Explaining the joke.',
    },
  })

  await payload.updateGlobal({
    slug: 'lanesPage',
    data: {
      metaTitle: 'Lanes \u2014 UglyLook',
      showHeader: true, sectionNumber: 'SEC / 04', heading: "Five lanes.\nThat\u2019s the catalog.", subheading: 'No drift \u00B7 no \u201Cathletic\u201D \u00B7 no \u201Csoft and feminine\u201D \u00B7 no kids',
      showLanes: true,
      lanes: [
        { visible: true, number: 'L.01', name: 'Maximalist collage.', description: 'Layered imagery. Clashing type. Deliberate visual overload. The \u201Ctoo much\u201D lane \u2014 earns the brand its name.' },
        { visible: true, number: 'L.02', name: 'Ironic text-only.', description: 'Bold declarative type. Phrases that read as both confession and flex. The shirt does the talking so you don\u2019t have to.' },
        { visible: true, number: 'L.03', name: 'Weirdcore / liminal.', description: '\u201CAre you real\u201D energy. Eyeballs, CRT scan lines, uncanny imagery \u2014 the visual language of people raised on Tumblr, Twitter, TikTok.' },
        { visible: true, number: 'L.04', name: 'Anti-design brutalism.', description: 'Helvetica blown up to absurd scale. Broken layouts. Error-message energy. Design school graduates rolling their eyes is the target reaction.' },
        { visible: true, number: 'L.05', name: 'Y2K-adjacent.', description: 'Chrome swirls. Butterflies. The fastest-dating lane \u2014 reserved for objects, not garments. One mug. That\u2019s it.' },
      ],
      showNegativeBox: true, negativeBoxLabel: 'Not in the catalog', negativeBoxContent: 'clean minimalism \u00B7 soft / feminine \u00B7 athletic / performance \u00B7 luxury polish \u00B7 kids & family \u00B7 anything that needs the joke explained.',
    },
  })

  await payload.updateGlobal({
    slug: 'dropPage',
    data: {
      showHeader: true, sectionNumber: 'SEC / 06', heading: 'SS27 / 01 \u2014 opens when it opens.', subheading: "We\u2019re not counting because urgency is for amateurs \u00B7 but here\u2019s the number anyway",
      showCountdown: true, targetDate: '2027-01-14T14:00:00.000Z',
      showFooterNote: true, footerNote: 'No early access. No waitlist. No \u201Cnotify me.\u201D',
    },
  })

  await payload.updateGlobal({
    slug: 'contactPage',
    data: {
      sectionNumber: 'SEC / 07', heading: 'Contact. If you must.',
      showInfoColumn: true,
      infoParagraph: "We read everything. We reply when there\u2019s something to say. No templates. No auto-responses. Just a person, eventually.",
      email: 'hello@uglylook.com',
      showInfoBox: true, infoBoxLine1: 'No live chat. No chatbot.', infoBoxLine2: 'No \u201Chow can I help you today\u201D energy.', infoBoxLine3: 'No ticket number. No SLA.',
      showForm: true, namePlaceholder: 'your name', emailPlaceholder: 'you@somewhere.com', subjectPlaceholder: 'optional', messagePlaceholder: "keep it short or don\u2019t. we\u2019ll read it either way.", submitText: 'Send',
      successLabel: 'SENT', successHeading: 'Got it.', successMessage: "We\u2019ll read it eventually. If it needs a reply, you\u2019ll get one.",
    },
  })

  await payload.updateGlobal({
    slug: 'faqPage',
    data: {
      sectionLabel: 'INFO / 03', heading: "FAQ. Fine, we\u2019ll explain.",
      categories: [
        { visible: true, name: 'Shipping', questions: [
          { visible: true, question: 'How long does shipping take?', answer: '5\u201310 business days total. 2\u20135 days production, then 3\u20137 days transit depending on where you are. We ship from Charlotte, Berlin, and Riga.' },
          { visible: true, question: 'Do you ship internationally?', answer: 'Yes. Everywhere Printful and Gelato can reach. Customs duties and import taxes are on you.' },
          { visible: true, question: 'Can I track my order?', answer: "You\u2019ll get a tracking number by email once your order ships. Production doesn\u2019t have tracking \u2014 it\u2019s just being made." },
        ]},
        { visible: true, name: 'Returns', questions: [
          { visible: true, question: "What\u2019s your return policy?", answer: '30 days. Unworn. Tags on. Email hello@uglylook.com with your order number. We send a return label within 48 hours.' },
          { visible: true, question: 'Can I exchange for a different size?', answer: "Not directly. Return the original, get your refund, order the right size. It\u2019s faster than waiting for us to process an exchange." },
          { visible: true, question: 'What if my item arrived damaged?', answer: 'Email us with photos. We replace it or refund it. No argument, no 20-question form.' },
        ]},
        { visible: true, name: 'Sizing', questions: [
          { visible: true, question: 'How do your sizes run?', answer: 'Boxy fit. Relaxed shoulders. They run generous. If you\u2019re between sizes, size down.' },
          { visible: true, question: 'Will it shrink?', answer: "Yes, if you abuse it. Cold wash, hang dry, and it\u2019ll hold. Hot wash? That\u2019s on you." },
        ]},
        { visible: true, name: 'Care', questions: [
          { visible: true, question: 'How do I wash printed items?', answer: "Inside out. Cold water. Hang dry or tumble low. No bleach. No ironing on the print. The print is DTG \u2014 treat it like you care." },
          { visible: true, question: 'Will the print crack or fade?', answer: 'DTG prints are embedded in the fiber, not sitting on top. Follow the care instructions and they hold up. Ignore them and find out.' },
        ]},
        { visible: true, name: 'Payment', questions: [
          { visible: true, question: 'What payment methods do you accept?', answer: 'All major cards via Stripe. Apple Pay. Google Pay. We don\u2019t do crypto or \u201Cpay in 4\u201D schemes.' },
          { visible: true, question: 'Is checkout secure?', answer: 'Stripe handles payment. PCI DSS Level 1 compliant. We never see your card number. Standard stuff, done properly.' },
        ]},
        { visible: true, name: 'Other', questions: [
          { visible: true, question: 'Do you do collaborations?', answer: 'Sometimes. Email hello@uglylook.com with your pitch. Keep it short. We read everything.' },
          { visible: true, question: 'Are these limited edition?', answer: "Print-on-demand means we can print forever. But designs get retired when we feel like it. No countdown timers. No fake urgency." },
        ]},
      ],
      showFooterCta: true, footerCtaText: "Still have questions? Contact us. We read everything. We reply when there\u2019s something to say.",
    },
  })

  await payload.updateGlobal({
    slug: 'shippingReturnsPage',
    data: {
      metaTitle: 'Shipping & Returns \u2014 UglyLook', metaDescription: 'Shipping info, return policy, and international fulfillment details.',
      sectionLabel: 'INFO / 01', heading: 'Shipping & Returns.',
      show_howItWorks: true, howItWorks_title: 'How it works', howItWorks_content: "Every piece is print-on-demand. Nothing sits in a warehouse. When you order, your item gets printed, pressed, and packed \u2014 then shipped directly to you.\n\nFulfillment partners: Printful (US, EU) and Gelato (global). Facilities in Charlotte, Berlin, and Riga \u2014 your order ships from the nearest hub.",
      show_shippingTable: true, shippingTableTitle: 'Shipping times',
      shippingRows: [
        { visible: true, region: 'US domestic', production: '2\u20135 days', transit: '3\u20135 days' },
        { visible: true, region: 'Europe', production: '2\u20135 days', transit: '3\u20137 days' },
        { visible: true, region: 'International', production: '2\u20135 days', transit: '5\u201312 days' },
      ],
      shippingTableNote: 'Total delivery: 5\u201310 business days for most orders. Customs delays are on customs.',
      show_returns: true, returns_title: 'Returns', returns_content: "30-day return window. Unworn, unwashed, tags still on. That\u2019s it.\n\nEmail hello@uglylook.com with your order number and reason. We\u2019ll send a return label within 48 hours.\n\nRefunds hit your original payment method within 5\u201310 business days after we receive the item. No restocking fees. No store credit games.",
      show_noReturns: true, noReturnsTitle: "What we don\u2019t take back",
      noReturnsList: [
        { visible: true, text: 'Items worn, washed, or altered' },
        { visible: true, text: 'Items without original tags' },
        { visible: true, text: 'Items returned after 30 days' },
        { visible: true, text: "Mugs. They\u2019re yours now." },
      ],
      show_damaged: true, damaged_title: 'Damaged or wrong item', damaged_content: "If it arrived damaged or we sent the wrong thing \u2014 email us with photos. We\u2019ll replace it or refund it. No argument.",
    },
  })

  await payload.updateGlobal({
    slug: 'sizeGuidePage',
    data: {
      metaTitle: 'Size Guide \u2014 UglyLook', metaDescription: 'Sizing charts and fit guide for UglyLook apparel.',
      sectionLabel: 'INFO / 02', heading: 'Size Guide.', subtext: "Boxy fit. Relaxed shoulders. If you\u2019re between sizes, size down. These run generous on purpose.",
      sizeTables: [
        { visible: true, title: 'Tees', rows: [
          { size: 'S', chest: '36\u2033 / 91.4 cm', length: '28\u2033 / 71.1 cm', sleeve: '8\u2033 / 20.3 cm' },
          { size: 'M', chest: '38\u2033 / 96.5 cm', length: '29\u2033 / 73.7 cm', sleeve: '8.5\u2033 / 21.6 cm' },
          { size: 'L', chest: '41\u2033 / 104.1 cm', length: '30\u2033 / 76.2 cm', sleeve: '9\u2033 / 22.9 cm' },
          { size: 'XL', chest: '44\u2033 / 111.8 cm', length: '31\u2033 / 78.7 cm', sleeve: '9.5\u2033 / 24.1 cm' },
          { size: 'XXL', chest: '47\u2033 / 119.4 cm', length: '32\u2033 / 81.3 cm', sleeve: '10\u2033 / 25.4 cm' },
        ]},
        { visible: true, title: 'Hoodies', rows: [
          { size: 'S', chest: '38\u2033 / 96.5 cm', length: '26\u2033 / 66.0 cm', sleeve: '25\u2033 / 63.5 cm' },
          { size: 'M', chest: '41\u2033 / 104.1 cm', length: '27\u2033 / 68.6 cm', sleeve: '25.5\u2033 / 64.8 cm' },
          { size: 'L', chest: '44\u2033 / 111.8 cm', length: '28\u2033 / 71.1 cm', sleeve: '26\u2033 / 66.0 cm' },
          { size: 'XL', chest: '47\u2033 / 119.4 cm', length: '29\u2033 / 73.7 cm', sleeve: '26.5\u2033 / 67.3 cm' },
          { size: 'XXL', chest: '50\u2033 / 127.0 cm', length: '30\u2033 / 76.2 cm', sleeve: '27\u2033 / 68.6 cm' },
        ]},
      ],
      show_howToMeasure: true, measureTitle: 'How to measure',
      measureChest: 'Measure across the chest, 1 inch below the armhole, from edge to edge. Double it.',
      measureLength: 'From the highest point of the shoulder to the bottom hem.',
      measureSleeve: 'Tees: from shoulder seam to sleeve hem. Hoodies: from center back neck, across the shoulder, down to the cuff.',
      show_fitNote: true, fitNoteLabel: 'Fit note', fitNoteContent: "All garments are pre-shrunk. Cold wash, hang dry, and they\u2019ll hold their shape. Hot wash at your own risk \u2014 we warned you.",
    },
  })

  await payload.updateGlobal({
    slug: 'privacyPage',
    data: {
      metaTitle: 'Privacy Policy \u2014 UglyLook', metaDescription: 'How UglyLook handles your data. Short version: carefully.',
      sectionLabel: 'LEGAL / 01', heading: 'Privacy.', lastUpdated: 'January 2026',
      sections: [
        { visible: true, number: '01', title: 'What we collect', listItems: [
          { visible: true, text: 'Name and email address' },
          { visible: true, text: 'Shipping address' },
          { visible: true, text: 'Payment info (processed by Stripe \u2014 we never see your card number)' },
          { visible: true, text: 'Order history' },
        ], paragraph: "If you just browse, we collect basic analytics: pages visited, device type, approximate location (country level). Nothing creepy." },
        { visible: true, number: '02', title: 'Cookies', listItems: [
          { visible: true, text: 'Keeping you logged in (session cookie)' },
          { visible: true, text: 'Remembering your cart (functional cookie)' },
          { visible: true, text: 'Basic analytics (anonymized, no ad tracking)' },
        ], paragraph: "No third-party ad trackers. No Facebook pixel. No retargeting. We don\u2019t follow you around the internet." },
        { visible: true, number: '03', title: 'How we use your data', listItems: [
          { visible: true, text: 'To fulfill your orders (obviously)' },
          { visible: true, text: 'To send order confirmations and shipping updates' },
          { visible: true, text: 'To send drop announcements if you subscribed' },
          { visible: true, text: 'To improve the site based on aggregate analytics' },
        ], paragraph: "We don\u2019t sell your data. We don\u2019t rent it. We don\u2019t trade it." },
        { visible: true, number: '04', title: 'Third parties', listItems: [
          { visible: true, text: 'Stripe \u2014 payment processing' },
          { visible: true, text: 'Printful / Gelato \u2014 order fulfillment (they need your shipping address)' },
          { visible: true, text: 'Email provider \u2014 transactional emails only' },
        ], paragraph: "Each of these has their own privacy policy. We picked them because they\u2019re not terrible." },
        { visible: true, number: '05', title: 'Your rights', listItems: [
          { visible: true, text: 'Request a copy of your data' },
          { visible: true, text: 'Ask us to delete your account and data' },
          { visible: true, text: 'Unsubscribe from emails (one click, always)' },
          { visible: true, text: 'Object to processing (GDPR Article 21)' },
        ], paragraph: "Email hello@uglylook.com for any of the above. We\u2019ll respond within 30 days. Usually faster." },
        { visible: true, number: '06', title: 'Data retention', listItems: [], paragraph: "Order data: kept for 7 years (tax and legal requirements). Account data: kept until you delete your account. Analytics: anonymized after 26 months." },
        { visible: true, number: '07', title: 'Security', listItems: [], paragraph: "All connections are encrypted (TLS). Payment data is handled by Stripe (PCI DSS Level 1). We don\u2019t store passwords in plaintext \u2014 they\u2019re hashed. Standard stuff, done properly." },
        { visible: true, number: '08', title: 'Changes', listItems: [], paragraph: "If we change this policy, we\u2019ll update the date at the top. No dark patterns. No silent edits to the important parts." },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'termsPage',
    data: {
      metaTitle: 'Terms of Service \u2014 UglyLook', metaDescription: 'Terms and conditions for using UglyLook.',
      sectionLabel: 'LEGAL / 02', heading: 'Terms.', lastUpdated: 'January 2026',
      sections: [
        { visible: true, number: '01', title: 'Agreement', content: "By using uglylook.com or purchasing from us, you agree to these terms. If you don\u2019t agree, that\u2019s fine \u2014 but you can\u2019t buy anything." },
        { visible: true, number: '02', title: 'Products & orders', content: "All products are print-on-demand. Colors may vary slightly from screen to garment \u2014 that\u2019s the nature of DTG printing, not a defect.\n\nWe reserve the right to cancel orders for any reason, including suspected fraud or inventory issues. If we cancel, you get a full refund.\n\nPrices are in USD. Taxes, duties, and customs fees for international orders are the buyer\u2019s responsibility." },
        { visible: true, number: '03', title: 'Accounts', content: "You can check out as a guest or create an account. If you create an account, keep your password secure. We\u2019re not responsible for unauthorized access due to weak passwords.\n\nWe can suspend or terminate accounts that violate these terms. We probably won\u2019t, but we can." },
        { visible: true, number: '04', title: 'Intellectual property', content: "All designs, graphics, text, and branding on this site are owned by UglyLook. You can\u2019t reproduce, distribute, or create derivative works without written permission.\n\nBuying a product gives you the right to wear it. Not to reprint it, resell the design, or put it on your own merch." },
        { visible: true, number: '05', title: 'User content', content: "If you send us messages, feedback, or content (via the contact form, email, or social media), you grant us a non-exclusive right to use that content for marketing purposes. We won\u2019t use your name without asking first." },
        { visible: true, number: '06', title: 'Limitation of liability', content: "UglyLook is provided \u201Cas is.\u201D We don\u2019t guarantee uninterrupted service, error-free operation, or that the olive green on your screen matches the olive green on your hoodie.\n\nOur total liability for any claim is limited to the amount you paid for the product in question. We\u2019re not liable for indirect, incidental, or consequential damages." },
        { visible: true, number: '07', title: 'Returns & refunds', content: "See our Shipping & Returns page for the full policy. The short version: 30 days, unworn, tags on." },
        { visible: true, number: '08', title: 'Governing law', content: "These terms are governed by the laws of the State of Delaware, United States. Any disputes will be resolved in the courts of Delaware. If you\u2019re in the EU, your local consumer protection laws still apply." },
        { visible: true, number: '09', title: 'Changes', content: "We may update these terms. When we do, we\u2019ll update the date at the top. Continued use of the site after changes means you accept the new terms." },
      ],
      showFooterCta: true, footerCtaText: "Questions about these terms? Email hello@uglylook.com. We\u2019ll respond in plain language.",
    },
  })

  // ── Sample data (customer, orders, etc.) ──
  // Wrapped in try/catch — these are non-critical and the ecommerce plugin
  // hooks can fail on remote DBs. Store content above is what matters.
  try {
    payload.logger.info('— Seeding sample customer & orders...')

    await payload.delete({
      collection: 'customers',
      depth: 0,
      where: { email: { equals: 'customer@example.com' } },
    })

    const customer = await payload.create({
      collection: 'customers',
      data: {
        name: 'Customer',
        email: 'customer@example.com',
        password: 'password',
      },
    })

    await payload.create({
      collection: 'addresses',
      depth: 0,
      data: { customer: customer.id, ...(baseAddressUSData as Address) },
    })

    await payload.create({
      collection: 'addresses',
      depth: 0,
      data: { customer: customer.id, ...(baseAddressUKData as Address) },
    })

    const succeededTransaction = await payload.create({
      collection: 'transactions',
      data: {
        currency: 'USD',
        customer: customer.id,
        paymentMethod: 'stripe',
        stripe: { customerID: 'cus_123', paymentIntentID: 'pi_succeeded' },
        status: 'succeeded',
        billingAddress: baseAddressUSData,
      },
    })

    const sampleProduct = productRecords['icon-tee-black']

    await payload.create({
      collection: 'carts',
      data: {
        customer: customer.id,
        currency: 'USD',
        items: [{ product: sampleProduct.id, quantity: 1 }],
      },
    })

    await payload.create({
      collection: 'orders',
      data: {
        amount: 3500,
        currency: 'USD',
        customer: customer.id,
        shippingAddress: baseAddressUSData,
        items: [{ product: sampleProduct.id, quantity: 1 }],
        status: 'processing',
        transactions: [succeededTransaction.id],
      },
    })

    payload.logger.info('— Sample data seeded.')
  } catch (err) {
    payload.logger.warn('— Sample data seeding failed (non-critical, skipping):')
    payload.logger.warn(err)
  }

  // ── Photo Presets ──
  payload.logger.info('— Seeding photo presets...')
  const photoPresetDefaults = [
    { name: 'Campaign Hero \u2014 Dark BG', photoType: 'campaign-hero', background: 'near-black', mood: 'neutral', detailLevel: 'high', defaultImageModel: 'flux-2-pro', promptTemplate: 'High-end fashion campaign photo. Gen Z model wearing UglyLook product prominently. Near-black #111 seamless studio background. Single soft directional light from upper-left. Neutral expression, direct camera gaze. Boxy dropped-shoulder fit visible. Shot on medium format, shallow depth of field.', isActive: true, timesUsed: 0 },
    { name: 'Campaign Hero \u2014 Cream BG', photoType: 'campaign-hero', background: 'cream', mood: 'neutral', detailLevel: 'high', defaultImageModel: 'flux-2-pro', promptTemplate: 'Fashion campaign photo on warm cream #F5F2EC seamless background. Gen Z model wearing UglyLook product. Soft natural daylight feel. Neutral expression. Boxy oversized fit clearly visible. Clean minimal composition.', isActive: true, timesUsed: 0 },
    { name: 'On-Model \u2014 Front View', photoType: 'on-model', background: 'near-black', mood: 'neutral', detailLevel: 'medium', defaultImageModel: 'flux-2-pro', promptTemplate: 'Product photography on model. Front-facing view. Near-black #111 background. Garment fills 65-75% of frame. Single soft directional light upper-left. Print/design legible. Boxy fit, dropped shoulder visible.', isActive: true, timesUsed: 0 },
    { name: 'On-Model \u2014 Back View', photoType: 'on-model', background: 'near-black', mood: 'neutral', detailLevel: 'medium', defaultImageModel: 'flux-2-pro', promptTemplate: 'Product photography on model. Back-facing view showing rear of garment. Near-black #111 background. Back print or label visible. Single soft directional light upper-left.', isActive: true, timesUsed: 0 },
    { name: 'Editorial \u2014 Parking Garage', photoType: 'editorial', background: 'environment', mood: 'editorial', detailLevel: 'high', defaultImageModel: 'flux-2-pro', promptTemplate: 'Fashion editorial in a fluorescent-lit parking garage. Harsh overhead fluorescent lighting, concrete pillars, yellow lane markings. Gen Z model wearing UglyLook oversized tee/hoodie. Deadpan expression, stiff posture. Shot on 35mm film, slight grain.', isActive: true, timesUsed: 0 },
    { name: 'Detail \u2014 Fabric Texture', photoType: 'detail-texture', background: 'near-black', mood: 'raw', detailLevel: 'very-high', defaultImageModel: 'flux-2-pro', promptTemplate: 'Macro close-up product photography. Focus on 240gsm cotton fabric weave texture. Near-black background. Soft directional lighting. Shallow depth of field. Premium quality streetwear material detail.', isActive: true, timesUsed: 0 },
  ]
  for (const preset of photoPresetDefaults) {
    try {
      const existing = await payload.find({ collection: 'photo-presets' as any, where: { name: { equals: preset.name } }, limit: 1 })
      if (existing.docs.length === 0) {
        await payload.create({ collection: 'photo-presets' as any, data: preset as any })
      }
    } catch { /* skip if exists */ }
  }

  payload.logger.info('Seeded database successfully!')
}
