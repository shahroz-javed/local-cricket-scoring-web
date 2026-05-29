export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API_BASE_URL) {
    return normalizedPath;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", token, body, headers = {}, cache = "no-store" } = options;
  const requestHeaders = { Accept: "application/json", ...headers };
  let requestBody = body;

  if (body && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
    requestBody = JSON.stringify(body);
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(apiUrl(path), {
    method,
    headers: requestHeaders,
    body: requestBody,
    cache,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
