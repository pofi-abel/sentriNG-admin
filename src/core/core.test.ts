import { act, renderHook } from "@testing-library/react";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, http } from "./helpers/axios.helper";
import { useValidator } from "./helpers/useValidator.hook";
import { LoginSchema } from "./schemas/auth.schema";
import { tokenManager } from "@/lib/token-manager";

describe("useValidator", () => {
  it("shows every error on validate and runs the callback only when valid", () => {
    const store = { email: "", password: "", totp_code: "12" };
    const { result, rerender } = renderHook(({ store }) => useValidator({ schema: LoginSchema, store }), { initialProps: { store } });
    const submit = vi.fn();

    act(() => void result.current.validate(submit));
    expect(submit).not.toHaveBeenCalled();
    expect(Object.keys(result.current.errors)).toEqual(["email", "password", "totp_code"]);

    rerender({ store: { email: " ops@desk.io ", password: "pw", totp_code: "123456" } });
    act(() => void result.current.validate(submit));
    expect(submit).toHaveBeenCalledWith({ email: "ops@desk.io", password: "pw", totp_code: "123456" });
  });
});

describe("tokenManager", () => {
  afterEach(() => tokenManager.clear());

  it("keeps the session in sessionStorage, never localStorage, and drops it once expired", () => {
    tokenManager.set({ token: "t", expiresAt: new Date(Date.now() + 60_000).toISOString(), analystId: 3 });
    expect(tokenManager.getToken()).toBe("t");
    expect(sessionStorage.getItem("sentring.admin.session")).not.toBeNull();
    expect(localStorage.length).toBe(0);

    tokenManager.set({ token: "t", expiresAt: new Date(Date.now() - 1).toISOString(), analystId: 3 });
    expect(tokenManager.get()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });
});

describe("http", () => {
  const reply = (status: number, data: unknown) => async (config: InternalAxiosRequestConfig) => {
    const response = { status, data, headers: {}, config, statusText: "" } as AxiosResponse;
    throw new AxiosError("Request failed", undefined, config, null, response);
  };

  it("on 401 drops the session and goes to login with the page to come back to", async () => {
    tokenManager.set({ token: "t", expiresAt: new Date(Date.now() + 60_000).toISOString(), analystId: 3 });
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, pathname: "/observers", search: "?status=pending", assign });

    const error = await http.get("/admin/me", { adapter: reply(401, { error: "invalid, expired, or revoked token" }) }).catch((e) => e);

    expect(error).toEqual(new ApiError("invalid, expired, or revoked token", 401));
    expect(tokenManager.get()).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login?reason=ended&redirect=%2Fobservers%3Fstatus%3Dpending");
    vi.unstubAllGlobals();
  });

  it("surfaces the server's { error } text and status", async () => {
    const error = await http
      .post("/admin/observers/import", {}, { adapter: reply(400, { error: "import rejected, nothing was changed: row 2: OBS-1 repeats row 1" }) })
      .catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toMatch(/row 2: OBS-1 repeats row 1/);
  });
});
