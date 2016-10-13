'use strict'

var Promise = require('bluebird')
var request = require('request')
var lodash = require('lodash')
var bnw = require('./lib/bnw')
var bot = require('./lib/bot')
var user = require('./lib/user')
var message = require('./lib/message')
var ws = require('./lib/ws')

ws('wss://bnw.im/ws?v=2', event => {
  switch (event.type) {
    case 'new_message':
      var tags = event.tags ?
        event.tags.map(tag => '#' + tag.replace(/\s+/g, '_'))
        .filter(tag => event.text.toLowerCase().indexOf(tag.toLowerCase()) === -1).join(' ') :
        ''
      var post = [
        event.user + ':',
        event.text,
        '6nw.im/p/' + event.id + ' ' + tags.join(' ')
      ].filter(item => !!item).join('\n\n')

      user.find({
        subscribed: { $ne: null }
      }).then(users => {
        Promise.each(users, user => {
          return new Promise((resolve, reject) => {
            bot.sendMessage(user.id, post).then(resolve).catch(e => {
              console.error(user.username, user.id, e.message)
              resolve()
            })
          })
        })
      })
      break

    case 'upd_recommendations_count':
      message.findOne({
        message: event.id,
        subscribed: { $ne: null }
      }).then(subscription => {
        if (!subscription) {
          return
        }

        var newRecommendation = event.recommendations.filter(recommendation => {
          return subscription.recommendations.indexOf(recommendation) === -1
        }).pop()

        if (!newRecommendation) {
          return
        }

        var post = newRecommendation + ' 🔃 6nw.im/p/' + event.id + ' "' + subscription.text.slice(0, 60) + '"'
        bot.sendMessage(subscription.userid, post)
        subscription.recommendations = event.recommendations
        subscription.save()
      })
      break
  }
})

ws('wss://bnw.im/comments/ws', comment => {
  var mentions = comment.text.match(/@[A-z0-9\-]+/g) || []
  mentions = mentions.map(mention => mention.slice(1))

  var props = {
    message: message.findOne({
      message: comment.replyto || comment.message,
      subscribed: { $ne: null }
    }),
    users: user.find({
      bnw_username: {
        $in: mentions
      }
    })
  }

  if (!comment.replyto) {
    props.thread = bnw({
      endpoint: 'show',
      qs: {
        message: comment.message
      }
    }).then(show => {
      var thread = show.messages.pop()
      return user.find({
        bnw_username: thread.user
      }).then(user => ({
        user: user && user[0],
        thread: thread
      }))
    })
  }

  Promise.props(props).then(results => {
    var ids = (results.users || []).map(user => user.id)

    if (results.message) {
      ids.push(results.message.userid)
    }

    if (results.thread && results.thread.user) {
      ids.push(results.thread.user.id)
    }

    var quote = results.thread ?
                '> ' + results.thread.thread.text.slice(0, 60) :
                comment.replyto ?
                '> ' + comment.replytotext : ''

    return {
      ids: lodash.uniq(lodash.compact(ids)),
      quote: quote
    }
  }).then(results => {
    if (comment.replyto) {
      comment.text = comment.text.split(' ').slice(1).join(' ')
    }

    var post = [
      comment.user + ':',
      results.quote ? results.quote + '\n' : '',
      comment.text,
      '',
      '6nw.im/p/' + comment.id.replace('/', '#')
    ].join('\n')

    return Promise.each(results.ids, id => {
      return new Promise((resolve, reject) => {
        bot.sendMessage(id, post).then(resolve).catch(e => {
          console.error(user.id, e.message)
          resolve()
        })
      })
    })
  })
})

console.log('Server launched at', new Date())
