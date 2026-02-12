import { apiRequest } from "./client";

/**
 * NOTE: Backend swagger currently appears incomplete (only `/`).
 * We implement conventional endpoints with fallbacks:
 *  - Primary base: REACT_APP_API_EVENTS_BASE (default "/api/events")
 *  - Fallback base: "/events"
 *
 * If your backend uses different routes, set REACT_APP_API_EVENTS_BASE accordingly.
 */

function getEventsBase() {
  const base = process.env.REACT_APP_API_EVENTS_BASE || "/api/events";
  return base.startsWith("/") ? base : `/${base}`;
}

function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

async function tryRequestInBases(bases, pathSuffix, options) {
  let lastErr;
  for (const base of bases) {
    try {
      return await apiRequest(`${base}${pathSuffix}`, options);
    } catch (e) {
      // Only fallback on 404; otherwise surface the error
      if (e && e.status === 404) {
        lastErr = e;
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error("No matching events endpoint found");
}

// PUBLIC_INTERFACE
export async function listEventsInRange({ start, end } = {}) {
  /**
   * Lists events, optionally filtered by date range.
   * start/end should be ISO8601 strings, e.g. 2026-02-12T00:00:00Z
   */
  const bases = [getEventsBase(), "/events"];
  const qs = buildQuery({ start, end });
  return await tryRequestInBases(bases, qs, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createEvent(event) {
  /** Creates an event. */
  const bases = [getEventsBase(), "/events"];
  return await tryRequestInBases(bases, "", { method: "POST", body: event });
}

// PUBLIC_INTERFACE
export async function updateEvent(id, event) {
  /** Updates an event by id. */
  const bases = [getEventsBase(), "/events"];
  return await tryRequestInBases(bases, `/${encodeURIComponent(id)}`, { method: "PUT", body: event });
}

// PUBLIC_INTERFACE
export async function deleteEvent(id) {
  /** Deletes an event by id. */
  const bases = [getEventsBase(), "/events"];
  return await tryRequestInBases(bases, `/${encodeURIComponent(id)}`, { method: "DELETE" });
}
