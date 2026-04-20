#!/usr/bin/env node
/**
 * Seed script: renames the "CheckIns" tab to "Database" (if needed),
 * clears existing data rows (keeps headers), and inserts 5 sample users
 * plus matching check-in log entries.
 *
 * Run: node scripts/seed.mjs (from project root)
 */

import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (!match) continue;
    let value = match[2];
    // Strip surrounding quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const DB_NAME = "Database";
const LOG_NAME = "CheckInLog";

const DB_HEADERS = [
  "Phone",
  "Full Name",
  "Skill Level",
  "Home Location",
  "Preferred Sport",
  "Instagram",
  "WhatsApp Opt-In",
  "Image Consent",
  "Check-In Count",
  "Last Check-In",
  "First Registered",
  "Unique ID",
  "Preferred Location",
];

const LOG_HEADERS = [
  "Timestamp",
  "Phone",
  "Full Name",
  "Unique ID",
  "Skill Level",
  "Check-In Location",
  "Preferred Sport",
  "Check-In Type",
];

function formatForSheet(date) {
  return date.toLocaleString("sv-SE", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// Helper: make a date N days ago at a specific hour/minute IST
function daysAgo(days, hour = 19, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function renameTabIfNeeded() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const dbTab = meta.data.sheets?.find(
    (s) => s.properties?.title === DB_NAME
  );
  if (dbTab) {
    console.log(`✓ Tab "${DB_NAME}" already exists.`);
    return;
  }
  const oldTab = meta.data.sheets?.find(
    (s) => s.properties?.title === "CheckIns"
  );
  if (oldTab) {
    console.log(`→ Renaming "CheckIns" to "${DB_NAME}"...`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: oldTab.properties.sheetId,
                title: DB_NAME,
              },
              fields: "title",
            },
          },
        ],
      },
    });
    console.log("✓ Rename complete.");
    return;
  }
  // Neither exists — create it
  console.log(`→ Creating new "${DB_NAME}" tab...`);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: DB_NAME } } }],
    },
  });
}

async function ensureLogTab() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const has = meta.data.sheets?.some((s) => s.properties?.title === LOG_NAME);
  if (!has) {
    console.log(`→ Creating "${LOG_NAME}" tab...`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: LOG_NAME } } }],
      },
    });
  }
}

async function clearAndSetHeaders(tabName, headers) {
  console.log(`→ Clearing "${tabName}" and writing headers...`);
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A:Z`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });
}

async function insertRows(tabName, rows) {
  if (rows.length === 0) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A:A`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
  console.log(`✓ Inserted ${rows.length} rows into "${tabName}".`);
}

