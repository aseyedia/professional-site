import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/projects', (req, res) => {
  res.render('projects');
});

app.get('/blog', (req, res) => {
    res.render('blog');
});

app.get('/projects/:projectName', (req, res, next) => {
  const { projectName } = req.params;
  const filePath = path.join(__dirname, 'views', 'content', 'projects', `${projectName}.md`);
  
  console.log('filePath', filePath);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(404).send('Project not found!');
    }

    const htmlContent = marked.parse(data);

    res.render('projectLayout', {
      title: projectName,
      content: htmlContent
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
