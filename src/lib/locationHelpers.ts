export interface LocationItem {
  name: string;
  code?: string;
  flag?: string;
  subtext?: string;
}

// Built-in lightweight list of common world countries with focus on MENA & global hubs
const WORLD_COUNTRIES: LocationItem[] = [
  { name: 'Egypt', code: 'EG', flag: '🇪🇬', subtext: '+20' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', subtext: '+966' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', subtext: '+971' },
  { name: 'Kuwait', code: 'KW', flag: '🇰🇼', subtext: '+965' },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦', subtext: '+974' },
  { name: 'Bahrain', code: 'BH', flag: '🇧🇭', subtext: '+973' },
  { name: 'Oman', code: 'OM', flag: '🇴🇲', subtext: '+968' },
  { name: 'Jordan', code: 'JO', flag: '🇯🇴', subtext: '+962' },
  { name: 'Lebanon', code: 'LB', flag: '🇱🇧', subtext: '+961' },
  { name: 'Iraq', code: 'IQ', flag: '🇮🇶', subtext: '+964' },
  { name: 'Syria', code: 'SY', flag: '🇸🇾', subtext: '+963' },
  { name: 'Palestine', code: 'PS', flag: '🇵🇸', subtext: '+970' },
  { name: 'Yemen', code: 'YE', flag: '🇾🇪', subtext: '+967' },
  { name: 'Libya', code: 'LY', flag: '🇱🇾', subtext: '+218' },
  { name: 'Sudan', code: 'SD', flag: '🇸🇩', subtext: '+249' },
  { name: 'Tunisia', code: 'TN', flag: '🇹🇳', subtext: '+216' },
  { name: 'Algeria', code: 'DZ', flag: '🇩🇿', subtext: '+213' },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦', subtext: '+212' },
  { name: 'United States', code: 'US', flag: '🇺🇸', subtext: '+1' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', subtext: '+44' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', subtext: '+49' },
  { name: 'France', code: 'FR', flag: '🇫🇷', subtext: '+33' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', subtext: '+39' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', subtext: '+34' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷', subtext: '+90' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', subtext: '+1' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', subtext: '+61' },
  { name: 'China', code: 'CN', flag: '🇨🇳', subtext: '+86' },
  { name: 'India', code: 'IN', flag: '🇮🇳', subtext: '+91' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', subtext: '+81' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', subtext: '+82' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾', subtext: '+60' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', subtext: '+65' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', subtext: '+27' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', subtext: '+55' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽', subtext: '+52' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱', subtext: '+31' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭', subtext: '+41' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪', subtext: '+46' },
  { name: 'Norway', code: 'NO', flag: '🇳🇴', subtext: '+47' },
  { name: 'Denmark', code: 'DK', flag: '🇩🇰', subtext: '+45' },
  { name: 'Greece', code: 'GR', flag: '🇬🇷', subtext: '+30' },
  { name: 'Cyprus', code: 'CY', flag: '🇨🇾', subtext: '+357' },
  { name: 'Russia', code: 'RU', flag: '🇷🇺', subtext: '+7' },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰', subtext: '+92' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩', subtext: '+62' }
];

// Major provinces / governorates for popular destinations
const PROVINCES_MAP: Record<string, LocationItem[]> = {
  'SA': [
    { name: 'Riyadh', code: '01', subtext: 'Province' },
    { name: 'Makkah (Mecca / Jeddah)', code: '02', subtext: 'Province' },
    { name: 'Eastern Province (Dammam / Khobar)', code: '04', subtext: 'Province' },
    { name: 'Madinah', code: '03', subtext: 'Province' },
    { name: 'Asir (Abha)', code: '14', subtext: 'Province' },
    { name: 'Tabuk', code: '07', subtext: 'Province' },
    { name: 'Qassim (Buraidah)', code: '05', subtext: 'Province' }
  ],
  'AE': [
    { name: 'Dubai', code: 'DU', subtext: 'Emirate' },
    { name: 'Abu Dhabi', code: 'AZ', subtext: 'Emirate' },
    { name: 'Sharjah', code: 'SH', subtext: 'Emirate' },
    { name: 'Ajman', code: 'AJ', subtext: 'Emirate' },
    { name: 'Ras Al Khaimah', code: 'RK', subtext: 'Emirate' },
    { name: 'Fujairah', code: 'FU', subtext: 'Emirate' },
    { name: 'Umm Al Quwain', code: 'UQ', subtext: 'Emirate' }
  ],
  'KW': [
    { name: 'Al Asimah (Kuwait City)', code: 'KU', subtext: 'Governorate' },
    { name: 'Hawalli', code: 'HA', subtext: 'Governorate' },
    { name: 'Al Ahmadi', code: 'AH', subtext: 'Governorate' },
    { name: 'Farwaniya', code: 'FA', subtext: 'Governorate' },
    { name: 'Jahra', code: 'JA', subtext: 'Governorate' },
    { name: 'Mubarak Al-Kabeer', code: 'MU', subtext: 'Governorate' }
  ],
  'QA': [
    { name: 'Doha', code: 'DA', subtext: 'Municipality' },
    { name: 'Al Rayyan', code: 'RA', subtext: 'Municipality' },
    { name: 'Al Wakrah', code: 'WA', subtext: 'Municipality' },
    { name: 'Al Daayen', code: 'ZA', subtext: 'Municipality' }
  ]
};

