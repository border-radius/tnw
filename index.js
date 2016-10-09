'use strict'

var Promise = require('bluebird')
var request = require('request')
var bot = require('./lib/bot')
var user = require('./lib/user')
var message = require('./lib/message')
var ws = require('./lib/ws')

ws('wss://bnw.im/ws?v=2', event => {
  switch (event.type) {
    case 'new_message':
      var tags = event.tags ?
        event.tags.map(tag => '#' + tag.replace(/\s/g, '_'))
        .filter(tag => event.text.indexOf(tag) === -1).join(' ') :
        ''
      var post = [
        '@' + event.user + ':',
        event.text,
        tags,
        'https://6nw.im/p/' + event.id
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

        var post = '@' + newRecommendation + ' recommended your post https://6nw.im/p/' + event.id + '\n>' + subscription.text.slice(0, 60)
        bot.sendMessage(subscription.userid, post)
        subscription.recommendations = event.recommendations
        subscription.save()
      })
      break
  }
})

ws('wss://bnw.im/comments/ws', comment => {
  message.findOne({
    message: comment.replyto || comment.message,
    subscribed: { $ne: null }
  }).then(subscription => {
    if (!subscription) {
      return
    }

    if (comment.replyto) {
      comment.text = comment.text.split(' ').slice(1).join(' ')
    }

    var post = [
      '@' + comment.user + ':',
      '>' + subscription.text.slice(0, 60),
      '',
      comment.text,
      '',
      'https://6nw.im/p/' + comment.id.replace('/', '#')
    ].join('\n')

    bot.sendMessage(subscription.userid, post)
  })
})

console.log('Server launched at', new Date())
