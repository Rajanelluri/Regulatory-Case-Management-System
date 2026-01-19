import { pingBackend } from "./api.js";

const SESSION_KEY = "rcms_session_v1";

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function requireAuth(allowedRoles = []) {
  const s = getSession();
  if (!s || !s.token) {
    window.location.href = "./login.html";
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(s.role)) {
    // If role mismatch, route them to their home page.
    window.location.href = s.role === "OFFICER" ? "./officer-dashboard.html" : "./applicant-dashboard.html";
    return null;
  }
  return s;
}

export function setActiveNav() {
  const current = (location.pathname.split("/").pop() || "").toLowerCase();
  document.querySelectorAll("[data-nav]").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href.endsWith(current)) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

export function mountUserBadge() {
  const s = getSession();
  const el = document.querySelector("[data-userbadge]");
  if (!el) return;
  if (!s) { el.textContent = "Not signed in"; return; }
  el.innerHTML = `
    <span class="dot"></span>
    ${escapeHtml(s.email || "user")} · ${escapeHtml(s.role || "")}
  `;
}

export async function mountBackendBadge() {
  const el = document.querySelector("[data-backendbadge]");
  if (!el) return;
  const ok = await pingBackend();
  el.classList.remove("ok", "warn", "err");
  if (ok) {
    el.classList.add("ok");
    el.querySelector(".label").textContent = "Backend";
    el.querySelector(".value").textContent = "Connected";
  } else {
    el.classList.add("warn");
    el.querySelector(".label").textContent = "Backend";
    el.querySelector(".value").textContent = "Not connected";
  }
}

export function logout() {
  clearSession();
  window.location.href = "./login.html";
}

export function toast(title, message) {
  const t = document.querySelector("[data-toast]");
  if (!t) return alert(`${title}\n${message}`);
  t.querySelector(".t").textContent = title;
  t.querySelector(".m").textContent = message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function statusPill(status) {
  const s = String(status || "").toUpperCase();
  if (s.includes("SUBMIT")) return `<span class="pill submitted">Submitted</span>`;
  if (s.includes("REVIEW")) return `<span class="pill review">Under Review</span>`;
  if (s.includes("APPROV")) return `<span class="pill approved">Approved</span>`;
  if (s.includes("REJECT")) return `<span class="pill rejected">Rejected</span>`;
  return `<span class="pill">${escapeHtml(status || "Unknown")}</span>`;
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
