# node-webpeer-bridge

When implementing the [vue-yify-client](https://github.com/noahtkeller/vue-yify-client) there
was a lack of cross-over of web peers and peers in the native swarm. This caused really slow results
when downloading the torrent file from the magnet links and the actual content itself. In most
cases there would be no webpeers available.

This repo is intended to remediate this issue. It acts as a [webtorrent/bittorrent-tracker](https://github.com/webtorrent/bittorrent-tracker)
to handle requests from vue-yify-client.  

When the client sends the info hash of the torrent, the bridge resolves the torrent file from the native swarm
and creates a magnet link containing the `xs` and `ws` parameters, while also serving the torrent file
and the torrent contents to the user.

It works in testing, but it's definitely not battle hardened.
But, the concept is here, it fixed my issue, and I will expand on this later.
