const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const commander = require('commander');
const superagent = require('superagent');

const program = new commander.Command();
program
  .requiredOption('-h, --host <type>', 'server host')
  .requiredOption('-p, --port <number>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache directory');

program.parse(process.argv);

const { host, port, cache } = program.opts();

async function ensureCacheDir(cacheDir) {
  try {
    await fs.access(cacheDir);
  } catch {
    await fs.mkdir(cacheDir, { recursive: true });
  }
}

ensureCacheDir(cache);

const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1);
  const cacheFilePath = path.join(cache, `${code}.jpg`);

  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(cacheFilePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    } catch (err) {
      try {
        const response = await superagent.get(`https://http.cat/${code}`).responseType('blob');
        const buffer = response.body;
        await fs.writeFile(cacheFilePath, buffer);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(buffer);
      } catch (fetchErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 not found');
      }
    }
  } else if (req.method === 'PUT') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      await fs.writeFile(cacheFilePath, buffer);
      res.writeHead(201, { 'Content-Type': 'text/plain' });
      res.end('Image cached');
    });
  } else if (req.method === 'DELETE') {
    try {
      await fs.unlink(cacheFilePath);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Image deleted');
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Image not found');
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
  }
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
