# SaderOT Landing Page — Deployment Guide

End-to-end guide to get your landing page (with logo) live on Vercel under your custom domain.

---

## 1. Files you need

The landing page is a static site — three small files plus the HTML:

| File | Purpose | Must be in project root? |
|---|---|---|
| `index.html` | The page itself | ✅ Yes |
| `logo.png` | Brand logo (used in nav) | ✅ Yes — referenced as `/logo.png` |
| `favicon.png` | Browser tab icon | ✅ Yes — referenced as `/favicon.png` |
| `logo.svg` | Vector backup | Optional — keep for future use |

> **Important**: the HTML references logos with absolute paths (`/logo.png`). They MUST sit next to `index.html` at the root of your deployment, not in a subfolder. If you put them in `/images/logo.png`, the page will show a broken image.

### Final folder structure

```
saderot-landing/
├── index.html
├── logo.png
├── favicon.png
└── logo.svg          ← optional, for future use
```

That's it. Four files.

---

## 2. Test locally first (5 minutes)

Before deploying, make sure the page renders correctly with the logo.

### Option A — open the file directly
Double-click `index.html`. Browser opens. Logo should appear in nav.

> **Caveat**: opening as `file://` works for HTML/CSS but breaks Google Tag Manager and the form fetch. Good enough for a visual check, not for testing tracking.

### Option B — run a tiny local server (recommended)

If you have Python:
```bash
cd saderot-landing
python3 -m http.server 8000
```
Visit http://localhost:8000

If you have Node.js:
```bash
cd saderot-landing
npx serve
```
Visit http://localhost:3000

This serves your files just like Vercel will. The logo at `/logo.png` resolves correctly. Tracking and forms behave realistically.

### What to verify
- ✅ Logo appears in the nav (top-right in RTL)
- ✅ Favicon appears in the browser tab
- ✅ Page is in Hebrew, right-to-left
- ✅ Email form submits and shows the success message
- ✅ Hero, features, pricing, FAQ all render

---

## 3. Deploy to Vercel — three options

| Option | Speed | Best for | Updates |
|---|---|---|---|
| **A. Drag & drop** | ⚡⚡⚡ ~2 min | One-shot, get something up now | Re-drag every time |
| **B. Vercel CLI** | ⚡⚡ ~5 min | Solo dev, no Git ceremony | `vercel --prod` from terminal |
| **C. Git + GitHub** | ⚡ ~10 min | Ongoing work, want history | Auto-deploy on every commit |

I'll cover all three. Start with whichever fits your style.

### Option A — Drag & drop

1. Go to https://vercel.com/new
2. Click the **"Deploy"** button on the import page (or look for the upload area)
3. Drag your `saderot-landing` folder onto the page
4. Vercel asks for a project name — pick `saderot-landing` or whatever you like
5. Click **Deploy**
6. ~30 seconds later you get a URL like `saderot-landing-abc123.vercel.app`

**To update later**: drag the folder again, Vercel detects the existing project, redeploys.

### Option B — Vercel CLI (recommended for solo dev)

One-time setup:
```bash
npm install -g vercel
vercel login    # opens browser to authenticate
```

Deploy:
```bash
cd saderot-landing
vercel          # first run sets up the project (answer the prompts)
```

For each follow-up deploy:
```bash
vercel --prod   # promotes to production URL
```

**Why I prefer this**: faster than drag-and-drop after the first time. Works from your terminal where you already are.

### Option C — Git + GitHub (recommended once it's a real product)

1. Create a new repo on GitHub (private if you prefer): https://github.com/new
2. In your `saderot-landing` folder:
   ```bash
   git init
   git add .
   git commit -m "Initial landing page"
   git branch -M main
   git remote add origin git@github.com:YOUR_USERNAME/saderot-landing.git
   git push -u origin main
   ```
3. In Vercel: **New Project → Import Git Repository** → pick your repo → **Deploy**
4. Done. Now every `git push` to `main` auto-deploys.

**Why this matters**: you get version history, can roll back if something breaks, and can collaborate later. For a marketing site about to start collecting signups, this is the safest path.

---

## 4. Custom domain (saderot.com)

By default Vercel gives you a `.vercel.app` URL. To use your real domain:

1. In Vercel, go to your project → **Settings → Domains**
2. Add your domain (e.g., `saderot.com` and `www.saderot.com`)
3. Vercel shows DNS records to configure. Two cases:

### If your domain is registered with Vercel
Nothing to do. DNS is automatic.

### If your domain is registered elsewhere (Namecheap, GoDaddy, etc.)
Log in to your registrar and add these DNS records:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Wait 5–60 minutes for DNS to propagate. Vercel will show ✅ Active when ready.

### HTTPS
Vercel auto-provisions a free SSL certificate from Let's Encrypt. Nothing to do — it just works.

---

