'use strict'

var TelegramBot = require('node-telegram-bot-api')
var message = require('./message')
var user = require('./user')
var bnw = require('./bnw')
var utils = require('./utils')
var sendreply = require('./sendreply')
var config = require('../config.json')

var blacklist = config.blacklist instanceof Array ? config.blacklist : []
var bot = new TelegramBot(config.token, config.options)

bot.on('message', msg => {
  auth(msg.from)
  .then(identity => route(msg, identity))
  .then(reply => {

    if (!reply) {
      return
    } else if (utils.checkFullUrl(reply)) {

      var options = {
        reply_markup: JSON.stringify({
          inline_keyboard: [
          [{ text: 'Open thread', url: reply },
           { text: 'Remove', callback_data: 'd:' +
          reply.split('/').pop() }],
          ]
        })
      }

      return bot.sendMessage(msg.from.id, 'Comment posted.', options)
    }

    return bot.sendMessage(msg.from.id, reply)
  })

  .catch(e => {
    console.error({
      from: msg.from.id,
      from_username: msg.from.username,
      from_name: [msg.from.first_name, msg.from.last_name].join(' '),
      text: msg.text,
      error: e.message,
      stack: e.stack.split('\n')[1].trim()
    })

    bot.sendMessage(msg.from.id, '⚠️ ' + e.message)
  })
})

bot.on('callback_query', action => {
  auth(action.from)
  .then(identity => {

    if (!identity.token) {
      return bot.sendMessage(action.from.id, 'Only for authenticated users.')    

    } else if (action.data.split(':')[0] == 'd'){
      return bnw({
        endpoint: 'delete',
        method: 'post',
        form: {
          message: action.data.split(':')[1],
          login: identity.token
        }
      })   
            
    } else {
      return bnw({
        endpoint: 'recommend',
        method: 'post',
        form: {
          message: action.data.split(':')[1],
          login: identity.token
        }
      })
    }
  })

  .then(response => response.desc).then(reply => {
    if (!reply) {
      return
    }
    return bot.sendMessage(action.from.id, reply)
  })
})

function auth (from) {
  if (blacklist.indexOf(from.id) > -1) {
    throw new Error('Your presence here is unacceptable')
  }

  return user.findOneAndUpdate({
    id: from.id
  }, from, {
    upsert: true
  })
  .then(identity => {

    if (!identity) {
      //mongoose didn't return instance on insert
      return user.findOne({ id: from.id }).then(identity => {
        if (!identity) {
          throw new Error('Failed to create session.' + 
            ' Try again, please.')
        }

        return identity
      })
    }
    
    return identity
  })
}

function route (msg, identity) {

  if (!msg.text) {
    return 'Where is your post, dude?'
  } else if (msg.text.slice(0, 1) === '/') {
    var commandName = msg.text.trim().split(' ').shift().slice(1)
    var afterCommand = msg.text.trim().split(' ').slice(1).join(' ')

    switch (commandName) {
      case 'start':
      identity.subscribed = new Date()
      if (!identity.bnw_url){identity.bnw_url = 'https://6nw.im/p/'}
        identity.save().then(() => {
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
      '/reply ID text - reply to specific message',
      '/recommend ID - recommend message',
      '/token abcdef0123456789 - auth with login-token,' +
      ' all your messages will be posted from your account',
      '/anon - become a slaqiue',
      '/bnw_url - choose your favorite BnW mirror',
      '/logout - remove your token from database,' +
      ' start posting as @telegram again',
      '/bl [username] - add/remove user from blacklist' +
      ' or just show blacklisted users'
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
      })

      .then(response => {

        if (!response.user) {
          return 'Identification failed.'
        }

        identity.token = token
        identity.bnw_username = response.user
        return identity.save().then(() => 'Hello, @' + response.user + '.')
      })

      case 'anon':
    
      return bnw({
        endpoint: 'whoami',
        qs: {
          login: identity.token
        }
      })

      .then(response => {

        if (!response.user) {
          return 'Identification failed.'
        }

        if(identity.anon) {
          identity.anon = false
          return identity.save().then(() => 'You are no longer anonymous!')
        }

        identity.anon = true
        return identity.save().then(() => 'Welcome back, slavique!')
      })

      case 'bnw_url':
      var bnw_url = msg.text.trim().split(' ').pop()
      
      if (utils.checkUrl(bnw_url)){
        identity.bnw_url = bnw_url
        return identity.save().then(() => 'Next links' + 
          'will lead you to ' +
          identity.bnw_url + '.')
      } else if (bnw_url!='/bnw_url'){
        return 'Invalid url!'
      }

      return 'Your current url is ' + identity.bnw_url

      case 'logout':
      identity.token = null
      identity.bnw_username = null
      return identity.save().then(() => 'Hello, stranger.')

      case 'reply':
      var text = msg.text.trim().split(' ').slice(2).join(' ')
      var id = msg.text.trim().split(' ')[1]
      id = (id || '').replace(/^#/, '').toUpperCase()

      if (!utils.checkFullId(id)) {
        return 'Invalid id.'
      }

      return sendreply(id, text, identity)

      case 'bl':
      if (!identity.token) {
        return 'Only for authenticated users.'
      }

      var updateBlackList = new Promise ((resolve, reject) => {
        if (!afterCommand) {
          return resolve()
        }

        bnw({
          endpoint: 'blacklist',
          method: 'post',
          form: {
            login: identity.token,
            user: afterCommand,
            delete: (identity.blacklist || []).filter(user => {
              return user.toLowerCase() === afterCommand.toLowerCase()
            }).length > 0 ? 1 : null
          }
        }).then(resolve).catch(reject)
      })

      return updateBlackList.then(() => {
        return bnw({
          endpoint: 'blacklist',
          qs: {
            login: identity.token
          }
        })

        .then(response => {
          identity.blacklist = response.blacklist
          .filter(item => item[0] == 'user').map(item => item[1])

          return identity.save().then(() => {
            return identity.blacklist.length === 0 ?
            'Your blacklist is empty.' :
            'Blacklisted users: ' + identity.blacklist.join(', ')
          })
        })
      })

      case 'recommend':
      if (!identity.token) {
        return 'Only for authenicated users.'
      }

      var id = msg.reply_to_message ?
      utils.getId(msg.reply_to_message.text):
      msg.text.trim().split(' ')[1]

      id = (id || '').replace(/^#/, '')

      if (!utils.checkId(id)) {
        return 'Reply to message with "/recommend" or send "/recommend ID".'
      }

      return bnw({
        endpoint: 'recommend',
        method: 'post',
        form: {
          message: id,
          login: identity.token
        }
      }).then(response => response.desc)

      default:
      return 'Unknown command: ' + commandName
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

    var id = utils.getId(msg.reply_to_message.text)

    if (!id) {
      return 'What are you answering?'
    }

    return sendreply(id.replace('#', '/'), msg.text, identity)
  } else {
    
    var tags = msg.text.match(/#[^\.,:;\*\s\(\)]+/g)
    
    return bnw({
      endpoint: 'post',
      method: 'post',
      form: {
        text: msg.text,
        tags: tags ? tags.map(tag => tag.slice(1)
          .replace(/(\.|,|\)|\!|\?)$/, '')).join(',') : undefined,
        login: identity.token || config.bnwtoken,
        anonymous: identity.anonymous
      }
    })

    .then(response => {
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
