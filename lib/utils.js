'use strict'

exports.getId = text => {
  return text.split('\n').pop().split(' ').shift().split('/').pop()
}

exports.checkId = id => {
  return /^[A-Z0-9]{6}$/.test(id)
}

exports.checkFullId = id => {
  return /^[A-Z0-9]{6}(|\/[A-Z0-9]{3})$/.test(id)
}
