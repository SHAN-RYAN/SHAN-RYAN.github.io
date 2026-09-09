const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, options);
}
