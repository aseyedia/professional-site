import 'dotenv/config';
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

let dancerLineCount = 0;
let dancerLineDayKey = null;
const DANCER_LINE_DAILY_CAP = 200;

app.post('/funky/api/dancer-line', async (req, res) => {
  const todayKey = new Date().toISOString().slice(0, 10);
  if (todayKey !== dancerLineDayKey) {
    dancerLineDayKey = todayKey;
    dancerLineCount = 0;
  }
  if (dancerLineCount >= DANCER_LINE_DAILY_CAP) {
    return res.status(429).json({ error: 'daily cap reached' });
  }
  dancerLineCount++;

  let text;
  try {
    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'system',
            content: "You are a friendly street dancer at a small personal portfolio website. Offer the visitor one short, warm, sincere, and touching thought about life, kindness, or being human — heartfelt and universal, never hype, never about code or technology. Two sentences maximum. Never claim to be the site's owner or to know the visitor personally; if asked something personal, gently deflect in character (e.g. 'I just dance here, but I'm glad you're here').",
          },
          { role: 'user', content: 'Say something to the visitor.' },
        ],
        max_tokens: 60,
        temperature: 0.9,
      }),
    });
    if (!orResponse.ok) throw new Error(`OpenRouter ${orResponse.status}`);
    const orData = await orResponse.json();
    text = orData.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('empty OpenRouter response');
  } catch (err) {
    console.error('dancer-line: OpenRouter failed:', err.message);
    return res.status(502).json({ error: 'text generation failed' });
  }

  let audio = null;
  if (process.env.VOICE_ENABLED === 'true') {
    try {
      const elResponse = await fetch(
        'https://api.elevenlabs.io/v1/text-to-speech/TX3LPaxmHKxFdv7VOQHJ',
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, model_id: 'eleven_flash_v2_5' }),
        }
      );
      if (!elResponse.ok) throw new Error(`ElevenLabs ${elResponse.status}`);
      const buffer = Buffer.from(await elResponse.arrayBuffer());
      audio = buffer.toString('base64');
    } catch (err) {
      console.error('dancer-line: ElevenLabs failed (text-only fallback):', err.message);
    }
  }

  res.json({ text, audio });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
