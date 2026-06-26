import { authHeaders } from "./auth.js";

export async function apiFetch(url, options = {}) {
  const useAuth = options.auth !== false;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(useAuth ? authHeaders() : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw buildApiError(response, data);
  }

  return data;
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildApiError(response, data) {
  if (data?.error) {
    return {
      status: response.status,
      code: data.error.code || "request_failed",
      message: data.error.message || "Request failed.",
      details: data.error.details || null,
    };
  }

  if (data?.errors) {
    return {
      status: response.status,
      code: "validation_failed",
      message: Array.isArray(data.errors) ? data.errors.join(", ") : "Validation failed.",
      details: data.errors,
    };
  }

  return {
    status: response.status,
    code: "request_failed",
    message: response.statusText || "Request failed.",
    details: null,
  };
}
