# Mileage Log — Standalone iPhone App

This turns your mileage log into a real installed app icon on your iPhone —
no App Store, no Xcode. It has two pieces:

1. **The app itself** (`index.html` + friends) — hosted for free on GitHub Pages
2. **A tiny proxy** (`worker.js`) — hosted for free on Cloudflare Workers, whose
   only job is to hold your Anthropic API key safely and forward odometer
   photos to Claude for reading. This exists because API keys can never be
   safely placed inside code that runs in a browser — anyone could open it and steal yours.

Total cost: **free hosting**, plus a few cents of Anthropic API usage per
photo you scan (Claude Haiku, roughly $0.001–0.01 per image depending on size).

---

## Step 1 — Get an Anthropic API key

1. Go to https://console.anthropic.com and sign in (or create an account —
   this is separate from your claude.ai login)
2. Go to Settings → API Keys → Create Key
3. Add a small amount of credit under Billing (a few dollars will last a
   long time for this use case)
4. Copy the key somewhere safe — you'll paste it into Cloudflare in Step 2

## Step 2 — Deploy the proxy (Cloudflare Workers)

1. Go to https://dash.cloudflare.com and sign up (free)
2. Workers & Pages → Create → Create Worker → give it any name (e.g. `mileage-ocr`)
3. Click Edit Code, delete the placeholder, paste in the contents of `worker.js`
4. Click Deploy
5. Go to Settings → Variables and Secrets → Add
   - Name: `ANTHROPIC_API_KEY`
   - Value: the key from Step 1
   - Type: **Secret** (not plain text)
6. Save and redeploy if prompted
7. Copy your worker's URL — it looks like
   `https://mileage-ocr.YOUR-SUBDOMAIN.workers.dev`

## Step 3 — Point the app at your proxy

1. Open `index.html` in any text editor
2. Find this line near the top of the `<script>` section:
   ```js
   const OCR_ENDPOINT = "PASTE_YOUR_WORKER_URL_HERE";
   ```
3. Replace the placeholder with your actual worker URL from Step 2, e.g.:
   ```js
   const OCR_ENDPOINT = "https://mileage-ocr.yoursubdomain.workers.dev";
   ```
4. Save the file

## Step 4 — Host the app (GitHub Pages)

1. Go to https://github.com and sign up (free) if you don't have an account
2. Create a new repository — call it whatever you like (e.g. `mileage-log`)
3. Upload all the files in this folder — `index.html`, `manifest.json`,
   `sw.js`, and the `icons` folder — keeping the same folder structure
4. Go to the repo's Settings → Pages
5. Under "Build and deployment," set Source to "Deploy from a branch,"
   branch `main`, folder `/ (root)` — Save
6. Wait a minute, then your app is live at:
   `https://YOUR-USERNAME.github.io/mileage-log/`

## Step 5 — Install it on your iPhone

1. Open that URL in **Safari** on your iPhone (must be Safari, not Chrome)
2. Tap the Share icon (square with an arrow) → **Add to Home Screen**
3. Name it "Mileage" and tap Add

You now have a real app icon. Tapping it opens full-screen, no browser
bar, no Claude branding — just your log.

---

## Notes

- **Data storage**: entries are saved on-device in Safari's local storage.
  They'll survive closing the app, but could be lost if you clear Safari
  data or switch phones. Export to Excel regularly as a backup — the
  export button always works, no internet needed.
- **Offline**: the app shell opens even with no signal. Logging new
  entries and viewing past ones works offline. Photographing and
  auto-reading an odometer needs a connection (it's calling out to Claude).
- **Updating the app later**: if you ever want to change the design or
  add features, edit `index.html` and re-upload it to GitHub — Pages
  updates automatically within a minute or two.
