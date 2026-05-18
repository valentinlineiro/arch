import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

export class ServeCommand {
  constructor(private rootPath: string = '.') {}

  async execute(args: string[] = []): Promise<void> {
    const port = parseInt(args.find(a => !isNaN(parseInt(a))) || '3000', 10);
    const docsPath = path.join(this.rootPath, 'docs');

    const server = http.createServer((req, res) => {
      // API Endpoints
      if (req.url === '/api/tasks') {
        const tasksDir = path.join(this.rootPath, 'docs/tasks');
        fs.readdir(tasksDir, async (err, files) => {
          if (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to read tasks directory' }));
            return;
          }
          const taskFiles = files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
          const tasks = await Promise.all(taskFiles.map(async f => {
            const content = fs.readFileSync(path.join(tasksDir, f), 'utf-8');
            const idMatch = f.match(/(TASK-\d{3})/);
            const titleMatch = content.match(/^## TASK-\d{3}: (.*)/m);
            const metaMatch = content.match(/^\*\*Meta:\*\* (.*)/m);
            const parts = (metaMatch?.[1] || '').split('|').map(p => p.trim());

            return {
              id: idMatch?.[1] || f,
              title: titleMatch?.[1] || 'Untitled',
              priority: parts[0] || 'P2',
              size: parts[1] || 'S',
              status: parts[2] || 'IDEA',
              focus: (parts[3] || '').includes('yes') ? 'Focus:yes' : 'Focus:no',
              cli: parts[5] || '',
              path: `docs/tasks/${f}`,
            };
          }));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(tasks));
        });
        return;
      }

      let filePath = path.join(docsPath, req.url === '/' ? 'index.html' : req.url!);
      
      // Security: ensure filePath is within docsPath
      if (!filePath.startsWith(docsPath)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      const ext = path.extname(filePath);
      const contentTypes: Record<string, string> = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };

      fs.readFile(filePath, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.statusCode = 404;
            res.end('Not Found');
          } else {
            res.statusCode = 500;
            res.end('Internal Server Error');
          }
          return;
        }
        res.setHeader('Content-Type', contentTypes[ext] || 'text/plain');
        res.end(data);
      });
    });

    server.listen(port, () => {
      console.log(`\n  \x1b[32m✔\x1b[0m ARCH Viewer serving at: \x1b[36mhttp://localhost:${port}\x1b[0m`);
      console.log(`  Serving files from: ${docsPath}`);
      console.log('  Press Ctrl+C to stop.\n');
    });
  }
}
