var Helper = require('./helper');

function Promise(planned) {
  this.state = new StatefulResult();
}
Promise.PENDING = 0;
Promise.FULFILLED = 1;
Promise.REJECTED = 2;
Promise.prototype = {
  'constructor': Promise,
  // ---------------------------------------------------------------------------
  // 1. ENTRY - PRODUCE RESULT. NOT STATE
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 1. ENTRY - EXTEND CONSUMER.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 2. PRODUCE STATE BY RESULT (VALUE/REASON)
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 3. HANDLE STATE + RESULT
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 4. PASS STATE + RESULT TO NEXT POSSIBLE PROMISES
  // ---------------------------------------------------------------------------
};
// -----------------------------------------------------------------------------
function StatefulResult(state, result) {
  this.state = state || Promise.PENDING;
  this.result = result; // XXX never change it even it's falsy
}
StatefulResult.isValid = function(state) {
  return Promise.PENDING <= state.type() && state.type() <= Promise.REJECTED;
};
StatefulResult.prototype = {
  'isReady': function() {
    return this.state !== Promise.PENDING;
  },
  'type': function() {
    return this.state;
  },
  'value': function() {
    return this.result;
  }
};
// -----------------------------------------------------------------------------

module.exports = {
  resolved: function(value) {
    return new Promise(function(resolve) {
      resolve(value);
    });
  },
  rejected: function(reason) {
    return new Promise(function(resolve, reject) {
      reject(reason);
    });
  },
  deferred: function() {
    var exportedResolve;
    var exportedReject;

    return {
      promise: new Promise(function(internalResolve, internalReject) {
        exportedResolve = internalResolve;
        exportedReject = internalReject;
      }),
      resolve: exportedResolve,
      reject: exportedReject
    };
  }
};
