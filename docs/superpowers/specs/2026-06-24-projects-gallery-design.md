# Site Spruce-Up: Projects Gallery + Structure — Design

**Date:** 2026-06-24
**Status:** Approved

## Context

Arta's professional site (Express + EJS, monospace/terminal aesthetic) is a single
long-scroll home page (three.js hero, About, Skills accordion, Contact, References)
plus a half-built `/projects` stub and a dead `/blog` route. Job-hunt context: PEDSnet
funding cut, layoff likely, wants the site to read as an organic personal-professional
site (explicitly *not* LinkedIn-flavored) that he updates for fun but uses professionally.

Constraints from the user:
- **Do not rewrite home-page prose** — tone is his to write.
- No blog. No Ghost. No new infra.
- Authoring content in raw HTML is a non-starter — content must be markdown.
- Keep the existing monospace / terminal look; it's already distinctive.

## What's actually broken / unfinished today

- `gray-matter` is a dependency but **never imported** — the markdown frontmatter
  pipeline was planned but not wired.
- `views/projects.ejs` is a hardcoded static list (one item: TWAS-Z), not data-driven.
- `/blog` route + `views/blog.ejs` exist but blog is being dropped.
- Header nav is commented out.

## Scope

1. **Projects gallery** — markdown-driven, card grid, tag-filterable, optional thumbnails.
2. **Restore nav** — Home / Projects only (no blog), styled to match the terminal aesthetic.
3. **Remove blog** — route + view.
4. **README** — instruction manual for how the site works and how to add content.
5. **No home-page prose changes** (nav restore in the shared header partial is fine).

## Content model

Each gallery item = one `.md` file in `views/content/projects/`. Frontmatter:

```yaml
---
title: TWAS-Z
tag: code            # one of: code | research | work | misc
summary: One-line blurb shown on the card.
thumbnail: /images/projects/twas-z.png   # optional; cards without one render text-only
externalUrl: https://github.com/...      # optional; if set, card links OUT instead of to internal page
date: 2026-01-15     # optional; controls sort order (newest first)
---

Full markdown writeup. Only reached/rendered for items WITHOUT an externalUrl.
```

- Files whose names start with `_` or `.` are ignored by the gallery (templates, drafts).
- `tag` drives the filter UI. Unknown/missing tag falls back to `misc`.

## Architecture / data flow

```
GET /projects
  -> read views/content/projects/*.md (skip _*, .*)
  -> gray-matter parse each -> { slug, title, tag, summary, thumbnail, externalUrl, date }
  -> sort by date desc (undated last), then title
  -> render projects.ejs with { projects }

GET /projects/:projectName
  -> read views/content/projects/<name>.md
  -> gray-matter parse -> marked(body)
  -> render projectLayout.ejs with { title (from frontmatter), content }
  -> 404 if file missing
```

A small shared helper reads + parses a project file so the list route and the detail
route don't duplicate frontmatter logic.

## Gallery UI (projects.ejs)

- Filter bar: `all` / `code` / `research` / `work` / `misc` — buttons styled like the
  existing accordion (monospace, `[ ]` / underline affordance), pure client-side JS
  toggling `display` by `data-tag`.
- Card grid (CSS grid, `auto-fill minmax`). Each card:
  - optional thumbnail (fixed aspect box; omitted cleanly if absent)
  - title (links to internal `/projects/:slug` or `externalUrl`)
  - tag badge
  - summary line
  - external cards get a small `↗` affordance.
- Styling lives in `public/css/styles.css`, reusing existing CSS vars
  (`--bg-color`, `--text-color`, `--link-color`) so dark/light theme just works.

## Seed content

Convert `twas-z.md` to the new frontmatter format and seed a handful of real,
already-public items so the gallery isn't empty:
- Research: the 5 papers already cited in the home page References (factual titles,
  `externalUrl` = existing DOI/journal links). Reuses his existing citation text.
- Code: `professional-site` (this site), `funky-website`, `career-ops`.
- A `_template.md` (underscore-prefixed, ignored by listing) as a copy-paste starter.

Summaries kept short and factual; the user edits/replaces them. No invented prose
about his accomplishments.

## Out of scope

- Home-page prose / tone (his to write).
- Blog, Ghost, any CMS.
- Image pipeline beyond "drop a file in `public/images/projects/` and reference it."
- The `/funky` sub-site (unchanged).

## Testing / verification

- `npm start`, hit `/` (nav present, home unchanged), `/projects` (grid renders,
  filters work), a `/projects/:slug` internal page (markdown renders), and confirm
  `/blog` now 404s.
- Confirm a thumbnail-less card and an external-link card both render correctly.
