require('./_header').say()
require('./_footer').say()

console.log('@FEDOG.aa')
console.log('@{FEDOG.bb}')
console.log('@{FEPACK.a}')
console.log('@{FEPACK.aa}')

console.log(1)

console.log(require('cookie').parse('foo=bar; equation=E%3Dmc%5E2'))

console.log(require('../markdown/1.md'))
console.log(require('../jade/index.jade'))

console.log(require('../sass/jsRequire.css'))


//var echarts = require('echarts');

var $ = require('jquery')
console.log($(document.body))
