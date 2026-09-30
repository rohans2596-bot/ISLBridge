export type SupportedLanguage = 'en' | 'ta' | 'hi' | 'te' | 'kn' | 'ml';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  bcp47: string;
  color: string;
  bgColor: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English',   nativeName: 'English',   bcp47: 'en-IN', color: 'text-sky-700',    bgColor: 'bg-sky-600' },
  { code: 'ta', name: 'Tamil',     nativeName: 'தமிழ்',      bcp47: 'ta-IN', color: 'text-amber-700',  bgColor: 'bg-amber-600' },
  { code: 'hi', name: 'Hindi',     nativeName: 'हिन्दी',      bcp47: 'hi-IN', color: 'text-orange-700', bgColor: 'bg-orange-600' },
  { code: 'te', name: 'Telugu',    nativeName: 'తెలుగు',     bcp47: 'te-IN', color: 'text-emerald-700',bgColor: 'bg-emerald-600' },
  { code: 'kn', name: 'Kannada',   nativeName: 'ಕನ್ನಡ',      bcp47: 'kn-IN', color: 'text-violet-700', bgColor: 'bg-violet-600' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം',    bcp47: 'ml-IN', color: 'text-rose-700',   bgColor: 'bg-rose-600' },
];

export function getLanguageInfo(code: SupportedLanguage): LanguageInfo {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
}

export interface SignSentences {
  en: string;
  ta: string;
  hi: string;
  te: string;
  kn: string;
  ml: string;
}

