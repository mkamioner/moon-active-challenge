const fs = require('fs');
const net = require('net');
const turboHttp = require('turbo-http');

const PORT = +process.argv[2] || 3000;
const PRIMARY_PORT = 4001;
const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData);
const CARD_DATA = cards.map((card) => Buffer.from(JSON.stringify(card), 'ascii'));
const COMPLETED_BODY = Buffer.from(JSON.stringify({ id: 'ALL CARDS' }), 'ascii');
const USER_INDEXES = {};

function createServer() {
  const server = turboHttp.createServer((req, res) => {
    const key = req.url.substring(13);
    const index = (USER_INDEXES[key] ?? 100) - 1;
    const body = CARD_DATA[index];
    if (body) {
      USER_INDEXES[key] = index;
      res.end(body);
    } else {
      res.end(COMPLETED_BODY);
    }
  });

  server.listen(PRIMARY_PORT, '0.0.0.0', () => {
    console.log('Main server alive');
  });
}

function mirrorServer() {
  const mirror = net.createServer((soc) => {
    const target = net.createConnection({ port: PRIMARY_PORT, host: '0.0.0.0' });
    soc.pipe(target);
    target.pipe(soc);
  });
  mirror.listen(PORT, '0.0.0.0', () => {
    console.log('Mirror proxy server alive');
  });
}

if (PORT === PRIMARY_PORT) {
  createServer();
} else {
  mirrorServer();
}
