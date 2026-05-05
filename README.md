# Soleymani Lab Website — Maintainer's Guide

This guide walks you through everything you need to update the lab website,
from scratch — even if you've never used a command line, GitHub, or Node.js
before.

- **Live site:** <https://soleymani-lab-website.vercel.app/>
- **Code on GitHub:** <https://github.com/FanxiaoLiu/soleymani-lab-website>

The site auto-rebuilds and redeploys whenever new code is pushed to GitHub.
Most updates (new team members, publications, etc.) are made by editing JSON
data files. This repository ships with helper scripts that walk you through
those edits interactively, so you don't have to touch JSON by hand.

---

## How long will this take?

- **First-time setup:** ~30 minutes (you only do this once, on your computer).
- **Each update afterwards:** 1–5 minutes.

---

## Table of contents

- [Part 1 — One-time setup](#part-1--one-time-setup)
- [Part 2 — The standard update workflow](#part-2--the-standard-update-workflow)
- [Part 3 — Script reference](#part-3--script-reference)
  - [Add a new team member](#add-a-new-team-member)
  - [Graduate a team member to alumni](#graduate-a-team-member-to-alumni)
  - [Add an alumni entry directly](#add-an-alumni-entry-directly)
  - [Update LinkedIn / email for a member](#update-linkedin--email-for-a-member)
  - [Refresh the publications list](#refresh-the-publications-list)
  - [Add a publication manually](#add-a-publication-manually)
  - [Set a graphical-abstract image for a paper](#set-a-graphical-abstract-image-for-a-paper)
  - [Map publications to research areas](#map-publications-to-research-areas)
  - [Pick featured publications for the home page](#pick-featured-publications-for-the-home-page)
- [Part 4 — Editing things by hand](#part-4--editing-things-by-hand)
- [Part 5 — Troubleshooting](#part-5--troubleshooting)

---

## Part 1 — One-time setup

You only need to do this **once per computer**.

### 1.1  Install Node.js

Node.js is the program that runs the helper scripts. Installing it also
installs `npm`, which is what you'll type to run them.

**On macOS:**

1. Go to <https://nodejs.org/>.
2. Click the big green **LTS** download button.
3. Open the downloaded `.pkg` file and click through the installer (default
   options are fine).
4. To verify it worked: open the **Terminal** app (press `⌘ + Space`, type
   "Terminal", press Enter) and type:
   ```
   node --version
   ```
   You should see something like `v20.10.0`. If you do, you're good.

**On Windows:**

1. Go to <https://nodejs.org/>.
2. Click the **LTS** download button.
3. Run the `.msi` installer; click through with default options.
4. To verify: press `⊞ Win + R`, type `cmd`, press Enter. In the black
   window, type:
   ```
   node --version
   ```

### 1.2  Install GitHub Desktop

GitHub Desktop is the easiest way to download the code and push your changes
back. It handles all the GitHub login complexity for you.

1. Go to <https://desktop.github.com/> and download/install it.
2. Open the app and sign in with the GitHub account that has access to the
   `soleymani-lab-website` repo.
3. From the start screen, click **Clone a repository from the Internet…**
4. Pick **FanxiaoLiu/soleymani-lab-website** from the list (or paste
   `https://github.com/FanxiaoLiu/soleymani-lab-website` into the URL field).
5. Choose where on your computer to put the folder — `Documents` is a good
   default. Note this path.
6. Click **Clone**.

You now have a local copy of the website code, and GitHub Desktop knows how
to push your future changes back.

### 1.3  Install the project's dependencies

The scripts rely on a few small JavaScript packages. Install them once.

1. Open **Terminal** (Mac) or **Command Prompt** (Windows).
2. Move into the project folder. If you cloned it to `Documents`, type:
   ```
   cd Documents/soleymani-lab-website
   ```
   *(`cd` means "change directory". Use the actual path you cloned to.)*
3. Type:
   ```
   npm install
   ```
4. Wait. It'll print a lot of stuff and take 30–60 seconds. When you get
   your prompt back, you're done.

**You're set up. Skip to Part 2.**

---

## Part 2 — The standard update workflow

Every time you want to make a change, follow these steps in order:

1. **Pull the latest code.** Open GitHub Desktop, click **Fetch origin** at
   the top, and if it says "Pull origin" click that too. This makes sure
   you're starting from the most recent version.

2. **Open Terminal/Command Prompt and `cd` into the project folder:**
   ```
   cd Documents/soleymani-lab-website
   ```

3. **Run the right script** for what you want to change (see [Part 3](#part-3--script-reference)).
   The script will ask you questions and save the result.

4. **Commit and push the change.** Switch back to GitHub Desktop:
   - You'll see the changed files highlighted in the left panel.
   - At the bottom-left, type a short summary (e.g., *"Added new student
     John Smith"*) and click **Commit to main**.
   - At the top, click **Push origin**.

5. **Wait ~1 minute**, then visit <https://soleymani-lab-website.vercel.app/>
   to see the change live. (Hard-refresh with `⌘ + Shift + R` on Mac or
   `Ctrl + Shift + R` on Windows if it looks stale.)

That's the entire flow. The rest of this document is a reference for the
scripts.

> **💡 Safety tip:** Every interactive script accepts `--dry-run` as a
> "preview" flag. Add `-- --dry-run` to the end of any `npm run` command and
> the script will show you exactly what it *would* do without writing any
> files. Useful when you're trying something for the first time. Example:
> ```
> npm run team:add -- --dry-run
> ```

---

## Part 3 — Script reference

All scripts are run from the project folder (the one you `cd`'d into). They
ask you questions and walk you through the change. To cancel at any time,
press `Ctrl + C`.

### Add a new team member

```
npm run team:add
```

Fields it asks for:

| Field | Required | Notes |
|---|---|---|
| Name | yes | e.g., "Jane Doe" |
| Role | yes | e.g., "PhD Candidate", "Master's Student" |
| Joined | no | e.g., "Fall 2025" |
| Research focus | no | One short phrase, e.g., "Wearable sensors" |
| Research link | no | Path on the site, e.g., `/research/diagnostics` |
| Image | no | See "Photo tip" below |
| Group | yes | Pick from the menu (or add a new one) |
| LinkedIn URL | no | Validated; type "-" to skip |
| Email | no | Validated; type "-" to skip |

**Photo tip:** Before running the script, drop the photo file into
`client/public/people/` (e.g., `jane-doe.jpg`). When the script asks for
"Image", just type the filename: `jane-doe.jpg`. The script automatically
prefixes the right path. To use the placeholder image, leave it blank.

After you finish all fields, you'll see a preview. Type `y` to save, or `n`
to fix any field — it'll ask which one to redo, and the rest of your answers
are kept.

### Graduate a team member to alumni

```
npm run team:graduate
```

Use this when a student or postdoc finishes and moves on. It does both
sides of the move in one step:

1. Lists everyone currently on the team, numbered.
2. You pick the person who's graduating.
3. Confirms or lets you edit their former role title (pre-filled from team data).
4. Asks for graduation year.
5. Asks for their next position and organization (optional).
6. Asks which alumni group they belong to (PhD Graduates, Post-Doctoral
   Fellows, etc.) — picked from existing groups or add a new one.
7. Shows a preview, asks for confirmation.

When you confirm, the script removes them from `team.json` AND adds them to
`alumni.json` together.

### Add an alumni entry directly

```
npm run alumni:add
```

For someone who was never in the current `team.json` but should appear in
alumni (e.g., very old alumni from before the website existed). Walks
through name, former role, year, current position, organization, and group.

### Update LinkedIn / email for a member

```
npm run contacts:update
```

Shows a list of all current team members with checkmarks for who has
LinkedIn / email already filled in. Pick someone, and you can edit either
field.

- **Press Enter** to keep the current value.
- **Type a new URL or email** to replace it.
- **Type `-` or `clear`** to wipe the field.
- After saving one person, you're returned to the list to pick another.
  Choose **Done** when finished.

You can also jump straight to one person if you remember a unique part of
their name:

```
npm run contacts:update -- "Jane"
```

### Refresh the publications list

```
npm run pubs:sync
```

Pulls every paper from the Semantic Scholar profiles of the lab members
listed in `pubs.config.json`, dedupes them, sorts by date, and saves to
`client/src/data/publications.json`.

**Custom paper images you've previously set are preserved across syncs**
(only papers still on the gray placeholder get refreshed).

To configure what gets pulled, open `pubs.config.json` (in a plain-text
editor like VS Code or Notepad). It looks like:

```json
{
  "authorIds": [
    "2262212",
    "2283336511",
    ...
  ],
  "denyTitles": [],
  "minYear": 2016
}
```

- **Add a new lab member's papers:** put their Semantic Scholar author ID
  in `authorIds`. To find it, search for the author at
  <https://www.semanticscholar.org/>; the ID is the number at the end of
  their profile URL.
- **Hide a specific paper from the website:** copy its title (lowercased)
  into `denyTitles`.
- **Change the year cutoff:** edit `minYear`. Currently `2016` — papers
  before that are filtered out.

After editing the config, save it and run `npm run pubs:sync` again.

> **Note on stability:** as of this version, paper IDs are **preserved
> across syncs** (matched by DOI first, then title). This means
> `featured_publications.json` and the publication-id mappings in
> `research_areas.json` keep pointing at the right papers even after a
> sync. Custom paper images are also preserved (already true before).

### Add a publication manually

```
npm run pubs:add
```

For papers that aren't on Semantic Scholar yet (e.g., very fresh
preprints), papers in venues S2 doesn't index, or whenever you want to
override what S2 has wrong about a paper.

The script walks you through:

| Field | Required | Notes |
|---|---|---|
| Title | yes | |
| Authors | yes | Free-text, comma-separated |
| Journal / venue | yes | e.g., "Nature Reviews Bioengineering" |
| Year | yes | 4 digits |
| Date | no | `YYYY-MM-DD`; blank → Jan 1 of the year |
| DOI URL or article link | yes | Validated as a URL |
| Image | no | URL or `/pub-images/...` path; blank → placeholder |
| Citation count | no | Defaults to 0 |

You'll see a preview before saving. Type `n` to fix any field.

The new entry is written with `"manual": true`. **`pubs:sync` preserves
any paper marked `manual: true`** — your manual entries are sticky and
won't be wiped on the next sync.

If a manual paper later shows up on Semantic Scholar (same DOI or title),
the manual entry takes precedence — the S2 version is skipped. To switch
to the S2 version instead, delete the manual entry from
`publications.json` and re-run `npm run pubs:sync`.

### Set a graphical-abstract image for a paper

```
npm run pubs:image
```

Run this *after* `pubs:sync` to give papers their figures.

Why a separate script? Because most academic publishers (Wiley, Elsevier,
Nature, etc.) actively block automatic scraping. So this script asks you to
provide the image yourself — which only takes a few seconds per paper.

**How to use it:**

1. Run `npm run pubs:image`.
2. You'll see a list of papers still using the gray placeholder image.
3. Pick a paper from the list.
4. Open the paper's page on the publisher's website.
5. Right-click the graphical abstract / TOC graphic → **Copy Image
   Address**.
6. Paste that URL into the script. It downloads the image into
   `client/public/pub-images/` and updates the JSON.
7. Pick the next paper, or type the **Done** option to save and exit.

You can also drop in a local file instead of a URL — type a path like
`~/Downloads/abstract.jpg`.

**Other modes:**

- `npm run pubs:image -- 17` — jump straight to paper #17 (the id shown in
  the list).
- `npm run pubs:image -- --all` — show *every* paper, not just placeholder
  ones. If you pick one that already has an image, the script will ask
  *"Replace it?"* with the default answer being **No**, so you can't
  accidentally wipe out a custom image.

### Map publications to research areas

```
npm run research:map
```

Each research area on the **Research** page has a "Key Publications"
dropdown. This script lets you curate which papers appear there, per area.

**How it works:**

1. Pick a research area from the list (paper count shown beside each).
2. See the papers currently mapped to that area.
3. Choose an action:
   - **Add a paper** — search by title keyword or paper id, pick from the
     match list.
   - **Remove a paper** — pick from the currently-mapped list.
   - **Reorder** — type the new order as comma-separated positions
     (e.g., `3,1,2` to move paper #3 to the top).
4. Repeat for other areas, or pick **Done** to save.

The script automatically cleans up any mappings that point to papers no
longer in the publications list (e.g., if a paper was removed during a
`pubs:sync`).

### Pick featured publications for the home page

```
npm run featured:pick
```

The home page's "Featured Publications" section is driven by
`client/src/data/featured_publications.json`. This script picks them
automatically based on impact, ranks the candidates, shows the top 10, and
(after you confirm) writes the chosen ids.

**Default ranking:** weighted score = `citations × 1 + impactFactor × 5`,
restricted to papers from the last 2 years.

**Configuration** lives in `featured.config.json` at the repo root:

```jsonc
{
  "count": 3,             // how many to feature
  "yearsBack": 2,         // only papers from the last N years
  "metric": "score",      // "score" | "citations" | "impact_factor"
  "weights": { "citations": 1, "impactFactor": 5 },
  "denyIds": [],          // paper ids to never feature
  "journalImpactFactors": {
    "Nature": 64.8,
    "Angewandte Chemie": 16.6,
    /* …extend as the lab publishes in new venues */
  }
}
```

If a paper's journal isn't in `journalImpactFactors` (e.g., a brand-new
venue), its IF is treated as 0 and the script will warn you so you can add
it.

**Useful flags:**

- `npm run featured:pick -- --list` — print the ranking and exit; don't
  write anything. Good for previewing what *would* be picked.
- `npm run featured:pick -- --metric citations` — rank by raw citation
  count for this run (overrides the config).
- `npm run featured:pick -- --metric impact_factor` — rank by journal IF
  alone.
- `npm run featured:pick -- --count 5` — pick 5 papers instead of the
  configured count.
- `npm run featured:pick -- --years 3` — widen the window to 3 years.

**Manual override:** if you want to force-feature a specific paper that
the algorithm wouldn't pick, you can edit
`client/src/data/featured_publications.json` directly and replace the `ids`
array. (Just remember it'll be overwritten the next time you run the
script.)

To exclude a specific paper *permanently* — e.g., a retraction notice —
add its id to `denyIds` in `featured.config.json`.

**Refresh cadence:** re-run after `npm run pubs:sync` to pick up new
papers and updated citation counts. Once a quarter is reasonable.

---

## Part 4 — Editing things by hand

A few parts of the site don't have a script and you'll edit the file
directly. Use a plain-text editor (VS Code is free and great:
<https://code.visualstudio.com/>).

| What | File | How |
|---|---|---|
| Lab news | `client/src/data/news.json` | Add a new entry to the array — copy an existing one and edit the fields. |
| Research areas | `client/src/data/research_areas.json` | Same idea. |
| Home page text | `client/src/pages/Home.jsx` | Edit the JSX — anything inside `<h1>`, `<p>`, etc. is the visible text. |
| Other page text | `client/src/pages/<PageName>.jsx` | Same as above. |

After saving, commit and push via GitHub Desktop as usual.

---

## Part 5 — Troubleshooting

### `command not found: node` or `command not found: npm`

You either haven't installed Node.js (go back to [Part 1.1](#11--install-nodejs))
or you need to **close and reopen** your terminal after installing — the new
commands aren't available in already-open windows.

### `npm: error` or `Cannot find module '...'`

Run `npm install` from the project folder. This installs the small packages
the scripts need.

### The script asks me a question and won't accept my Enter

If a field is **required**, the script keeps asking until you give a non-empty
answer. Required fields are name, role, group (for team members), year (for
alumni), etc.

If a field has a **default value** shown in `[brackets]`, pressing Enter
accepts that default.

### "❌ Page HTTP 403" when running `pubs:image`

Some publisher sites won't let you copy the image address directly because of
hotlink protection. Workaround: right-click the image and **Save Image As…**
into your Downloads folder, then paste the local file path into the script
instead of the URL.

### I made a mistake — how do I undo?

- **Before pushing:** in GitHub Desktop, right-click any changed file and
  pick **Discard Changes**. Or, the scripts that overwrite a JSON file leave
  a `.bak` backup right next to the file — you can manually restore it.
- **After pushing:** make a corrective commit with the right values. Don't
  try to rewrite history unless someone with git experience is helping.

### The website didn't update after I pushed

1. Wait 2 minutes — Vercel takes a moment to rebuild.
2. Hard-refresh: `⌘ + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows).
3. Sign in to <https://vercel.com> and check the project — if a deployment
   failed, the error message will be there.

### Direct URLs like `/research` show "404 not found"

This shouldn't happen — there's a `vercel.json` file in the `client/` folder
that prevents it. If it ever does, check that `client/vercel.json` is still
present and contains the rewrites rule.

### I can't push — GitHub Desktop says "permission denied" or similar

You're either signed into the wrong GitHub account, or the account doesn't
have write access to the repo. Sign out and back in (Preferences → Accounts),
or ask the lab to grant your account write access on the repo settings page.

### Something else is wrong

The full repo is at
<https://github.com/FanxiaoLiu/soleymani-lab-website>. Open an issue there,
or contact the previous maintainer.
