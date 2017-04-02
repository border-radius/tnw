'use strict'

var Promise = require('bluebird')
var request = require('request')
var config = require('../config')

module.exports = opts => {
  opts = opts instanceof Object ? opts : {}
  var url = [ 'http://bnw.im/api', opts.endpoint ].join('/')

  return new Promise ((resolve, reject) => {
    request({
      url: url,
      method: opts.method || 'get',
      json: true,
      form: opts.form,
      qs: opts.qs
    }, (e, res, body) => {
      if (body && !body.ok && body.desc) {
        return reject(new Error(body.desc))
      }

      if (!e && res.statusCode !== 200) {
        e = new Error('HTTP ' + res.statusCode)
      }

      if (e) {
        return reject(e)
      }

      resolve(body)
    })
  })
}
