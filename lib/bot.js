'use strict'

var TelegramBot = require('node-telegram-bot-api')
var user = require('./user')
var config = require('../config.json')

var bot = new TelegramBot(config.token, config.options)

bot.on('message', msg => {
  if (msg.text === '/start') {
    user.update({
      id: msg.from.id
    }, {
      id: msg.from.id,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name,
      username: msg.from.username,
      subscribed: new Date()
    }, {
      upsert: true
    }).then(() => {
      bot.sendMessage(msg.from.id, 'Just in case, you always can unscribe with /stop command.')
    })
  } else if (msg.text === '/stop') {
    user.update({
      id: msg.from.id
    }, {
      subscribed: null
    }).then(() => {
      bot.sendMessage(msg.from.id, 'Okay, unscribed. Send /start to subscribe again.')
    })
  } else {
    bot.sendMessage(msg.from.id, 'I\'m useless now. You can subscribe with /start or you can unscribe with /stop. Why do you need more?')
  }
})

module.exports = bot
