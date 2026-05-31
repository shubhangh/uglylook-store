/**
 * Text Compositor — Satori (JSX→SVG) + resvg-js (SVG→PNG) + Sharp (composite).
 *
 * Renders crisp, pixel-perfect text over AI-generated graphics.
 * Fonts fetched dynamically from Google Fonts API, cached in memory.
 */

import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'
import { fetchGoogleFont } from '@/lib/font-loader'
import type { GenZPalette } from '@/lib/gen-z-palettes'

// ── Types ──

export type TextCompositeOptions = {
  graphicBuffer: Buffer         // AI-generated background image
  width: number
  height: number
  heroText: string              // "DO NOT PERCEIVE ME"
  subText?: string              // "visibility: hidden"
  palette: GenZPalette
  position: 'bottom-left' | 'center' | 'bottom-center'
  garmentColor: 'dark' | 'light'
  heroFont?: string             // default: "Inter"
  heroWeight?: number           // default: 900
  subFont?: string              // default: "JetBrains Mono"
  subWeight?: number            // default: 400
}

export type TextCompositeResult = {
  buffer: Buffer
  mimeType: string
}

// ── Position Layouts ──

function getFlexLayout(position: TextCompositeOptions['position']) {
  switch (position) {
    case 'bottom-left':
      return { justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 60px 80px 60px' } as const
    case 'center':
      return { justifyContent: 'center', alignItems: 'center', padding: '60px' } as const
    case 'bottom-center':
      return { justifyContent: 'flex-end', alignItems: 'center', padding: '0 60px 80px 60px' } as const
  }
}

function getTextAlign(position: TextCompositeOptions['position']): 'left' | 'center' {
  return position === 'bottom-left' ? 'left' : 'center'
}

// ── Pick text colors from palette based on garment ──

function getTextColors(palette: GenZPalette, garmentColor: 'dark' | 'light') {
  // Dark garment → use light palette colors for text visibility
  // Light garment → use dark palette colors
  if (garmentColor === 'dark') {
    // Use bone/light neutral for hero, secondary for sub
    const lightColor = palette.colors.find((c) => c.role.toLowerCase().includes('light neutral'))
    const secondary = palette.colors.find((c) => c.role.toLowerCase().includes('secondary'))
    return {
      heroColor: lightColor?.hex || palette.colors[2]?.hex || '#E8DCC8',
      subColor: secondary?.hex || palette.colors[1]?.hex || '#C45B28',
    }
  } else {
    // Use structure/dark color for hero, primary for sub
    const structureColor = palette.colors.find((c) => c.role.toLowerCase().includes('structure'))
    const primary = palette.colors.find((c) => c.role.toLowerCase().includes('primary'))
    return {
      heroColor: structureColor?.hex || palette.colors[3]?.hex || '#2B2B2B',
      subColor: primary?.hex || palette.colors[0]?.hex || '#5C4033',
    }
  }
}

// ── Main Compositor ──

export async function compositeTextDesign(
  options: TextCompositeOptions,
): Promise<TextCompositeResult> {
  const {
    graphicBuffer, width, height, heroText, subText, palette, position, garmentColor,
    heroFont = 'Inter', heroWeight = 900, subFont = 'JetBrains Mono', subWeight = 400,
  } = options

  // Fetch fonts dynamically (cached after first call)
  const heroFontData = await fetchGoogleFont(heroFont, heroWeight)
  const subFontData = subText ? await fetchGoogleFont(subFont, subWeight) : null
  const layout = getFlexLayout(position)
  const textAlign = getTextAlign(position)
  const { heroColor, subColor } = getTextColors(palette, garmentColor)

  // Scale font size based on image dimensions and text length
  const baseFontSize = Math.min(width, height) * 0.08
  const heroFontSize = heroText.length > 25
    ? baseFontSize * 0.7
    : heroText.length > 18
      ? baseFontSize * 0.85
      : baseFontSize
  const subFontSize = heroFontSize * 0.35

  // 1. Render text overlay as SVG via Satori
  // Build children for the text container
  const textChildren: any[] = [
    {
      type: 'div',
      props: {
        style: {
          fontFamily: heroFont,
          fontSize: `${Math.round(heroFontSize)}px`,
          fontWeight: 900,
          color: heroColor,
          letterSpacing: '0.04em',
          lineHeight: 1.1,
          textAlign,
          textTransform: 'uppercase',
        },
        children: heroText,
      },
    },
  ]

  if (subText) {
    textChildren.push({
      type: 'div',
      props: {
        style: {
          fontFamily: subFont,
          fontSize: `${Math.round(subFontSize)}px`,
          fontWeight: 400,
          color: subColor,
          letterSpacing: '0.08em',
          textAlign,
          opacity: 0.85,
        },
        children: subText,
      },
    })
  }

  const element: any = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...layout,
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: subText ? `${Math.round(subFontSize * 0.6)}px` : '0',
            },
            children: textChildren,
          },
        },
      ],
    },
  }

  const svg = await satori(element,
    {
      width,
      height,
      fonts: [
        {
          name: heroFont,
          data: heroFontData,
          weight: heroWeight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
          style: 'normal' as const,
        },
        ...(subFontData
          ? [{
              name: subFont,
              data: subFontData,
              weight: subWeight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
              style: 'normal' as const,
            }]
          : []),
      ],
    },
  )

  // 2. Convert SVG → PNG (transparent background)
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: 'rgba(0, 0, 0, 0)',
  })
  const textPng = resvg.render().asPng()

  // 3. Composite text PNG over graphic using Sharp
  const composited = await sharp(graphicBuffer)
    .resize(width, height, { fit: 'cover' })
    .composite([{ input: textPng, top: 0, left: 0 }])
    .png()
    .toBuffer()

  return { buffer: composited, mimeType: 'image/png' }
}
