'use strict'

var bnw = require('./bnw')
var message = require('./message')
var config = require('../config.json')

module.exports = (id, text, identity) => {
  return bnw({
    endpoint: 'comment',
    method: 'post',
    form: {
      message: id,
      text: text,
      login: identity.token || config.bnwtoken
    }
  }).then(response => {
    var reply = new message({
      message: response.id,
      userid: identity.id,
      text: text,
      recommendations: [],
      subscribed: new Date()
    })
    
    return reply.save().then(() => {
      return response.id ?
      identity.bnw_url + response.id.replace('/', '#') :
      'Probably, message was removed.'
    })
    
  })
}
