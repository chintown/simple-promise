$(document).ready(function () {
  var $container = $('<div id="content"></div>').appendTo('body');
  $container.bind('onViewerPreInit', function(event) {
    // Get application object
    var viewer = event.target.repObject;

    // Remove unnecessary tabs
    // viewer.removeTab('Home');
    viewer.removeTab('About');
    viewer.removeTab('Schema');

    // Hide the tab bar
    // viewer.showTabBar(false);

    var preview = viewer.getTab('Preview');
    preview.showStats(false);
    preview.showTimeline(false);
  });
});

(function(globals) {

  var HarViewer = {
    'core': null,
    'setCore': function(core) {
      this.core = core;
    },
    'load': function(json) {
      if (typeof json === 'object') {
        json = JSON.stringify(json);
      }
      this.core.appendPreview(json);
    }
  };
  var $container = $('<div id="content"></div>').appendTo('body');
  $container.bind('onViewerPreInit', function(event) {
    // Get application object
    var viewer = event.target.repObject;
    HarViewer.setCore(viewer);

    // Remove unnecessary tabs
    viewer.removeTab('Home');
    viewer.removeTab('About');
    viewer.removeTab('Schema');

    // Hide the tab bar
    // viewer.showTabBar(false);

    var preview = viewer.getTab('Preview');
    preview.showStats(false);
    preview.showTimeline(false);
  });

  globals.HarViewer = HarViewer;
})(window, jQuery);
