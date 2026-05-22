import { Command } from '../../domain/models/command.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

export class ServeCommand implements Command {
  constructor(private rootPath: string = '.') {}

  async execute(args: string[] = []): Promise<void> {
    const port = this.parsePort(args);
    const server = http.createServer(this.createHandler());

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n  ✗ Port ${port} is already in use. Try: arch govern serve ${port + 1}`);
        process.exit(1);
      }
      throw err;
    });

    server.listen(port, () => {
      console.log(`\n  \x1b[32m✔\x1b[0m ARCH Viewer serving at: \x1b[36mhttp://localhost:${port}\x1b[0m`);
      console.log(`  Serving files from: ${path.join(this.rootPath, 'docs')}`);
      console.log('  Press Ctrl+C to stop.\n');
    });
  }

  parsePort(args: string[]): number {
    const arg = args.find(a => /^\d+$/.test(a));
    return arg ? parseInt(arg, 10) : 3000;
  }

  createHandler(): http.RequestListener {
    const docsPath = path.join(this.rootPath, 'docs');

    return (req, res) => {
      // API Endpoints
      if (req.url?.split('?')[0] === '/api/tasks') {
        const tasksDir = path.join(this.rootPath, 'docs/tasks');
        fs.readdir(tasksDir, async (err, files) => {
          if (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to read tasks directory' }));
            return;
          }
          try {
            const taskFiles = files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
            const tasks = await Promise.all(taskFiles.map(async f => {
              const content = fs.readFileSync(path.join(tasksDir, f), 'utf-8');
              const idMatch = f.match(/(TASK-\d+)/);
              const idStr = idMatch?.[1] ?? f.replace('.md', '');
              const titleMatch = content.match(new RegExp(`^## ${idStr}: (.*)`, 'm'));
              const metaMatch = content.match(/^\*\*Meta:\*\* (.*)/m);
              const parts = (metaMatch?.[1] || '').split('|').map(p => p.trim());

              return {
                id: idStr,
                title: titleMatch?.[1] || 'Untitled',
                priority: parts[0] || 'P2',
                size: parts[1] || 'S',
                status: parts[2] || 'IDEA',
                focus: (parts[3] || '').includes('yes') ? 'Focus:yes' : 'Focus:no',
                class: parts[4] || '',
                cli: parts[5] || '',
                context: parts[6] || '',
                path: `docs/tasks/${f}`,
              };
            }));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(tasks));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to parse task files' }));
          }
        });
        return;
      }

      // Static file serving
      const parsed = new URL(req.url ?? '/', `http://localhost`);
      const pathname = parsed.pathname;
      let filePath = path.join(docsPath, pathname === '/' ? 'index.html' : pathname);

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
    };
  }
}