// Curated supplementary Egyptian cities for major governorates to ensure complete modern districts coverage
const EGYPT_EXTRA_CITIES: Record<string, string[]> = {
  'Cairo': [
    'Cairo',
    'New Cairo',
    'Nasr City',
    'Heliopolis',
    'Maadi',
    'New Administrative Capital',
    'Zamalek',
    'Garden City',
    'Downtown Cairo',
    'Tagamoa',
    'Madinaty',
    'El Shorouk',
    'El Rehab',
    'Badr City',
    'El Obour',
    'Helwan',
    'Mokattam',
    'Shubra',
    'Ain Shams',
    'El Marg',
    'El Salam City',
    'Matariya',
    'Zaytoun'
  ],
  'Giza': [
    'Giza',
    '6th of October City',
    'Sheikh Zayed City',
    'Dokki',
    'Mohandessin',
    'Agouza',
    'Haram',
    'Faisal',
    'Imbaba',
    'Smart Village',
    'Al Omraneyah',
    'Al Hawamdiya',
    'Al Badrasheen',
    'Bulaq El Dakrour',
    'Warraq',
    'Oseem'
  ],
  'Alexandria': [
    'Alexandria',
    'Borg El Arab',
    'Smouha',
    'Sidi Gaber',
    'Stanley',
    'San Stefano',
    'Gleem',
    'Miami',
    'Montaza',
    'Mandara',
    'Roushdy',
    'Agami',
    'King Mariout',
    'Al Mex'
  ],
  'Dakahlia': [
    'Mansoura',
    'Talkha',
    'Mit Ghamr',
    'Dikirnis',
    'Senbellawein',
    'Belqas',
    'Manzala',
    'Sherbin',
    'Aga',
    'Gamasa'
  ],
  'Red Sea': [
    'Hurghada',
    'El Gouna',
    'Sahl Hasheesh',
    'Makadi Bay',
    'Soma Bay',
    'Marsa Alam',
    'Safaga',
    'El Qoseir',
    'Ras Gharib'
  ],
  'South Sinai': [
    'Sharm El Sheikh',
    'Dahab',
    'Nuweiba',
    'Taba',
    'Ras Sedr',
    'St. Catherine',
    'El Tor'
  ],
  'Matrouh': [
    'Marsa Matrouh',
    'New Alamein',
    'El Alamein',
    'Siwa',
    'Sidi Abdel Rahman',
    'El Dabaa',
    'Ras El Hekma',
    'Sallum'
  ],
  'Sharqia': [
    'Zagazig',
    '10th of Ramadan City',
    'Bilbeis',
    'Minya El Qamh',
    'Faqous',
    'Abu Kabir',
    'Diyarb Negm',
    'Hehya',
    'Al Husseiniya'
  ],
  'Qalyubia': [
    'Banha',
    'Shubra El Kheima',
    'Qalyub',
    'El Qanater El Khayreia',
    'Khanka',
    'Kafr Shukr',
    'Tukh',
    'Shebin El Qanater'
  ],
  'Gharbia': [
    'Tanta',
    'El Mahalla El Kubra',
    'Zifta',
    'Kafr El Zayat',
    'Samanoud',
    'Basyoun',
    'Qutour',
    'Santa'
  ],
  'Monufia': [
    'Shibin El Kom',
    'Menouf',
    'Ashmoun',
    'Sadat City',
    'Quesna',
    'Tala',
    'Shohada',
    'Berket El Saba'
  ],
  'Port Said': [
    'Port Said',
    'Port Fouad',
    'Al Sharq',
    'Al Arab',
    'Al Dawahy',
    'Al Zohour'
  ],
  'Suez': [
    'Suez',
    'Ain Sokhna',
    'Arbaeen',
    'Ganayen',
    'Attaka',
    'Faisal (Suez)'
  ],
  'Ismailia': [
    'Ismailia',
    'Fayed',
    'El Qantara',
    'El Tal El Kebir',
    'Abu Suwayr',
    'Kasaseen'
  ],
  'Damietta': [
    'Damietta',
    'New Damietta',
    'Ras El Bar',
    'Faraskour',
    'Zarqa',
    'Kafr Saad'
  ],
  'Kafr el-Sheikh': [
    'Kafr El Sheikh',
    'Desouk',
    'Baltim',
    'Fouah',
    'Metobas',
    'Qallin',
    'Riyadh',
    'Sidi Salem'
  ],
  'Faiyum': [
    'Faiyum',
    'New Faiyum',
    'Sinnuris',
    'Ibshaway',
    'Itsa',
    'Tamiya',
    'Youssef El Seddik'
  ],
  'Beni Suef': [
    'Beni Suef',
    'New Beni Suef',
    'Biba',
    'Nasser',
    'Al Wasta',
    'Ihnasiya',
    'Sumusta',
    'Fashn'
  ],
  'Minya': [
    'Minya',
    'New Minya',
    'Mallawi',
    'Samalut',
    'Maghagha',
    'Beni Mazar',
    'Abu Qurqas',
    'Matay',
    'Deir Mawas'
  ],
  'Asyut': [
    'Asyut',
    'New Asyut',
    'Dairut',
    'Manfalut',
    'Abnoub',
    'Al Qusiya',
    'Abu Tig',
    'Sedfa',
    'El Badari',
    'Sahel Selim'
  ],
  'Sohag': [
    'Sohag',
    'New Sohag',
    'Akhmim',
    'Girga',
    'Tahta',
    'Balyana',
    'Maragha',
    'Tama',
    'Monshah',
    'Juhayna',
    'Dar El Salam'
  ],
  'Qena': [
    'Qena',
    'New Qena',
    'Nag Hammadi',
    'Qus',
    'Deshna',
    'Farshut',
    'Abu Tesht',
    'Naqada',
    'Waqf'
  ],
  'Luxor': [
    'Luxor',
    'New Luxor',
    'Esna',
    'Armant',
    'El Tod',
    'Al Bayadiya',
    'Al Zayniya'
  ],
  'Aswan': [
    'Aswan',
    'New Aswan',
    'Kom Ombo',
    'Edfu',
    'Daraw',
    'Nasr El Nuba',
    'Abu Simbel'
  ],
  'New Valley': [
    'Kharga',
    'Dakhla',
    'Farafra',
    'Baris',
    'Balat'
  ],
  'North Sinai': [
    'Arish',
    'Sheikh Zuweid',
    'Rafah',
    'Bir al-Abed',
    'Nakhl',
    'Hasna'
  ]
};

