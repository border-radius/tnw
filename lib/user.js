'use strict'

var mongoose = require('./mongoose')

var schema = new mongoose.Schema({
	id: Number,
	token: String,
	bnw_username: String,
	first_name: String,
	last_name: String,
	username: String,
	subscribed: Date,
	blacklist: Array,
	bnw_url: String,
	anon: Boolean
})

module.exports = mongoose.model('user', schema)
