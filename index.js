const fs = require('fs');
const http = require('http');
const redis = require('redis');

const port = +process.argv[2] || 3000;

// const client = require('redis').createClient();

const DATABASE_CONNECTIONS = ['01234567', '89abcdef']
  .reduce((prev, curr, index) => {
    const clients = [...curr].reduce((allClients, shard) => {
      const client = redis.createClient({ database: index });
      client.on('error', (err) => console.log('Redis Client Error', index, err));
      return { ...allClients, [shard]: client };
    }, {});

    return {
      ...prev,
      ...clients,
    };
  }, {});

const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData);
const CARD_DATA = cards.reduce(
  (prev, curr, index) => ({ ...prev, [index]: JSON.stringify(curr) }),
  {},
);
const DATA_COMPLETE = JSON.stringify({ id: 'ALL CARDS' });
const DATA_COMPLETE_LENGTH = DATA_COMPLETE.length;
async function getMissingCard(key) {
  const newIndex = (await DATABASE_CONNECTIONS[(key || 'a')[0]].incr(key)) - 1;
  if (newIndex < 100) {
    return [CARD_DATA[newIndex], 91];
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

Promise.all(
  Object.keys(DATABASE_CONNECTIONS)
    .map((shard) => new Promise((resolve) => {
      DATABASE_CONNECTIONS[shard].on('ready', resolve);
      DATABASE_CONNECTIONS[shard].connect();
    })),
).then(() => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening at http://0.0.0.0:${port}`);
  });
});
