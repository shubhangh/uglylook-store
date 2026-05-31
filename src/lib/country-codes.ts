/**
 * Country name → ISO 3166-1 alpha-2 code mapping.
 * Used to normalize shipping addresses for Printify API.
 */
const COUNTRY_MAP: Record<string, string> = {
  'afghanistan': 'AF', 'albania': 'AL', 'algeria': 'DZ', 'andorra': 'AD',
  'angola': 'AO', 'argentina': 'AR', 'armenia': 'AM', 'australia': 'AU',
  'austria': 'AT', 'azerbaijan': 'AZ', 'bahamas': 'BS', 'bahrain': 'BH',
  'bangladesh': 'BD', 'barbados': 'BB', 'belarus': 'BY', 'belgium': 'BE',
  'belize': 'BZ', 'bermuda': 'BM', 'bhutan': 'BT', 'bolivia': 'BO',
  'bosnia': 'BA', 'bosnia and herzegovina': 'BA', 'botswana': 'BW',
  'brazil': 'BR', 'brunei': 'BN', 'bulgaria': 'BG', 'cambodia': 'KH',
  'cameroon': 'CM', 'canada': 'CA', 'chile': 'CL', 'china': 'CN',
  'colombia': 'CO', 'costa rica': 'CR', 'croatia': 'HR', 'cuba': 'CU',
  'cyprus': 'CY', 'czech republic': 'CZ', 'czechia': 'CZ',
  'denmark': 'DK', 'dominican republic': 'DO', 'ecuador': 'EC',
  'egypt': 'EG', 'el salvador': 'SV', 'estonia': 'EE', 'ethiopia': 'ET',
  'fiji': 'FJ', 'finland': 'FI', 'france': 'FR', 'georgia': 'GE',
  'germany': 'DE', 'ghana': 'GH', 'greece': 'GR', 'guatemala': 'GT',
  'haiti': 'HT', 'honduras': 'HN', 'hong kong': 'HK', 'hungary': 'HU',
  'iceland': 'IS', 'india': 'IN', 'indonesia': 'ID', 'iran': 'IR',
  'iraq': 'IQ', 'ireland': 'IE', 'israel': 'IL', 'italy': 'IT',
  'jamaica': 'JM', 'japan': 'JP', 'jordan': 'JO', 'kazakhstan': 'KZ',
  'kenya': 'KE', 'kuwait': 'KW', 'laos': 'LA', 'latvia': 'LV',
  'lebanon': 'LB', 'libya': 'LY', 'liechtenstein': 'LI', 'lithuania': 'LT',
  'luxembourg': 'LU', 'macau': 'MO', 'macao': 'MO', 'madagascar': 'MG',
  'malaysia': 'MY', 'maldives': 'MV', 'mali': 'ML', 'malta': 'MT',
  'mauritius': 'MU', 'mexico': 'MX', 'moldova': 'MD', 'monaco': 'MC',
  'mongolia': 'MN', 'montenegro': 'ME', 'morocco': 'MA', 'mozambique': 'MZ',
  'myanmar': 'MM', 'namibia': 'NA', 'nepal': 'NP', 'netherlands': 'NL',
  'new zealand': 'NZ', 'nicaragua': 'NI', 'nigeria': 'NG', 'north korea': 'KP',
  'north macedonia': 'MK', 'norway': 'NO', 'oman': 'OM', 'pakistan': 'PK',
  'palestine': 'PS', 'panama': 'PA', 'papua new guinea': 'PG',
  'paraguay': 'PY', 'peru': 'PE', 'philippines': 'PH', 'poland': 'PL',
  'portugal': 'PT', 'puerto rico': 'PR', 'qatar': 'QA', 'romania': 'RO',
  'russia': 'RU', 'russian federation': 'RU', 'rwanda': 'RW',
  'saudi arabia': 'SA', 'senegal': 'SN', 'serbia': 'RS', 'singapore': 'SG',
  'slovakia': 'SK', 'slovenia': 'SI', 'south africa': 'ZA',
  'south korea': 'KR', 'korea': 'KR', 'spain': 'ES', 'sri lanka': 'LK',
  'sudan': 'SD', 'sweden': 'SE', 'switzerland': 'CH', 'syria': 'SY',
  'taiwan': 'TW', 'tanzania': 'TZ', 'thailand': 'TH', 'trinidad': 'TT',
  'trinidad and tobago': 'TT', 'tunisia': 'TN', 'turkey': 'TR',
  'turkiye': 'TR', 'uganda': 'UG', 'ukraine': 'UA',
  'united arab emirates': 'AE', 'uae': 'AE',
  'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB', 'england': 'GB',
  'united states': 'US', 'usa': 'US', 'us': 'US', 'united states of america': 'US',
  'uruguay': 'UY', 'uzbekistan': 'UZ', 'venezuela': 'VE', 'vietnam': 'VN',
  'yemen': 'YE', 'zambia': 'ZM', 'zimbabwe': 'ZW',
}

/**
 * Converts a country name or code to ISO 3166-1 alpha-2.
 * Returns the input as-is if already a 2-letter code or not found.
 */
export function toCountryCode(input: string): string {
  if (!input) return 'US'
  const trimmed = input.trim()

  // Already a 2-letter code
  if (/^[A-Z]{2}$/.test(trimmed)) return trimmed
  if (/^[a-z]{2}$/.test(trimmed)) return trimmed.toUpperCase()

  // Lookup by name
  return COUNTRY_MAP[trimmed.toLowerCase()] || trimmed
}