// Comprehensive sign → full sentence mapping in all 6 Indian languages
export const SIGN_SENTENCES: Record<string, SignSentences> = {
  'FOOD': {
    en: 'I would like something to eat.',
    ta: 'எனக்கு உணவு வேண்டும்.',
    hi: 'मुझे कुछ खाने को चाहिए।',
    te: 'నాకు తినడానికి ఏదైనా కావాలి.',
    kn: 'ನನಗೆ ಏನಾದರೂ ತಿನ್ನಲು ಬೇಕು.',
    ml: 'എനിക്ക് കഴിക്കാൻ എന്തെങ്കിലും വേണം.'
  },
  'WATER': {
    en: 'Please give me some water to drink.',
    ta: 'தயவுசெய்து எனக்கு குடிக்க தண்ணீர் கொடுங்கள்.',
    hi: 'कृपया मुझे पीने का पानी दीजिए।',
    te: 'దయచేసి నాకు తాగడానికి నీళ్ళు ఇవ్వండి.',
    kn: 'ದಯವಿಟ್ಟು ನನಗೆ ಕುಡಿಯಲು ನೀರು ಕೊಡಿ.',
    ml: 'ദയവായി എനിക്ക് കുടിക്കാൻ വെള്ളം തരൂ.'
  },
  'HOSPITAL': {
    en: 'I need to go to the hospital immediately.',
    ta: 'நான் உடனடியாக மருத்துவமனைக்குச் செல்ல வேண்டும்.',
    hi: 'मुझे तुरंत अस्पताल जाना है।',
    te: 'నేను వెంటనే ఆసుపత్రికి వెళ్ళాలి.',
    kn: 'ನಾನು ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಬೇಕು.',
    ml: 'എനിക്ക് ഉടൻ ആശുപത്രിയിൽ പോകണം.'
  },
  'DOCTOR': {
    en: 'Please call a doctor for me.',
    ta: 'தயவுசெய்து எனக்காக ஒரு மருத்துவரை அழைக்கவும்.',
    hi: 'कृपया मेरे लिए एक डॉक्टर को बुलाइए।',
    te: 'దయచేసి నాకు ఒక డాక్టర్‌ను పిలవండి.',
    kn: 'ದಯವಿಟ್ಟು ನನಗಾಗಿ ಒಬ್ಬ ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ.',
    ml: 'ദയവായി എനിക്കായി ഒരു ഡോക്ടറെ വിളിക്കൂ.'
  },
  'HELP': {
    en: 'Please help me, I need assistance.',
    ta: 'தயவுசெய்து எனக்கு உதவுங்கள், எனக்கு உதவி தேவை.',
    hi: 'कृपया मेरी मदद कीजिए, मुझे सहायता चाहिए।',
    te: 'దయచేసి నాకు సహాయం చేయండి, నాకు సహాయం అవసరం.',
    kn: 'ದಯವಿಟ್ಟು ನನಗೆ ಸಹಾಯ ಮಾಡಿ, ನನಗೆ ನೆರವು ಬೇಕು.',
    ml: 'ദയവായി എന്നെ സഹായിക്കൂ, എനിക്ക് സഹായം വേണം.'
  },
  'EMERGENCY': {
    en: 'This is an emergency, please assist right now!',
    ta: 'இது அவசர நிலை, தயவுசெய்து உடனடியாக உதவுங்கள்!',
    hi: 'यह आपातकालीन स्थिति है, कृपया तुरंत मदद करें!',
    te: 'ఇది అత్యవసర పరిస్థితి, దయచేసి ఇప్పుడే సహాయం చేయండి!',
    kn: 'ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿ, ದಯವಿಟ್ಟು ಈಗಲೇ ಸಹಾಯ ಮಾಡಿ!',
    ml: 'ഇത് അടിയന്തര സാഹചര്യമാണ്, ദയവായി ഇപ്പോൾ സഹായിക്കൂ!'
  },
  'PLEASE': {
    en: 'Please assist me with this request.',
    ta: 'தயவுசெய்து எனக்கு உதவி செய்யுங்கள்.',
    hi: 'कृपया इस अनुरोध में मेरी सहायता करें।',
    te: 'దయచేసి ఈ అభ్యర్థనలో నాకు సహాయం చేయండి.',
    kn: 'ದಯವಿಟ್ಟು ಈ ವಿನಂತಿಯಲ್ಲಿ ನನಗೆ ಸಹಾಯ ಮಾಡಿ.',
    ml: 'ദയവായി ഈ അഭ്യർത്ഥനയിൽ എന്നെ സഹായിക്കൂ.'
  },
  'THANK YOU': {
    en: 'Thank you very much for your kind help.',
    ta: 'உங்கள் அன்பான உதவிக்கு மிக்க நன்றி.',
    hi: 'आपकी दयालु सहायता के लिए बहुत-बहुत धन्यवाद।',
    te: 'మీ దయగల సహాయానికి చాలా ధన్యవాదాలు.',
    kn: 'ನಿಮ್ಮ ದಯೆಯ ಸಹಾಯಕ್ಕೆ ತುಂಬಾ ಧನ್ಯವಾದಗಳು.',
    ml: 'നിങ്ങളുടെ ദയാപൂർണ്ണമായ സഹായത്തിന് വളരെ നന്ദി.'
  },
  'HELLO': {
    en: 'Hello, greetings to you!',
    ta: 'வணக்கம், உங்களுக்கு என் வாழ்த்துகள்!',
    hi: 'नमस्ते, आपको मेरा अभिवादन!',
    te: 'నమస్కారం, మీకు నా శుభాకాంక్షలు!',
    kn: 'ನಮಸ್ಕಾರ, ನಿಮಗೆ ನನ್ನ ಶುಭಾಶಯಗಳು!',
    ml: 'നമസ്കാരം, നിങ്ങൾക്ക് എന്റെ ആശംസകൾ!'
  },
  'GOOD MORNING': {
    en: 'Good morning, hope you have a wonderful day!',
    ta: 'இனிய காலை வணக்கம், உங்களுக்கு நல்ல நாளாக அமையட்டும்!',
    hi: 'सुप्रभात, आपका दिन शुभ हो!',
    te: 'శుభోదయం, మీకు మంచి రోజు అవుగాక!',
    kn: 'ಶುಭೋದಯ, ನಿಮಗೆ ಒಳ್ಳೆಯ ದಿನವಾಗಲಿ!',
    ml: 'സുപ്രഭാതം, നല്ലൊരു ദിവസമാകട്ടെ!'
  },
  'GOOD NIGHT': {
    en: 'Good night, sleep well and sweet dreams.',
    ta: 'இனிய இரவு வணக்கம், நலமாக உறங்குங்கள்.',
    hi: 'शुभ रात्रि, अच्छी नींद लें और मीठे सपने देखें।',
    te: 'శుభ రాత్రి, బాగా నిద్రపొండి, మంచి కలలు.',
    kn: 'ಶುಭ ರಾತ್ರಿ, ಚೆನ್ನಾಗಿ ನಿದ್ರೆ ಮಾಡಿ, ಸಿಹಿ ಕನಸುಗಳು.',
    ml: 'ശുഭ രാത്രി, നല്ല ഉറക്കം, മധുരമായ സ്വപ്നങ്ങൾ.'
  },
  'WELCOME': {
    en: 'You are warmly welcome here.',
    ta: 'உங்களை அன்புடன் வரவேற்கிறோம்.',
    hi: 'आपका हार्दिक स्वागत है।',
    te: 'మిమ్మల్ని ఆప్యాయంగా ఆహ్వానిస్తున్నాము.',
    kn: 'ನಿಮ್ಮನ್ನು ಆತ್ಮೀಯವಾಗಿ ಸ್ವಾಗತಿಸುತ್ತೇವೆ.',
    ml: 'നിങ്ങളെ ഊഷ്മളമായി സ്വാഗതം ചെയ്യുന്നു.'
  },
  'SORRY': {
    en: 'I am very sorry for any inconvenience.',
    ta: 'ஏற்பட்ட சிரமத்திற்கு என்னை மன்னிக்கவும்.',
    hi: 'किसी भी असुविधा के लिए मुझे बहुत खेद है।',
    te: 'ఏదైనా అసౌకర్యానికి నేను చాలా క్షమిస్తున్నాను.',
    kn: 'ಯಾವುದೇ ತೊಂದರೆಗೆ ನಾನು ಕ್ಷಮೆ ಕೇಳುತ್ತೇನೆ.',
    ml: 'എന്തെങ്കിലും അസൗകര്യത്തിന് ഞാൻ ക്ഷമ ചോദിക്കുന്നു.'
  },
  'YES': {
    en: 'Yes, I agree and confirm this.',
    ta: 'ஆம், நான் இதை ஒப்புக்கொள்கிறேன்.',
    hi: 'हाँ, मैं सहमत हूँ और इसकी पुष्टि करता हूँ।',
    te: 'అవును, నేను అంగీకరిస్తున్నాను మరియు నిర్ధారిస్తున్నాను.',
    kn: 'ಹೌದು, ನಾನು ಒಪ್ಪುತ್ತೇನೆ ಮತ್ತು ಇದನ್ನು ಖಚಿತಪಡಿಸುತ್ತೇನೆ.',
    ml: 'അതെ, ഞാൻ സമ്മതിക്കുന്നു, ഇത് ഉറപ്പിക്കുന്നു.'
  },
  'NO': {
    en: 'No, I do not want or need this.',
    ta: 'இல்லை, எனக்கு இது தேவையில்லை.',
    hi: 'नहीं, मुझे यह नहीं चाहिए।',
    te: 'కాదు, నాకు ఇది అవసరం లేదు.',
    kn: 'ಇಲ್ಲ, ನನಗೆ ಇದು ಬೇಡ.',
    ml: 'ഇല്ല, എനിക്ക് ഇത് വേണ്ട.'
  },
  'GOOD': {
    en: 'This is very good and well done.',
    ta: 'இது மிகவும் நல்லது, நன்றாக இருக்கிறது.',
    hi: 'यह बहुत अच्छा है, शाबाश।',
    te: 'ఇది చాలా బాగుంది, బాగా చేసారు.',
    kn: 'ಇದು ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ, ಉತ್ತಮ ಕೆಲಸ.',
    ml: 'ഇത് വളരെ നല്ലതാണ്, നന്നായി ചെയ്തു.'
  },
  'BAD': {
    en: 'This is not good and feels uncomfortable.',
    ta: 'இது சரியில்லை, மோசமாக உள்ளது.',
    hi: 'यह ठीक नहीं है और असहज लगता है।',
    te: 'ఇది బాగాలేదు, ఇబ్బందిగా ఉంది.',
    kn: 'ಇದು ಚೆನ್ನಾಗಿಲ್ಲ, ಅಹಿತಕರವಾಗಿದೆ.',
    ml: 'ഇത് നല്ലതല്ല, അസ്വസ്ഥതയുണ്ട്.'
  },
  'STOP': {
    en: 'Please stop right here.',
    ta: 'தயவுசெய்து இங்கே நிறுத்துங்கள்.',
    hi: 'कृपया यहीं रुक जाइए।',
    te: 'దయచేసి ఇక్కడ ఆగండి.',
    kn: 'ದಯವಿಟ್ಟು ಇಲ್ಲಿಯೇ ನಿಲ್ಲಿ.',
    ml: 'ദയവായി ഇവിടെ നിർത്തൂ.'
  },
  'COME': {
    en: 'Please come over here.',
    ta: 'தயவுசெய்து இங்கே வாருங்கள்.',
    hi: 'कृपया यहाँ आइए।',
    te: 'దయచేసి ఇక్కడికి రండి.',
    kn: 'ದಯವಿಟ್ಟು ಇಲ್ಲಿ ಬನ್ನಿ.',
    ml: 'ദയവായി ഇങ്ങോട്ട് വരൂ.'
  },
  'GO': {
    en: 'We can proceed and go now.',
    ta: 'நாம் இப்போது புறப்படலாம்.',
    hi: 'हम अब चल सकते हैं।',
    te: 'మనం ఇప్పుడు వెళ్ళవచ్చు.',
    kn: 'ನಾವು ಈಗ ಹೊರಡಬಹುದು.',
    ml: 'നമുക്ക് ഇപ്പോൾ പോകാം.'
  },
  'WAIT': {
    en: 'Please wait for a moment.',
    ta: 'தயவுசெய்து சிறிது நேரம் காத்திருங்கள்.',
    hi: 'कृपया एक क्षण रुकिए।',
    te: 'దయచేసి ఒక్క క్షణం ఆగండి.',
    kn: 'ದಯವಿಟ್ಟು ಒಂದು ಕ್ಷಣ ಕಾಯಿರಿ.',
    ml: 'ദയവായി ഒരു നിമിഷം കാത്തിരിക്കൂ.'
  },
  'WHERE': {
    en: 'Where is it located?',
    ta: 'அது எங்கே அமைந்துள்ளது?',
    hi: 'वह कहाँ स्थित है?',
    te: 'అది ఎక్కడ ఉంది?',
    kn: 'ಅದು ಎಲ್ಲಿ ಇದೆ?',
    ml: 'അത് എവിടെയാണ്?'
  },
  'WHEN': {
    en: 'When will this take place?',
    ta: 'இது எப்போது நடைபெறும்?',
    hi: 'यह कब होगा?',
    te: 'ఇది ఎప్పుడు జరుగుతుంది?',
    kn: 'ಇದು ಯಾವಾಗ ನಡೆಯುತ್ತದೆ?',
    ml: 'ഇത് എപ്പോൾ നടക്കും?'
  },
  'WHY': {
    en: 'Why did this happen?',
    ta: 'இது ஏன் நடந்தது?',
    hi: 'यह क्यों हुआ?',
    te: 'ఇది ఎందుకు జరిగింది?',
    kn: 'ಇದು ಏಕೆ ಆಯಿತು?',
    ml: 'ഇത് എന്തുകൊണ്ട് സംഭവിച്ചു?'
  },
  'WHAT': {
    en: 'What is happening here?',
    ta: 'இங்கே என்ன நடக்கிறது?',
    hi: 'यहाँ क्या हो रहा है?',
    te: 'ఇక్కడ ఏమి జరుగుతోంది?',
    kn: 'ಇಲ್ಲಿ ಏನು ನಡೆಯುತ್ತಿದೆ?',
    ml: 'ഇവിടെ എന്താണ് സംഭവിക്കുന്നത്?'
  },
  'HOW': {
    en: 'How can this be done?',
    ta: 'இதை எப்படி செய்ய முடியும்?',
    hi: 'यह कैसे किया जा सकता है?',
    te: 'ఇది ఎలా చేయవచ్చు?',
    kn: 'ಇದನ್ನು ಹೇಗೆ ಮಾಡಬಹುದು?',
    ml: 'ഇത് എങ്ങനെ ചെയ്യാം?'
  },
  'HOME': {
    en: 'I want to go to my home.',
    ta: 'நான் என் வீட்டிற்குச் செல்ல விரும்புகிறேன்.',
    hi: 'मैं अपने घर जाना चाहता हूँ।',
    te: 'నేను నా ఇంటికి వెళ్ళాలనుకుంటున్నాను.',
    kn: 'ನಾನು ನನ್ನ ಮನೆಗೆ ಹೋಗಬೇಕು.',
    ml: 'ഞാൻ എന്റെ വീട്ടിലേക്ക് പോകണം.'
  },
  'SCHOOL': {
    en: 'I am attending school.',
    ta: 'நான் பள்ளிக்குச் செல்கிறேன்.',
    hi: 'मैं स्कूल जा रहा हूँ।',
    te: 'నేను బడికి వెళ్తున్నాను.',
    kn: 'ನಾನು ಶಾಲೆಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ.',
    ml: 'ഞാൻ സ്കൂളിൽ പോകുകയാണ്.'
  },
  'COLLEGE': {
    en: 'I am studying in college.',
    ta: 'நான் கல்லூரியில் படித்து வருகிறேன்.',
    hi: 'मैं कॉलेज में पढ़ रहा हूँ।',
    te: 'నేను కాలేజీలో చదువుతున్నాను.',
    kn: 'ನಾನು ಕಾಲೇಜಿನಲ್ಲಿ ಓದುತ್ತಿದ್ದೇನೆ.',
    ml: 'ഞാൻ കോളേജിൽ പഠിക്കുകയാണ്.'
  },
  'FRIEND': {
    en: 'You are a very good friend to me.',
    ta: 'நீங்கள் எனக்கு ஒரு நல்ல நண்பர்.',
    hi: 'आप मेरे बहुत अच्छे मित्र हैं।',
    te: 'మీరు నాకు చాలా మంచి స్నేహితులు.',
    kn: 'ನೀವು ನನಗೆ ತುಂಬಾ ಒಳ್ಳೆಯ ಸ್ನೇಹಿತ.',
    ml: 'നിങ്ങൾ എനിക്ക് വളരെ നല്ല സുഹൃത്താണ്.'
  },
  'FAMILY': {
    en: 'I love my family dearly.',
    ta: 'நான் என் குடும்பத்தை மிகவும் நேசிக்கிறேன்.',
    hi: 'मैं अपने परिवार से बहुत प्यार करता हूँ।',
    te: 'నేను నా కుటుంబాన్ని చాలా ప్రేమిస్తాను.',
    kn: 'ನಾನು ನನ್ನ ಕುಟುಂಬವನ್ನು ತುಂಬಾ ಪ್ರೀತಿಸುತ್ತೇನೆ.',
    ml: 'ഞാൻ എന്റെ കുടുംബത്തെ വളരെ സ്നേഹിക്കുന്നു.'
  },
  'NAME': {
    en: 'What is your name?',
    ta: 'உங்கள் பெயர் என்ன?',
    hi: 'आपका नाम क्या है?',
    te: 'మీ పేరు ఏమిటి?',
    kn: 'ನಿಮ್ಮ ಹೆಸರೇನು?',
    ml: 'നിങ്ങളുടെ പേര് എന്താണ്?'
  },
  'MY': {
    en: 'This belongs to me.',
    ta: 'இது என்னுடையது.',
    hi: 'यह मेरा है।',
    te: 'ఇది నాది.',
    kn: 'ಇದು ನನ್ನದು.',
    ml: 'ഇത് എന്റേതാണ്.'
  },
  'YOU': {
    en: 'How are you doing today?',
    ta: 'நீங்கள் இன்று எப்படி இருக்கிறீர்கள்?',
    hi: 'आज आप कैसे हैं?',
    te: 'ఈ రోజు మీరు ఎలా ఉన్నారు?',
    kn: 'ಇಂದು ನೀವು ಹೇಗಿದ್ದೀರಿ?',
    ml: 'ഇന്ന് നിങ്ങൾ എങ്ങനെയുണ്ട്?'
  },
  'ME': {
    en: 'Please talk with me.',
    ta: 'தயவுசெய்து என்னுடன் பேசுங்கள்.',
    hi: 'कृपया मुझसे बात करें।',
    te: 'దయచేసి నాతో మాట్లాడండి.',
    kn: 'ದಯವಿಟ್ಟು ನನ್ನೊಂದಿಗೆ ಮಾತನಾಡಿ.',
    ml: 'ദയവായി എന്നോട് സംസാരിക്കൂ.'
  },
  'NEED': {
    en: 'I need some urgent assistance.',
    ta: 'எனக்கு அவசர உதவி தேவைப்படுகிறது.',
    hi: 'मुझे तत्काल सहायता चाहिए।',
    te: 'నాకు అత్యవసర సహాయం అవసరం.',
    kn: 'ನನಗೆ ತುರ್ತು ಸಹಾಯ ಬೇಕು.',
    ml: 'എനിക്ക് അടിയന്തിര സഹായം ആവശ്യമാണ്.'
  },
  'HOW ARE YOU': {
    en: 'How are you?',
    ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
    hi: 'आप कैसे हैं?',
    te: 'మీరు ఎలా ఉన్నారు?',
    kn: 'ನೀವು ಹೇಗಿದ್ದೀರಿ?',
    ml: 'നിങ്ങൾ എങ്ങനെയുണ്ട്?'
  }
};

// Backward-compatible exports for existing code
export const TAMIL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SIGN_SENTENCES).map(([key, val]) => [key, val.ta])
);

// Legacy alias
export const SIGN_SENTENCES_MAP = SIGN_SENTENCES;

export function getTranslation(sign: string, lang: SupportedLanguage): string {
  const upper = sign.toUpperCase().trim();
  const entry = SIGN_SENTENCES[upper];
  if (entry) return entry[lang] || entry.en;
  return sign;
}

export function getTamilTranslation(signOrSentence: string): string {
  return getTranslation(signOrSentence, 'ta');
}
