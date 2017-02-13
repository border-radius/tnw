'use strict'

var ws = require('ws')

function socket (address, listener) {
  var i;
  var w = new ws(address)

  var reconnect = e => {
    if (e) {
      console.error(e)
    }

    clearInterval(i)

    try {
      w.close()
    } catch (e) {
      console.error(e)
    }

    setTimeout(socket, 1000, address, listener)
  }

  w.on('message', message => {
    try {
      setTimeout(listener, 0, JSON.parse(message))
    } catch (e) {
      w.close()
    }
  })
  w.on('error', reconnect)
  w.on('close', reconnect)

  i = setInterval(() => {
    w.ping()
  }, 5000)
}

module.exports = socket
