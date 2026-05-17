/**
 * Content Filter Utility for FindIt Campus
 * Filters profanity, slurs, and inappropriate content in Indonesian & English.
 * Enhanced with slang detection and phonetic similarity matching.
 */

// Daftar kata-kata terlarang — termasuk variasi slang, typo, dan singkatan
const BLOCKED_WORDS = [
  // === BAHASA INDONESIA ===

  // Organ & vulgar - semua variasi slang
  'kontol', 'kntl', 'kontl', 'kntol', 'konthol', 'kontil',
  'memek', 'mmk', 'memex', 'mmek', 'meki', 'meqi',
  'ngentot', 'ngentod', 'ngenthot', 'ngntot', 'ngntod', 'entot', 'entod',
  'ngewe', 'ngeue', 'ngwe', 'ewe', 'eue', 'ngew3',
  'pepek', 'pepe', 'ppk', 'pekpek',
  'titit', 'tytyt', 'titid', 'tityd',
  'itil', 'ithil',
  'jembut', 'jmbut', 'jmbt', 'jembud',
  'tempik', 'tmpk', 'tempek',
  'pantat', 'pantet', 'pantad', 'pntat',
  'peler', 'pelir', 'plr',
  'pentil', 'pentol', 'pntil',
  'toket', 'tokket', 'toged', 'toket',
  'tetek', 'teted', 'ttek', 'tete',
  'nenen', 'nenen', 'susu',

  // Umpatan umum
  'bangsat', 'bangsad', 'bngst', 'bgst', 'bangset',
  'bajingan', 'bjngan', 'bjingn', 'bajingn',
  'keparat', 'kparat', 'kprat',
  'brengsek', 'brngsk', 'brengsex',
  'sialan', 'sialn', 'syalan',
  'kampret', 'kmprt', 'kampred', 'kmpret',
  'kimak', 'kimk', 'kiamak',

  // Hinaan
  'goblok', 'goblog', 'gblk', 'goblock', 'gblok', 'gobloq',
  'tolol', 'tolol', 'tll', 'tololl',
  'bego', 'bgoo', 'bgo', 'begoo',
  'idiot', 'idiod', 'idyot',
  'bodoh', 'bodo', 'bodho',

  // Binatang sbg umpatan — DIHAPUS karena user mungkin melaporkan hewan peliharaan hilang

  // Jawa kasar
  'jancok', 'jancuk', 'jangkrik', 'jnck', 'jancog', 'jancik',
  'dancok', 'dancuk', 'matamu', 'diamput', 'diancuk',
  'cuk', 'cok', 'coeg', 'cog', 'coq',

  // Seksual & prostitusi
  'lonte', 'lonthe', 'lont3',
  'pelacur', 'plcr', 'plcur',
  'sundal', 'sundel', 'sndal',
  'lacur', 'lcur',
  'jablay', 'jablai', 'jblay',
  'perek', 'prk', 'perek',

  // Aktivitas seksual
  'sange', 'sangean', 'sng3', 'horny',
  'coli', 'coliii', 'c0li', 'kocok',
  'colmek', 'colm3k',
  'bokep', 'bokeb', 'bok3p', 'bokeep',
  'ngocok', 'ngcok',
  'crot', 'crotz', 'crott', 'crots',
  'puki', 'puqi', 'pukimak', 'pukimac',
  'itil', 'klitoris',
  'dildo', 'vibrator', 'kondom',
  'orgasme', 'masturbasi', 'onani',
  'ngesex', 'ngeseks', 'ngenthu',

  // Tai
  'tai', 'taik', 'tahi', 'taek', 'taiq', 'tahy',

  // Kata ganti slang kasar (Jaksel, Medsos)
  'bgsd', 'bgsdd', 'kntl', 'mmk', 'jmbt',
  'wtf', 'stfu', 'gtfo',
  'bacot', 'bacod', 'bacott', 'bcot',
  'bngsd', 'ajgggg', 'ngntd',

  // === ENGLISH ===
  'fuck', 'fck', 'fucker', 'fucking', 'fuk', 'fak', 'phuck', 'fvck',
  'shit', 'bullshit', 'shite', 'sht',
  'asshole', 'arsehole',
  'bitch', 'btch', 'biatch',
  'dick', 'dck',
  'pussy', 'puss',
  'cock', 'cawk',
  'bastard', 'bstrd',
  'slut', 'sl*t',
  'whore', 'wh0re', 'hoe',
  'nigga', 'nigger', 'negro',
  'porn', 'porno', 'pornography', 'p0rn',
  'nude', 'naked', 'telanjang', 'bugil', 'telajang',
  'hentai', 'xxx', 'nsfw',
  'blowjob', 'handjob', 'gangbang',
  'anal', 'cumshot', 'creampie',
];

// Variasi karakter yang sering digunakan untuk mengelabui filter
const CHAR_SUBSTITUTIONS = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '@': 'a', '$': 's', '!': 'i', '*': '',
  '.': '', '-': '', '_': '', ' ': '',
};

// Penggantian huruf fonetik bahasa Indonesia (slang)
const PHONETIC_SUBSTITUTIONS = {
  'th': 't',   // konthol -> kontol
  'dh': 'd',   // bodho -> bodo
  'x': 'k',    // memex -> memek
  'q': 'k',    // taiq -> taik
  'z': 's',    // crotz -> crots
};

/**
 * Normalisasi teks untuk mendeteksi variasi penulisan
 * Contoh: "k0nt0l" -> "kontol", "f-u-c-k" -> "fuck", "ngent0d" -> "ngentod"
 */
const normalizeText = (text) => {
  let normalized = text.toLowerCase();
  
  // Remove common separator characters
  normalized = normalized.replace(/[\s\-\_\.\,\;\:\!\?\#\~\+\=\/\\]/g, '');
  
  // Replace character substitutions (leet speak)
  for (const [char, replacement] of Object.entries(CHAR_SUBSTITUTIONS)) {
    normalized = normalized.split(char).join(replacement);
  }
  
  // Apply phonetic substitutions
  for (const [pattern, replacement] of Object.entries(PHONETIC_SUBSTITUTIONS)) {
    normalized = normalized.split(pattern).join(replacement);
  }
  
  // Normalize 'd' at end of words to 't' (common Indonesian slang: ngentod -> ngentot)
  normalized = normalized.replace(/d\b/g, 't');
  normalized = normalized.replace(/d$/g, 't');
  
  // Remove repeated characters (e.g., "fuuuuck" -> "fuck", "anjgggg" -> "anjg")
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
  
  // Also normalize blocked words for consistent matching
  for (const word of BLOCKED_WORDS) {
    const normalizedWord = normalizeText(word);
    if (normalized.includes(normalizedWord)) {
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
    const normalizedWord = normalizeText(word);
    if (lowerText.includes(normalizedWord)) {
      const regex = new RegExp(word, 'gi');
      censored = censored.replace(regex, '*'.repeat(word.length));
    }
  }
  
  return censored;
};
