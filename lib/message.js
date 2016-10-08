'use strict'

var mongoose = require('./mongoose')

var schema = new mongoose.Schema({
  message: String,
  userid: Number,
  text: String,
  recommendations: Array,
  subscribed: Date
})

module.exports = mongoose.model('message', schema)
