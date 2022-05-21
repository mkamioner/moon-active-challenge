const fs = require('fs');
const http = require('http');
const cluster = require('cluster');

const PORT = +process.argv[2] || 3000;
const THREADS = +process.env.THREAD_COUNT || 1;

const client = require('redis').createClient();

client.on('error', (err) => console.log('Redis Client Error', err));
const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData);
const CARD_DATA = cards.reduce(
  (prev, curr, index) => ({ ...prev, [index]: JSON.stringify(curr) }),
  {},
);
const DATA_COMPLETE = JSON.stringify({ id: 'ALL CARDS' });
const DATA_COMPLETE_LENGTH = DATA_COMPLETE.length;
const USER_DATA = {};
async function getMissingCard(key) {
  const newIndex = (USER_DATA[key] ?? 0) + 1;
  USER_DATA[key] = newIndex;
  // const newIndex = (await client.incr(key)) - 1;
  if (newIndex < 100) {
    return [CARD_DATA[newIndex], 91];
  }
  return [DATA_COMPLETE, DATA_COMPLETE_LENGTH];
}
const CONTENT_TYPE = 'application/json; charset=utf-8';

function initServer(port) {
  const server = http.createServer((req, res) => {
    if (req.url[1] !== 'r') {
      getMissingCard(req.url.substring(13)).then(([body, length]) => {
        res.writeHead(200, { 'Content-Type': CONTENT_TYPE, 'Content-Length': length });
        res.write(body);
        res.end();
      }).catch((err) => console.log(err));
      return;
    }

    res.writeHead(200, { 'Content-Type': CONTENT_TYPE, 'Content-Length': 14 });
    res.write('{"ready":true}');
    res.end();
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening at http://0.0.0.0:${port}`);
  });
}

if (THREADS > 1 && cluster.isPrimary) {
  for (let i = 0; i < THREADS; i += 1) {
    cluster.fork();
  }
} else {
  client.on('ready', () => {
    if (PORT === 4001) {
      initServer(4001);
      initServer(4002);
    } else {
      console.log('ignoring other port');
    }
  });

  client.connect();
}
// forking
// minimize
