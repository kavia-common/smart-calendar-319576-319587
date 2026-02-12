/**
 * Very small fetch wrapper used by the calendar UI.
 * - Normalizes errors (status code, message)
 * - Supports optional base URL override via REACT_APP_API_BASE_URL
 *
 * Integration note (Kavia preview):
 * - The frontend typically runs on :3000 and the backend on :3001.
 * - In preview/dev, we auto-target :3001 unless REACT_APP_API_BASE_URL is set.
 * - In production (same-origin behind a reverse proxy), default is "".
 */

const DEFAULT_BASE_URL = ""; // same-origin by default (works behind reverse proxy)

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the API base URL from environment, defaulting to same-origin (or :3001 in preview). */
  const explicit = (process.env.REACT_APP_API_BASE_URL || "").trim();
  if (explicit) return explicit.replace(/\/$/, "");

  // Auto-detect Kavia/CRA preview setup: frontend :3000, backend :3001
  if (typeof window !== "undefined" && window.location?.origin) {
    try {
      const url = new URL(window.location.origin);
      // If the frontend is on port 3000, assume backend is on 3001.
      if (url.port === "3000") {
        url.port = "3001";
        return url.toString().replace(/\/$/, "");
      }
    } catch {
      // ignore and fall back
    }
  }

  return DEFAULT_BASE_URL.replace(/\/$/, "");
}

async function readResponseBodySafe(res) {
  try {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export async function apiRequest(path, { method = "GET", body, headers, signal } = {}) {
  /**
   * Performs an API request to the backend.
   * @param {string} path Relative API path (e.g. "/api/events").
   * @param {object} options Fetch options, supports JSON body.
   * @returns {Promise<any>} Parsed JSON (or null for empty response).
   */
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const init = {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    signal,
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);

  if (!res.ok) {
    const payload = await readResponseBodySafe(res);
    const message =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" ? payload : null) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  // 204/empty responses
  if (res.status === 204) return null;

  // Some endpoints might return empty body with 200
  const data = await readResponseBodySafe(res);
  return data;
}
