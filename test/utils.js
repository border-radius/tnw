'use strict'

var assert = require('assert')
var utils = require('../lib/utils')

describe('utils', () => {
  it('should get id from text', done => {
    var id = utils.getId('anonymous:\n\nподскажите пожалуйста, куда катится сраная рашка? спасибо\n\n6nw.im/p/U00HX6 #?')
    assert.equal(id, 'U00HX6')
    done()
  })
})
