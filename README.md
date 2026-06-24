# Arta's Professional Site

A small Express + EJS site with a markdown-driven project gallery and a terminal /
monospace aesthetic. No CMS, no build step for content — you add a project by dropping
a markdown file in a folder.

## Run it

```bash
npm install
npm start        # production-ish, serves on http://localhost:3000
npm run dev      # nodemon, auto-restarts on file changes
```

`PORT` env var overrides the port (e.g. `PORT=3100 node app.js`).

## How the site is laid out

```
app.js                       # Express server + all routes
views/
  home.ejs                   # home page (About / Skills / Contact / References)
  projects.ejs               # the project gallery (card grid + tag filter)
  projectLayout.ejs          # template for an individual project writeup page
  partials/header.ejs        # shared title, nav, dark/light toggle
  content/projects/*.md      # <-- your project content lives here (one file per card)
public/
  css/styles.css             # all styling (uses CSS vars, so dark mode is automatic)
  js/three-widget.js         # the spinning hero on the home page
  images/projects/           # optional card thumbnails
```

## Routes

| Route                  | What it does                                                        |
|------------------------|--------------------------------------------------------------------|
| `/`                    | Home page (`home.ejs`).                                             |
| `/projects`            | Gallery — auto-built from every `.md` in `content/projects/`.       |
| `/projects/:name`      | Renders `content/projects/<name>.md` as a full page.               |
| `/funky` , `/funky/*`  | Serves the separate `funky-website/dist` build (sibling repo).      |

## Adding a project (the only thing you'll do regularly)

1. Copy `views/content/projects/_template.md` to a new file, e.g.
   `views/content/projects/my-thing.md`. The filename becomes the URL slug
   (`/projects/my-thing`).
2. Fill in the frontmatter at the top:

   ```yaml
   ---
   title: My Thing
   tag: code                # code | research | work | misc  (drives the filter buttons)
   summary: One line shown on the gallery card.
   thumbnail: /images/projects/my-thing.png   # optional
   externalUrl: https://github.com/aseyedia/my-thing   # optional — see below
   date: 2026-06-24         # optional — newest first; undated items sort last
   ---
   ```

3. Write the writeup in markdown below the frontmatter.

That's it — the gallery picks it up automatically on next page load. No code changes.

### Internal page vs. external link

- **No `externalUrl`** → the card links to an internal page at `/projects/<slug>` that
  renders your markdown body. Use this for writeups.
- **`externalUrl` set** → the card links straight out (new tab, with a `↗`) and the
  markdown body is ignored. Use this for papers, GitHub repos, or anything that already
  lives elsewhere. (The research papers in the gallery work this way.)

### Conventions / gotchas

- Files starting with `_` (like `_template.md`) or `.` are **ignored** by the gallery —
  handy for drafts and templates.
- `tag` must be one of `code | research | work | misc`. Anything else falls back to
  `misc`. To add a new tag category, add it to `VALID_TAGS` in `app.js`.
- Thumbnails are optional and cropped to 16:9. Drop the image in
  `public/images/projects/` and reference it as `/images/projects/<file>`.
- Styling uses CSS variables (`--bg-color`, `--text-color`, `--link-color`), so anything
  you add inherits dark/light theme for free.

## Design notes

The spec for the gallery revamp lives in
`docs/superpowers/specs/2026-06-24-projects-gallery-design.md`.
