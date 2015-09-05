var Helper = require('./helper');

function Promise(planned) {
  this.state = new StatefulResult();
  this.logics = new LogicPack();
  this.queue = [];

  if (Helper.isDefined(planned)) {
    this.attempt(planned);
  }
}
Promise.PENDING = 0;
Promise.FULFILLED = 1;
Promise.REJECTED = 2;
Promise.prototype = {
  'constructor': Promise,
  // ---------------------------------------------------------------------------
  // 1. ENTRY - PRODUCE RESULT. NOT STATE
  // ---------------------------------------------------------------------------
  'attempt': function(planned) {
    // planned has it's input, logic and fixed destination: fullfiled / rejected
    // `attempt` gives it the actual logic of it's destination
    var resolver = this.resolver.bind(this);
    var rejector = this.rejector.bind(this);
    planned(resolver, rejector);
  },
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

    this.tryFeedConsumers();
  },
  // ---------------------------------------------------------------------------
  // 2. PRODUCE STATE BY RESULT (VALUE/REASON)
  // ---------------------------------------------------------------------------
  'resolver': function(value) {
    if (value === this) {
      this.transitAsRejected(
        new TypeError('The promise and its value refer to the same object')
      );
    } else if (Promise.isPromise(value)) {
      this.resolvePromise(value);
    } else if (Helper.isObject(value) || Helper.isFunction(value)) {
      this.probCallableThenProperty(value, // reject if exception happened
        function(self, callableThen) {
          if (Helper.isFunction(callableThen)) {
            self.resolveCallableThen(value, callableThen);
          } else {
            self.transitAsFullfilled(value);
          }
        }
      );
    } else {
      this.transitAsFullfilled(value);
    }
  },
  'resolvePromise': function(userPromise) {
    // host user promise by giving final resolving routes
    var userState = userPromise.state;
    if (!userState.isReady()) {
      // usually, then accepts plain `logics`,
      // but we inject plans
      userPromise.then(
        this.resolver.bind(this), // plan to guild execution flow back to self
        this.rejector.bind(this)  // plan to guild execution flow back to self
      );
    } else {
      this.transit(userState.type(), userState.value());
    }
  },
  'resolveCallableThen': function(context, callablethen) {
    var quota = Helper.makeQuota(1);
    var resolver = Helper.limitCall(this, this.resolver, quota);
    var rejector = Helper.limitCall(this, this.rejector, quota);

    try {
      callablethen.call(context,
        resolver,
        rejector
      );
    } catch (e) {
      rejector(e);
    }
  },
  'rejector': function(reason) {
    this.transitAsRejected(reason);
  },
  'probCallableThenProperty': function(value, onProbed) {
    // never access twice. side effect may be invovled from object getter
    try {
      var then = value.then;
      onProbed(this, then);
    } catch (e) {
      this.transitAsRejected(e);
    }
  },
  // ---------------------------------------------------------------------------
  // 3. HANDLE STATE + RESULT
  // ---------------------------------------------------------------------------
  'transitAsFullfilled': function(value) {
    this.transit(Promise.FULFILLED, value);
  },
  'transitAsRejected': function(reason) {
    this.transit(Promise.REJECTED, reason);
  },
  'transit': function(state, result) {
    if (this.state.isReady() ||
        this.state.type() === state ||
        !StatefulResult.isValid(this.state)
          ) {
      this.warn('transit: `%s`:`%s` => `%s`:`%s`. SKIP',
                  this.state.type(), this.state.value(), state, result);
      return;
    }

    this.state = new StatefulResult(state, result);

    this.tryFeedConsumers();
  },
  // ---------------------------------------------------------------------------
  // 4. PASS STATE + RESULT TO NEXT POSSIBLE PROMISES
  // ---------------------------------------------------------------------------
  'tryFeedConsumers': function() {
    if (!this.state.isReady()) {
      this.warn('tryFeedConsumers: state is PENDING. abort.');
      return;
    }

    var producer = this;
    Helper.asyncCall(function() {
      while (producer.queue.length) {
        var consumer = producer.queue.shift();

        var planned = Promise.makeConsumingPlan(producer, consumer);
        consumer.attempt(planned);
      }
    });
  },
  // ---------------------------------------------------------------------------
  'log': function() {
    var args = [].slice.call(arguments);
    var prefix = this.name ? ['[', this.name, ']'] : [];
    args = prefix.concat(args);
    // this.log.apply(console, args);
  },
  'warn': function() {
    var args = [].slice.call(arguments);
    args = ['[', this.name, ']'].concat(args);
    // this.log.apply(console, args);
  }
};
Promise.makeConsumingPlan = function(producer, consumer) {
  return Promise.planned(function() {
    var input = producer.state.value();
    var logic = consumer.logics.getBy(producer.state.type());
    return logic(input);
  });
};
Promise.planned = function(logic) {
  // logic only considers input and output.
  // it might go with error or expections
  return function(resolver, rejector) {
    try {
      resolver(logic());
    } catch (e) {
      rejector(e);
    }
  };
};
Promise.isPromise = function(candidate) {
  return Helper.isDefined(candidate) &&
          candidate.constructor == Promise;
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
    return this.logics[state];
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
