'use strict'

var ws = require('ws')

function socket (address, listener) {
  var i;

  var reconnect = e => {
    if (e) {
      console.error(e)
    }

    clearInterval(i)

    setTimeout(socket, 1000, address, listener)
  }

  var w = new ws(address)
  w.on('message', listener)
  w.on('error', reconnect)
  w.on('close', reconnect)

  i = setInterval(() => {
    w.ping()
  }, 5000)
}

module.exports = socket
