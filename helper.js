var Helper = {
  'isDefined': function isDefined() {
    var args = [].slice.call(arguments);
    if (args.length == 1) {
      return typeof args[0] !== 'undefined' && args[0] !== null;
    } else if (args.length == 2) {
      return Helper.isDefined(args[0]) &&
              args[1] in args[0] &&
              args[0][args[1]] !== null;
    }
  },
  'isFunction': function(candidate) {
    return Helper.isDefined(candidate) && typeof candidate === 'function';
  },
  'isObject': function(candidate) {
    return Helper.isDefined(candidate) && typeof candidate === 'object';
  },
  'insertAt': function(arr, idx, item) {
    arr.splice(idx, 0, item);
  },
  'asyncCall': function(fn) {
    setTimeout(fn, 0);
  },
  'makeQuota': function(amount) {
    return Object.create({value: amount},
      {isEnough: {get: function() {return this.value--;}}}
    );
  },
  'limitCall': function(context, callable, quota) {
    return function() {
      if (!quota.isEnough) {
        return;
      }
      var args = [].slice.call(arguments);
      callable.apply(context, args);
    };
  }
};

module.exports = Helper;
