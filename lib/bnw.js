'use strict'

var Promise = require('bluebird')
var request = require('request')
var config = require('../config')

module.exports = opts => {
  opts = opts instanceof Object ? opts : {}
  return new Promise ((resolve, reject) => {
    request({
      url: [ 'https://bnw.im/api', opts.endpoint ].join('/'),
      method: opts.method || 'get',
      json: true,
      form: opts.form,
      qs: opts.qs
    }, (e, res, body) => {
      if (body && !body.ok && body.description) {
        return reject(new Error(body.description))
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