// Sample users: 5 with varying profiles
const users = [
  {
    phone: "9876543210",
    name: "Rahul Sharma",
    skill: "Intermediate",
    homeLocation: "PickleGarage",
    sport: "Pickleball",
    instagram: "rahul_s",
    whatsapp: "Yes",
    image: "Yes",
    checkinCount: 5,
    firstRegistered: daysAgo(21, 18, 30),
    lastCheckin: daysAgo(1, 19, 15),
    uniqueId: "STL-001",
    preferredLocation: "PickleGarage",
    // Log entries: 1 new + 4 returning
    visits: [
      { date: daysAgo(21, 18, 30), type: "new", location: "PickleGarage" },
      { date: daysAgo(14, 19, 0), type: "returning", location: "PickleGarage" },
      { date: daysAgo(9, 18, 45), type: "returning", location: "Deep VK" },
      { date: daysAgo(4, 17, 30), type: "returning", location: "PickleGarage" },
      { date: daysAgo(1, 19, 15), type: "returning", location: "PickleGarage" },
    ],
  },
  {
    phone: "9123456789",
    name: "Priya Patel",
    skill: "Beginner",
    homeLocation: "Deep VK",
    sport: "Pickleball",
    instagram: "priya.p",
    whatsapp: "Yes",
    image: "No",
    checkinCount: 2,
    firstRegistered: daysAgo(10, 10, 15),
    lastCheckin: daysAgo(2, 11, 30),
    uniqueId: "STL-002",
    preferredLocation: "Deep VK",
    visits: [
      { date: daysAgo(10, 10, 15), type: "new", location: "Deep VK" },
      { date: daysAgo(2, 11, 30), type: "returning", location: "Deep VK" },
    ],
  },
  {
    phone: "9988776655",
    name: "Arjun Mehta",
    skill: "Advanced",
    homeLocation: "PickleGarage",
    sport: "Pickleball",
    instagram: "arjun_mehta",
    whatsapp: "Yes",
    image: "Yes",
    checkinCount: 8,
    firstRegistered: daysAgo(28, 17, 0),
    lastCheckin: daysAgo(0, 7, 0),
    uniqueId: "STL-003",
    preferredLocation: "Deep VK",
    visits: [
      { date: daysAgo(28, 17, 0), type: "new", location: "PickleGarage" },
      { date: daysAgo(24, 18, 30), type: "returning", location: "PickleGarage" },
      { date: daysAgo(20, 19, 0), type: "returning", location: "Deep VK" },
      { date: daysAgo(16, 17, 45), type: "returning", location: "Deep VK" },
      { date: daysAgo(12, 18, 0), type: "returning", location: "PickleGarage" },
      { date: daysAgo(8, 19, 30), type: "returning", location: "Deep VK" },
      { date: daysAgo(3, 18, 15), type: "returning", location: "Deep VK" },
      { date: daysAgo(0, 7, 0), type: "returning", location: "PickleGarage" },
    ],
  },
  {
    phone: "9876500001",
    name: "Kavya Iyer",
    skill: "Pro",
    homeLocation: "Deep VK",
    sport: "Pickleball",
    instagram: "kavya.iyer",
    whatsapp: "Yes",
    image: "Yes",
    checkinCount: 3,
    firstRegistered: daysAgo(15, 20, 0),
    lastCheckin: daysAgo(3, 20, 15),
    uniqueId: "STL-004",
    preferredLocation: "Deep VK",
    visits: [
      { date: daysAgo(15, 20, 0), type: "new", location: "Deep VK" },
      { date: daysAgo(8, 19, 30), type: "returning", location: "Deep VK" },
      { date: daysAgo(3, 20, 15), type: "returning", location: "Deep VK" },
    ],
  },
  {
    phone: "9090909090",
    name: "Sameer Khan",
    skill: "Intermediate",
    homeLocation: "PickleGarage",
    sport: "Tennis",
    instagram: "sameer.k",
    whatsapp: "No",
    image: "Yes",
    checkinCount: 1,
    firstRegistered: daysAgo(0, 8, 30),
    lastCheckin: daysAgo(0, 8, 30),
    uniqueId: "STL-005",
    preferredLocation: "",
    visits: [
      { date: daysAgo(0, 8, 30), type: "new", location: "PickleGarage" },
    ],
  },
];

async function main() {
  if (!SHEET_ID) {
    console.error("✗ GOOGLE_SHEET_ID is not set in .env.local");
    process.exit(1);
  }

  console.log(`→ Working with Sheet ID: ${SHEET_ID}\n`);

  await renameTabIfNeeded();
  await ensureLogTab();

  await clearAndSetHeaders(DB_NAME, DB_HEADERS);
  await clearAndSetHeaders(LOG_NAME, LOG_HEADERS);

  // Build Database rows
  const dbRows = users.map((u) => [
    u.phone,
    u.name,
    u.skill,
    u.homeLocation,
    u.sport,
    u.instagram,
    u.whatsapp,
    u.image,
    u.checkinCount,
    formatForSheet(u.lastCheckin),
    formatForSheet(u.firstRegistered),
    u.uniqueId,
    u.preferredLocation,
  ]);

  // Build CheckInLog rows (sorted chronologically across all users)
  const logEntries = [];
  for (const u of users) {
    for (const v of u.visits) {
      logEntries.push({
        timestamp: v.date,
        phone: u.phone,
        name: u.name,
        uniqueId: u.uniqueId,
        skill: u.skill,
        location: v.location,
        sport: u.sport,
        type: v.type,
      });
    }
  }
  logEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const logRows = logEntries.map((e) => [
    formatForSheet(e.timestamp),
    e.phone,
    e.name,
    e.uniqueId,
    e.skill,
    e.location,
    e.sport,
    e.type,
  ]);

  await insertRows(DB_NAME, dbRows);
  await insertRows(LOG_NAME, logRows);

  console.log("\n🎉 Seed complete!");
  console.log(`   - ${dbRows.length} users in Database`);
  console.log(`   - ${logRows.length} entries in CheckInLog`);
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
