(function(globals) {
  var Promise = require('promise').Promise;

  function HarLogger() {
    this.profiles = [];
    this.timers = {};
    this.metas = {};
  }
  HarLogger.prototype = {
    'phase': {
      START: 0,
      RESOLVE: 1,
      TRANSIT: 2
    },
    // -------------------------------------------------------------------------
    'log': function() {
      var args = [].slice.call(arguments);
      var method = args.shift();
      this[method].apply(this, args);
    },
    'warn': function() {
      var args = [].slice.call(arguments);
      console.warn.apply(console, args);
    },
    // -------------------------------------------------------------------------
    'start': function(promise, parentPromise) {
      this.addProfile(promise, parentPromise);
      this.startTimer(promise, 'start');
    },
    'startEnd': function(promise) {
      this.stopTimer(promise, 'start');
    },
    'resolve': function(promise, value) {
      this.startTimer(promise, 'resolve', value);
      this.addMeta(promise, 'result', value);
    },
    'resolveEnd': function(promise) {
      this.stopTimer(promise, 'resolve');
    },
    'transit': function(promise, state) {
      this.startTimer(promise, 'transit', state);
      this.addMeta(promise, 'state', state);
    },
    'transitEnd': function(promise) {
      this.stopTimer(promise, 'transit');
    },
    // -------------------------------------------------------------------------
    'addProfile': function(promise, parentPromise) {
      var profile = {
        startDateTime: this._getIsoStamp(),
        name: promise.name,
        parentName: parentPromise ? parentPromise.name : ''
      };
      this.profiles.push(profile);
    },
    'addMeta': function(promise, name, value) {
      if (!(promise.name in this.metas)) {
        this.metas[promise.name] = [];
      }
      var meta = {
        'name': name,
        'value': value
      };
      this.metas[promise.name].push(meta);
    },
    'startTimer': function(promise, name) {
      if (!(promise.name in this.timers)) {
        this.timers[promise.name] = {};
      }
      var timer = this.timers[promise.name];
      timer[name] = Date.now();
    },
    'stopTimer': function(promise, name) {
      if (!(promise.name in this.timers)) {
        console.warn('stopTimer: wrong timer name: `%o`', name);
      }
      var timer = this.timers[promise.name];
      var now = new Date();
      // var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      // if (timer[name] > today) {
        timer[name] = Date.now() - timer[name];
      // }
    },
    // -------------------------------------------------------------------------
    'export': function() {
      var PAGEID = '0';
      var fromNames = ['start', 'resolve', 'transit'];
      var toNames = ['blocked', 'dns', 'send'];
      var log = {
        'version': '1.1',
        'creator': {
          'name': 'PromiseHarLogger',
          'version': '1.0.0'
        },
        'pages': [{
          'startedDateTime': '',
          'id': PAGEID,
          'title': 'Promises',

          'pageTimings': {
            'onContentLoad': -1,
            'onLoad': -1,
          },
        }],
        'entries': []
      };
      for (var i = 0; i < this.profiles.length; i++) {
        var profile = this.profiles[i];
        var entry = {
          pageref: PAGEID,
          'startedDateTime': profile.startDateTime,
          'time': 0,
          'request': {
            'method': profile.parentName,
            'url': '<- ' + profile.name,

            'httpVersion': 'HTTP/1.1',
            'cookies': [],
            'headers': [],
            'queryString': [],
            'headersSize': 0,
            'bodySize': 0
          },
          'response': {
            'status': Promise.PENDING,
            'statusText': this._getStateName(Promise.PENDING),
            'content': {
              'mimeType': 'text/plain; charset=utf-8',
              'text': '',
              'size': 0
            },

            'httpVersion': 'HTTP/1.1',
            'cookies': [],
            'headers': [],
            'headersSize': 0,
            'bodySize': 0,
            'redirectURL': ''
          },
          'timings': {},
          'cache': {}
        };
        if (i == 0) {
          log.pages[0].startedDateTime = profile.startDateTime;
        }
        // ---------------------------------------------------------------------
        var isIncomplete = false;
        var totalTime = 0;
        var fromTimings = this.timers[profile.name];
        var toTimings = {
          blocked: 0, dns: 0, connect: 0, send: 1, wait: 0, receive: 0, ssl: 0
        };
        for (var j = 0; j < fromNames.length; j++) {
          var msec = fromTimings[fromNames[j]];
          if (typeof msec === 'undefined') {
            isIncomplete = true;
            break;
          }
          toTimings[toNames[j]] = msec;
          totalTime += msec;
        }
        entry.time = totalTime;
        entry.timings = toTimings;
        // ---------------------------------------------------------------------
        var result = this.metas[profile.name];
        if (result) {
          for (var j = 0; j < result.length; j++) {
            var pair = result[j];
            if (pair.name == 'state') {
              entry.response.status = pair.value;
              entry.response.statusText = this._getStateName(pair.value);
            } else if (pair.name == 'result') {
              entry.response.content.text = JSON.stringify(pair.value);
            }
          }
        }
        // ---------------------------------------------------------------------
        if (!isIncomplete) { // XXX
          log.entries.push(entry);
        }
      }
      return {log: log};
    },
    // -------------------------------------------------------------------------
    '_funcBody': function(fn) {
      if (!fn) {
        return '<undefined>';
      }
      return fn.toString();//.replace(this.ptnNewLine, "\n");
    },
    '_getStateName': function(state) {
      var stateName = 'PENDING';
      if (state === Promise.FULFILLED) {
        stateName = 'FULFILLED';
      } else if (state == Promise.REJECTED) {
        stateName = 'REJECTED';
      }
      return stateName;
    },
    '_getIsoStamp': function() {
      return (new Date()).toISOString();
    }
    // -------------------------------------------------------------------------
  };
  globals.HarLogger = HarLogger;
})(window);
