import { google } from "googleapis";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_NAME = "Database";
const LOG_SHEET_NAME = "CheckInLog";

// Columns (A-M, 13 total). New "Preferred Location" appended at M to avoid
// disturbing existing data in the sheet.
// A Phone, B Full Name, C Skill Level, D Home Location, E Preferred Sport,
// F Instagram, G WhatsApp, H Image Consent, I Check-In Count,
// J Last Check-In, K First Registered, L Unique ID, M Preferred Location
const COLUMNS = {
  PHONE: 0,
  NAME: 1,
  SKILL: 2,
  HOME_LOCATION: 3,
  SPORT: 4,
  INSTAGRAM: 5,
  WHATSAPP: 6,
  IMAGE_CONSENT: 7,
  CHECKIN_COUNT: 8,
  LAST_CHECKIN: 9,
  FIRST_REGISTERED: 10,
  UNIQUE_ID: 11,
  PREFERRED_LOCATION: 12,
};

const SHEET_RANGE = `${SHEET_NAME}!A:M`;
const SHEET_HEADER_RANGE = `${SHEET_NAME}!A1:M1`;

const EXPECTED_HEADERS = [
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

/**
 * Format a Date (or ISO string) as a sheet-friendly IST string:
 * "YYYY-MM-DD HH:mm:ss" (sortable and readable in Sheets).
 */
function formatForSheet(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  // sv-SE locale gives ISO-like output "2026-04-19 12:34:56"
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

async function generateUniqueId(): Promise<string> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!L:L`,
  });

  const rows = res.data.values || [];
  let maxNum = 0;

  for (let i = 1; i < rows.length; i++) {
    const val = rows[i]?.[0];
    if (typeof val === "string") {
      const match = val.match(/^STL-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  const next = maxNum + 1;
  return `STL-${String(next).padStart(3, "0")}`;
}

/**
 * Ensure the CheckInLog tab exists and has headers.
 */
async function ensureLogSheet(): Promise<void> {
  const sheets = getSheets();

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const hasLogTab = meta.data.sheets?.some(
    (s) => s.properties?.title === LOG_SHEET_NAME
  );

  if (!hasLogTab) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: LOG_SHEET_NAME },
            },
          },
        ],
      },
    });
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${LOG_SHEET_NAME}!A1:H1`,
  });

  const existing = res.data.values?.[0];
  const needsUpdate =
    !existing ||
    existing.length < LOG_HEADERS.length ||
    LOG_HEADERS.some((h, i) => existing[i] !== h);

  if (needsUpdate) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${LOG_SHEET_NAME}!A1:H1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [LOG_HEADERS],
      },
    });
  }
}

/**
 * Append a single check-in event to the log sheet.
 */
async function appendCheckinLog(entry: {
  timestamp: string; // formatted IST string
  phone: string;
  name: string;
  uniqueId: string;
  skillLevel: string;
  location?: string;
  preferredSport?: string;
  type: "new" | "returning";
}): Promise<void> {
  try {
    await ensureLogSheet();
    const sheets = getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${LOG_SHEET_NAME}!A:H`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            entry.timestamp,
            entry.phone,
            entry.name,
            entry.uniqueId,
            entry.skillLevel,
            entry.location || "",
            entry.preferredSport || "",
            entry.type,
          ],
        ],
      },
    });
  } catch (err) {
    console.error("Failed to append check-in log:", err);
  }
}

/**
 * Read-only lookup. Does NOT increment counts or log.
 */
export async function lookupByPhone(phone: string) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });

  const rows = (res.data.values || []) as string[][];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][COLUMNS.PHONE] === phone) {
      return {
        name: rows[i][COLUMNS.NAME],
        skillLevel: rows[i][COLUMNS.SKILL],
        checkinCount: parseInt(rows[i][COLUMNS.CHECKIN_COUNT] || "0", 10),
        uniqueId: rows[i][COLUMNS.UNIQUE_ID] || "",
        phone: rows[i][COLUMNS.PHONE],
        homeLocation: rows[i][COLUMNS.HOME_LOCATION] || "",
        preferredLocation: rows[i][COLUMNS.PREFERRED_LOCATION] || "",
        preferredSport: rows[i][COLUMNS.SPORT] || "",
      };
    }
  }

  return null;
}

/**
 * Check-in action for an existing user: increments count, updates last check-in,
 * appends to log. `checkinLocation` is today's location from landing page.
 */
export async function checkInExistingUser(
  phone: string,
  checkinLocation: string = ""
): Promise<{
  name: string;
  skillLevel: string;
  uniqueId: string;
  checkinCount: number;
  checkinTime: string; // ISO for client-side formatting
  location: string;
} | null> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });

  const rows = (res.data.values || []) as string[][];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][COLUMNS.PHONE] === phone) {
      const currentCount = parseInt(rows[i][COLUMNS.CHECKIN_COUNT] || "0", 10);
      const rowIndex = i + 1;
      const now = new Date();
      const formattedTime = formatForSheet(now);

      // Columns I (Check-In Count) and J (Last Check-In)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!I${rowIndex}:J${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[currentCount + 1, formattedTime]],
        },
      });

      const name = rows[i][COLUMNS.NAME];
      const skillLevel = rows[i][COLUMNS.SKILL];
      const uniqueId = rows[i][COLUMNS.UNIQUE_ID] || "";
      const homeLocation = rows[i][COLUMNS.HOME_LOCATION] || "";
      const loggedLocation = checkinLocation || homeLocation;

      await appendCheckinLog({
        timestamp: formattedTime,
        phone,
        name,
        uniqueId,
        skillLevel,
        location: loggedLocation,
        preferredSport: rows[i][COLUMNS.SPORT],
        type: "returning",
      });

      return {
        name,
        skillLevel,
        uniqueId,
        checkinCount: currentCount + 1,
        checkinTime: now.toISOString(),
        location: loggedLocation,
      };
    }
  }

  return null;
}

export async function registerUser(data: {
  phone: string;
  fullName: string;
  skillLevel: string;
  homeLocation: string; // from landing page — permanent
  checkinLocation: string; // today's visit location for log
  preferredLocation: string; // user's chosen preferred Stellarin location
  preferredSport: string;
  instagram: string;
  whatsappOptIn: boolean;
  imageConsent: boolean;
}): Promise<{ uniqueId: string; checkinTime: string }> {
  const sheets = getSheets();
  const now = new Date();
  const formattedTime = formatForSheet(now);
  const uniqueId = await generateUniqueId();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          data.phone,
          data.fullName,
          data.skillLevel,
          data.homeLocation || "",
          data.preferredSport || "",
          data.instagram || "",
          data.whatsappOptIn ? "Yes" : "No",
          data.imageConsent ? "Yes" : "No",
          1,
          formattedTime,
          formattedTime,
          uniqueId,
          data.preferredLocation || "",
        ],
      ],
    },
  });

  await appendCheckinLog({
    timestamp: formattedTime,
    phone: data.phone,
    name: data.fullName,
    uniqueId,
    skillLevel: data.skillLevel,
    location: data.checkinLocation || data.homeLocation,
    preferredSport: data.preferredSport,
    type: "new",
  });

  return { uniqueId, checkinTime: now.toISOString() };
}

export async function ensureHeaders() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_HEADER_RANGE,
  });

  const headers = res.data.values?.[0];
  const needsUpdate =
    !headers ||
    headers.length < EXPECTED_HEADERS.length ||
    EXPECTED_HEADERS.some((h, i) => headers[i] !== h);

  if (needsUpdate) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: SHEET_HEADER_RANGE,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [EXPECTED_HEADERS],
      },
    });
  }
}
