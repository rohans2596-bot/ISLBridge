export interface SignMetadata {
  name: string;
  category: 'Greetings' | 'Courtesy' | 'Basic Needs' | 'Places' | 'People' | 'Questions' | 'Actions';
  gestureType: 'static' | 'dynamic';
  description: string;
  tamil: string;
  icon?: string;
}

export const SUPPORTED_ISL_SIGNS: SignMetadata[] = [
  { name: 'HELLO', category: 'Greetings', gestureType: 'static', description: 'Open palm wave or salute gesture near temple', tamil: 'வணக்கம்' },
  { name: 'THANK YOU', category: 'Courtesy', gestureType: 'static', description: 'Flat hand fingertips touch chin and move outward forward', tamil: 'நன்றி' },
  { name: 'PLEASE', category: 'Courtesy', gestureType: 'static', description: 'Flat open palm gently placed and rubbed over chest', tamil: 'தயவுசெய்து' },
  { name: 'YES', category: 'Courtesy', gestureType: 'static', description: 'Closed fist nodding up and down like a head nod', tamil: 'ஆம்' },
  { name: 'NO', category: 'Courtesy', gestureType: 'static', description: 'Index and middle fingers snapping to thumb like closing beak', tamil: 'இல்லை' },
  { name: 'GOOD', category: 'Courtesy', gestureType: 'static', description: 'Closed fist with thumb extended straight up', tamil: 'நல்லது' },
  { name: 'BAD', category: 'Courtesy', gestureType: 'static', description: 'Closed fist with thumb pointing straight down', tamil: 'மோசமானது' },
  { name: 'HELP', category: 'Basic Needs', gestureType: 'static', description: 'Thumbs-up right fist placed on open flat left palm', tamil: 'உதவி' },
  { name: 'SORRY', category: 'Courtesy', gestureType: 'static', description: 'Closed fist rubbed in small circles on chest', tamil: 'மன்னிக்கவும்' },
  { name: 'WELCOME', category: 'Greetings', gestureType: 'static', description: 'Both open palms facing up sweeping inward', tamil: 'நல்வரவு' },
  { name: 'GOOD MORNING', category: 'Greetings', gestureType: 'static', description: 'Good sign combined with rising hand motion', tamil: 'காலை வணக்கம்' },
  { name: 'GOOD NIGHT', category: 'Greetings', gestureType: 'static', description: 'Good sign combined with hand draping over wrist', tamil: 'இனிய இரவு வணக்கம்' },
  { name: 'WATER', category: 'Basic Needs', gestureType: 'static', description: 'W-shaped 3 fingers tapping gently on chin', tamil: 'தண்ணீர்' },
  { name: 'FOOD', category: 'Basic Needs', gestureType: 'static', description: 'All fingertips brought together tapping against mouth', tamil: 'உணவு' },
  { name: 'HOME', category: 'Places', gestureType: 'static', description: 'Both hands fingertips touching to form a triangular roof', tamil: 'வீடு' },
  { name: 'SCHOOL', category: 'Places', gestureType: 'static', description: 'Horizontal flat palms clapping together twice', tamil: 'பள்ளி' },
  { name: 'COLLEGE', category: 'Places', gestureType: 'static', description: 'Flat right hand sliding across left palm and arcing upward', tamil: 'கல்லூரி' },
  { name: 'HOSPITAL', category: 'Places', gestureType: 'static', description: 'H handshape drawing a cross on the upper left arm', tamil: 'மருத்துவமனை' },
  { name: 'DOCTOR', category: 'People', gestureType: 'static', description: 'Right fingertips tapping pulse point on left inner wrist', tamil: 'மருத்துவர்' },
  { name: 'FRIEND', category: 'People', gestureType: 'static', description: 'Hooked index fingers of both hands linked together', tamil: 'நண்பர்' },
  { name: 'FAMILY', category: 'People', gestureType: 'static', description: 'Both hands forming F shapes circling and touching pinkies', tamil: 'குடும்பம்' },
  { name: 'NAME', category: 'People', gestureType: 'static', description: 'Index and middle fingers of both hands tapping perpendicularly', tamil: 'பெயர்' },
  { name: 'WHAT', category: 'Questions', gestureType: 'static', description: 'Both hands open palms facing upward shaking side-to-side', tamil: 'என்ன' },
  { name: 'WHERE', category: 'Questions', gestureType: 'static', description: 'Index finger pointing up and swaying left-right with puzzled face', tamil: 'எங்கே' },
  { name: 'WHEN', category: 'Questions', gestureType: 'static', description: 'Right index finger circling tip of left index finger', tamil: 'எப்போது' },
  { name: 'WHY', category: 'Questions', gestureType: 'static', description: 'Fingertips touching forehead and pulling away into Y handshape', tamil: 'ஏன்' },
  { name: 'HOW', category: 'Questions', gestureType: 'static', description: 'Curved hands with backs touching turning upward together', tamil: 'எப்படி' },
  { name: 'STOP', category: 'Actions', gestureType: 'static', description: 'Open palm thrust vertically forward like a barrier', tamil: 'நில்' },
  { name: 'COME', category: 'Actions', gestureType: 'static', description: 'Open hand beckoning inward towards chest', tamil: 'வாருங்கள்' },
  { name: 'GO', category: 'Actions', gestureType: 'static', description: 'Index fingers pointing away forward briskly', tamil: 'போங்கள்' },
  { name: 'WAIT', category: 'Actions', gestureType: 'static', description: 'Both hands open palms upward with fingers wiggling gently', tamil: 'காத்திருங்கள்' },
  { name: 'EMERGENCY', category: 'Basic Needs', gestureType: 'static', description: 'E handshape shaken vigorously side-to-side', tamil: 'அவசரம்' },
];

export const SIGN_CATEGORIES = [
  'All',
  'Greetings',
  'Courtesy',
  'Basic Needs',
  'Places',
  'People',
  'Questions',
  'Actions',
] as const;
