const fs = require('fs');
const http = require('http');

const port = +process.argv[2] || 3000;

const client = require('redis').createClient();

client.on('error', (err) => console.log('Redis Client Error', err));
const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData);
const CARD_DATA = cards.reduce(
  (prev, curr, index) => ({ ...prev, [index]: JSON.stringify(curr) }),
  {},
);
const DATA_COMPLETE = JSON.stringify({ id: 'ALL CARDS' });
const DATA_COMPLETE_LENGTH = DATA_COMPLETE.length.toString();

async function getMissingCard(key) {
  const newIndex = (await client.incr(key)) - 1;
  if (newIndex < 100) {
    return [CARD_DATA[newIndex], '91'];
  }
  return [DATA_COMPLETE, DATA_COMPLETE_LENGTH];
}
const CONTENT_TYPE = 'application/json; charset=utf-8';

const server = http.createServer((req, res) => {
  getMissingCard(req.url.substring(13)).then(([body, length]) => {
    res.writeHead(200, { 'Content-Type': CONTENT_TYPE, 'Content-Length': length });
    res.write(body);
    res.end();
  }).catch((err) => console.log(err));
});

client.on('ready', () => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening at http://0.0.0.0:${port}`);
  });
});

client.connect();
