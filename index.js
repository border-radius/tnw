'use strict'

var Promise = require('bluebird')
var bot = require('./lib/bot')
var user = require('./lib/user')
var ws = require('./lib/ws')

ws('wss://bnw.im/ws?v=2', json => {
  try {
    var message = JSON.parse(json)
  } catch (e) {
    console.error(e)
    return
  }

  if (message.type !== 'new_message') {
    return
  }

  var post = [
    '@' + message.user,
    message.text,
    'https://meow.bnw.im/p/' + message.id
  ].join('\n\n')

  user.find({
    subscribed: { $ne: null }
  }).then(users => {
    Promise.each(users, user => {
      return bot.sendMessage(user.id, post)
    })
  })
})

console.log('Server launched at', new Date())
