import { Server } from 'bittorrent-tracker';
import freeport from 'freeport';
import WebTorrent from 'webtorrent-hybrid'

const client = new WebTorrent();
const server = new Server();
const port = 8990;
const hostname = 'localhost';
server.listen(port, hostname);

function getTorrentFile(infoHash, cb) {
  const existing = client.get(infoHash);
  if (!existing) {
    client.add(infoHash, { announce }, (torrent) => cb(null, torrent));
  } else {
    cb(null, existing);
  }
}

function startServer(torrent, cb = () => null) {
  if (!torrent._servers.length) {
    const webseed = torrent.createServer();
    freeport((err, port) => {
      webseed.listen(port, () => {
        torrent.urlList.push(`http://localhost:${port}/`);
        cb();
      });
    });
  } else {
    cb();
  }
}

function stopServer(torrent) {
  for (const server of torrent._servers) {
    server.close();
  }
  torrent._servers.splice(0, torrent._servers.length);
}

// listen for individual tracker messages from peers:
server.on('start', (peer, torrent) => {
  getTorrentFile(torrent.info_hash, (err, t) => startServer(t));
});

server.on('stop', (addr, torrent) => {
  getTorrentFile(torrent.info_hash, (err, t) => stopServer(t));
});

const announce = [
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.openbittorrent.com:80',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://glotorrents.pw:6969/announce',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://torrent.gresille.org:80/announce',
  'udp://p4p.arenabg.com:1337',
  'udp://tracker.leechers-paradise.org:6969',
];

// Handle serving the torrent file
server._onHttpRequest = server.onHttpRequest;
server.onHttpRequest  = (req, res, opts) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, GET',
    'Access-Control-Max-Age': 2592000,
    'Access-Control-Allow-Headers': '*',
  };

  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    return res.end();
  }

  res.writeHead(200, headers);
  // Serve the .torrent files
  if (req.url.startsWith('/torrent')) {
    const infoHash = req.url.split('/').pop().toLowerCase();
    getTorrentFile(infoHash, (err, torrent) => {
      startServer(torrent, () => {
        res.write(torrent.torrentFile);
        res.end();
      });
    });
  } else {
    server._onHttpRequest(req, res, opts);
  }
};

// Watch the torrents on our tracker, remove any with 0 peers
setInterval(() => {
  for (const infoHash in server.torrents) {
    const torrent = server.torrents[infoHash];
    if (!torrent.peers.length) {
      // Get the client torrent reference
      getTorrentFile(infoHash, (err, t) => {
        // Stop the client torrent and cleanup
        t.destroy({ destroyStore: true }, () => {
          delete server.torrents[infoHash];
        });
      });
    }
  }
}, 10000).unref();
