const http = require('http');
const cluster = require('cluster');
const cards = require('./cards.json');

const PORT = +process.argv[2] || 3000;
const THREADS = +process.env.THREAD_COUNT || 1;

const CARD_DATA = cards.reduce(
  (prev, curr, index) => ({ ...prev, [index]: JSON.stringify(curr) }),
  {},
);
const CARDS_COUNT = cards.length;
const DATA_COMPLETE = JSON.stringify({ id: 'ALL CARDS' });
const DATA_COMPLETE_LENGTH = DATA_COMPLETE.length.toString();
const USER_DATA = {};
const CONTENT_TYPE = 'application/json; charset=utf-8';

function returnCardApi(req, res) {
  const key = req.url.substring(13);
  const newIndex = (USER_DATA[key] ?? CARDS_COUNT) - 1;
  if (newIndex < 0) {
    res.writeHead(200, { 'Content-Type': CONTENT_TYPE, 'Content-Length': DATA_COMPLETE_LENGTH });
    res.write(DATA_COMPLETE);
    res.end();
  } else {
    USER_DATA[key] = newIndex;
    res.writeHead(200, { 'Content-Type': CONTENT_TYPE, 'Content-Length': '91' });
    res.write(CARD_DATA[newIndex]);
    res.end();
  }
}

function initServer(port) {
  const server = http.createServer(returnCardApi);
  server.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening at http://0.0.0.0:${port}`);
  });
}

if (THREADS > 1 && cluster.isPrimary) {
  for (let i = 0; i < THREADS; i += 1) {
    cluster.fork();
  }
} else if (PORT === 4001) {
  initServer(4001);
  initServer(4002);
} else {
  console.log('ignoring other port');
}
