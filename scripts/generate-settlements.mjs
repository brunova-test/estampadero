const appUrl = process.env.APP_URL;
const cronSecret = process.env.CRON_SECRET;

if (!appUrl || !cronSecret) {
  throw new Error("APP_URL and CRON_SECRET are required");
}

const response = await fetch(`${appUrl}/api/cron/generate-settlements`, {
  headers: { authorization: `Bearer ${cronSecret}` },
});
const result = await response.text();
if (!response.ok) {
  throw new Error(
    `Settlement generation failed (${response.status}): ${result}`,
  );
}
process.stdout.write(`${result}\n`);
