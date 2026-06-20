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

async function request(path, options = {}, tokenType = "applicant") {
  const token = getToken(tokenType);
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const method = (options.method || "GET").toUpperCase();
  const retryable = method === "GET";

  let lastErr;
  for (let attempt = 0; attempt <= (retryable ? MAX_RETRIES : 0); attempt += 1) {
    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } catch {
      lastErr = new Error("Server is waking up or temporarily unavailable. Please wait a few seconds and try again.");
      if (retryable && attempt < MAX_RETRIES) {
        await sleep(500 * (attempt + 1));
        continue;
      }
      throw lastErr;
    }

    if (res.status === 401) {
      const key = tokenType === "hr" ? "tf_hr_token" : "tf_user_token";
      localStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent("auth:expired", { detail: { type: tokenType } }));
    }

    if (res.status >= 500 && retryable && attempt < MAX_RETRIES) {
      await sleep(500 * (attempt + 1));
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
  post: (path, body, tokenType) => request(path, { method: "POST", body: JSON.stringify(body) }, tokenType),
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
