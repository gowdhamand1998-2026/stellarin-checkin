#!/usr/bin/env node
/**
 * Prune orphaned CheckInLog rows.
 *
 * The app keeps two tabs:
 *   - "Database"   : the live directory of registered users (what the app reads)
 *   - "CheckInLog" : an append-only history of every check-in
 *
 * When you delete someone from Database, their old check-in rows stay in
 * CheckInLog. This script removes any CheckInLog row whose phone number is no
 * longer present in Database, keeping the log in sync with the directory.
 *
 * Run from project root:  node scripts/prune-log.mjs
 * Dry run (preview only):  node scripts/prune-log.mjs --dry
 */

import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

// --- Load .env.local manually ---
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (!match) continue;
    let value = match[2];
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const DB_NAME = "Database";
const LOG_NAME = "CheckInLog";
const DRY_RUN = process.argv.includes("--dry");

if (!SHEET_ID) {
  console.error("Missing GOOGLE_SHEET_ID in .env.local");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Normalize a phone for comparison (digits only).
const normPhone = (v) => String(v ?? "").replace(/\D/g, "");

async function main() {
  // 1. Get the CheckInLog tab's numeric id (gid) for row deletion.
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const logSheet = meta.data.sheets?.find(
    (s) => s.properties?.title === LOG_NAME
  );
  if (!logSheet) {
    console.error(`No "${LOG_NAME}" tab found — nothing to prune.`);
    process.exit(1);
  }
  const logSheetId = logSheet.properties.sheetId;

  // 2. Build the set of phones currently in Database (column A, skip header).
  const dbRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${DB_NAME}!A2:A`,
  });
  const dbPhones = new Set(
    (dbRes.data.values || []).map((r) => normPhone(r[0])).filter(Boolean)
  );
  console.log(`Database has ${dbPhones.size} registered phone number(s).`);

  // 3. Read the CheckInLog rows (column B = Phone, skip header row 1).
  const logRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${LOG_NAME}!A:H`,
  });
  const logRows = logRes.data.values || [];

  // 4. Find 0-based row indexes whose phone is NOT in Database.
  const orphanIndexes = [];
  for (let i = 1; i < logRows.length; i++) {
    const phone = normPhone(logRows[i]?.[1]);
    if (!phone) continue; // skip blank rows
    if (!dbPhones.has(phone)) {
      orphanIndexes.push(i);
      console.log(
        `  orphan row ${i + 1}: ${logRows[i][2] || "(no name)"} — ${phone}`
      );
    }
  }

  if (orphanIndexes.length === 0) {
    console.log("Nothing to prune — CheckInLog is already in sync. ✅");
    return;
  }

  console.log(
    `\nFound ${orphanIndexes.length} orphaned log row(s)${
      DRY_RUN ? " (dry run — not deleting)." : "."
    }`
  );
  if (DRY_RUN) return;

  // 5. Delete from the bottom up so earlier indexes don't shift.
  const requests = orphanIndexes
    .sort((a, b) => b - a)
    .map((i) => ({
      deleteDimension: {
        range: {
          sheetId: logSheetId,
          dimension: "ROWS",
          startIndex: i,
          endIndex: i + 1,
        },
      },
    }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests },
  });

  console.log(`Pruned ${orphanIndexes.length} orphaned log row(s). ✅`);
}

main().catch((err) => {
  console.error("Prune failed:", err.message || err);
  process.exit(1);
});
