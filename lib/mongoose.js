'use strict'

var mongoose = require('mongoose')
var config = require('../config.json')

mongoose.Promise = global.Promise
mongoose.connect(config.mongodb)

module.exports = mongoose
