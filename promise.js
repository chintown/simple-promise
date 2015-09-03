var Helper = require('./helper');

function Promise(planned) {
}
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
