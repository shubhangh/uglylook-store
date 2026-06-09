/**
 * Converts admin image display settings to Tailwind CSS classes.
 *
 * Usage:
 *   const { containerClass, imageClass } = getImageDisplayStyles(size, aspect)
 *   <div className={containerClass}>
 *     <Media imgClassName={imageClass} ... />
 *   </div>
 */

const SIZE_MAP: Record<string, string> = {
  small: 'max-w-[33%]',
  medium: 'max-w-[50%]',
  large: 'max-w-[75%]',
  full: 'w-full',
}

const ASPECT_MAP: Record<string, string> = {
  auto: '',
  square: 'aspect-square',
  portrait: 'aspect-[4/5]',
  landscape: 'aspect-[16/9]',
  wide: 'aspect-[21/9]',
}

export function getImageDisplayStyles(
  size?: string | null,
  aspect?: string | null,
): { containerClass: string; imageClass: string } {
  const sizeClass = SIZE_MAP[size || 'full'] || SIZE_MAP.full
  const aspectClass = ASPECT_MAP[aspect || 'auto'] || ''

  const containerClass = [
    sizeClass,
    aspectClass,
    'overflow-hidden rounded-lg',
    aspectClass ? '' : '', // no extra class needed for auto
  ]
    .filter(Boolean)
    .join(' ')

  const imageClass = aspectClass
    ? 'w-full h-full object-cover'
    : 'w-full h-auto'

  return { containerClass, imageClass }
}
