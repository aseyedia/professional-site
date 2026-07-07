import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { marked } from 'marked';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const PROJECTS_DIR = path.join(__dirname, 'views', 'content', 'projects');
const REPORTS_DIR = path.join(__dirname, 'views', 'content', 'reports');
const VALID_TAGS = ['code', 'research', 'work', 'misc'];

app.use(express.static(path.join(__dirname, 'public')));
app.use('/funky', express.static(path.join(__dirname, '../funky-website/dist')));
app.get('/funky/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../funky-website/dist', 'index.html'));
});
app.set('view engine', 'ejs');

// Read + parse a single project markdown file. Returns null if it doesn't exist.
function readProject(slug) {
  const filePath = path.join(PROJECTS_DIR, `${slug}.md`);
  // Guard against path traversal via the :projectName param.
  if (!filePath.startsWith(PROJECTS_DIR + path.sep)) return null;
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const tag = VALID_TAGS.includes(data.tag) ? data.tag : 'misc';

  return {
    slug,
    title: data.title || slug,
    tag,
    summary: data.summary || '',
    thumbnail: data.thumbnail || null,
    externalUrl: data.externalUrl || null,
    reportHtml: data.reportHtml || null,
    date: data.date || null,
    journal: data.journal || null,
    abstract: data.abstract || null,
    role: data.role || null,
    body: content,
  };
}

// List all gallery projects, newest first. Skips _template / .dotfiles.
function listProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs.readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !f.startsWith('.'))
    .map((f) => readProject(f.replace(/\.md$/, '')))
    .filter(Boolean)
    .sort((a, b) => {
      // Dated items first (newest -> oldest), then undated alphabetically.
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return a.title.localeCompare(b.title);
    });
}

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/projects', (req, res) => {
  const projects = listProjects();
  // Only show filter buttons for tags that actually have a project — an
  // empty "code" button that filters to nothing is worse than no button.
  const tags = VALID_TAGS.filter((t) => projects.some((p) => p.tag === t));
  res.render('projects', { projects, tags });
});

app.get('/publications', (req, res) => {
  // Publications are research-tagged projects with a `role` writeup —
  // papers without one (no summary provided yet) stay out of this page
  // but still show up in the general /projects research filter.
  const publications = listProjects().filter((p) => p.tag === 'research' && p.role);
  res.render('publications', { publications });
});

app.get('/projects/:projectName', (req, res) => {
  const project = readProject(req.params.projectName);
  if (!project) return res.status(404).send('Project not found!');

  if (project.reportHtml) {
    const reportPath = path.join(REPORTS_DIR, project.reportHtml);
    // Guard against path traversal via frontmatter.
    if (!reportPath.startsWith(REPORTS_DIR + path.sep)) {
      return res.status(400).send('Invalid report path');
    }
    if (!fs.existsSync(reportPath)) {
      return res.status(404).send('Project report not found!');
    }
    return res.sendFile(reportPath);
  }

  res.render('projectLayout', {
    title: project.title,
    content: marked.parse(project.body),
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
