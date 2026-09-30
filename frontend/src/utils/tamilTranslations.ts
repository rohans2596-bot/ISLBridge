export interface SignSentence {
  en: string;
  ta: string;
}

export const SIGN_SENTENCES_MAP: Record<string, SignSentence> = {
  'FOOD': {
    en: 'I would like something to eat.',
    ta: 'எனக்கு உணவு வேண்டும்.'
  },
  'WATER': {
    en: 'Please give me some water to drink.',
    ta: 'தயவுசெய்து எனக்கு குடிக்க தண்ணீர் கொடுங்கள்.'
  },
  'HOSPITAL': {
    en: 'I need to go to the hospital immediately.',
    ta: 'நான் உடனடியாக மருத்துவமனைக்குச் செல்ல வேண்டும்.'
  },
  'DOCTOR': {
    en: 'Please call a doctor for me.',
    ta: 'தயவுசெய்து எனக்காக ஒரு மருத்துவரை அழைக்கவும்.'
  },
  'HELP': {
    en: 'Please help me, I need assistance.',
    ta: 'தயவுசெய்து எனக்கு உதவுங்கள், எனக்கு உதவி தேவை.'
  },
  'EMERGENCY': {
    en: 'This is an emergency, please assist right now!',
    ta: 'இது அவசர நிலை, தயவுசெய்து உடனடியாக உதவுங்கள்!'
  },
  'PLEASE': {
    en: 'Please assist me with this request.',
    ta: 'தயவுசெய்து எனக்கு உதவி செய்யுங்கள்.'
  },
  'THANK YOU': {
    en: 'Thank you very much for your kind help.',
    ta: 'உங்கள் அன்பான உதவிக்கு மிக்க நன்றி.'
  },
  'HELLO': {
    en: 'Hello, greetings to you!',
    ta: 'வணக்கம், உங்களுக்கு என் வாழ்த்துகள்!'
  },
  'GOOD MORNING': {
    en: 'Good morning, hope you have a wonderful day!',
    ta: 'இனிய காலை வணக்கம், உங்களுக்கு நல்ல நாளாக அமையட்டும்!'
  },
  'GOOD NIGHT': {
    en: 'Good night, sleep well and sweet dreams.',
    ta: 'இனிய இரவு வணக்கம், நலமாக உறங்குங்கள்.'
  },
  'WELCOME': {
    en: 'You are warmly welcome here.',
    ta: 'உங்களை அன்புடன் வரவேற்கிறோம்.'
  },
  'SORRY': {
    en: 'I am very sorry for any inconvenience.',
    ta: 'ஏற்பட்ட சிரமத்திற்கு என்னை மன்னிக்கவும்.'
  },
  'YES': {
    en: 'Yes, I agree and confirm this.',
    ta: 'ஆம், நான் இதை ஒப்புக்கொள்கிறேன்.'
  },
  'NO': {
    en: 'No, I do not want or need this.',
    ta: 'இல்லை, எனக்கு இது தேவையில்லை.'
  },
  'GOOD': {
    en: 'This is very good and well done.',
    ta: 'இது மிகவும் நல்லது, நன்றாக இருக்கிறது.'
  },
  'BAD': {
    en: 'This is not good and feels uncomfortable.',
    ta: 'இது சரியில்லை, மோசமாக உள்ளது.'
  },
  'STOP': {
    en: 'Please stop right here.',
    ta: 'தயவுசெய்து இங்கே நிறுத்துங்கள்.'
  },
  'COME': {
    en: 'Please come over here.',
    ta: 'தயவுசெய்து இங்கே வாருங்கள்.'
  },
  'GO': {
    en: 'We can proceed and go now.',
    ta: 'நாம் இப்போது புறப்படலாம்.'
  },
  'WAIT': {
    en: 'Please wait for a moment.',
    ta: 'தயவுசெய்து சிறிது நேரம் காத்திருங்கள்.'
  },
  'WHERE': {
    en: 'Where is it located?',
    ta: 'அது எங்கே அமைந்துள்ளது?'
  },
  'WHEN': {
    en: 'When will this take place?',
    ta: 'இது எப்போது நடைபெறும்?'
  },
  'WHY': {
    en: 'Why did this happen?',
    ta: 'இது ஏன் நடந்தது?'
  },
  'WHAT': {
    en: 'What is happening here?',
    ta: 'இங்கே என்ன நடக்கிறது?'
  },
  'HOW': {
    en: 'How can this be done?',
    ta: 'இதை எப்படி செய்ய முடியும்?'
  },
  'HOME': {
    en: 'I want to go to my home.',
    ta: 'நான் என் வீட்டிற்குச் செல்ல விரும்புகிறேன்.'
  },
  'SCHOOL': {
    en: 'I am attending school.',
    ta: 'நான் பள்ளிக்குச் செல்கிறேன்.'
  },
  'COLLEGE': {
    en: 'I am studying in college.',
    ta: 'நான் கல்லூரியில் படித்து வருகிறேன்.'
  },
  'FRIEND': {
    en: 'You are a very good friend to me.',
    ta: 'நீங்கள் எனக்கு ஒரு நல்ல நண்பர்.'
  },
  'FAMILY': {
    en: 'I love my family dearly.',
    ta: 'நான் என் குடும்பத்தை மிகவும் நேசிக்கிறேன்.'
  },
  'NAME': {
    en: 'What is your name?',
    ta: 'உங்கள் பெயர் என்ன?'
  },
  'MY': {
    en: 'This belongs to me.',
    ta: 'இது என்னுடையது.'
  },
  'YOU': {
    en: 'How are you doing today?',
    ta: 'நீங்கள் இன்று எப்படி இருக்கிறீர்கள்?'
  },
  'ME': {
    en: 'Please talk with me.',
    ta: 'தயவுசெய்து என்னுடன் பேசுங்கள்.'
  },
  'NEED': {
    en: 'I need some urgent assistance.',
    ta: 'எனக்கு அவசர உதவி தேவைப்படுகிறது.'
  }
};

export const TAMIL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SIGN_SENTENCES_MAP).map(([key, val]) => [key, val.ta])
);

export function getTamilTranslation(signOrSentence: string): string {
  if (!signOrSentence) return '';
  const upper = signOrSentence.toUpperCase().trim();
  if (SIGN_SENTENCES_MAP[upper]) return SIGN_SENTENCES_MAP[upper].ta;

  // Fallback map individual words
  const words = upper.split(/\s+/);
  const translated = words.map(w => (SIGN_SENTENCES_MAP[w]?.ta || w));
  return translated.join(' ');
}
