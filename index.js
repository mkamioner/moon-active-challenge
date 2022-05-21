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
const COMPLETED_BODY = JSON.stringify({ id: 'ALL CARDS' });
const COMPLETED_HEADER = {'Content-Length': '18'};
const DATA_HEADER = {'Content-Length': '91'};
async function getMissingCard(key) {
  return CARD_DATA[(await client.incr(key)) - 1];
}

const server = http.createServer((req, res) => {
  getMissingCard(req.url.substring(13)).then((body) => {
    if (body) {
      res.writeHead(200, DATA_HEADER);
      res.write(body);
      res.end();
    } else {
      res.writeHead(200, COMPLETED_HEADER);
      res.write(COMPLETED_BODY);
      res.end();
    }
  });
});

client.on('ready', () => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening at http://0.0.0.0:${port}`);
  });
});

client.connect();
