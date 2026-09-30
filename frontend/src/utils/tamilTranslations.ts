export const TAMIL_MAP: Record<string, string> = {
  'HELLO': 'வணக்கம்',
  'THANK YOU': 'நன்றி',
  'PLEASE': 'தயவுசெய்து',
  'YES': 'ஆம்',
  'NO': 'இல்லை',
  'GOOD': 'நல்லது',
  'BAD': 'மோசமானது',
  'HELP': 'உதவி',
  'SORRY': 'மன்னிக்கவும்',
  'WELCOME': 'நல்வரவு',
  'GOOD MORNING': 'காலை வணக்கம்',
  'GOOD NIGHT': 'இனிய இரவு வணக்கம்',
  'WATER': 'தண்ணீர்',
  'FOOD': 'உணவு',
  'HOME': 'வீடு',
  'SCHOOL': 'பள்ளி',
  'COLLEGE': 'கல்லூரி',
  'HOSPITAL': 'மருத்துவமனை',
  'DOCTOR': 'மருத்துவர்',
  'FRIEND': 'நண்பர்',
  'FAMILY': 'குடும்பம்',
  'NAME': 'பெயர்',
  'WHAT': 'என்ன',
  'WHERE': 'எங்கே',
  'WHEN': 'எப்போது',
  'WHY': 'ஏன்',
  'HOW': 'எப்படி',
  'STOP': 'நில்',
  'COME': 'வாருங்கள்',
  'GO': 'போங்கள்',
  'WAIT': 'காத்திருங்கள்',
  'EMERGENCY': 'அவசரம்',
  'MY': 'என்',
  'YOU': 'நீங்கள்',
  'ME': 'நான்',
};

export function getTamilTranslation(signOrSentence: string): string {
  if (!signOrSentence) return '';
  const upper = signOrSentence.toUpperCase().trim();
  if (TAMIL_MAP[upper]) return TAMIL_MAP[upper];

  // Map individual words
  const words = upper.split(/\s+/);
  const translated = words.map(w => TAMIL_MAP[w] || w);
  return translated.join(' ');
}
