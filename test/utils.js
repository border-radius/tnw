'use strict'

var assert = require('assert')
var utils = require('../lib/utils')

describe('utils', () => {
  it('should get id from text', done => {
    var id = utils.getId('anonymous:\n\nподскажите пожалуйста, куда катится сраная рашка? спасибо\n\n6nw.im/p/U00HX6 #?')
    assert.equal(id, 'U00HX6')
    done()
  })

  it('should check correct id', done => {
    var result = utils.checkId('U00HX6')
    assert.equal(result, true)
    done()
  })

  it('should check incorrect id', done => {
    var result = utils.checkId('HUYPIZD')
    assert.equal(result, false)
    done()
  })

  it('should check correct full id', done => {
    var result = utils.checkFullId('U00HX6/3DS')
    assert.equal(result, true)
    done()
  })

  it('should check incorrect full id', done => {
    var result = utils.checkFullId('HUYPIZD/123')
    assert.equal(result, false)
    done()
  })
})