// Memoized countries cache
let _allCountriesCache: LocationItem[] | null = null;

export function getAllCountries(): LocationItem[] {
  if (_allCountriesCache) return _allCountriesCache;

  // Egypt at the very top, then other countries alphabetically
  const egypt = WORLD_COUNTRIES.find(c => c.name.toLowerCase() === 'egypt' || c.code === 'EG');
  const others = WORLD_COUNTRIES.filter(c => c !== egypt);
  others.sort((a, b) => a.name.localeCompare(b.name));

  _allCountriesCache = egypt ? [egypt, ...others] : others;
  return _allCountriesCache;
}

export function findCountry(countryNameOrCode?: string) {
  if (!countryNameOrCode) return null;
  const q = countryNameOrCode.trim().toLowerCase();
  return WORLD_COUNTRIES.find(c => c.name.toLowerCase() === q || c.code?.toLowerCase() === q) || null;
}

export function getCountiesForCountry(countryNameOrCode?: string): LocationItem[] {
  if (!countryNameOrCode) {
    return getCountiesForCountry('Egypt');
  }

  const country = findCountry(countryNameOrCode);
  const code = country?.code || 'EG';

  if (code === 'EG') {
    const egGovernorates: LocationItem[] = Object.keys(EGYPT_EXTRA_CITIES).map(g => ({
      name: g,
      code: g,
      subtext: 'Governorate'
    }));

    const cairo = egGovernorates.find(g => g.name.toLowerCase() === 'cairo');
    const others = egGovernorates.filter(g => g !== cairo);
    others.sort((a, b) => a.name.localeCompare(b.name));

    return cairo ? [cairo, ...others] : others;
  }

  if (PROVINCES_MAP[code]) {
    return PROVINCES_MAP[code];
  }

  return [];
}

