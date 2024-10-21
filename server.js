const http = require('http');
const fs = require('fs').promises;
const commander = require('commander');

const program = new commander.Command();
program
  .requiredOption('-h, --host <type>', 'server host')
  .requiredOption('-p, --port <number>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache directory');

program.parse(process.argv);

const { host, port, cache } = program.opts();

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Server ok');
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
