const SESSION_COOKIE_PATTERN =
  /^(?:(?:__Secure|__Host)-)?authjs\.session-token(?:\.\d+)?=/;






export function applySessionPersistence(
  response: Response,
  persistent: boolean,
): Response {
  if (persistent) return response;

  const setCookies = response.headers.getSetCookie();

  if (setCookies.length === 0) return response;

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");

  for (const cookie of setCookies) {
    const isSessionCookie = SESSION_COOKIE_PATTERN.test(cookie);
    headers.append(
      "set-cookie",
      isSessionCookie
        ? cookie
            .replace(/;\s*Expires=[^;]*/gi, "")
            .replace(/;\s*Max-Age=[^;]*/gi, "")
        : cookie,
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