export function getCitiesForCountryAndCounty(countryNameOrCode?: string, countyNameOrCode?: string): LocationItem[] {
  const country = findCountry(countryNameOrCode || 'Egypt');
  const code = country?.code || 'EG';

  // If county is provided
  if (countyNameOrCode) {
    const countyTrim = countyNameOrCode.trim().toLowerCase().replace(/governorate|province|state|county/g, '').trim();
    const results: LocationItem[] = [];
    const seen = new Set<string>();

    if (code === 'EG') {
      const stateNameKey = Object.keys(EGYPT_EXTRA_CITIES).find(k => 
        k.toLowerCase() === countyTrim || k.toLowerCase().includes(countyTrim) || countyTrim.includes(k.toLowerCase())
      );
      if (stateNameKey && EGYPT_EXTRA_CITIES[stateNameKey]) {
        for (const cityName of EGYPT_EXTRA_CITIES[stateNameKey]) {
          if (!seen.has(cityName.toLowerCase())) {
            seen.add(cityName.toLowerCase());
            results.push({ name: cityName, subtext: `${stateNameKey}, Egypt` });
          }
        }
      }
    }

    if (results.length > 0) {
      return results;
    }
  }

  // Fallback: return primary cities
  const results: LocationItem[] = [];
  const seen = new Set<string>();

  if (code === 'EG') {
    const primaryEgyptianCities = [
      'Cairo', 'New Cairo', 'Giza', '6th of October City', 'Sheikh Zayed City',
      'Alexandria', 'Mansoura', 'Tanta', 'Hurghada', 'Sharm El Sheikh',
      'Port Said', 'Suez', 'Ismailia', 'Zagazig', 'Banha', 'Damietta',
      'Faiyum', 'Beni Suef', 'Minya', 'Asyut', 'Sohag', 'Qena', 'Luxor', 'Aswan'
    ];

    for (const c of primaryEgyptianCities) {
      if (!seen.has(c.toLowerCase())) {
        seen.add(c.toLowerCase());
        results.push({ name: c, subtext: 'Egypt' });
      }
    }

    for (const [gov, cities] of Object.entries(EGYPT_EXTRA_CITIES)) {
      for (const c of cities) {
        if (!seen.has(c.toLowerCase())) {
          seen.add(c.toLowerCase());
          results.push({ name: c, subtext: `${gov}, Egypt` });
        }
      }
    }
    return results;
  }

  return [];
}

export function resolveLocationFromCity(cityName?: string): { country: string; county: string; city: string } | null {
  if (!cityName) return null;
  const q = cityName.trim().toLowerCase();

  // 1. Check in Egypt extra cities
  for (const [gov, cities] of Object.entries(EGYPT_EXTRA_CITIES)) {
    const found = cities.find(c => c.toLowerCase() === q || q.includes(c.toLowerCase()));
    if (found) {
      return {
        country: 'Egypt',
        county: gov,
        city: found
      };
    }
  }

  // 2. Default fallback if contains Cairo or Giza
  if (q.includes('cairo')) {
    return { country: 'Egypt', county: 'Cairo', city: 'Cairo' };
  }
  if (q.includes('alexandria')) {
    return { country: 'Egypt', county: 'Alexandria', city: 'Alexandria' };
  }
  if (q.includes('giza')) {
    return { country: 'Egypt', county: 'Giza', city: 'Giza' };
  }

  return null;
}
