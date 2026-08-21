// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api.js";

const jsonResponse = (body, options = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...options,
  });

describe("apiFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds authentication headers and returns JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ ok: true })));

    await expect(apiFetch("/api/v1/dashboard")).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/dashboard",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Bearer"),
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("allows public requests to omit authentication", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ token: "abc" })));

    await apiFetch("/api/v1/login", { method: "POST", auth: false });

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/login",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("normalizes API validation errors for forms", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "validation_failed",
              message: "Validation failed.",
              details: { first_name: ["First name can't be blank"] },
            },
          },
          { status: 422 }
        )
      )
    );

    await expect(apiFetch("/api/v1/clients", { method: "POST" })).rejects.toEqual(
      expect.objectContaining({
        status: 422,
        code: "validation_failed",
        validationErrors: [
          {
            field: "first_name",
            type: "invalid",
            message: "First name can't be blank",
          },
        ],
      })
    );
  });

  it("uses the HTTP status text when the server returns no JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503, statusText: "Unavailable" })));

    await expect(apiFetch("/api/v1/dashboard")).rejects.toEqual(
      expect.objectContaining({ status: 503, code: "request_failed", message: "Unavailable" })
    );
  });
});
