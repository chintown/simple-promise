var Helper = require('./helper');

function Promise(planned) {
  this.state = new StatefulResult();
  this.logics = new LogicPack();
  this.queue = [];
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
  'then': function(fullfilledLogic, rejectedLogic) {
    // could be primative, function or object. but normally, it's a Promise
    var consumer = new Promise();
    consumer.logics = new LogicPack(fullfilledLogic, rejectedLogic);

    this.enqueue(consumer);
    return consumer;
  },
  'enqueue': function(consumer) {
    this.queue.push(consumer);
  },
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
function LogicPack(fullfilledLogic, rejectedLogic) {
  // logic could go wrong w/o fixed destination: resolve/reject
  fullfilledLogic = Helper.isFunction(fullfilledLogic) ?
                fullfilledLogic : function(value) {return value;};
  rejectedLogic = Helper.isFunction(rejectedLogic) ?
                rejectedLogic : function(reason) {throw reason;};
  this.logics = [];
  Helper.insertAt(this.logics, Promise.PENDING, null);
  Helper.insertAt(this.logics, Promise.FULFILLED, fullfilledLogic);
  Helper.insertAt(this.logics, Promise.REJECTED, rejectedLogic);
}
LogicPack.prototype = {
  'getBy': function(state) {
    return this.logics[state.type()];
  }
};

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
