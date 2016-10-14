'use strict'

exports.getId = text => {
  return text.split('\n').pop().split(' ').shift().split('/').pop()
}
