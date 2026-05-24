import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { checkRole } from '@/access/utilities'

export const maxDuration = 300

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&q=80',
  'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80',
  'https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&q=80',
]

const BLOG_POSTS = [
  {
    title: 'The Death of Clean Aesthetics',
    slug: 'death-of-clean-aesthetics',
    excerpt:
      'Minimalism had its run. The new wave of streetwear is loud, raw, and unapologetically ugly. Here is why that matters.',
    category: 'culture',
    author: 'UglyLook Editorial',
    publishedAt: '2026-05-20',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'For the better part of a decade, fashion worshipped at the altar of minimalism. Clean lines, neutral palettes, quiet luxury. It was elegant, sure. But it was also boring. And boring is the one thing streetwear was never supposed to be.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'The Pendulum Swings' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'The backlash was inevitable. When everything looks the same — when every brand is selling the same oatmeal-colored hoodie with the same sans-serif logo — people stop caring. Uniformity breeds apathy. And apathy is the death of culture.',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'What emerged in its place was something rawer. Intentionally imperfect. Graphic-heavy, oversized, clashing. The kind of clothes your parents would call ugly. That is exactly the point.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'Ugly as a Statement' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Ugly is not an accident. It is a choice. It says: I do not need your approval. I am not dressing for the algorithm. The new generation of streetwear is built on this defiance — a rejection of the polished, the curated, the safe.',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Brands like UglyLook are not trying to make you look good in the traditional sense. They are trying to make you look interesting. There is a difference, and it matters.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'What Comes Next' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'The death of clean aesthetics does not mean the death of design. It means the expansion of it. More textures, more references, more risks. The next era of fashion belongs to the weird, the loud, and the unapologetic.',
              },
            ],
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
  },
  {
    title: 'How We Source Fabrics Nobody Else Wants',
    slug: 'how-we-source-fabrics',
    excerpt:
      'Deadstock, surplus, factory rejects. The materials behind UglyLook are as unconventional as the clothes themselves.',
    category: 'behind-the-seams',
    author: 'UglyLook Editorial',
    publishedAt: '2026-05-15',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Every piece in the UglyLook collection starts with a fabric that most brands would reject. Off-spec weights, discontinued colorways, surplus from factories that overproduced. Materials with stories.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'The Case for Deadstock' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Deadstock fabric is material that was produced but never used. It sits in warehouses, waiting to be destroyed or dumped. We buy it instead. This is not a sustainability pitch — it is just smarter design. You get limited-run pieces made from premium materials at a fraction of the original cost.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'Factory Rejects, Reimagined' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'A fabric gets rejected because the dye lot came out slightly different from the spec. Or the weave has a subtle irregularity. These are flaws to a mass-market brand. To us, they are features. The slight variations mean no two batches are identical.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'Limited by Nature' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'When a fabric runs out, it is gone. We do not reorder. We do not replicate. Each drop is genuinely limited — not by artificial scarcity, but by the reality of working with materials nobody else wanted. That constraint forces creativity, and creativity is what this brand runs on.',
              },
            ],
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
  },
  {
    title: '5 Ways to Style an Oversized Silhouette',
    slug: '5-ways-oversized-silhouette',
    excerpt:
      'Oversized does not mean sloppy. Here are five ways to make big shapes work with intention.',
    category: 'style',
    author: 'UglyLook Editorial',
    publishedAt: '2026-05-10',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'The oversized silhouette is the backbone of modern streetwear. But there is a fine line between intentionally oversized and just wearing the wrong size. Here is how to get it right.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h3',
            children: [{ type: 'text', text: '1. Anchor With Footwear' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'A chunky shoe grounds a large top. It creates visual weight at the bottom that balances the volume above. Think platform boots, trail runners, or anything with presence.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h3',
            children: [{ type: 'text', text: '2. Tuck One Layer' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'If you are wearing an oversized top, tuck just the front into your waistband. It breaks up the block of fabric and gives your outfit a focal point.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h3',
            children: [{ type: 'text', text: '3. Contrast Proportions' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Pair a wide top with a slightly tapered bottom, or vice versa. The contrast creates shape and prevents the outfit from reading as one big rectangle.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h3',
            children: [{ type: 'text', text: '4. Roll the Sleeves' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Showing your wrists is a small move with a big payoff. It signals that the oversized fit is deliberate, not accidental. It adds a detail to an otherwise relaxed look.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h3',
            children: [{ type: 'text', text: '5. Accessorize Boldly' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Big clothes need accessories that hold their own. A structured bag, a thick chain, or a hat with personality. Small, delicate accessories get swallowed by volume.',
              },
            ],
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
  },
  {
    title: 'Drop 003 Is Coming. Here Is What We Know.',
    slug: 'drop-003-preview',
    excerpt:
      'The third UglyLook drop is nearly here. A first look at what is landing, when, and why it is different.',
    category: 'drops',
    author: 'UglyLook Editorial',
    publishedAt: '2026-05-05',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Drop 003 has been in the works for months. This is not a rushed restock or a recycled colorway — it is a full reset. New silhouettes, new fabrics, and a direction that pushes the brand further into uncomfortable territory.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'The Lineup' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Expect six pieces. Three tops, two bottoms, one outerwear. Every item uses a different fabric, sourced from three different countries. The color palette is tighter than previous drops — almost monochrome, but not quite.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'The Date' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'June 2026. Exact date to be announced on our socials. No early access, no pre-orders. When it drops, it drops. First come, first served.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'What Makes It Different' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Drop 003 is the first collection designed entirely around movement. How fabric falls when you walk. How a jacket sits when your hands are in your pockets. These are not photoshoot clothes. They are wearing clothes.',
              },
            ],
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
  },
  {
    title: 'Tokyo Street Style Is Still Unmatched',
    slug: 'tokyo-street-style',
    excerpt:
      'From Harajuku to Shimokitazawa, Tokyo remains the most interesting place to watch how people actually dress.',
    category: 'streetwear',
    author: 'UglyLook Editorial',
    publishedAt: '2026-04-28',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Every year, some fashion publication declares that Tokyo street style is dead or dying. And every year, five minutes on the streets of Shimokitazawa proves them wrong. The city remains the global epicenter of personal style — not because of trends, but because of attitude.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'The Layering Game' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Nobody layers like Tokyo. Three, four, five pieces combined in ways that should not work but always do. A technical jacket over a vintage knit over a graphic tee. Different eras, different contexts, one outfit. It is collage, not coordination.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'Proportion as Expression' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'In Western streetwear, oversized usually means uniformly big. In Tokyo, proportion is a tool. Cropped on top, wide on the bottom. Tight sleeves with a ballooning body. Each choice communicates something different.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'Why It Still Matters' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Tokyo street style matters because it is democratic. You do not need money to dress well here. You need taste, patience, and a willingness to look weird. That is the same energy that drives UglyLook. Not expensive, just interesting.',
              },
            ],
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
  },
]

async function uploadImageFromUrl(payload: any, url: string, filename: string) {
  const res = await fetch(url)
  const buffer = Buffer.from(await res.arrayBuffer())
  const file = {
    data: buffer,
    mimetype: 'image/jpeg',
    name: `${filename}.jpg`,
    size: buffer.length,
  }
  const media = await payload.create({
    collection: 'media',
    data: { alt: filename.replace(/-/g, ' ') },
    file,
  })
  return media.id
}

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    // Check if posts already exist
    const existing = await payload.find({ collection: 'posts', limit: 1 })
    if (existing.totalDocs > 0) {
      return Response.json({ message: 'Blog posts already exist. Skipping seed.' })
    }

    // Upload images and create posts
    for (let i = 0; i < BLOG_POSTS.length; i++) {
      const post = BLOG_POSTS[i]
      const imageId = await uploadImageFromUrl(
        payload,
        UNSPLASH_IMAGES[i],
        `blog-${post.slug}`,
      )

      await payload.create({
        collection: 'posts',
        data: {
          ...post,
          coverImage: imageId,
          status: 'published',
        } as any,
      })
    }

    return Response.json({ success: true, message: `Seeded ${BLOG_POSTS.length} blog posts.` })
  } catch (e: any) {
    payload.logger.error({ err: e, message: 'Error seeding blog data' })
    return new Response(`Error seeding blog data: ${e.message}`, { status: 500 })
  }
}
