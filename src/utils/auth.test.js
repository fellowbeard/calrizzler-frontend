// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { authHeaders, getToken, removeToken, setToken } from "./auth.js";

describe("auth utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and reads the authentication token", () => {
    setToken("token-123");

    expect(getToken()).toBe("token-123");
    expect(authHeaders()).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer token-123",
    });
  });

  it("removes the authentication token", () => {
    setToken("token-123");

    removeToken();

    expect(getToken()).toBeNull();
  });
});
