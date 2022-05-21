const fs = require('fs');
const http = require('http');
const cluster = require('cluster');

const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData);
const CARD_DATA = cards.reduce(
  (prev, curr, index) => ({ ...prev, [index]: JSON.stringify(curr) }),
  {},
);
const DATA_COMPLETE = JSON.stringify({ id: 'ALL CARDS' });
const DATA_COMPLETE_LENGTH = DATA_COMPLETE.length;

const CONTENT_TYPE = 'application/json; charset=utf-8';
let requestIdIndex = 0;
function setupServer(port) {
  const server = http.createServer((req, res) => {
    const userId = req.url.substring(13);
    const requestId = requestIdIndex += 1;
    function processResponse([body, responseId]) {
      if (responseId === requestId) {
        process.removeListener('message', processResponse);
        if (body) {
          res.writeHead(200, { 'Content-Type': CONTENT_TYPE, 'Content-Length': '91' });
          res.write(body);
          res.end();
        } else {
          res.writeHead(200, { 'Content-Type': CONTENT_TYPE, 'Content-Length': DATA_COMPLETE_LENGTH });
          res.write(DATA_COMPLETE);
          res.end();
        }
      }
    }
    process.addListener('message', processResponse);
    process.send([userId, requestId]);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening at http://0.0.0.0:${port}`);
  });
}
const USER_DATA = {};
function dataRequest(proc) {
  return function innerDataRequest([userId, requestId]) {
    const newIndex = (USER_DATA[userId] ?? 100) - 1;
    if (newIndex < 0) {
      proc.send([false, requestId]);
    } else {
      USER_DATA[userId] = newIndex;
      proc.send([CARD_DATA[newIndex], requestId]);
    }
  };
}

if (cluster.isPrimary) {
  if (process.argv[2] === '4001') {
    ['4001', '4002'].forEach((port) => {
      const proc = cluster.fork({ PORT_ENV: port });
      proc.on('message', dataRequest(proc));
    });
  }
} else {
  process.setMaxListeners(0);
  setupServer(process.env.PORT_ENV);
}
