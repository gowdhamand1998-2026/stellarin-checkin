# 🔐 TODO: Rotate Google Service Account Key

**Why:** The current private key in `.env.local` was pasted into a chat during setup. To be safe, replace it with a fresh one. This takes ~30 seconds and makes the old key useless.

---

## Steps

### 1. Open Google Cloud Console
- Go to **https://console.cloud.google.com**
- Make sure you're signed in with the **personal Gmail** used during setup (open an incognito window if you're logged into a work account)
- Make sure the project `stellarin-checkin` is selected in the top bar

### 2. Find the service account
- Sidebar (☰) → **IAM & Admin → Service Accounts**
- Click on `stellarin-sheets@stellarin-checkin.iam.gserviceaccount.com`

### 3. Delete the old key
- Click the **Keys** tab at the top
- You'll see the existing key (the one from initial setup)
- Click the **trash icon** on the right → confirm **Delete**
- ⚠️ From this moment, the old key stops working. Make sure you have time to do step 4 right after.

### 4. Create a new key
- Click **Add Key → Create new key**
- Choose **JSON** format → **Create**
- A new `.json` file downloads to your computer

### 5. Update `.env.local`
- Open the downloaded JSON file in a text editor
- Copy the `client_email` value (should be the same as before)
- Copy the `private_key` value (this will be different — the whole thing including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----\n`)
- Open `/Users/elizabethwindsor/Documents/Claude_CheckIn/stellarin-checkin/.env.local`
- Replace the `GOOGLE_PRIVATE_KEY=` line with the new key value
- Save the file

Example `.env.local` format:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=stellarin-sheets@stellarin-checkin.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nNEW_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=19XMT9REVUOeeeAXB2OYzBMKVHf2q2fRgG9MqjKyEiT4
```

Keep the quotes around the private key. Keep the `\n` as literal characters.

### 6. Restart the dev server
From the project folder, stop the running server (Ctrl+C in its terminal, or `kill $(lsof -ti :3000)`), then:
```bash
cd /Users/elizabethwindsor/Documents/Claude_CheckIn/stellarin-checkin
npm run dev
```

### 7. Test it works
Open `http://localhost:3000`, enter a test phone number, and verify you can register or look up a user. If the Google Sheet still gets updated, the new key works.

### 8. Delete the JSON file from Downloads
Once the app is working with the new key, delete the downloaded `.json` file from your Downloads folder so it's not lying around.

---

## If you get stuck

- **"Sheet not found" error:** Make sure the service account still has Editor access to the Sheet. Open the Sheet → Share → should list `stellarin-sheets@...iam.gserviceaccount.com`.
- **"Invalid credentials" error:** Usually a formatting issue with the private key. Make sure:
  - The key is wrapped in double quotes `"..."`
  - The `\n` characters are literal (not converted to actual line breaks)
  - You copied the full key including both `-----BEGIN` and `-----END` markers
- **Still broken:** Create another new key and try again. You can have multiple keys active — just delete the broken ones.

---

## Current credentials summary (for reference)

- **Project name:** `stellarin-checkin`
- **Service account:** `stellarin-sheets@stellarin-checkin.iam.gserviceaccount.com`
- **Sheet ID:** `19XMT9REVUOeeeAXB2OYzBMKVHf2q2fRgG9MqjKyEiT4`
- **Sheet tabs:** `Database` (user directory) and `CheckInLog` (visit history — auto-created)
