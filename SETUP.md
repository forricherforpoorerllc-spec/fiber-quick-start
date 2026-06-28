# T-Mobile Fiber Signup — Setup

## 1. Google Apps Script Web App

1. Create a new Google Sheet. Name the first tab `Submissions`.
2. Add this header row (row 1) in this exact order:

```
Timestamp EST | Plan Selected | Full Name | Full Formatted Address | Street Address | Apt / Unit | City | State | ZIP | Phone | Email | DOB | 6 Digit PIN | Preferred Install Date | Preferred Install Time | Consent
```

3. In the sheet, open **Extensions → Apps Script**.
4. Replace `Code.gs` with the contents of [`google-apps-script/Code.gs`](./google-apps-script/Code.gs).
5. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the deployment **Web app URL** (looks like `https://script.google.com/macros/s/AKfy.../exec`).

## 2. Connect the site

Open `src/lib/signup-config.ts` and paste the URL:

```ts
export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfy.../exec";
```

That's it — submissions will now append to your sheet.

## 3. Deploy

Works out of the box on Vercel or Netlify — it's a static TanStack Start app.

```
bun install
bun run build
```

Then push to GitHub and connect to your hosting provider.

## Notes

- Submissions are sent with `mode: "no-cors"` (required for Apps Script Web Apps from the browser). The script still appends the row; the browser just can't read the response. The UI optimistically shows success after the network request resolves.
- Timestamps are normalized to **Eastern Time** in `MM/DD/YYYY HH:MM AM/PM` format before being sent.
- Mapbox token is embedded in `src/lib/signup-config.ts` — replace it with your own token if needed.
