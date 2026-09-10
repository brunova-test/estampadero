import { describe, expect, it } from "vitest";

import { applySessionPersistence } from "./session-persistence";

describe("applySessionPersistence", () => {
  it("turns only Auth.js session cookies into browser-session cookies", () => {
    const headers = new Headers();
    headers.append(
      "set-cookie",
      "authjs.session-token=encrypted; Path=/; Expires=Sun, 20 Sep 2026 12:00:00 GMT; HttpOnly; SameSite=Lax",
    );
    headers.append(
      "set-cookie",
      "authjs.csrf-token=value; Path=/; Max-Age=900; HttpOnly; SameSite=Lax",
    );

    const result = applySessionPersistence(
      new Response(null, { headers }),
      false,
    );
    const cookies = result.headers.getSetCookie();

    expect(cookies[0]).toBe(
      "authjs.session-token=encrypted; Path=/; HttpOnly; SameSite=Lax",
    );
    expect(cookies[1]).toContain("Max-Age=900");
  });

  it("leaves persistent sessions unchanged", () => {
    const response = new Response(null, {
      headers: {
        "set-cookie":
          "__Secure-authjs.session-token=encrypted; Path=/; Expires=Sun, 20 Sep 2026 12:00:00 GMT; Secure; HttpOnly",
      },
    });

    expect(applySessionPersistence(response, true)).toBe(response);
  });

  it("recognizes the host-only production session cookie", () => {
    const response = new Response(null, {
      headers: {
        "set-cookie":
          "__Host-authjs.session-token=encrypted; Path=/; Max-Age=3600; Secure; HttpOnly; SameSite=Lax",
      },
    });

    const result = applySessionPersistence(response, false);
    expect(result.headers.getSetCookie()[0]).toBe(
      "__Host-authjs.session-token=encrypted; Path=/; Secure; HttpOnly; SameSite=Lax",
    );
  });
});
