const SUPPRESSION_KEY = "tarot_detection_suppressions";

function extractKeywords(text) {
  const cleaned = text.replace(/[，。！？、；：""''（）【】《》\s,.!?;:'"()]/g, " ");
  const cjkTerms = [];
  for (let i = 0; i < cleaned.length - 1; i++) {
    if (/[一-鿿]/.test(cleaned[i]) && /[一-鿿]/.test(cleaned[i + 1])) {
      cjkTerms.push(cleaned[i] + cleaned[i + 1]);
    }
  }
  const words = cleaned
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map((w) => w.toLowerCase());
  return [...new Set([...cjkTerms, ...words])];
}

function jaccardSimilarity(setA, setB) {
  const a = new Set(setA);
  const b = new Set(setB);
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function hoursBetween(isoA, isoB) {
  return Math.abs(new Date(isoA) - new Date(isoB)) / 36e5;
}

export function detectSimilarQuestion(newQuestion, pastReadings, options = {}) {
  const { maxAgeHours = 24, threshold = 0.4 } = options;
  if (!newQuestion || !pastReadings || pastReadings.length === 0) return null;

  const qKeywords = extractKeywords(newQuestion);
  if (qKeywords.length === 0) return null;

  let best = null;
  for (const reading of pastReadings) {
    if (!reading.question) continue;
    if (hoursBetween(new Date().toISOString(), reading.createdAt) > maxAgeHours) continue;

    const rKeywords = extractKeywords(reading.question);
    const score = jaccardSimilarity(qKeywords, rKeywords);
    if (score >= threshold && (!best || score > best.score)) {
      best = { isSimilar: true, matchedReading: reading, score };
    }
  }
  return best;
}

export function findSimilarPastReadings(question, pastReadings, maxAgeHours = 720) {
  if (!question || !pastReadings || pastReadings.length === 0) return [];

  const qKeywords = extractKeywords(question);
  if (qKeywords.length === 0) return [];

  return pastReadings
    .filter((r) => r.question && hoursBetween(new Date().toISOString(), r.createdAt) <= maxAgeHours)
    .map((r) => {
      const rKeywords = extractKeywords(r.question);
      return { ...r, _similarity: jaccardSimilarity(qKeywords, rKeywords) };
    })
    .filter((r) => r._similarity >= 0.3)
    .sort((a, b) => b._similarity - a._similarity);
}

export function getPreviouslyUsedSpread(question, pastReadings) {
  const similar = findSimilarPastReadings(question, pastReadings, 720);
  if (similar.length === 0) return null;
  return similar[0].spread_id;
}

function loadSuppressions() {
  try {
    return JSON.parse(localStorage.getItem(SUPPRESSION_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSuppressions(data) {
  try {
    localStorage.setItem(SUPPRESSION_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function isDetectionSuppressed(questionText, matchedReadingId) {
  const suppressions = loadSuppressions();
  const key = `${hashQuestion(questionText)}_${matchedReadingId}`;
  return !!suppressions[key];
}

export function suppressDetection(questionText, matchedReadingId) {
  const suppressions = loadSuppressions();
  const key = `${hashQuestion(questionText)}_${matchedReadingId}`;
  suppressions[key] = Date.now();
  saveSuppressions(suppressions);
}

function hashQuestion(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
