/**
 * NSFW Image Detection Utility for FindIt Campus
 * Uses nsfwjs (TensorFlow.js) to detect inappropriate images client-side.
 * No API key needed — runs entirely in the browser.
 */

let nsfwModel = null;
let isLoadingModel = false;
let modelLoadPromise = null;

/**
 * Load the NSFW detection model (lazy-loaded, cached after first use)
 */
const loadModel = async () => {
  if (nsfwModel) return nsfwModel;
  if (modelLoadPromise) return modelLoadPromise;

  isLoadingModel = true;
  modelLoadPromise = (async () => {
    try {
      const nsfwjs = await import('nsfwjs');
      const tf = await import('@tensorflow/tfjs');

      // Use a lighter model for faster loading
      tf.enableProdMode();
      nsfwModel = await nsfwjs.load(
        'https://nsfwjs.com/quant_nsfw_mobilenet/',
        { type: 'graph' }
      );
      return nsfwModel;
    } catch (error) {
      console.error('Gagal memuat model NSFW:', error);
      modelLoadPromise = null;
      return null;
    } finally {
      isLoadingModel = false;
    }
  })();

  return modelLoadPromise;
};

/**
 * Check if an image (as base64 data URL or HTMLImageElement) contains NSFW content
 * @param {string} imageSource - Base64 data URL string of the image
 * @returns {Promise<{ isSafe: boolean, reason: string|null, predictions: object }>}
 */
export const checkImage = async (imageSource) => {
  try {
    const model = await loadModel();
    
    if (!model) {
      // If model fails to load, allow the image (fail-open) but log warning
      console.warn('Model NSFW tidak tersedia, gambar diizinkan tanpa pemeriksaan.');
      return { isSafe: true, reason: null, predictions: null };
    }

    // Create an Image element from the source
    const img = await createImageElement(imageSource);
    
    // Run prediction
    const predictions = await model.classify(img);
    
    // Parse results
    const result = {};
    predictions.forEach(p => {
      result[p.className] = p.probability;
    });

    // Categories from nsfwjs:
    // - Porn: explicit sexual content
    // - Sexy: suggestive but not explicit
    // - Hentai: anime/cartoon pornography
    // - Drawing: safe drawings/illustrations
    // - Neutral: safe content
    
    const pornScore = result['Porn'] || 0;
    const hentaiScore = result['Hentai'] || 0;
    const sexyScore = result['Sexy'] || 0;

    // Threshold: block if Porn or Hentai is > 30%, or Sexy is > 60%
    if (pornScore > 0.3) {
      return { isSafe: false, reason: 'Gambar mengandung konten pornografi.', predictions: result };
    }
    if (hentaiScore > 0.3) {
      return { isSafe: false, reason: 'Gambar mengandung konten hentai/pornografi kartun.', predictions: result };
    }
    if (sexyScore > 0.6) {
      return { isSafe: false, reason: 'Gambar mengandung konten yang terlalu vulgar.', predictions: result };
    }

    return { isSafe: true, reason: null, predictions: result };
  } catch (error) {
    console.error('Error saat memeriksa gambar:', error);
    return { isSafe: true, reason: null, predictions: null };
  }
};

/**
 * Create an HTMLImageElement from a base64 data URL
 */
const createImageElement = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

/**
 * Preload the model in the background (call this early for better UX)
 */
export const preloadNSFWModel = () => {
  loadModel();
};
