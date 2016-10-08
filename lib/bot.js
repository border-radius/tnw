'use strict'

var TelegramBot = require('node-telegram-bot-api')
var request = require('request')
var message = require('./message')
var user = require('./user')
var config = require('../config.json')

var bot = new TelegramBot(config.token, config.options)

bot.on('message', msg => {
  if (!msg.text) {
    return bot.sendMessage(msg.from.id, 'Where is your post, dude?')
  } else if (msg.text === '/start') {
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
      bot.sendMessage(msg.from.id, [
        'You are now subscribed to new BnW messages.',
        'Send anything and I will post it in BnW.',
        'Reply to message to send a reply.',
        'You always can unscribe with /stop command.'
      ].join('\n'))
    })
  } else if (msg.text === '/stop') {
    user.update({
      id: msg.from.id
    }, {
      subscribed: null
    }).then(() => {
      bot.sendMessage(msg.from.id, 'Okay, unscribed. Send /start to subscribe again.')
    })
  } else if (msg.text && msg.text.slice(0, 1) === '#') {
    bot.sendMessage(msg.from.id, 'Jabber commands are not supported.')
  } else if (msg.reply_to_message) {
    var id = msg.reply_to_message.text.split('\n').pop().split('/').pop()

    if (!/^[A-Z0-9]{6}(|#[A-Z0-9]{3})$/.test(id)) {
      return
    }

    request.post({
      url: 'https://bnw.im/api/comment',
      json: true,
      form: {
        message: (id || '').replace('#', '/'),
        text: msg.text,
        login: config.bnwtoken
      }
    }, function (e, res, body) {
      if (body && !body.ok && body.description) {
        return bot.sendMessage(msg.from.id, body && body.description)
      }

      if (e || res && res.statusCode !== 200) {
        return console.error(res && res.statusCode, e.message)
      }

      if (!body.id) {
        return bot.sendMessage(msg.from.id, body.description)
      }

      var reply = new message({
        message: body.id,
        userid: msg.from.id,
        text: msg.text,
        recommendations: [],
        subscribed: new Date()
      })

      reply.save(e => {
        bot.sendMessage(msg.from.id, 'Comment posted. https://6nw.im/p/' + body.id.replace('/', '#'))
      })
    })
  } else {
    request.post({
      url: 'https://bnw.im/api/post',
      json: true,
      form: {
        text: msg.text,
        login: config.bnwtoken
      }
    }, function (e, res, body) {
      if (body && !body.ok && body.description) {
        return bot.sendMessage(msg.from.id, body && body.description)
      }

      if (e || res && res.statusCode !== 200) {
        return console.error(res && res.statusCode, e.message)
      }

      if (!body.id) {
        return bot.sendMessage(msg.from.id, body.description)
      }

      var post = new message({
        message: body.id,
        userid: msg.from.id,
        text: msg.text,
        recommendations: [],
        subscribed: new Date()
      })

      post.save(e => {
        // bot.sendMessage(msg.from.id, 'Message posted. https://6nw.im/p/' + body.id)
      })
    })
  }
})

module.exports = bot
