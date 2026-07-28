// Stellarin check-in diagnostics — run from the project folder:
//   node scripts/diagnose.mjs
// Tests (1) the Google key in .env.local directly, (2) the live Vercel API.

import { readFileSync } from "fs";
import { google } from "googleapis";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = (env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const sheetId = env.GOOGLE_SHEET_ID;

console.log("=== 1. Local key vs Google (tests the key itself) ===");
try {
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Database!A1:C2",
  });
  console.log("PASS — the key in .env.local WORKS and can read the sheet.");
  console.log("   Sample row:", JSON.stringify(res.data.values?.[1]?.slice(0, 2)));
} catch (e) {
  console.log("FAIL — Google rejected the local key.");
  console.log("   Error:", e.message?.slice(0, 300));
  if (/invalid_grant|invalid_rapt|account not found/i.test(e.message || ""))
    console.log("   → Meaning: this key has been DELETED/rotated in Google Cloud. Need a fresh key.");
  if (/permission/i.test(e.message || ""))
    console.log("   → Meaning: key is alive but the sheet isn't shared with the service account.");
}

console.log("\n=== 2. Live site API (tests what Vercel has) ===");
try {
  const r = await fetch("https://enterstellarin.vercel.app/api/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "9791555697" }),
  });
  const body = await r.text();
  console.log("HTTP", r.status, "—", body.slice(0, 200));
  if (r.status === 200) console.log("PASS — the LIVE SITE is working. Problem solved.");
  else if (r.status === 404) console.log("Odd — API works but user not found.");
  else console.log("FAIL — live site still can't reach the sheet (check Vercel env + redeploy).");
} catch (e) {
  console.log("FAIL — couldn't reach the live site:", e.message);
}

console.log("\n=== 3. Compare Vercel's stored env vs .env.local (if pulled) ===");
try {
  const venv = {};
  for (const line of readFileSync(".env.vercel-prod", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (m) venv[m[1]] = m[2];
  }
  const checks = [
    ["GOOGLE_SHEET_ID", env.GOOGLE_SHEET_ID, venv.GOOGLE_SHEET_ID],
    ["GOOGLE_SERVICE_ACCOUNT_EMAIL", env.GOOGLE_SERVICE_ACCOUNT_EMAIL, venv.GOOGLE_SERVICE_ACCOUNT_EMAIL],
  ];
  for (const [name, local, remote] of checks) {
    if (remote === undefined) console.log(`MISSING on Vercel: ${name}`);
    else if (local === remote) console.log(`MATCH: ${name}`);
    else console.log(`MISMATCH: ${name} (Vercel has: "${(remote||"").slice(0,60)}")`);
  }
  const lk = (env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n").trim();
  const rkRaw = venv.GOOGLE_PRIVATE_KEY;
  if (rkRaw === undefined) console.log("MISSING on Vercel: GOOGLE_PRIVATE_KEY");
  else {
    const rk = rkRaw.replace(/\\n/g, "\n").trim();
    if (lk === rk) console.log("MATCH: GOOGLE_PRIVATE_KEY is identical — problem is elsewhere.");
    else {
      console.log("MISMATCH: GOOGLE_PRIVATE_KEY differs from your working local key.");
      console.log(`   local length: ${lk.length}, vercel length: ${rk.length}`);
      if (/^["']/.test(rkRaw)) console.log("   → Vercel copy starts with a QUOTE character.");
      if (!rk.startsWith("-----BEGIN PRIVATE KEY-----")) console.log("   → Vercel copy does NOT start with -----BEGIN PRIVATE KEY-----");
      if (!rk.endsWith("-----END PRIVATE KEY-----")) console.log("   → Vercel copy does NOT end with -----END PRIVATE KEY-----");
    }
  }
} catch {
  console.log("(skipped — no .env.vercel-prod file found; run the 'vercel env pull' step first)");
}
