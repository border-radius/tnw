'use strict'

var mongoose = require('mongoose')
var config = require('../config.json')

mongoose.Promise = global.Promise
mongoose.connect(config.mongodb)

var schema = new mongoose.Schema({
  id: Number,
  first_name: String,
  last_name: String,
  username: String,
  subscribed: Date
})

module.exports = mongoose.model('user', schema)
