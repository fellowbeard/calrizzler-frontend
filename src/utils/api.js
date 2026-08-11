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
    const details = normalizeErrorDetails(data.error.details);

    return {
      status: response.status,
      code: data.error.code || "request_failed",
      message: data.error.message || "Request failed.",
      details,
      validationErrors: normalizeValidationErrors(details),
    };
  }

  if (data?.errors) {
    const details = normalizeErrorDetails(data.errors);

    return {
      status: response.status,
      code: "validation_failed",
      message: Array.isArray(data.errors) ? data.errors.join(", ") : "Validation failed.",
      details,
      validationErrors: normalizeValidationErrors(details),
    };
  }

  return {
    status: response.status,
    code: "request_failed",
    message: response.statusText || "Request failed.",
    details: null,
    validationErrors: [],
  };
}

function normalizeErrorDetails(details) {
  if (!details) {
    return null;
  }

  if (Array.isArray(details)) {
    return details;
  }

  if (typeof details === "object") {
    return details;
  }

  return [{ type: "invalid", message: String(details) }];
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
