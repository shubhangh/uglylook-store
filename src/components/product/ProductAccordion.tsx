'use client'

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

type ProductAccordionProps = {
  description?: React.ReactNode
}

const MATERIAL_CARE = [
  'Cotton-blend fabric, pre-shrunk for minimal change',
  'DTG (Direct-to-Garment) printing — ink is in the fiber, not on top',
  'Cold wash, inside out. Hang dry or tumble low.',
  'No bleach. No ironing on the print. You know better.',
]

const DELIVERY_RETURNS = [
  'Production: 2–5 business days (made when you order)',
  'Shipping: 3–7 business days depending on location',
  'Ships from Charlotte, Berlin, or Riga — whichever is closer',
  '30-day returns: unworn, tags on. Email hello@uglylook.com',
  'Damaged items replaced or refunded. No argument.',
]

export function ProductAccordion({ description }: ProductAccordionProps) {
  return (
    <Accordion type="multiple" defaultValue={['description']} className="w-full">
      {description && (
        <AccordionItem value="description" className="border-border">
          <AccordionTrigger className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:no-underline py-5 text-olive-text">
            Description
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-foreground/70">
            {description}
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="material" className="border-border">
        <AccordionTrigger className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:no-underline py-5">
          Material & Care
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2">
            {MATERIAL_CARE.map((item) => (
              <li
                key={item}
                className="text-sm leading-relaxed text-foreground/70 flex items-start gap-2"
              >
                <span className="text-olive-text mt-1.5 text-[6px]">&#9679;</span>
                {item}
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="delivery" className="border-border">
        <AccordionTrigger className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:no-underline py-5">
          Delivery & Returns
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2">
            {DELIVERY_RETURNS.map((item) => (
              <li
                key={item}
                className="text-sm leading-relaxed text-foreground/70 flex items-start gap-2"
              >
                <span className="text-olive-text mt-1.5 text-[6px]">&#9679;</span>
                {item}
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
