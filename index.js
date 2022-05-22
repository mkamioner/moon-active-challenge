const fs = require('fs');
const net = require('net');
const turboHttp = require('turbo-http');

const PRIMARY_PORT = 4001;
const PORT = +process.argv[2] || PRIMARY_PORT;
const RAW_CARDS = JSON.parse(fs.readFileSync('./cards.json'));
const CARD_DATA = RAW_CARDS.map((card) => Buffer.from(JSON.stringify(card), 'ascii'));
CARD_DATA.unshift(Buffer.from(JSON.stringify({ id: 'ALL CARDS' }), 'ascii'));
const USER_INDEXES = {};
const CARD_COUNT = CARD_DATA.length;

function createServer() {
  turboHttp.createServer((req, res) => {
    const newIndex = (USER_INDEXES[req.url] ?? CARD_COUNT) - 1;
    if (newIndex) {
      USER_INDEXES[req.url] = newIndex;
    }
    res.end(CARD_DATA[newIndex]);
  }).listen(PRIMARY_PORT, '0.0.0.0', () => {
    console.log('Main server alive');
  });
}

function mirrorServer() {
  net.createServer((soc) => {
    const target = net.createConnection({ port: PRIMARY_PORT, host: '0.0.0.0' });
    soc.pipe(target);
    target.pipe(soc);
  }).listen(PORT, '0.0.0.0', () => {
    console.log('Mirror proxy server alive');
  });
}

if (PORT === PRIMARY_PORT) {
  createServer();
} else {
  mirrorServer();
}
