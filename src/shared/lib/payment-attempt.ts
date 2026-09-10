const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function storageKey(orderId: string, channel: string) {
  return `payment-attempt:${orderId}:${channel}`;
}

export function getOrCreatePaymentAttemptId(orderId: string, channel: string) {
  const key = storageKey(orderId, channel);
  const existing = window.sessionStorage.getItem(key);
  if (existing && UUID_PATTERN.test(existing)) return existing;

  const created = crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}

export function clearPaymentAttemptId(orderId: string, channel: string) {
  window.sessionStorage.removeItem(storageKey(orderId, channel));
}
