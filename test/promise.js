var testRunner = require('promises-aplus-tests');
var adapter = require('../src/promise.js');

testRunner(adapter, function(err) {
  if (err) {console.log(err);}
});