## 5. Pre-launch checklist (do these before sharing the URL)

Open `index.html` and search for these placeholders, replace before going live:

| Placeholder | Where | Replace with |
|---|---|---|
| `GTM-XXXXXXX` | Lines ~30 and ~263 | Your real GTM container ID |
| `/api/signup` | Line ~1000 (form fetch) | Your real form handler URL (Formspree, MailerLite, or Vercel API route) |
| `972500000000` | WhatsApp link | Your real WhatsApp number |
| `https://saderot.com/og-image.png` | Line 15 | Your real OG image URL (or remove if not made yet) |
| `support@saderot.com` / `hello@saderot.com` | Footer + app store copy | Your real email |

After deploying, also:
- ☐ Add your privacy policy at `/privacy.html` (or update the link)
- ☐ Add your terms at `/terms.html`
- ☐ Add your refund policy at `/refund.html`
- ☐ Verify GTM is firing (use Tag Assistant Chrome extension)
- ☐ Submit a test email signup — confirm it lands wherever it's supposed to

---

## 6. How to update the site later

### Drag & drop method
Drag the folder to Vercel again. Done.

### Vercel CLI method
```bash
cd saderot-landing
vercel --prod
```

### Git method
```bash
cd saderot-landing
# make your edits
git add .
git commit -m "Update hero copy"
git push
```
Vercel auto-deploys within 30 seconds.

### Common updates and where to make them

| What you want to change | File | Approximate line |
|---|---|---|
| Hero headline | `index.html` | ~853 |
| Pricing | `index.html` | ~1030 |
| FAQ questions | `index.html` | ~1075 |
| Logo image | Replace `/logo.png` (same filename) | — |
| Color palette | `index.html` `:root` block | ~42 |
| Add a new tracking event | `index.html` `<script>` block | bottom |

---

## 7. Troubleshooting

### Logo doesn't show / broken image icon
- ✅ Confirm `logo.png` is at the project root, not in a subfolder
- ✅ Check capitalization: `logo.png` (lowercase) matches the HTML reference
- ✅ Hard-refresh (Cmd/Ctrl + Shift + R) — old cached 404 may persist
- ✅ In browser DevTools → Network tab, filter by "img" and look for the failing request — the path it's trying tells you exactly what's wrong

### Hebrew text shows as gibberish
- ✅ Confirm the file is saved as UTF-8
- ✅ Confirm `<meta charset="UTF-8">` is at the top of `<head>` (it should be, in our file)

### Page is left-to-right instead of right-to-left
- ✅ Confirm `<html lang="he" dir="rtl">` is on line 2 (it should be)

### Form submits but you don't get the email
- This is the most common issue. The form points to `/api/signup` which doesn't exist by default. Either:
  - Sign up for Formspree → replace `/api/signup` with `https://formspree.io/f/YOUR_ID`
  - Or build a Vercel API route at `/api/signup.js` (see README.md for example)

### GTM events don't fire
- ✅ Replace `GTM-XXXXXXX` with your real ID (both occurrences)
- ✅ Use the Tag Assistant Chrome extension to verify
- ✅ Check the browser console — if you see "[track] page_view" logs, the JavaScript is firing; the issue is just GTM

### Site is slow to load
- The single biggest perf win: convert `logo.png` to `logo.webp` — usually 50–70% smaller
- Use `<img loading="lazy">` for below-the-fold images
- Vercel's free CDN serves everything from edge locations near Israel automatically

---

## 8. After-deploy growth tasks

Once the page is live, the work continues:

1. **Add Vercel Analytics** (free, one-line install) — gets you real visitor data without GTM
   ```html
   <script defer src="/_vercel/insights/script.js"></script>
   ```

2. **Set up Vercel Web Vitals** — track Largest Contentful Paint, Cumulative Layout Shift. Critical for SEO and user perception.

3. **Connect Google Search Console** — verify ownership using the meta tag method. Submit your sitemap (or just the URL) to start indexing.

4. **Add a sitemap.xml and robots.txt** — both can be tiny static files in the project root.

5. **Add OG image** — make a 1200×630 PNG with your logo + Hebrew tagline. Save it as `og-image.png` in the project root.

6. **Build the legal pages** (`/privacy`, `/terms`, `/refund`) — convert your existing markdown templates to HTML using the same fonts and colors as the main page.

---

## 9. Quick reference — minimum viable launch

If you want the absolute fastest path from here to a live URL:

```bash
# 1. Make a folder
mkdir saderot-landing && cd saderot-landing

# 2. Copy these files into it:
#    - index.html
#    - logo.png
#    - favicon.png

# 3. Replace GTM-XXXXXXX in index.html with your real ID (or skip for now)

# 4. Deploy
npx vercel
```

You'll have a live `.vercel.app` URL in under 2 minutes. Custom domain takes another 15. Total: under 30 minutes from now to live, with the logo working.
