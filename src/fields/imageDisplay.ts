import type { Field } from 'payload'

/**
 * Reusable image display fields — add alongside any `upload` field
 * to give admins control over how the image renders on the frontend.
 *
 * Usage in a global/collection config:
 *   ...imageDisplayFields('heroImage'),
 *
 * Frontend usage:
 *   import { getImageDisplayClasses } from '@/utilities/imageDisplay'
 *   <div className={getImageDisplayClasses(data.heroImageSize, data.heroImageAspect)}>
 *     <Media resource={data.heroImage} ... />
 *   </div>
 */
export function imageDisplayFields(prefix: string): Field[] {
  return [
    {
      name: `${prefix}Size`,
      type: 'select',
      defaultValue: 'full',
      label: 'Display size',
      options: [
        { label: 'Small (33%)', value: 'small' },
        { label: 'Medium (50%)', value: 'medium' },
        { label: 'Large (75%)', value: 'large' },
        { label: 'Full width (100%)', value: 'full' },
      ],
      admin: {
        width: '50%',
        description: 'Controls how wide the image renders on the page.',
      },
    },
    {
      name: `${prefix}Aspect`,
      type: 'select',
      defaultValue: 'auto',
      label: 'Aspect ratio',
      options: [
        { label: 'Auto (original)', value: 'auto' },
        { label: 'Square (1:1)', value: 'square' },
        { label: 'Portrait (4:5)', value: 'portrait' },
        { label: 'Landscape (16:9)', value: 'landscape' },
        { label: 'Wide (21:9)', value: 'wide' },
      ],
      admin: {
        width: '50%',
        description: 'Controls the crop/aspect ratio of the image.',
      },
    },
  ]
}
