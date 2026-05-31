/**
 * Pre-parsed fashion config for Claude prompt engineering.
 *
 * Instead of sending the full 2000+ token fashion doc every time,
 * this provides a structured ~200 token config that captures the rules.
 *
 * Source: fashion/UGLYLOOK_FASHION_REQUIREMENTS.md
 */

export const FASHION_CONFIG = {
  brand: {
    name: 'UglyLook',
    tagline: 'Ugly is the new sick.',
    voice: 'dry, deadpan, adult. Never explain the joke.',
    thesis:
      'Coolness is always the inversion of an insult. UglyLook is the next inversion, made physical.',
  },
  target: {
    primary: 'Gen Z, 15-28, irony-pilled / terminally-online',
    psychology:
      'Buys identity and visibility, not fabric. Screen-first: must punch on a phone screen.',
  },
  emotions: {
    tierA: [
      'In-group superiority — "I\'m in on it, you\'re not"',
      'Status-through-anti-status — the flex that you don\'t need the flex',
      'Self-deprecation as armor — name your flaw before anyone weaponizes it',
      'Belonging to a weird tribe — membership card for a subculture',
    ],
    tierB: [
      'Irony / detached amusement — unbothered, too amused to be sincere',
      'Rebellion / refusal — friction against polish and algorithmic sameness',
      'Confessional over-sharing — mental state worn out loud',
    ],
    tierC: [
      'Absurdist delight / unseriousness — random, anti-humor',
      'Weaponized nostalgia — ironic only, NEVER warm/sincere',
      'Novelty / curiosity-bait — scroll-stopping double-take',
    ],
    forbidden: [
      'Comfort / coziness / softness',
      'Aspiration / "your best self"',
      'Sincere belonging / wholesomeness',
      'Eco/ethical virtue as selling message',
      'Generic empowerment / "queen energy"',
    ],
  },
  lanes: {
    1: 'Ironic text-only — bold typography, declarative/absurdist phrases. STRONGEST trend.',
    2: 'Anti-design / brutalist — Helvetica blown up, broken layouts, error-message energy.',
    3: 'Weirdcore / liminal — eyeballs, CRT distortion, uncanny imagery.',
    4: 'Maximalist collage / chaos-print — layered imagery, clashing type, deliberate overload.',
    5: 'Y2K-adjacent — CAUTION: most crowded, most likely to date. Seasoning only.',
  },
  palette: {
    nearBlack: '#111111',
    cream: '#F5F2EC',
    olive: '#5A6242',
    petrol: '#264A4F',
    bone: '#D9D2C2',
  },
  typography: [
    'Font-as-tone does the heavy lifting. The joke is in the typeface mismatch.',
    'Text-only / 1-2 color prints are highest-reward, lowest-cost.',
    'Specificity beats generic. Hyper-specific references over broad slogans.',
    'Readable at a glance — must land in first second of a scroll.',
    'End on a punch, not a CTA.',
  ],
  rules: [
    'Filter discipline > volume. Reject in-lane-adjacent ideas that miss the emotion.',
    'No forbidden emotions.',
    'No explained jokes.',
    'Screen-first: if it doesn\'t punch on a phone, it isn\'t done.',
    'No real public figures, no copyrighted characters, no trademarked phrases.',
    'COLD emotions only (detached, ironic, superior, refusing). Never WARM.',
  ],
}

/**
 * Build a compact fashion context string for Claude system prompt.
 * ~200 tokens instead of 2000+.
 */
export function buildFashionContext(): string {
  const c = FASHION_CONFIG
  return `Brand: ${c.brand.name} — "${c.brand.tagline}"
Voice: ${c.brand.voice}
Target: ${c.target.primary}. ${c.target.psychology}

EMOTIONS (use these, ranked):
Tier A (flagship): ${c.emotions.tierA.map((e) => e.split('—')[0].trim()).join(', ')}
Tier B (supporting): ${c.emotions.tierB.map((e) => e.split('—')[0].trim()).join(', ')}
Tier C (perishable): ${c.emotions.tierC.map((e) => e.split('—')[0].trim()).join(', ')}
FORBIDDEN: ${c.emotions.forbidden.join(', ')}

DESIGN LANES: ${Object.values(c.lanes).map((l) => l.split('—')[0].trim()).join(' | ')}

PALETTE: near-black ${c.palette.nearBlack}, cream ${c.palette.cream}, olive ${c.palette.olive}, bone ${c.palette.bone}

RULES: ${c.rules.join(' | ')}`
}

/**
 * Get the full fashion config as JSON (for reference/display).
 */
export function getFashionConfig() {
  return FASHION_CONFIG
}
