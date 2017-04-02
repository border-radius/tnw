'use strict'

exports.getId = text => {
	return text.split('\n').pop().split('#')[1].trim()
}

exports.checkUrl = url => {
	return /http.?:\/\/.*\/p\/$/.test(url)
}

exports.checkFullUrl = url => {
	return /http.?:\/\/.*\/p\/[A-Z0-9]{6}(|#[A-Z0-9]{3})$/.test(url)
}

exports.checkId = id => {
	return /^[A-Z0-9]{6}$/.test(id)
}

exports.checkFullId = id => {
	return /^[A-Z0-9]{6}(|\/[A-Z0-9]{3})$/.test(id)
}
