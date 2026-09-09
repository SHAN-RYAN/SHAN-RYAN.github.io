import { apiFetch } from "./api";
const KEYS = {
  PROFILE: "tarot_user_profile",
  READINGS: "tarot_user_readings",
  FEEDBACK: "tarot_user_feedback",
  SUPPLEMENTAL: "tarot_user_feedback_records",
};

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function write(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

/* ---- Auth API wrappers ---- */

function getAuth() {
  const profile = read(KEYS.PROFILE);
  if (!profile?.nickname || !profile?.password) return null;
  return { nickname: profile.nickname, password: profile.password };
}

async function apiPost(path, body) {
  const res = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "请求失败");
  return data;
}

export async function registerAccount(nickname, password) {
  return apiPost("/api/auth", { action: "register", nickname, password });
}

export async function loginAccount(nickname, password) {
  return apiPost("/api/auth", { action: "login", nickname, password });
}

/* ---- Cloud sync via Python backend ---- */

export async function syncReadingsFromCloud() {
  const auth = getAuth();
  if (!auth) return null;
  try {
    const res = await apiFetch("/api/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list", ...auth }),
    });
    const data = await res.json();
    if (!res.ok || !data.readings) return null;
    const localReadings = getReadings();
    const localIds = new Set(localReadings.map((r) => r.id));
    const newRemote = data.readings.filter((r) => !localIds.has(r.id));
    if (newRemote.length > 0) write(KEYS.READINGS, [...newRemote, ...localReadings]);
    return newRemote.length;
  } catch { return null; }
}

async function pushReadingToCloud(reading) {
  const auth = getAuth();
  if (!auth) return;
  try {
    await apiFetch("/api/readings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", ...auth, reading }) });
  } catch { /* fire and forget */ }
}

/* ---- Profile ---- */

export function getProfile() {
  return read(KEYS.PROFILE);
}

export function saveProfile({ nickname, password }) {
  const profile = { nickname, password, createdAt: new Date().toISOString() };
  write(KEYS.PROFILE, profile);
  return profile;
}

export function clearProfile() {
  localStorage.removeItem(KEYS.PROFILE);
}

/* ---- Readings ---- */

export function getReadings() {
  return read(KEYS.READINGS) || [];
}

export function saveReading(reading) {
  const readings = getReadings();
  const newReading = {
    ...reading,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  readings.unshift(newReading);
  write(KEYS.READINGS, readings);

  // 异步推送到云端，不阻塞
  pushReadingToCloud(newReading);

  return readings;
}

/* ---- Feedback ---- */

export function getFeedbackRecords() {
  return read(KEYS.FEEDBACK) || [];
}

export function saveFeedback(record) {
  const records = getFeedbackRecords();
  records.unshift({ ...record, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  write(KEYS.FEEDBACK, records);
  return records;
}

export function updateLastFeedback(feedbackText) {
  const records = getFeedbackRecords();
  if (records.length > 0) {
    records[0].feedbackText = feedbackText;
    write(KEYS.FEEDBACK, records);
  }
}

/* ---- Legacy localStorage compatibility (from the old feedback system) ---- */

export function loadLegacyFeedback() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SUPPLEMENTAL) || "[]");
  } catch {
    return [];
  }
}
