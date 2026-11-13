import { authHeaders } from "./auth.js";

export async function apiFetch(url, options = {}) {
  const useAuth = options.auth !== false;
  const isFormData = options.body instanceof FormData;

  const headers = new Headers({
    ...(useAuth ? authHeaders() : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  });

  if (isFormData) {
    headers.delete("Content-Type");
  }

  const response = await fetch(url, {
    ...options,
    headers,
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

// The API always reports failures as { error: { code, message, details } }.
// `details` is a hash of field => messages for validation errors, otherwise null.
function buildApiError(response, data) {
  const details = data?.error?.details ?? null;

  return {
    status: response.status,
    code: data?.error?.code || "request_failed",
    message: data?.error?.message || response.statusText || "Request failed.",
    details,
    validationErrors: normalizeValidationErrors(details),
  };
}

function normalizeValidationErrors(details) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return [];
  }

  return Object.entries(details).flatMap(([field, entries]) => {
    const list = Array.isArray(entries) ? entries : [entries];

    return list.map((entry) => {
      if (entry && typeof entry === "object" && "message" in entry) {
        return {
          field,
          type: entry.type || "invalid",
          message: entry.message,
        };
      }

      return {
        field,
        type: "invalid",
        message: String(entry),
      };
    });
  });
}
