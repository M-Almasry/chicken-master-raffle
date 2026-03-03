/**
 * Profanity Filter - Arabic & English
 * Filters out bad words and inappropriate content from reviews.
 */

// Arabic bad words list (common insults/profanity)
const arabicBadWords = [
  'كلب', 'حمار', 'غبي', 'أحمق', 'تافه', 'حقير', 'وسخ', 'قذر',
  'زبالة', 'منيوك', 'شرموط', 'عرص', 'كس', 'طيز', 'زب', 'نيك',
  'ابن الكلب', 'يلعن', 'ملعون', 'خنزير', 'واطي', 'سافل',
  'عاهرة', 'قحبة', 'لعنة', 'ابن الحرام', 'حيوان', 'بهيمة',
  'اخرس', 'انقلع', 'تبا', 'لعنك', 'يخرب بيتك', 'الله يلعنك',
  'متخلف', 'معوق', 'مجنون', 'مريض', 'فاشل', 'خسيس',
  'سخيف', 'نذل', 'وقح', 'جبان', 'خائن', 'كذاب',
  'مسبة', 'شتيمة', 'لعنة', 'عيب', 'حرام عليك'
];

// English bad words list
const englishBadWords = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap', 'dick',
  'bastard', 'idiot', 'stupid', 'dumb', 'moron', 'jerk', 'loser',
  'suck', 'whore', 'slut', 'piss', 'cock', 'pussy', 'retard',
  'nigger', 'faggot', 'wtf', 'stfu', 'lmao', 'trash', 'garbage',
  'ugly', 'hate', 'kill', 'die', 'worst', 'terrible', 'horrible',
  'disgusting', 'pathetic', 'scam', 'fraud', 'cheat', 'liar'
];

// Combine all bad words
const allBadWords = [...arabicBadWords, ...englishBadWords];

/**
 * Check if text contains profanity
 * @param {string} text - Text to check
 * @returns {{ isClean: boolean, flaggedWords: string[] }}
 */
function checkProfanity(text) {
  if (!text || typeof text !== 'string') {
    return { isClean: true, flaggedWords: [] };
  }

  const lowerText = text.toLowerCase().trim();
  const flaggedWords = [];

  for (const word of allBadWords) {
    // Use word boundary-like matching for both Arabic and English
    if (lowerText.includes(word.toLowerCase())) {
      flaggedWords.push(word);
    }
  }

  return {
    isClean: flaggedWords.length === 0,
    flaggedWords
  };
}

/**
 * Sanitize text by replacing bad words with asterisks
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  for (const word of allBadWords) {
    const regex = new RegExp(escapeRegex(word), 'gi');
    sanitized = sanitized.replace(regex, '*'.repeat(word.length));
  }

  return sanitized;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { checkProfanity, sanitizeText };
