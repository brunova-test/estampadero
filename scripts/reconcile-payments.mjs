const appUrl = process.env.APP_URL;
const cronSecret = process.env.CRON_SECRET;

if (!appUrl || !cronSecret) {
  throw new Error("APP_URL and CRON_SECRET are required");
}

const response = await fetch(`${appUrl}/api/cron/reconcile-payments`, {
  headers: {
    authorization: `Bearer ${cronSecret}`,
  },
});

const body = await response.text();

if (!response.ok) {
  throw new Error(`Reconciliation failed (${response.status}): ${body}`);
}

console.log(`[payments reconciliation] ${body}`);
