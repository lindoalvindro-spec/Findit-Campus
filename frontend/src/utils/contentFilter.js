/**
 * Content Filter Utility for FindIt Campus
 * Filters profanity, slurs, and inappropriate content in Indonesian & English.
 */

// Daftar kata-kata terlarang (disamarkan sebagian untuk keamanan kode)
const BLOCKED_WORDS = [
  // Bahasa Indonesia - Kata kasar & vulgar
  'kontol', 'memek', 'ngentot', 'entot', 'ngewe', 'pepek', 'titit', 'itil',
  'jembut', 'tempik', 'pantat', 'peler', 'pelir', 'pentil',
  'bego', 'tolol', 'goblok', 'goblog', 'idiot', 'bodoh',
  'bangsat', 'bajingan', 'keparat', 'brengsek', 'sialan',
  'anjing', 'anjg', 'anjir', 'anj', 'ajg', 'babi', 'monyet',
  'asu', 'asw', 'kampret', 'kimak', 'memekmu',
  'lonte', 'pelacur', 'sundal', 'lacur', 'jablay',
  'sange', 'coli', 'colmek', 'bokep', 'ngewe',
  'jancok', 'jancuk', 'dancok', 'cuk', 'jnck',
  'tai', 'taik', 'tahi',
  'ngocok', 'crot', 'crotz',
  'pepek', 'pepe', 'puki', 'pukimak',
  'nenen', 'toket', 'tetek',
  'dildo', 'vibrator', 'kondom',

  // English - Common profanity
  'fuck', 'fck', 'f*ck', 'fucker', 'fucking', 'fuk',
  'shit', 'sh1t', 'bullshit',
  'ass', 'asshole', 'a$$',
  'bitch', 'b1tch', 'btch',
  'dick', 'd1ck', 'dck',
  'pussy', 'p*ssy',
  'cock', 'c0ck',
  'bastard', 'slut', 'whore',
  'nigga', 'nigger', 'n1gga',
  'porn', 'porno', 'pornography',
  'sex', 'seks', 'sexual',
  'nude', 'naked', 'telanjang',
  'hentai', 'xxx', 'nsfw',
];

// Variasi karakter yang sering digunakan untuk mengelabui filter
const CHAR_SUBSTITUTIONS = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '@': 'a', '$': 's', '!': 'i', '*': '',
  '.': '', '-': '', '_': '', ' ': ''
};

/**
 * Normalisasi teks untuk mendeteksi variasi penulisan
 * Contoh: "k0nt0l" -> "kontol", "f-u-c-k" -> "fuck"
 */
const normalizeText = (text) => {
  let normalized = text.toLowerCase();
  
  // Replace character substitutions
  for (const [char, replacement] of Object.entries(CHAR_SUBSTITUTIONS)) {
    normalized = normalized.split(char).join(replacement);
  }
  
  // Remove repeated characters (e.g., "fuuuuck" -> "fuck")
  normalized = normalized.replace(/(.)\1{2,}/g, '$1');
  
  return normalized;
};

/**
 * Periksa apakah teks mengandung kata-kata terlarang
 * @param {string} text - Teks yang akan diperiksa
 * @returns {{ isClean: boolean, flaggedWord: string|null }}
 */
export const checkText = (text) => {
  if (!text || typeof text !== 'string') return { isClean: true, flaggedWord: null };
  
  const normalized = normalizeText(text);
  
  for (const word of BLOCKED_WORDS) {
    if (normalized.includes(word)) {
      return { isClean: false, flaggedWord: word };
    }
  }
  
  return { isClean: true, flaggedWord: null };
};

/**
 * Bersihkan teks dengan menyensor kata-kata terlarang
 * @param {string} text - Teks yang akan disensor
 * @returns {string} Teks yang sudah disensor
 */
export const censorText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  let censored = text;
  const lowerText = normalizeText(text);
  
  for (const word of BLOCKED_WORDS) {
    if (lowerText.includes(word)) {
      const regex = new RegExp(word, 'gi');
      censored = censored.replace(regex, '*'.repeat(word.length));
    }
  }
  
  return censored;
};
