'use strict'

var ws = require('ws')

function socket (address, listener) {
  var reconnect = e => {
    if (e) {
      console.error(e)
    }

    setTimeout(socket, 1000, address, listener)
  }

  var w = new ws(address)
  w.on('message', listener)
  w.on('error', reconnect)
  w.on('close', reconnect)
}

module.exports = socket
