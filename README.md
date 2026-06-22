# Silvia Talavera Lodos — Portfolio Site

Personal portfolio and policy brief repository. Built as a single-page static site — no frameworks, no build step, ready for GitHub Pages.

---

## Before publishing: three things to update

Open `index.html` in any text editor and search for `TODO` — there are three:

1. **CV PDF** — copy your CV as `assets/CV_Talavera_Lodos.pdf`. The "Download CV" button in the top bar links to this file.
2. **LinkedIn URL** — find the LinkedIn link near the bottom and replace `https://www.linkedin.com/` with your actual profile URL.
3. **Publication links** — once papers are published or posted (SSRN, I·CON, etc.), add `href="..."` to the relevant items in the Publications section.

---

## Deploy to GitHub Pages (step by step)

### 1. Create the repository

Go to [github.com/new](https://github.com/new) and create a new repository. **Name it exactly:**

```
YOUR_USERNAME.github.io
```

For example: `silviatalaveralodos.github.io`

If you use any other name, the free subdomain won't work automatically (though you can configure it manually later).

Make it **Public**. Do not initialise it with a README — you'll push your own files.

---

### 2. Upload the files

You have two options:

**Option A — drag and drop (no terminal needed)**

1. Open your new repository on GitHub.
2. Click **Add file → Upload files**.
3. Drag the entire contents of this folder (all files and the `assets/` folder) into the upload area.
4. Click **Commit changes**.

**Option B — Git (faster for future updates)**

```bash
# Inside this folder:
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_USERNAME.github.io.git
git push -u origin main
```

---

### 3. Enable GitHub Pages

1. Go to your repository → **Settings** → **Pages** (left sidebar).
2. Under **Source**, select **Deploy from a branch**.
3. Branch: `main` / folder: `/ (root)`.
4. Click **Save**.

GitHub will show a green banner with your URL within 1–2 minutes:  
`https://YOUR_USERNAME.github.io`

---

## File structure

```
/
├── index.html              ← the whole site (one page)
├── assets/
│   ├── style.css           ← all styles
│   ├── CV_Talavera_Lodos.pdf   ← ADD YOUR CV HERE
│   └── briefs/
│       ├── Policy_Brief_1_Education.pdf
│       ├── Policy_Brief_2_Health.pdf
│       └── Policy_Brief_3_Housing.pdf
└── README.md
```

---

## Customising content

All content is in `index.html` — no special syntax, just HTML. The sections in order:

| Section | What to edit |
|---|---|
| Hero | Name, role line, the 2–3 sentence statement |
| About | Bio paragraphs, the four fact items (Based / Field / Languages / Currently) |
| Policy Briefs | Title, dek, pull quote for each brief — keep the card structure |
| Publications | Add/remove `<li class="pub-item">` blocks |
| Experience | Add/remove `<div class="exp-item">` blocks |
| Contact | Email address, LinkedIn URL |

---

## Adding a custom domain later

If you buy a domain (e.g. `silviatalavera.eu`):

1. In your domain registrar's DNS settings, add a `CNAME` record pointing to `YOUR_USERNAME.github.io`.
2. In GitHub → Settings → Pages → Custom domain, enter your domain.
3. Enable **Enforce HTTPS**.

---

## Fonts

The site loads three typefaces from Google Fonts (no tracking, just typography):

- **Source Serif 4** — display/headings
- **Inter** — body and UI
- **JetBrains Mono** — metadata, labels, the rotating seal

These load from the web. If you ever need a fully offline version (e.g. for a printed PDF of the site), let me know and I can embed them as base64.
