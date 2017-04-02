'use strict'

function checkFullId (id) {
	return /^[A-Z0-9]{6}(|\/[A-Z0-9]{3})$/.test(id)
}

exports.getId = text => {
	var lastStringId = text.split('\n').pop().split('#')[1].trim()
	var lastStringPartId = text.split('\n').pop().split('/').pop().replace('#', '/').trim()

	return checkFullId(lastStringId) ? lastStringId : lastStringPartId
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

exports.checkFullId = checkFullId

exports.getCorrectUrl = url => {
	return url ? url : 'https://6nw.im/p/'
}
