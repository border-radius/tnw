'use strict'

var TelegramBot = require('node-telegram-bot-api')
var message = require('./message')
var user = require('./user')
var bnw = require('./bnw')
var config = require('../config.json')

var bot = new TelegramBot(config.token, config.options)

bot.on('message', msg => {
  auth(msg.from)
  .then(identity => route(msg, identity))
  .then(reply => {
    if (!reply) {
      return
    }

    return bot.sendMessage(msg.from.id, reply)
  })
  .catch(e => {
    console.error({
      from: msg.from.id,
      from_username: msg.from.username,
      from_name: [msg.from.first_name, msg.from.last_name].join(' '),
      text: msg.text,
      error: e.message
    })

    bot.sendMessage(msg.from.id, e.message)
  })
})

function auth (from) {
  return user.findOneAndUpdate({
    id: from.id
  }, from, {
    upsert: true
  }).then(identity => {
    if (!identity) {
      throw new Error('Failed to create session. Try again, please.')
    }

    return identity
  })
}

function route (msg, identity) {
  if (!msg.text) {
    return 'Where is your post, dude?'
  } else if (msg.text.slice(0, 1) === '/') {
    switch (msg.text.trim().split(' ').shift().slice(1)) {
      case 'start':
        identity.subscribed = new Date()
        return identity.save().then(() => {
          return [
            'You are now subscribed to new BnW messages.',
            'Send anything and I will post it in BnW.',
            'Reply to message to send a reply.',
            'You always can unsubscribe with /stop command.'
          ].join('\n')
        })
      case 'help':
        return [
          '/start - subscribe to bnw feed',
          '/stop - unsubscribe from feed',
          '/token abcdef0123456789 - auth with login-token, all your messages will be posted from your account',
          '/logout - remove your token from database, start posting as @telegram again'
        ].join('\n')
      case 'stop':
        identity.subscribed = null
        return identity.save()
        .then(() => 'Okay, unscribed. Send /start to subscribe again.')
      case 'token':
        var token = msg.text.trim().split(' ').pop()
        return bnw({
          endpoint: 'whoami',
          qs: {
            login: token
          }
        }).then(response => {
          if (!response.user) {
            return 'Identification failed.'
          }

          identity.token = token
          identity.bnw_username = response.user
          return identity.save().then(() => 'Hello, @' + response.user + '.')
        })
      case 'logout':
        identity.token = null
        identity.bnw_username = null
        return identity.save().then(() => 'Hello, stranger.')
      default:
        return 'Unknown command.'
    }
  } else if (msg.text.slice(0, 1) === '#') {
    return [
      '1. Download XMPP client. Pidgin, for example: https://pidgin.im.',
      '2. Choose XMPP server and register account. Bitcheese.net, for example.',
      '3. Add bnw@bnw.im bot to your roster.',
      '4. Send "register nickname" to bot to register @nickname.',
      '5. Enjoy your Jabber commands, faggot.'
    ].join('\n')
  } else if (msg.reply_to_message) {
    var id = msg.reply_to_message.text.split('\n').pop().split('/').pop()

    if (!id) {
      return 'What are you answering?'
    }

    return bnw({
      endpoint: 'comment',
      method: 'post',
      form: {
        message: id.replace('#', '/'),
        text: msg.text,
        login: identity.token || config.bnwtoken
      }
    }).then(response => {
      var reply = new message({
        message: response.id,
        userid: identity.id,
        text: msg.text,
        recommendations: [],
        subscribed: new Date()
      })

      return reply.save().then(() => {
        return response.id ?  'Comment posted. https://6nw.im/p/' + response.id.replace('/', '#') : 'Probably, message was removed.'
      })
    })
  } else {
    var tags = msg.text.match(/#[^\s]+/g)
    return bnw({
      endpoint: 'post',
      method: 'post',
      form: {
        text: msg.text,
        tags: tags ? tags.map(tag => tag.slice(1).replace(/(\.|,|\)|\!|\?)$/, '')).join(',') : undefined,
        login: identity.token || config.bnwtoken
      }
    }).then(response => {
      var post = new message({
        message: response.id,
        userid: identity.id,
        text: msg.text,
        recommendations: [],
        subscribed: new Date()
      })

      return post.save().then(() => null)
    })
  }
}

module.exports = bot
