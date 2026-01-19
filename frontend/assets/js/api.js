// api.js (FULL)
// Backend-ready API helper (no mock data).

export const API_BASE = "http://localhost:3001/api";

async function withTimeout(fn, ms = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

export async function pingBackend() {
  try {
    const res = await withTimeout((signal) =>
      fetch(`${API_BASE}/health`, { signal })
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};

  // Add JSON content-type only when sending a JSON body
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // TEMP auth bridge: send logged-in user email for backend identification
  try {
    const session = JSON.parse(localStorage.getItem("rcms_session_v1") || "null");
    if (session?.email) headers["x-user-email"] = session.email;
  } catch {}

  // Optional token support (later, JWT)
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await withTimeout((signal) =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers,
      signal,
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
  );

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && data.message
        ? data.message
        : `Request failed: ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// -------------------- Auth --------------------
export const apiLogin = (email, password) =>
  request("/auth/login", { method: "POST", body: { email, password } });

// -------------------- Applicants --------------------
export const apiGetMyProfile = (token) => request("/applicants/me", { token });

export const apiUpdateMyProfile = (token, payload) =>
  request("/applicants/me", { method: "PUT", token, body: payload });

// -------------------- Applications --------------------
export const apiGetMyApplications = (token) =>
  request("/applications/me", { token });

export const apiCreateApplication = (token, payload) =>
  request("/applications", { method: "POST", token, body: payload });

export const apiGetAllApplications = (token) =>
  request("/applications", { token });

export const apiApproveApplication = (token, id) =>
  request(`/applications/${id}/approve`, { method: "PUT", token });

export const apiRejectApplication = (token, id, reason) =>
  request(`/applications/${id}/reject`, {
    method: "PUT",
    token,
    body: { reason }
  });

// -------------------- Licenses --------------------
export const apiGetMyLicense = (token) => request("/licenses/me", { token });

export const apiGetLicenseById = (token, id) =>
  request(`/licenses/${id}`, { token });

// -------------------- Renewals --------------------
export const apiSubmitRenewal = (token, payload) =>
  request("/renewals", { method: "POST", token, body: payload });

// -------------------- Forms (XML served by frontend assets for now) --------------------
export async function fetchFormXML(code) {
  // IMPORTANT: use absolute path from site root (works from any page)
  const res = await fetch(`/assets/forms/${code}.xml`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Form not found: ${code}`);
  return await res.text();
}
