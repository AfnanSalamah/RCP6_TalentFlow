const DEPLOYED_API_URL = "https://talentflow-backend-asoo.onrender.com";
const rawBaseUrl =
  import.meta.env.VITE_API_URL ||
  DEPLOYED_API_URL;
const BASE_URL = rawBaseUrl.replace(/\/+$/, "");

function getToken(type = "applicant") {
  const key = type === "hr" ? "tf_hr_token" : "tf_user_token";
  return localStorage.getItem(key);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_RETRIES = 2;
const NETWORK_MESSAGE = "Server is waking up or temporarily unavailable. Please wait a few seconds and try again.";
const RETRYABLE_POST_PATHS = new Set([
  "/auth/register-company",
  "/auth/resend-company-verification",
  "/auth/applicant/register",
  "/auth/applicant/resend-verification",
  "/auth/applicant/forgot-password",
  "/auth/hr/forgot-password",
]);

async function request(path, options = {}, tokenType = "applicant") {
  const { retry = false, ...fetchOptions } = options;
  const token = getToken(tokenType);
  const headers = { "Content-Type": "application/json", ...(fetchOptions.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const method = (fetchOptions.method || "GET").toUpperCase();
  const retryable = method === "GET" || retry || RETRYABLE_POST_PATHS.has(path);
  const maxAttempts = retryable ? MAX_RETRIES : 0;

  let lastErr;
  for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });
    } catch {
      lastErr = new Error(NETWORK_MESSAGE);
      if (retryable && attempt < maxAttempts) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      throw lastErr;
    }

    if (res.status === 401) {
      const key = tokenType === "hr" ? "tf_hr_token" : "tf_user_token";
      localStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent("auth:expired", { detail: { type: tokenType } }));
    }

    if (res.status >= 500 && retryable && attempt < maxAttempts) {
      await sleep(1200 * (attempt + 1));
      continue;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || `Request failed (${res.status})`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  throw lastErr || new Error("Request failed");
}

export const api = {
  get: (path, tokenType) => request(path, { method: "GET" }, tokenType),
  post: (path, body, tokenType, config = {}) => request(path, { method: "POST", body: JSON.stringify(body), retry: config.retry }, tokenType),
  put: (path, body, tokenType) => request(path, { method: "PUT", body: JSON.stringify(body) }, tokenType),
  patch: (path, body, tokenType) => request(path, { method: "PATCH", body: JSON.stringify(body) }, tokenType),
  delete: (path, tokenType) => request(path, { method: "DELETE" }, tokenType),

  upload: (path, formData, tokenType = "applicant") => {
    const token = getToken(tokenType);
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${BASE_URL}${path}`, { method: "POST", headers, body: formData })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Upload failed" }));
          throw new Error(err.detail || "Upload failed");
        }
        return res.json();
      });
  },
};

export const BASE = BASE_URL;
