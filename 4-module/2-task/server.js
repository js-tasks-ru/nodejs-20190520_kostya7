// Не смог сделать стрим из тела запроса, чтобы потом в кастомный наш стрим прокинуть

const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
// const LimitSizeStream = require('./LimitSizeStream');

const server = new http.Server();
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  fs.open(dirname, 'r', (err) => {
    if (err !== null) {
      ensureDirectoryExistence(dirname);
      fs.mkdirSync(dirname);
    }
  });
}

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':
      if (pathname.includes('/')) {
        res.statusCode = 400;
        res.end('Dont support nested files');
        return;
      }

      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();

        ensureDirectoryExistence(filepath);
        if (body.length > 1e6) {
          body = "";
          res.writeHead(413, {'Content-Type': 'text/plain'}).end();
          req.connection.destroy();
        }
      });


      req.on('end', () => {
        fs.stat(filepath, (err) => {
          if (err !== null && body.length) {
            res.statusCode = 201;
            fs.writeFile(filepath, body, () => {});
          } else {
            res.statusCode = 409;
          }
          res.end(body);
        });
      });

      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;


