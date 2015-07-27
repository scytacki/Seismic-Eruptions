(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var has = ({}).hasOwnProperty;

  var aliases = {};

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf('components/' === 0)) {
        start = 'components/'.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return 'components/' + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var expand = (function() {
    var reg = /^\.\.?(\/|$)/;
    return function(root, name) {
      var results = [], parts, part;
      parts = (reg.test(name) ? root + '/' + name : name).split('/');
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part === '..') {
          results.pop();
        } else if (part !== '.' && part !== '') {
          results.push(part);
        }
      }
      return results.join('/');
    };
  })();
  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';
    path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  globals.require = require;
})();
require.define({"2D/BaseMapLayerManager": function(exports, require, module) {
  
/*
A class to swap out different base maps
Note: There's supposed to be a controller and provider that feeds into here, but NOTE: I've
skipped them both for rapid prototyping.
 */
var BaseMapLayerManager, BaseMapSelectorUI, MapView, NNode, SessionController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

BaseMapSelectorUI = require("./BaseMapSelectorUI");

MapView = require("./MapView");

SessionController = require("./SessionController");

module.exports = new (BaseMapLayerManager = (function(superClass) {
  extend(BaseMapLayerManager, superClass);

  function BaseMapLayerManager() {
    BaseMapLayerManager.__super__.constructor.apply(this, arguments);
    this.streetMap = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {});
    this.satelliteMap = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png', {
      subdomains: ['otile1', 'otile2', 'otile3', 'otile4']
    });
    this.earthquakeDensityMap = L.tileLayer('http://{s}.tiles.mapbox.com/v3/bclc-apec.map-rslgvy56/{z}/{x}/{y}.png', {});
    this.sessionController = SessionController;
    this.baseLayer = "satellite";
    this.previousBaseLayer = null;
    this.mapView = MapView;
    this.baseMapSelector = BaseMapSelectorUI;
    this.baseMapSelector.subscribe("update", (function(_this) {
      return function(value) {
        _this.baseLayer = value;
        _this.updateBaseLayer();
        return _this.updateSession();
      };
    })(this));
    this.sessionController.subscribe("update", (function(_this) {
      return function(session) {
        _this.baseLayer = session.baseLayer;
        return _this.updateBaseLayer();
      };
    })(this));
    this.updateBaseLayer();
    this.updateSession();
  }

  BaseMapLayerManager.prototype.updateSession = function() {
    return this.sessionController.tell("append", {
      baseLayer: this.baseLayer
    });
  };

  BaseMapLayerManager.prototype.updateBaseLayer = function() {
    this.baseMapSelector.tell("set", this.baseLayer);
    if (this.previousBaseLayer !== this.baseLayer) {
      if (this.previousBaseLayer != null) {
        this.mapView.tell("remove-layer", this.getLayer(this.previousBaseLayer));
      }
      this.mapView.tell("add-layer", this.getLayer(this.baseLayer));
      return this.previousBaseLayer = this.baseLayer;
    }
  };

  BaseMapLayerManager.prototype.getLayer = function(name) {
    switch (name) {
      case "street":
        return this.streetMap;
      case "satellite":
        return this.satelliteMap;
      case "density":
        return this.earthquakeDensityMap;
    }
  };

  return BaseMapLayerManager;

})(NNode));


}});

require.define({"2D/BaseMapSelectorUI": function(exports, require, module) {
  
/*
A class to manage the base map selector
 */
var BaseMapSelectorUI, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (BaseMapSelectorUI = (function(superClass) {
  extend(BaseMapSelectorUI, superClass);

  function BaseMapSelectorUI() {
    var preventChangeFromHappenningHack;
    BaseMapSelectorUI.__super__.constructor.apply(this, arguments);
    preventChangeFromHappenningHack = false;
    this.baseMapSelector = $("#base-map-selector");
    this.baseMapSelector.on("change", (function(_this) {
      return function() {
        if (!preventChangeFromHappenningHack) {
          return _this.post("update", _this.baseMapSelector.val());
        }
      };
    })(this));
    this.listen("set", (function(_this) {
      return function(value) {
        preventChangeFromHappenningHack = true;
        _this.baseMapSelector.val(value).selectmenu("refresh");
        return preventChangeFromHappenningHack = false;
      };
    })(this));
  }

  return BaseMapSelectorUI;

})(NNode));


}});

require.define({"2D/BoundariesLayerManager": function(exports, require, module) {
  
/*
A class to add or remove the boundaries layer
Note: There's supposed to be a controller and provider that feeds into here, but NOTE: I've
skipped them both for rapid prototyping.
 */
var BoundariesLayerManager, BoundariesToggleUI, MapView, NNode, SessionController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

BoundariesToggleUI = require("./BoundariesToggleUI");

MapView = require("./MapView");

SessionController = require("./SessionController");

module.exports = new (BoundariesLayerManager = (function(superClass) {
  extend(BoundariesLayerManager, superClass);

  function BoundariesLayerManager() {
    BoundariesLayerManager.__super__.constructor.apply(this, arguments);
    this.boundariesLayer = new L.KML("plates.kml", {
      async: true
    });
    this.boundariesVisible = false;
    this.boundariesPreviouslyVisible = false;
    this.sessionController = SessionController;
    this.mapView = MapView;
    this.boundariesToggle = BoundariesToggleUI;
    this.boundariesToggle.subscribe("update", (function(_this) {
      return function(value) {
        _this.boundariesVisible = value;
        _this.updateBoundaries();
        return _this.updateSession();
      };
    })(this));
    this.sessionController.subscribe("update", (function(_this) {
      return function(session) {
        _this.boundariesVisible = session.boundariesVisible;
        return _this.updateBoundaries();
      };
    })(this));
    this.updateSession();
  }

  BoundariesLayerManager.prototype.updateSession = function() {
    return this.sessionController.tell("append", {
      boundariesVisible: this.boundariesVisible
    });
  };

  BoundariesLayerManager.prototype.updateBoundaries = function() {
    this.boundariesToggle.tell("set", this.boundariesVisible);
    if (this.boundariesVisible) {
      if (!this.boundariesPreviouslyVisible) {
        this.mapView.tell("add-layer", this.boundariesLayer);
      }
    } else {
      if (this.boundariesPreviouslyVisible) {
        this.mapView.tell("remove-layer", this.boundariesLayer);
      }
    }
    return this.boundariesPreviouslyVisible = this.boundariesVisible;
  };

  return BoundariesLayerManager;

})(NNode));


}});

require.define({"2D/BoundariesToggleUI": function(exports, require, module) {
  
/*
A class to manage the boundaries toggle switch
 */
var BoundariesToggleUI, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (BoundariesToggleUI = (function(superClass) {
  extend(BoundariesToggleUI, superClass);

  function BoundariesToggleUI() {
    var preventChangeFromHappenningHack;
    BoundariesToggleUI.__super__.constructor.apply(this, arguments);
    preventChangeFromHappenningHack = false;
    this.plateToggle = $("#plate-toggle");
    this.plateToggle.on("change", (function(_this) {
      return function() {
        if (!preventChangeFromHappenningHack) {
          return _this.post("update", _this.plateToggle.parent().hasClass("ui-flipswitch-active"));
        }
      };
    })(this));
    this.listen("set", (function(_this) {
      return function(value) {
        preventChangeFromHappenningHack = true;
        if (value) {
          _this.plateToggle.parent().addClass("ui-flipswitch-active");
        } else {
          _this.plateToggle.parent().removeClass("ui-flipswitch-active");
        }
        return preventChangeFromHappenningHack = false;
      };
    })(this));
  }

  return BoundariesToggleUI;

})(NNode));


}});

require.define({"2D/CacheFilter": function(exports, require, module) {
  
/*
CacheFilter - a class to receive data from the web and cache it all up, and serve it to the filters
that come after.

TODO: FIXME: HACK: NOTE: THIS CLASS IS HALF-BAKED at the moment
 */
var CacheFilter, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (CacheFilter = (function(superClass) {
  extend(CacheFilter, superClass);

  function CacheFilter() {
    CacheFilter.__super__.constructor.apply(this, arguments);
    setTimeout((function(_this) {
      return function() {
        return $.ajax("earthquakeSeed.json").done(function(data) {
          return _this.post("stream", data.features);
        });
      };
    })(this), 200);
  }

  return CacheFilter;

})(NNode));


}});

require.define({"2D/ControlsManager": function(exports, require, module) {
  
/*
Manages the showing/hiding of the bottom bar
 */
var App, ControlsUI, NNode, SessionController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

ControlsUI = require("./ControlsUI");

SessionController = require("./SessionController");

module.exports = new (App = (function(superClass) {
  extend(App, superClass);

  function App() {
    App.__super__.constructor.apply(this, arguments);
    this.controlsUI = ControlsUI;
    this.sessionController = SessionController;
    this.controlsVisible = true;
    this.controls = $("#controls");
    this.showControls = $("#show-controls");
    this.controlsUI.subscribe("update", (function(_this) {
      return function() {
        _this.controlsVisible = !_this.controlsVisible;
        _this.updateControlVisibility();
        return _this.updateSession();
      };
    })(this));
    this.sessionController.subscribe("update", (function(_this) {
      return function(session) {
        _this.controlsVisible = session.controlsVisible;
        return _this.updateControlVisibility();
      };
    })(this));
    this.updateSession();
    this.updateControlVisibility();
  }

  App.prototype.updateSession = function() {
    return this.sessionController.tell("append", {
      controlsVisible: this.controlsVisible
    });
  };

  App.prototype.updateControlVisibility = function() {
    if (this.controlsVisible) {
      this.controls.finish().slideDown(300);
      return this.showControls.finish().fadeOut(300);
    } else {
      this.controls.finish().slideUp(300);
      return this.showControls.finish().fadeIn(300);
    }
  };

  return App;

})(NNode));


}});

require.define({"2D/ControlsUI": function(exports, require, module) {
  
/*
Represents the two show/hide chevron buttons
 */
var ControlsUI, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (ControlsUI = (function(superClass) {
  extend(ControlsUI, superClass);

  function ControlsUI() {
    ControlsUI.__super__.constructor.apply(this, arguments);
    this.showButton = $("#show-controls");
    this.hideButton = $("#hide-controls");
    this.showButton.add(this.hideButton).click((function(_this) {
      return function() {
        return _this.post("update");
      };
    })(this));
  }

  return ControlsUI;

})(NNode));


}});

require.define({"2D/DataFormatter": function(exports, require, module) {
  
/*
A class that contains helper methods to determine how earthquake data is formatted
in terms of depth --> color and magnitude --> radius
 */
var DataFormatter, monthArray, rainbow;

rainbow = new Rainbow();

monthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

module.exports = DataFormatter = (function() {
  function DataFormatter() {}

  DataFormatter.MAX_DEPTH = 700;

  DataFormatter.depthToColor = function(depth) {
    rainbow.setNumberRange(0, DataFormatter.MAX_DEPTH);
    return "#" + (rainbow.colourAt(depth));
  };

  DataFormatter.magnitudeToRadius = function(magnitude) {
    return 0.9 * Math.pow(1.5, magnitude - 1);
  };

  DataFormatter.formatMagnitude = function(magnitude) {
    return magnitude.toFixed(1);
  };

  DataFormatter.formatDate = function(dateNumber) {
    var date;
    date = new Date(dateNumber);
    return monthArray[date.getMonth()] + " " + (date.getDate()) + ", " + (date.getFullYear());
  };

  return DataFormatter;

})();


}});

require.define({"2D/DateFilter": function(exports, require, module) {
  
/*
DateFilter - a class to receive a bunch of earthquakes, and pass on the ones that lie in between
the set date ranges.

Before we begin, let's get a visual picture of what's going on here.

## FILTER DATA FLOW DIAGRAM ##

+---------------------------------+
| Another node that is our input  |
+---------------------------------+
   inputNode     ||            ^ inputNode
   .subscribe()  \/            | .tell()
+---------------------------------+
| * The filter in consideration * |
+---------------------------------+
         @post() ||            ^ @listen()
                 \/            |
+---------------------------------+
| Another node that is our output |
+---------------------------------+

The majority of data (the general data flow) is shown by the thick arrows in the center.
The control flow follows the thinner arrows on the right.
NOTE that the listed methods pertain to the filter in consideration, which is our current class.

## FILTER OPERATIONS OVERVIEW ##

A filter is a device designed to take some input and remove something from it to provide as output.
In this case, we're removing earthquakes that don't fall within a date range.

Now, these fliters are designed with the web in mind. They're designed to be asynchonous and accept
data points in chunks as they arrive over a web connection. This chunk-based data flow I will call
streaming. Streaming does has a downside though. Because data flows around in chunks, it can be hard
to get a grand picture of what the entire data set looks like at a given time, say, to plot all the
points that have arrived thus far. As such, each filter has a cache. Each time a chunk (which should
contain new data points only) gets sent to the filter, those points are added to the cache.

Now why did I choose to use a per-filter cache? Why not one at the very end of the filter chain?
It's because I figured we'd need to deal with changing filter parameters. Every time a filter's
parameters change, it may output different information. For example, let's say that the date range
was expanded by the user, from 1900-1950 to 1900-2000. That just added 50 years of earthquake
points to our filter's output. All that needs to be done in this case is to send a chunk
of earthquakes from 1950-2000 to the subsequent filter, and it's good to go, the same way as if it
were to receive a new set of data from the web. This new data will propagate down the chain and
eventually reflect in the map.

However, let's use the flipside of that example and say that the date range was contracted from
1900-2000 back to 1900-1950. Now the points between 1950-2000 residing in the subsequent filter's
cache are invalid, and don't pertain to our current filter parameters. They need to be removed
somehow. The efficient option would be to inform the filter that these points are invalid,
completing a diff-like system, but I've opted for a less efficient but easier to code method of
completely clearing the subsequent filter's cache, then refilling it manually with data that
passes the current filter. I deem this process flushing.

That just about sums up the mechanics of the filter.
 */
var DateFilter, DateFilterController, MagnitudeFilter, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

MagnitudeFilter = require("./MagnitudeFilter");

DateFilterController = require("./DateFilterController");

module.exports = new (DateFilter = (function(superClass) {
  extend(DateFilter, superClass);

  function DateFilter() {
    DateFilter.__super__.constructor.apply(this, arguments);
    this.controller = DateFilterController;
    this.startDate = -Infinity;
    this.endDate = Infinity;
    this.controller.subscribe("update", (function(_this) {
      return function(updatedFilter) {
        var additionalPoints;
        if (updatedFilter.startDate > _this.startDate || updatedFilter.endDate < _this.endDate) {
          _this.post("flush", _this.filterDates(_this.cachedData, updatedFilter.startDate, updatedFilter.endDate));
        } else {
          additionalPoints = [];
          _this.filterDates(_this.cachedData, updatedFilter.startDate, _this.startDate, additionalPoints);
          _this.filterDates(_this.cachedData, _this.endDate, updatedFilter.endDate, additionalPoints);
          if (additionalPoints.length > 0) {
            _this.post("stream", additionalPoints);
          }
        }
        _this.startDate = updatedFilter.startDate;
        return _this.endDate = updatedFilter.endDate;
      };
    })(this));
    this.cachedData = [];
    this.inputNode = MagnitudeFilter;
    this.inputNode.subscribe("stream", (function(_this) {
      return function(newData) {
        var i, len, point;
        for (i = 0, len = newData.length; i < len; i++) {
          point = newData[i];
          _this.cachedData.push(point);
        }
        return _this.post("stream", _this.filterDates(newData, _this.startDate, _this.endDate));
      };
    })(this));
    this.inputNode.subscribe("flush", (function(_this) {
      return function(freshData) {
        _this.cachedData = freshData;
        return _this.post("flush", _this.filterDates(_this.cachedData, _this.startDate, _this.endDate));
      };
    })(this));
    this.inputNode.tell("request-update");
  }


  /*
  Creates a new array and fills it with the dataset, diced with given parameters
  Note: startDate is inclusive, endDate is exclusive
   */

  DateFilter.prototype.filterDates = function(data, startDate, endDate, newArray) {
    var i, len, point, ref;
    if (newArray == null) {
      newArray = [];
    }
    for (i = 0, len = data.length; i < len; i++) {
      point = data[i];
      if ((startDate <= (ref = point.properties.time) && ref < endDate)) {
        newArray.push(point);
      }
    }
    return newArray;
  };

  return DateFilter;

})(NNode));


}});

require.define({"2D/DateFilterController": function(exports, require, module) {
  
/*
A class to manage the date filter, connecting the data filter to the
 * UI date range slider, playback slider, and the animation of date range
 */
var DataFormatter, DateFilterController, DateRangeSliderUI, NNode, PlaybackController, SessionController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

PlaybackController = require("./PlaybackController");

DateRangeSliderUI = require("./DateRangeSliderUI");

DataFormatter = require("./DataFormatter");

SessionController = require("./SessionController");

module.exports = new (DateFilterController = (function(superClass) {
  extend(DateFilterController, superClass);

  DateFilterController.MIN_DATE = (new Date(1900, 0)).valueOf();

  DateFilterController.MAX_DATE = Date.now();

  function DateFilterController() {
    DateFilterController.__super__.constructor.apply(this, arguments);
    this.startDate = new Date(1960, 0).valueOf();
    this.endDate = DateFilterController.MAX_DATE;
    this.animatedEndDate = DateFilterController.MAX_DATE;
    this.sessionController = SessionController;
    this.playbackController = PlaybackController;
    this.playbackController.subscribe("update", (function(_this) {
      return function(progress) {
        _this.animatedEndDate = progress * (_this.endDate - _this.startDate) + _this.startDate;
        _this.limitDatesJustInCase();
        _this.postControllerChanges();
        _this.updatePlaybackSliderTextOnly();
        return _this.updateSession();
      };
    })(this));
    this.dateRangeSlider = DateRangeSliderUI;
    this.dateRangeSlider.tell("configure", {
      startYear: (new Date(DateFilterController.MIN_DATE)).getFullYear(),
      endYear: (new Date(DateFilterController.MAX_DATE)).getFullYear(),
      yearStep: 1,
      initialStartYear: (new Date(this.startDate)).getFullYear(),
      initialEndYear: (new Date(this.endDate)).getFullYear()
    });
    this.dateRangeSlider.subscribe("update-start", (function(_this) {
      return function(start) {
        _this.startDate = (new Date(start, 0)).valueOf();
        _this.limitDatesJustInCase();
        _this.postControllerChanges();
        _this.updateDateRange();
        _this.updatePlaybackSlider();
        return _this.updateSession();
      };
    })(this));
    this.dateRangeSlider.subscribe("update-end", (function(_this) {
      return function(end) {
        _this.endDate = (new Date(end, 11, 31)).valueOf();
        _this.animatedEndDate = Infinity;
        _this.limitDatesJustInCase();
        _this.postControllerChanges();
        _this.updateDateRange();
        _this.updatePlaybackSlider();
        return _this.updateSession();
      };
    })(this));
    this.listen("request-update", this.postControllerChanges);
    this.sessionController.subscribe("update", (function(_this) {
      return function(session) {
        _this.startDate = session.startDate, _this.animatedEndDate = session.animatedEndDate, _this.endDate = session.endDate;
        _this.limitDatesJustInCase();
        _this.postControllerChanges();
        _this.updateDateRange();
        return _this.updatePlaybackSlider();
      };
    })(this));
    this.updatePlaybackSlider();
    this.updateDateRange();
    this.updateSession();
  }

  DateFilterController.prototype.updateSession = function() {
    return this.sessionController.tell("append", {
      startDate: this.startDate,
      animatedEndDate: this.animatedEndDate,
      endDate: this.endDate
    });
  };

  DateFilterController.prototype.limitDatesJustInCase = function() {
    this.endDate = Math.min(this.endDate, DateFilterController.MAX_DATE);
    this.startDate = Math.max(this.startDate, DateFilterController.MIN_DATE);
    return this.animatedEndDate = Math.round(Math.min(Math.max(this.animatedEndDate, this.startDate), this.endDate));
  };

  DateFilterController.prototype.postControllerChanges = function() {
    return this.post("update", {
      startDate: this.startDate,
      endDate: this.animatedEndDate
    });
  };

  DateFilterController.prototype.updatePlaybackSliderTextOnly = function() {
    return this.playbackController.tell("set-text", "" + (DataFormatter.formatDate(this.animatedEndDate)));
  };

  DateFilterController.prototype.updatePlaybackSlider = function() {
    var days, msBetweenStartAndEnd, msPerDay;
    this.playbackController.tell("set", (this.animatedEndDate - this.startDate) / (this.endDate - this.startDate));
    msBetweenStartAndEnd = this.endDate - this.startDate;
    msPerDay = 1000 * 60 * 60 * 24;
    days = (msBetweenStartAndEnd / msPerDay) | 0;
    this.playbackController.tell("set-step", 1 / days);
    return this.updatePlaybackSliderTextOnly();
  };

  DateFilterController.prototype.updateDateRange = function() {
    var endYear, startYear;
    startYear = (new Date(this.startDate)).getFullYear();
    endYear = (new Date(this.endDate)).getFullYear();
    this.dateRangeSlider.tell("set-text", startYear + " and " + endYear);
    return this.dateRangeSlider.tell("set", startYear, endYear);
  };

  return DateFilterController;

})(NNode));


}});

require.define({"2D/DateRangeSliderUI": function(exports, require, module) {
  var DateRangeSliderUI, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (DateRangeSliderUI = (function(superClass) {
  extend(DateRangeSliderUI, superClass);

  function DateRangeSliderUI() {
    var preventChangeFromHappenningHack;
    DateRangeSliderUI.__super__.constructor.apply(this, arguments);
    preventChangeFromHappenningHack = false;
    this.dateSliderStart = $("#date-slider-start");
    this.dateSliderEnd = $("#date-slider-end");
    this.dateSliderReadout = $("#date-slider-readout");
    this.listen("configure", (function(_this) {
      return function(options) {
        var endYear, startYear, yearStep;
        startYear = options.startYear, endYear = options.endYear, yearStep = options.yearStep;
        return _this.dateSliderStart.add(_this.dateSliderEnd).attr("min", startYear).attr("max", endYear).attr("step", yearStep);
      };
    })(this));
    this.listen("set", (function(_this) {
      return function(startVal, endVal) {
        preventChangeFromHappenningHack = true;
        _this.dateSliderStart.val(startVal);
        _this.dateSliderEnd.val(endVal);
        _this.dateSliderStart.add(_this.dateSliderEnd).slider("refresh");
        return preventChangeFromHappenningHack = false;
      };
    })(this));
    this.dateSliderStart.on("change", (function(_this) {
      return function() {
        if (!preventChangeFromHappenningHack) {
          return _this.post("update-start", parseInt(_this.dateSliderStart.val()));
        }
      };
    })(this));
    this.dateSliderEnd.on("change", (function(_this) {
      return function() {
        if (!preventChangeFromHappenningHack) {
          return _this.post("update-end", parseInt(_this.dateSliderEnd.val()));
        }
      };
    })(this));
    this.listen("set-text", (function(_this) {
      return function(text) {
        return _this.dateSliderReadout.text(text);
      };
    })(this));
  }

  return DateRangeSliderUI;

})(NNode));


}});

require.define({"2D/EarthquakeLayerManager": function(exports, require, module) {
  
/*
EarthquakeLayerManager - A class to manage the Leaflet earthquake layer and populate it with points
from the filters that lead into it
TODO: HORRIBLY INCOMPLETE
 */
var DataFormatter, DateFilter, EarthquakeLayerManager, MapView, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

DateFilter = require("./DateFilter");

MapView = require("./MapView");

DataFormatter = require("./DataFormatter");

module.exports = new (EarthquakeLayerManager = (function(superClass) {
  extend(EarthquakeLayerManager, superClass);

  function EarthquakeLayerManager() {
    EarthquakeLayerManager.__super__.constructor.apply(this, arguments);
    this.inputNode = DateFilter;
    this.mapView = MapView;
    this.earthquakesLayer = null;
    this.cachedData = [];
    this.inputNode.subscribe("stream", (function(_this) {
      return function(newData) {
        var i, len, point;
        for (i = 0, len = newData.length; i < len; i++) {
          point = newData[i];
          _this.cachedData.push(point);
        }
        return _this.addToLayer(newData);
      };
    })(this));
    this.inputNode.subscribe("flush", (function(_this) {
      return function(freshData) {
        _this.cachedData = freshData;
        return _this.flushLayer(freshData);
      };
    })(this));
    this.flushLayer();
    this.flushDeferTimer = null;
  }

  EarthquakeLayerManager.FLUSH_DEFER_TIME = 300;


  /*
  Pretty self-explanatory, eh?
   */

  EarthquakeLayerManager.prototype.addToLayer = function(data) {
    return this.earthquakesLayer.addData(data);
  };


  /*
  Removes the current, stale layer and replaces it with a new, fresh, empty one.
  Also used to intitialize the layer.
  
  NOTE: Defer re-adding fresh data to the layer
   */

  EarthquakeLayerManager.prototype.flushLayer = function(freshData) {
    if (this.earthquakesLayer != null) {
      this.mapView.tell("remove-layer", this.earthquakesLayer);
    }
    this.earthquakesLayer = L.geoJson([], {
      pointToLayer: function(feature, latlng) {
        var depth, magnitude, marker, style;
        depth = feature.geometry.coordinates[2];
        magnitude = feature.properties.mag;
        style = {
          clickable: true,
          weight: 1.5,
          opacity: 0.2,
          color: "#000",
          fillOpacity: 0.8,
          fillColor: DataFormatter.depthToColor(depth),
          radius: DataFormatter.magnitudeToRadius(magnitude)
        };
        marker = L.circleMarker(latlng, style);
        marker.bindPopup("Place: <b>" + feature.properties.place + "</b></br>\nMagnitude: <b>" + (DataFormatter.formatMagnitude(magnitude)) + "</b></br>\nDate: <b>" + (DataFormatter.formatDate(feature.properties.time)) + "</b></br>\nDepth: <b>" + depth + " km</b>");
        return marker;
      }
    });
    this.mapView.tell("add-layer", this.earthquakesLayer);
    if (freshData != null) {
      if (this.flushDeferTimer != null) {
        clearTimeout(this.flushDeferTimer);
      }
      return this.flushDeferTimer = setTimeout((function(_this) {
        return function() {
          return _this.addToLayer(freshData);
        };
      })(this), EarthquakeLayerManager.FLUSH_DEFER_TIME);
    }
  };

  return EarthquakeLayerManager;

})(NNode));


}});

require.define({"2D/HashController": function(exports, require, module) {
  
/*
A class to watch for hash changes and update the map accordingly
NOTE: Probably decouple the share link going forward,
as well as find a better way to load in hashes...
 */
var HashController, NNode, SessionController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

SessionController = require("./SessionController");

module.exports = new (HashController = (function(superClass) {
  extend(HashController, superClass);

  function HashController() {
    HashController.__super__.constructor.apply(this, arguments);
    this.sessionController = SessionController;
    this.delayedTimer = null;
    this.lastUpdate = null;
    this.lastHash = null;
    this.sessionController.subscribe("append", (function(_this) {
      return function(session) {
        if (_this.delayedTimer != null) {
          clearTimeout(_this.delayedTimer);
          _this.delayedTimer = null;
        }
        if ((_this.lastUpdate != null) && Date.now() - _this.lastUpdate < 1500) {
          return _this.delayedTimer = setTimeout(function() {
            return _this.updateLink(session);
          }, 300);
        } else {
          return _this.updateLink(session);
        }
      };
    })(this));
    $(window).on("load hashchange", (function(_this) {
      return function() {
        var error;
        if (_this.lastHash !== window.location.hash) {
          try {
            _this.sessionController.tell("replace-and-update", JSON.parse(window.decodeURIComponent(window.location.hash.slice(1))));
          } catch (_error) {
            error = _error;
          }
          _this.lastHash = window.location.hash;
          return _this.sessionController.tell("append", {});
        }
      };
    })(this));
  }

  HashController.prototype.updateLink = function(session) {
    window.location.hash = this.lastHash = "#" + (window.encodeURIComponent(JSON.stringify(session)));
    $("#share-link").val("" + window.location);
    return this.lastUpdate = Date.now();
  };

  return HashController;

})(NNode));


}});

require.define({"2D/MagnitudeFilter": function(exports, require, module) {
  
/*
MagnitudeFilter - a class to receive a bunch of earthquakes, and pass on the ones that are greater
than a specified magnitude

See DateFilter's header comment for more info on filters.
 */
var CacheFilter, MagnitudeFilter, MagnitudeFilterController, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

CacheFilter = require("./CacheFilter");

MagnitudeFilterController = require("./MagnitudeFilterController");

module.exports = new (MagnitudeFilter = (function(superClass) {
  extend(MagnitudeFilter, superClass);

  function MagnitudeFilter() {
    MagnitudeFilter.__super__.constructor.apply(this, arguments);
    this.controller = MagnitudeFilterController;
    this.minMagnitude = -Infinity;
    this.maxMagnitude = Infinity;
    this.controller.subscribe("update", (function(_this) {
      return function(updatedFilter) {
        var additionalPoints;
        updatedFilter.maxMagnitude = Infinity;
        if (updatedFilter.minMagnitude > _this.minMagnitude || updatedFilter.maxMagnitude < _this.maxMagnitude) {
          _this.post("flush", _this.filterMagnitudes(_this.cachedData, updatedFilter.minMagnitude, updatedFilter.maxMagnitude));
        } else {
          additionalPoints = [];
          _this.filterMagnitudes(_this.cachedData, updatedFilter.minMagnitude, _this.minMagnitude, additionalPoints);
          _this.filterMagnitudes(_this.cachedData, _this.maxMagnitude, updatedFilter.maxMagnitude, additionalPoints);
          if (additionalPoints.length > 0) {
            _this.post("stream", additionalPoints);
          }
        }
        _this.minMagnitude = updatedFilter.minMagnitude;
        return _this.maxMagnitude = updatedFilter.maxMagnitude;
      };
    })(this));
    this.cachedData = [];
    this.inputNode = CacheFilter;
    this.inputNode.subscribe("stream", (function(_this) {
      return function(newData) {
        var i, len, point;
        for (i = 0, len = newData.length; i < len; i++) {
          point = newData[i];
          _this.cachedData.push(point);
        }
        return _this.post("stream", _this.filterMagnitudes(newData, _this.minMagnitude, _this.maxMagnitude));
      };
    })(this));
    this.inputNode.subscribe("flush", (function(_this) {
      return function(freshData) {
        _this.cachedData = freshData;
        return _this.post("flush", _this.filterMagnitudes(_this.cachedData, _this.minMagnitude, _this.maxMagnitude));
      };
    })(this));
    this.inputNode.tell("request-update");
  }


  /*
  Creates a new array and fills it with the dataset, diced with given parameters
  Note: minMagnitude is inclusive, maxMagnitude is exclusive
   */

  MagnitudeFilter.prototype.filterMagnitudes = function(data, minMagnitude, maxMagnitude, newArray) {
    var i, len, point, ref;
    if (newArray == null) {
      newArray = [];
    }
    for (i = 0, len = data.length; i < len; i++) {
      point = data[i];
      if ((minMagnitude <= (ref = point.properties.mag) && ref < maxMagnitude)) {
        newArray.push(point);
      }
    }
    return newArray;
  };

  return MagnitudeFilter;

})(NNode));


}});

require.define({"2D/MagnitudeFilterController": function(exports, require, module) {
  
/*
A class to manage the magnitude filter, tying together the UI
and the data filter
 */
var DataFormatter, MagnitudeFilterController, MagnitudeSliderUI, NNode, SessionController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

MagnitudeSliderUI = require("./MagnitudeSliderUI");

DataFormatter = require("./DataFormatter");

SessionController = require("./SessionController");

module.exports = new (MagnitudeFilterController = (function(superClass) {
  extend(MagnitudeFilterController, superClass);

  MagnitudeFilterController.MIN_MAGNITUDE = 3;

  MagnitudeFilterController.MAX_MAGNITUDE = 9;

  function MagnitudeFilterController() {
    MagnitudeFilterController.__super__.constructor.apply(this, arguments);
    this.minMagnitude = 5;
    this.sessionController = SessionController;
    this.uiMagnitudeSlider = MagnitudeSliderUI;
    this.uiMagnitudeSlider.subscribe("update", (function(_this) {
      return function(value) {
        _this.minMagnitude = value;
        _this.limitMagnitudeJustInCase();
        _this.postControllerChanges();
        _this.updateMagnitudeSlider();
        return _this.updateSession();
      };
    })(this));
    this.uiMagnitudeSlider.tell("configure", {
      minMagnitude: MagnitudeFilterController.MIN_MAGNITUDE,
      maxMagnitude: MagnitudeFilterController.MAX_MAGNITUDE,
      magnitudeStep: 0.1
    });
    this.sessionController.subscribe("update", (function(_this) {
      return function(session) {
        _this.minMagnitude = session.minMagnitude;
        _this.limitMagnitudeJustInCase();
        _this.postControllerChanges();
        return _this.updateMagnitudeSlider();
      };
    })(this));
    this.updateMagnitudeSlider();
    this.updateSession();
    this.listen("request-update", this.postControllerChanges);
  }

  MagnitudeFilterController.prototype.limitMagnitudeJustInCase = function() {
    return this.minMagnitude = Math.min(Math.max(this.minMagnitude, MagnitudeFilterController.MIN_MAGNITUDE), MagnitudeFilterController.MAX_MAGNITUDE);
  };

  MagnitudeFilterController.prototype.updateSession = function() {
    return this.sessionController.tell("append", {
      minMagnitude: this.minMagnitude
    });
  };

  MagnitudeFilterController.prototype.postControllerChanges = function() {
    return this.post("update", {
      minMagnitude: this.minMagnitude
    });
  };

  MagnitudeFilterController.prototype.updateMagnitudeSlider = function() {
    this.uiMagnitudeSlider.tell("set-text", "" + (DataFormatter.formatMagnitude(this.minMagnitude)));
    return this.uiMagnitudeSlider.tell("set", this.minMagnitude);
  };

  return MagnitudeFilterController;

})(NNode));


}});

require.define({"2D/MagnitudeSliderUI": function(exports, require, module) {
  
/*
A class to manage the magnitude slider
 */
var MagnitudeSliderUI, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (MagnitudeSliderUI = (function(superClass) {
  extend(MagnitudeSliderUI, superClass);

  function MagnitudeSliderUI() {
    var preventChangeFromHappenningHack;
    MagnitudeSliderUI.__super__.constructor.apply(this, arguments);
    preventChangeFromHappenningHack = false;
    this.magnitudeSlider = $("#magnitude-slider");
    this.magnitudeSliderReadout = $("#magnitude-readout");
    this.listen("configure", (function(_this) {
      return function(options) {
        var magnitudeStep, maxMagnitude, minMagnitude;
        minMagnitude = options.minMagnitude, maxMagnitude = options.maxMagnitude, magnitudeStep = options.magnitudeStep;
        return _this.magnitudeSlider.attr("min", minMagnitude).attr("max", maxMagnitude).attr("step", magnitudeStep);
      };
    })(this));
    this.magnitudeSlider.on("change", (function(_this) {
      return function() {
        if (!preventChangeFromHappenningHack) {
          return _this.post("update", parseFloat(_this.magnitudeSlider.val()));
        }
      };
    })(this));
    this.listen("set", function(value) {
      preventChangeFromHappenningHack = true;
      this.magnitudeSlider.val(value).slider("refresh");
      return preventChangeFromHappenningHack = false;
    });
    this.listen("set-text", function(text) {
      return this.magnitudeSliderReadout.text(text);
    });
  }

  return MagnitudeSliderUI;

})(NNode));


}});

require.define({"2D/MapKeyController": function(exports, require, module) {
  
/*
An all-in-one class to manage the map key, populating it as well as showing/hiding it.
Could perhaps be split into multiple classes
 */
var DataFormatter, MapKeyController, MapKeyToggleUI, NNode, SessionController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

DataFormatter = require("./DataFormatter");

MapKeyToggleUI = require("./MapKeyToggleUI");

SessionController = require("./SessionController");

module.exports = new (MapKeyController = (function(superClass) {
  extend(MapKeyController, superClass);

  function MapKeyController() {
    var depth, magnitude, radius;
    MapKeyController.__super__.constructor.apply(this, arguments);
    this.mapKey = $("#map-key");
    this.mapKey.find(".magnitude-key").html(((function() {
      var i, results;
      results = [];
      for (magnitude = i = 3; i <= 9; magnitude = ++i) {
        radius = DataFormatter.magnitudeToRadius(magnitude);
        results.push("<div class=\"magnitude-item\">\n  <div class=\"magnitude-example\" style=\"width: " + (2 * radius) + "px; height: " + (2 * radius) + "px;margin-left: " + (-radius) + "px; margin-top: " + (-radius) + "px;\"></div>\n  " + (DataFormatter.formatMagnitude(magnitude)) + "\n</div>");
      }
      return results;
    })()).join(""));
    this.mapKey.find(".depth-key > .labels").html(((function() {
      var i, ref, results;
      results = [];
      for (depth = i = 0, ref = DataFormatter.MAX_DEPTH; i <= ref; depth = i += 100) {
        results.push("<p>" + depth + " km</p>");
      }
      return results;
    })()).join(""));
    this.sessionController = SessionController;
    this.sessionController.subscribe("update", (function(_this) {
      return function(session) {
        _this.keyVisible = session.keyVisible;
        return _this.updateKeyVisibility();
      };
    })(this));
    this.mapKeyToggle = MapKeyToggleUI;
    this.keyVisible = false;
    this.mapKeyToggle.subscribe("update", (function(_this) {
      return function(value) {
        _this.keyVisible = value;
        _this.updateKeyVisibility();
        return _this.updateSession();
      };
    })(this));
    this.updateSession();
  }

  MapKeyController.prototype.updateSession = function() {
    return this.sessionController.tell("append", {
      keyVisible: this.keyVisible
    });
  };

  MapKeyController.prototype.updateKeyVisibility = function() {
    this.mapKeyToggle.tell("set", this.keyVisible);
    if (this.keyVisible) {
      return this.mapKey.finish().fadeIn(300);
    } else {
      return this.mapKey.finish().fadeOut(300);
    }
  };

  return MapKeyController;

})(NNode));


}});

require.define({"2D/MapKeyToggleUI": function(exports, require, module) {
  
/*
A class to manage the map key toggle switch
 */
var MapKeyToggleUI, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (MapKeyToggleUI = (function(superClass) {
  extend(MapKeyToggleUI, superClass);

  function MapKeyToggleUI() {
    var preventChangeFromHappenningHack;
    MapKeyToggleUI.__super__.constructor.apply(this, arguments);
    preventChangeFromHappenningHack = false;
    this.mapKey = $("#map-key-toggle");
    this.mapKey.on("change", (function(_this) {
      return function() {
        if (!preventChangeFromHappenningHack) {
          return _this.post("update", _this.mapKey.parent().hasClass("ui-flipswitch-active"));
        }
      };
    })(this));
    this.listen("set", (function(_this) {
      return function(value) {
        preventChangeFromHappenningHack = true;
        if (value) {
          _this.mapKey.parent().addClass("ui-flipswitch-active");
        } else {
          _this.mapKey.parent().removeClass("ui-flipswitch-active");
        }
        return preventChangeFromHappenningHack = false;
      };
    })(this));
  }

  return MapKeyToggleUI;

})(NNode));


}});

require.define({"2D/MapView": function(exports, require, module) {
  
/*
MapView - a class for creating a leaflet map and exposing parts of the map
as an interface to child classes
 */
var MapView, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (MapView = (function(superClass) {
  extend(MapView, superClass);

  function MapView() {
    MapView.__super__.constructor.apply(this, arguments);
    this.leafletMap = L.map("map");
    $(window).on("load", (function(_this) {
      return function() {
        _this.leafletMap.invalidateSize();
        _this.post("loaded");
        return _this.leafletMap.on("moveend", function() {
          return _this.post("bounds-update", _this.leafletMap.getBounds());
        });
      };
    })(this));
    this.listen("add-layer", (function(_this) {
      return function(layer) {
        return _this.leafletMap.addLayer(layer);
      };
    })(this));
    this.listen("remove-layer", (function(_this) {
      return function(layer) {
        return _this.leafletMap.removeLayer(layer);
      };
    })(this));
    this.listen("freeze", (function(_this) {
      return function() {
        _this.leafletMap.options.minZoom = _this.leafletMap.options.maxZoom = _this.leafletMap.getZoom();
        return _this.leafletMap.setMaxBounds(_this.leafletMap.getBounds());
      };
    })(this));
    this.listen("unfreeze", (function(_this) {
      return function() {
        _this.leafletMap.options.minZoom = 0;
        _this.leafletMap.options.maxZoom = 18;
        return _this.leafletMap.setMaxBounds(null);
      };
    })(this));
    this.listen("set-bounds", (function(_this) {
      return function(bounds) {
        return _this.leafletMap.fitBounds(bounds);
      };
    })(this));
  }

  return MapView;

})(NNode));


}});

require.define({"2D/MapViewManager": function(exports, require, module) {
  
/*
Manages the map's movement (pan and zoom)
 */
var MapView, MapViewManager, NNode, SessionController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

MapView = require("./MapView");

SessionController = require("./SessionController");

module.exports = new (MapViewManager = (function(superClass) {
  extend(MapViewManager, superClass);

  function MapViewManager() {
    MapViewManager.__super__.constructor.apply(this, arguments);
    this.sessionController = SessionController;
    this.minLatitude = -40;
    this.minLongitude = -50;
    this.maxLatitude = 40;
    this.maxLongitude = 50;
    this.restrictedView = false;
    this.previouslyRestrictedView = false;
    this.mapView = MapView;
    this.mapView.subscribe("loaded", (function(_this) {
      return function() {
        return _this.updateMapView();
      };
    })(this));
    this.mapView.subscribe("bounds-update", (function(_this) {
      return function(bounds) {
        var max, min;
        min = bounds.getSouthWest();
        max = bounds.getNorthEast();
        _this.minLatitude = min.lat;
        _this.maxLatitude = max.lat;
        _this.minLongitude = min.lng;
        _this.maxLongitude = max.lng;
        return _this.updateSession();
      };
    })(this));
    this.sessionController.subscribe("update", (function(_this) {
      return function(session) {
        _this.minLatitude = session.minLatitude, _this.maxLatitude = session.maxLatitude, _this.minLongitude = session.minLongitude, _this.maxLongitude = session.maxLongitude, _this.restrictedView = session.restrictedView;
        return _this.updateMapView();
      };
    })(this));
    this.updateSession();
  }

  MapViewManager.prototype.updateSession = function() {
    return this.sessionController.tell("append", {
      minLatitude: this.minLatitude,
      minLongitude: this.minLongitude,
      maxLatitude: this.maxLatitude,
      maxLongitude: this.maxLongitude,
      restrictedView: this.restrictedView
    });
  };

  MapViewManager.prototype.updateMapView = function() {
    if (this.previouslyRestrictedView) {
      this.mapView.tell("unfreeze");
    }
    this.mapView.tell("set-bounds", L.latLngBounds(L.latLng(this.minLatitude, this.minLongitude), L.latLng(this.maxLatitude, this.maxLongitude)));
    if (this.restrictedView) {
      this.mapView.tell("freeze");
    }
    return this.previouslyRestrictedView = this.restrictedView;
  };

  return MapViewManager;

})(NNode));


}});

require.define({"2D/NNode": function(exports, require, module) {
  
/*
A small and lightweight class to streamline and standardize communication between
objects, as if each were a node in a larger network
 */
var NNode,
  slice = [].slice;

module.exports = NNode = (function() {
  function NNode() {
    this.listenerMap = {};
    this.subscriberListenerMap = {};
  }


  /*
  News onhand! Tell this to all eager subscribers.
   */

  NNode.prototype.post = function() {
    var channel, data;
    channel = arguments[0], data = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return this._activateListeners(this.subscriberListenerMap, channel, data);
  };


  /*
  Subscribe to a popular node to keep updated.
  All news will be prepended with the namespace, if given
   */

  NNode.prototype.subscribe = function(channel, listener) {
    this._addToListenerMap(this.subscriberListenerMap, channel, listener);
  };


  /*
  Tells this node a very personal message.
   */

  NNode.prototype.tell = function() {
    var channel, data;
    channel = arguments[0], data = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    this._activateListeners(this.listenerMap, channel, data);
  };


  /*
  Registers this node to hear any type of message.
   */

  NNode.prototype.listen = function(channel, listener) {
    this._addToListenerMap(this.listenerMap, channel, listener);
  };

  NNode.prototype._addToListenerMap = function(map, channel, listener) {
    if (map[channel] == null) {
      map[channel] = [];
    }
    this._addToSet(map[channel], listener);
  };

  NNode.prototype._activateListeners = function(map, channel, data) {
    var i, len, listener, ref;
    if (map[channel] != null) {
      ref = map[channel];
      for (i = 0, len = ref.length; i < len; i++) {
        listener = ref[i];
        listener.apply(this, data);
      }
    }
  };

  NNode.prototype._addToSet = function(array, value) {
    if (array.indexOf(value) === -1) {
      array.push(value);
    }
  };

  return NNode;

})();


}});

require.define({"2D/PlaybackButtonsUI": function(exports, require, module) {
  
/*
A small class to manage the playback buttons
 */
var NNode, PlaybackButtonsUI,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (PlaybackButtonsUI = (function(superClass) {
  extend(PlaybackButtonsUI, superClass);

  function PlaybackButtonsUI() {
    PlaybackButtonsUI.__super__.constructor.apply(this, arguments);
    this.slowDown = $("#slowdown");
    this.playPause = $("#playpause");
    this.speedUp = $("#speedup");
    this.slowDown.click((function(_this) {
      return function() {
        return _this.post("update", "slowdown");
      };
    })(this));
    this.playPause.click((function(_this) {
      return function() {
        return _this.post("update", "playpause");
      };
    })(this));
    this.speedUp.click((function(_this) {
      return function() {
        return _this.post("update", "speedup");
      };
    })(this));
    this.listen("set-play-or-pause", function(playOrPause) {
      switch (playOrPause) {
        case "play":
          return this.becomePlayButton();
        case "pause":
          return this.becomePauseButton();
      }
    });
  }

  PlaybackButtonsUI.prototype.becomePlayButton = function() {
    this.playPause.removeClass("ui-icon-fa-pause");
    return this.playPause.addClass("ui-icon-fa-play");
  };

  PlaybackButtonsUI.prototype.becomePauseButton = function() {
    this.playPause.addClass("ui-icon-fa-pause");
    return this.playPause.removeClass("ui-icon-fa-play");
  };

  return PlaybackButtonsUI;

})(NNode));


}});

require.define({"2D/PlaybackController": function(exports, require, module) {
  
/*
PlaybackController
A class to manage playing, pausing, speeding up, and slowing down.
Communicates with the UI's buttons and timeline slider.
 */
var NNode, PlaybackButtonsUI, PlaybackController, PlaybackSliderUI,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PlaybackButtonsUI = require("./PlaybackButtonsUI");

PlaybackSliderUI = require("./PlaybackSliderUI");

NNode = require("./NNode");

module.exports = new (PlaybackController = (function(superClass) {
  extend(PlaybackController, superClass);


  /*
  Creates a new PlaybackController.
  Also rigs up the provided UI elements.
   */

  function PlaybackController() {
    PlaybackController.__super__.constructor.apply(this, arguments);
    this.timeline = new TimelineLite({
      onUpdate: (function(_this) {
        return function() {
          var progress;
          progress = _this.timeline.progress();
          _this.post("update", progress);
          _this.playbackSlider.tell("set", progress);
          if (progress === 1) {
            return _this.pauseOnly();
          }
        };
      })(this),
      paused: true
    });
    this.duration = 16;
    this._updateTimelineScale();
    this.timeline.addPause(1);
    this.playbackButtons = PlaybackButtonsUI;
    this.playbackButtons.subscribe("update", (function(_this) {
      return function(which) {
        switch (which) {
          case "slowdown":
            return _this.slowDown();
          case "playpause":
            return _this.playPause();
          case "speedup":
            return _this.speedUp();
        }
      };
    })(this));
    this.playbackSlider = PlaybackSliderUI;
    this.playbackSlider.subscribe("update", (function(_this) {
      return function(progress) {
        _this.pauseOnly();
        return _this.timeline.progress(progress);
      };
    })(this));
    this.listen("set", (function(_this) {
      return function(value) {
        return _this.timeline.progress(value);
      };
    })(this));
    this.listen("set-text", (function(_this) {
      return function(text) {
        return _this.playbackSlider.tell("set-text", text);
      };
    })(this));
    this.listen("set-step", (function(_this) {
      return function(step) {
        return _this.playbackSlider.tell("set-step", step);
      };
    })(this));
  }


  /*
  Standard playback control methods. Does what you expect them to do.
   */

  PlaybackController.prototype.slowDown = function() {
    if (this.duration < 128) {
      this.duration *= 2;
    }
    return this._updateTimelineScale();
  };

  PlaybackController.prototype.speedUp = function() {
    if (this.duration > 2) {
      this.duration /= 2;
    }
    return this._updateTimelineScale();
  };

  PlaybackController.prototype.pauseOnly = function() {
    this.timeline.pause();
    return this.playbackButtons.tell("set-play-or-pause", "play");
  };

  PlaybackController.prototype.playPause = function() {
    if (this.timeline.isActive()) {
      return this.pauseOnly();
    } else {
      if (this.timeline.progress() === 1) {
        this.timeline.restart();
      } else {
        this.timeline.play();
      }
      return this.playbackButtons.tell("set-play-or-pause", "pause");
    }
  };

  PlaybackController.prototype._updateTimelineScale = function() {
    return this.timeline.timeScale(1 / this.duration);
  };

  return PlaybackController;

})(NNode));


}});

require.define({"2D/PlaybackSliderUI": function(exports, require, module) {
  
/*
A small class to hook up the playback slider
 */
var NNode, PlaybackSliderUI,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (PlaybackSliderUI = (function(superClass) {
  extend(PlaybackSliderUI, superClass);

  function PlaybackSliderUI() {
    var preventChangeFromHappenningHack;
    PlaybackSliderUI.__super__.constructor.apply(this, arguments);
    preventChangeFromHappenningHack = false;
    this.slider = $("#slider");
    this.sliderHandle = $("#slider-wrapper .ui-slider-handle");
    this.slider.on("change", (function(_this) {
      return function() {
        if (!preventChangeFromHappenningHack) {
          return _this.post("update", parseFloat(_this.slider.val()));
        }
      };
    })(this));
    this.listen("set", (function(_this) {
      return function(value) {
        preventChangeFromHappenningHack = true;
        _this.slider.val(value).slider("refresh");
        return preventChangeFromHappenningHack = false;
      };
    })(this));
    this.listen("set-text", (function(_this) {
      return function(text) {
        _this.sliderHandle.text(text);
        return _this.sliderHandle.attr("title", text);
      };
    })(this));
    this.listen("set-step", (function(_this) {
      return function(step) {
        return _this.slider.attr("step", step);
      };
    })(this));
  }

  return PlaybackSliderUI;

})(NNode));


}});

require.define({"2D/SessionController": function(exports, require, module) {
  
/*
A class to manage the user's map session, including settings of most things.
 */
var NNode, SessionController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (SessionController = (function(superClass) {
  extend(SessionController, superClass);

  function SessionController() {
    SessionController.__super__.constructor.apply(this, arguments);
    this.session = {};
    this.listen("append", (function(_this) {
      return function(params) {
        var key, value;
        for (key in params) {
          value = params[key];
          _this.session[key] = value;
        }
        return _this.post("append", _this.session);
      };
    })(this));
    this.listen("replace-and-update", (function(_this) {
      return function(params) {
        var key;
        for (key in _this.session) {
          if (params[key] != null) {
            if (typeof _this.session[key] === typeof params[key]) {
              _this.session[key] = params[key];
            }
          }
        }
        return _this.post("update", _this.session);
      };
    })(this));
  }

  return SessionController;

})(NNode));


}});

require.define({"2D/Utils": function(exports, require, module) {

  

}});

;require.define({"2D/app": function(exports, require, module) {
  var App, NNode,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

NNode = require("./NNode");

module.exports = new (App = (function(superClass) {
  extend(App, superClass);

  function App() {
    App.__super__.constructor.apply(this, arguments);
    this.superHackySliderKeyboardHack();
    require("./EarthquakeLayerManager");
    require("./BoundariesLayerManager");
    require("./BaseMapLayerManager");
    require("./ControlsManager");
    require("./MapKeyController");
    require("./MapViewManager");
    require("./HashController");
  }

  App.prototype.superHackySliderKeyboardHack = function() {
    return $("#slider-wrapper .ui-slider-handle").keydown(function(event) {
      var input, newValue;
      input = $(this).parents(".ui-slider").find("input");
      switch (event.keyCode) {
        case $.mobile.keyCode.HOME:
          newValue = parseFloat(input.attr("min"));
          break;
        case $.mobile.keyCode.END:
          newValue = parseFloat(input.attr("max"));
          break;
        case $.mobile.keyCode.PAGE_UP:
        case $.mobile.keyCode.UP:
        case $.mobile.keyCode.LEFT:
          newValue = parseFloat(input.val()) - parseFloat(input.attr("step"));
          break;
        case $.mobile.keyCode.PAGE_DOWN:
        case $.mobile.keyCode.DOWN:
        case $.mobile.keyCode.RIGHT:
          newValue = parseFloat(input.val()) + parseFloat(input.attr("step"));
          break;
        default:
          return;
      }
      input.val(newValue);
      return $(input).slider("refresh");
    });
  };

  return App;

})(NNode));


}});

//NOWRAP

/*global L: true */

L.KML = L.FeatureGroup.extend({
  options: {
    async: true
  },

  initialize: function(kml, options) {
    L.Util.setOptions(this, options);
    this._kml = kml;
    this._layers = {};

    if (kml) {
      this.addKML(kml, options, this.options.async);
    }
  },

  loadXML: function(url, cb, options, async) {
    if (async == undefined) async = this.options.async;
    if (options == undefined) options = this.options;

    var req = new window.XMLHttpRequest();
    req.open('GET', url, async);
    try {
      req.overrideMimeType('text/xml'); // unsupported by IE
    } catch(e) {}
    req.onreadystatechange = function() {
      if (req.readyState != 4) return;
      if(req.status == 200) cb(req.responseXML, options);
    };
    req.send(null);
  },

  addKML: function(url, options, async) {
    var _this = this;
    var cb = function(gpx, options) { _this._addKML(gpx, options) };
    this.loadXML(url, cb, options, async);
  },

  _addKML: function(xml, options) {
    var layers = L.KML.parseKML(xml);
    if (!layers || !layers.length) return;
    for (var i = 0; i < layers.length; i++)
    {
      this.fire('addlayer', {
        layer: layers[i]
      });
      this.addLayer(layers[i]);
    }
    this.latLngs = L.KML.getLatLngs(xml);
    this.fire("loaded");
  },

  latLngs: []
});

L.Util.extend(L.KML, {

  parseKML: function (xml) {
    var style = this.parseStyle(xml);
    this.parseStyleMap(xml, style);
    var el = xml.getElementsByTagName("Folder");
    var layers = [], l;
    for (var i = 0; i < el.length; i++) {
      if (!this._check_folder(el[i])) { continue; }
      l = this.parseFolder(el[i], style);
      if (l) { layers.push(l); }
    }
    el = xml.getElementsByTagName('Placemark');
    for (var j = 0; j < el.length; j++) {
      if (!this._check_folder(el[j])) { continue; }
      l = this.parsePlacemark(el[j], xml, style);
      if (l) { layers.push(l); }
    }
    return layers;
  },

  // Return false if e's first parent Folder is not [folder]
  // - returns true if no parent Folders
  _check_folder: function (e, folder) {
    e = e.parentElement;
    while (e && e.tagName !== "Folder")
    {
      e = e.parentElement;
    }
    return !e || e === folder;
  },

  parseStyle: function (xml) {
    var style = {};
    var sl = xml.getElementsByTagName("Style");

    //for (var i = 0; i < sl.length; i++) {
    var attributes = {color: true, width: true, Icon: true, href: true,
              hotSpot: true};

    function _parse(xml) {
      var options = {};
      for (var i = 0; i < xml.childNodes.length; i++) {
        var e = xml.childNodes[i];
        var key = e.tagName;
        if (!attributes[key]) { continue; }
        if (key === 'hotSpot')
        {
          for (var j = 0; j < e.attributes.length; j++) {
            options[e.attributes[j].name] = e.attributes[j].nodeValue;
          }
        } else {
          var value = e.childNodes[0].nodeValue;
          if (key === 'color') {
            options.opacity = parseInt(value.substring(0, 2), 16) / 255.0;
            options.color = "#" + value.substring(6, 8) + value.substring(4, 6) + value.substring(2, 4);
          } else if (key === 'width') {
            options.weight = value;
          } else if (key === 'Icon') {
            ioptions = _parse(e);
            if (ioptions.href) { options.href = ioptions.href; }
          } else if (key === 'href') {
            options.href = value;
          }
        }
      }
      return options;
    }

    for (var i = 0; i < sl.length; i++) {
      var e = sl[i], el;
      var options = {}, poptions = {}, ioptions = {};
      el = e.getElementsByTagName("LineStyle");
      if (el && el[0]) { options = _parse(el[0]); }
      el = e.getElementsByTagName("PolyStyle");
      if (el && el[0]) { poptions = _parse(el[0]); }
      if (poptions.color) { options.fillColor = poptions.color; }
      if (poptions.opacity) { options.fillOpacity = poptions.opacity; }
      el = e.getElementsByTagName("IconStyle");
      if (el && el[0]) { ioptions = _parse(el[0]); }
      if (ioptions.href) {
        // save anchor info until the image is loaded
        options.icon = new L.KMLIcon({
          iconUrl: ioptions.href,
          shadowUrl: null,
          iconAnchorRef: {x: ioptions.x, y: ioptions.y},
          iconAnchorType: {x: ioptions.xunits, y: ioptions.yunits}
        });
      }
      style['#' + e.getAttribute('id')] = options;
    }
    return style;
  },

  parseStyleMap: function (xml, existingStyles) {
    var sl = xml.getElementsByTagName("StyleMap");

    for (var i = 0; i < sl.length; i++) {
      var e = sl[i], el;
      var smKey, smStyleUrl;

      el = e.getElementsByTagName("key");
      if (el && el[0]) { smKey = el[0].textContent; }
      el = e.getElementsByTagName("styleUrl");
      if (el && el[0]) { smStyleUrl = el[0].textContent; }

      if (smKey=='normal')
      {
        existingStyles['#' + e.getAttribute('id')] = existingStyles[smStyleUrl];
      }
    }

    return;
  },

  parseFolder: function (xml, style) {
    var el, layers = [], l;
    el = xml.getElementsByTagName('Folder');
    for (var i = 0; i < el.length; i++) {
      if (!this._check_folder(el[i], xml)) { continue; }
      l = this.parseFolder(el[i], style);
      if (l) { layers.push(l); }
    }
    el = xml.getElementsByTagName('Placemark');
    for (var j = 0; j < el.length; j++) {
      if (!this._check_folder(el[j], xml)) { continue; }
      l = this.parsePlacemark(el[j], xml, style);
      if (l) { layers.push(l); }
    }
    if (!layers.length) { return; }
    if (layers.length === 1) { return layers[0]; }
    return new L.FeatureGroup(layers);
  },

  parsePlacemark: function (place, xml, style) {
    var i, j, el, options = {};
    el = place.getElementsByTagName('styleUrl');
    for (i = 0; i < el.length; i++) {
      var url = el[i].childNodes[0].nodeValue;
      for (var a in style[url])
      {
        // for jshint
        if (true)
        {
          options[a] = style[url][a];
        }
      }
    }
    var layers = [];

    var parse = ['LineString', 'Polygon', 'Point'];
    for (j in parse) {
      // for jshint
      if (true)
      {
        var tag = parse[j];
        el = place.getElementsByTagName(tag);
        for (i = 0; i < el.length; i++) {
          var l = this["parse" + tag](el[i], xml, options);
          if (l) { layers.push(l); }
        }
      }
    }

    if (!layers.length) {
      return;
    }
    var layer = layers[0];
    if (layers.length > 1) {
      layer = new L.FeatureGroup(layers);
    }

    var name, descr = "";
    el = place.getElementsByTagName('name');
    if (el.length && el[0].childNodes.length) {
      name = el[0].childNodes[0].nodeValue;
    }
    el = place.getElementsByTagName('description');
    for (i = 0; i < el.length; i++) {
      for (j = 0; j < el[i].childNodes.length; j++) {
        descr = descr + el[i].childNodes[j].nodeValue;
      }
    }

    if (name) {
      layer.bindPopup("<h2>" + name + "</h2>" + descr);
    }

    return layer;
  },

  parseCoords: function (xml) {
    var el = xml.getElementsByTagName('coordinates');
    return this._read_coords(el[0]);
  },

  parseLineString: function (line, xml, options) {
    var coords = this.parseCoords(line);
    if (!coords.length) { return; }
    return new L.Polyline(coords, options);
  },

  parsePoint: function (line, xml, options) {
    var el = line.getElementsByTagName('coordinates');
    if (!el.length) {
      return;
    }
    var ll = el[0].childNodes[0].nodeValue.split(',');
    return new L.KMLMarker(new L.LatLng(ll[1], ll[0]), options);
  },

  parsePolygon: function (line, xml, options) {
    var el, polys = [], inner = [], i, coords;
    el = line.getElementsByTagName('outerBoundaryIs');
    for (i = 0; i < el.length; i++) {
      coords = this.parseCoords(el[i]);
      if (coords) {
        polys.push(coords);
      }
    }
    el = line.getElementsByTagName('innerBoundaryIs');
    for (i = 0; i < el.length; i++) {
      coords = this.parseCoords(el[i]);
      if (coords) {
        inner.push(coords);
      }
    }
    if (!polys.length) {
      return;
    }
    if (options.fillColor) {
      options.fill = true;
    }
    if (polys.length === 1) {
      return new L.Polygon(polys.concat(inner), options);
    }
    return new L.MultiPolygon(polys, options);
  },

  getLatLngs: function (xml) {
    var el = xml.getElementsByTagName('coordinates');
    var coords = [];
    for (var j = 0; j < el.length; j++) {
      // text might span many childNodes
      coords = coords.concat(this._read_coords(el[j]));
    }
    return coords;
  },

  _read_coords: function (el) {
    var text = "", coords = [], i;
    for (i = 0; i < el.childNodes.length; i++) {
      text = text + el.childNodes[i].nodeValue;
    }
    text = text.split(/[\s\n]+/);
    for (i = 0; i < text.length; i++) {
      var ll = text[i].split(',');
      if (ll.length < 2) {
        continue;
      }
      coords.push(new L.LatLng(ll[1], ll[0]));
    }
    return coords;
  }

});

L.KMLIcon = L.Icon.extend({

  createIcon: function () {
    var img = this._createIcon('icon');
    img.onload = function () {
      var i = img;
      this.style.width = i.width + 'px';
      this.style.height = i.height + 'px';

      if (this.anchorType.x === 'UNITS_FRACTION' || this.anchorType.x === 'fraction') {
        img.style.marginLeft = (-this.anchor.x * i.width) + 'px';
      }
      if (this.anchorType.y === 'UNITS_FRACTION' || this.anchorType.x === 'fraction') {
        img.style.marginTop  = (-(1 - this.anchor.y) * i.height) + 'px';
      }
      this.style.display = "";
    };
    return img;
  },

  _setIconStyles: function (img, name) {
    L.Icon.prototype._setIconStyles.apply(this, [img, name])
    // save anchor information to the image
    img.anchor = this.options.iconAnchorRef;
    img.anchorType = this.options.iconAnchorType;
  }
});


L.KMLMarker = L.Marker.extend({
  options: {
    icon: new L.KMLIcon.Default()
  }
});






//NOWRAP

/*
 * L.LatLngUtil contains different utility functions for LatLngs.
 */

L.LatLngUtil = {
  // Clones a LatLngs[], returns [][]
  cloneLatLngs: function (latlngs) {
    var clone = [];
    for (var i = 0, l = latlngs.length; i < l; i++) {
      clone.push(this.cloneLatLng(latlngs[i]));
    }
    return clone;
  },

  cloneLatLng: function (latlng) {
    return L.latLng(latlng.lat, latlng.lng);
  }
};





//NOWRAP
L.Tooltip = L.Class.extend({
  initialize: function (map) {
    this._map = map;
    this._popupPane = map._panes.popupPane;

    this._container = L.DomUtil.create('div', 'leaflet-draw-tooltip', this._popupPane);
    this._singleLineLabel = false;
  },

  dispose: function () {
    if (this._container) {
      this._popupPane.removeChild(this._container);
      this._container = null;
    }
  },

  updateContent: function (labelText) {
    if (!this._container) {
      console.log("hello");
      return this;
    }
    labelText.subtext = labelText.subtext || '';

    // update the vertical position (only if changed)
    if (labelText.subtext.length === 0 && !this._singleLineLabel) {
      L.DomUtil.addClass(this._container, 'leaflet-draw-tooltip-single');
      this._singleLineLabel = true;
    }
    else if (labelText.subtext.length > 0 && this._singleLineLabel) {
      L.DomUtil.removeClass(this._container, 'leaflet-draw-tooltip-single');
      this._singleLineLabel = false;
    }

    this._container.innerHTML =
      (labelText.subtext.length > 0 ? '<span class="leaflet-draw-tooltip-subtext">' + labelText.subtext + '</span>' + '<br />' : '') +
      '<span>' + labelText.text + '</span>';

    return this;
  },

  updatePosition: function (latlng) {
    var pos = this._map.latLngToLayerPoint(latlng),
      tooltipContainer = this._container;

    if (this._container) {
      tooltipContainer.style.visibility = 'inherit';
      L.DomUtil.setPosition(tooltipContainer, pos);
    }

    return this;
  },

  showAsError: function () {
    if (this._container) {
      L.DomUtil.addClass(this._container, 'leaflet-error-draw-tooltip');
    }
    return this;
  },

  removeError: function () {
    if (this._container) {
      L.DomUtil.removeClass(this._container, 'leaflet-error-draw-tooltip');
    }
    return this;
  }
});





require.define({"2D/extensions/custom-polyline": function(exports, require, module) {
  var CustomPolyline,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

CustomPolyline = (function(superClass) {
  extend(CustomPolyline, superClass);

  function CustomPolyline() {
    return CustomPolyline.__super__.constructor.apply(this, arguments);
  }

  CustomPolyline.prototype._onMouseUp = function(e) {
    var ref;
    CustomPolyline.__super__._onMouseUp.apply(this, arguments);
    if (((ref = this._markers) != null ? ref.length : void 0) === 2) {
      return this._finishShape();
    }
  };

  return CustomPolyline;

})(L.Draw.Polyline);

module.exports = CustomPolyline;


}});

require.define({"2D/thisfolderisacomment/app": function(exports, require, module) {
  var App, Map, MapController;

Map = require('2D/map');

MapController = require('2D/map-controller');

App = (function() {
  function App() {
    this.util = require('common/util');
    this.map = new Map();
    this.controller = new MapController(this.map);
    $("#index").on("pageshow", (function(_this) {
      return function(event, ui) {
        $.mobile.loading('show');
        _this.map.leafletMap.invalidateSize(true);
        _this.map.layers.baseLayer2.addTo(_this.map.leafletMap);
        if ((_this.map.parameters.center != null) && (_this.map.parameters.zoom != null)) {
          _this.map.leafletMap.setView(_this.map.parameters.center, _this.map.parameters.zoom);
        } else {
          _this.map.leafletMap.fitBounds(L.latLngBounds(_this.map.parameters.nw, _this.map.parameters.se));
        }
        _this.controller.initController();
        _this.controller.timeLine.timeScale(_this.controller.speed);
        _this.controller.timeLine.pause();
        $.mobile.loading('hide');
        setTimeout(function() {
          return _this.map.leafletMap.invalidateSize();
        }, 1);
        return _this.init();
      };
    })(this));
  }

  App.prototype.init = function() {
    var drawingMode, elem, maxSelected, minSelected, removeDrawingTool, startDrawingTool, updateShareLink;
    $('#play').click((function(_this) {
      return function() {
        return _this.controller.timeLine.resume();
      };
    })(this));
    $('#pause').click((function(_this) {
      return function() {
        return _this.controller.timeLine.pause();
      };
    })(this));
    $('#speedup').click((function(_this) {
      return function() {
        _this.controller.speed *= 1.5;
        return _this.controller.timeLine.timeScale(_this.controller.speed);
      };
    })(this));
    $('#speeddown').click((function(_this) {
      return function() {
        if (_this.controller.speed >= 0.5) {
          _this.controller.speed /= 2;
          return _this.controller.timeLine.timeScale(_this.controller.speed);
        }
      };
    })(this));
    $('#changeparams').click((function(_this) {
      return function() {
        return _this.controller.timeLine.pause();
      };
    })(this));
    $('#editparamscancel').click((function(_this) {
      return function() {
        return _this.controller.timeLine.resume();
      };
    })(this));
    $('#editparamsenter').click((function(_this) {
      return function() {
        return _this.controller.timeLine.pause();
      };
    })(this));
    if (this.map.parameters.timeline) {
      $('#options-button').attr('href', '#options-details');
    }
    $('#daterange').dateRangeSlider({
      arrows: false,
      bounds: {
        min: new Date(1900, 0, 1),
        max: Date.now()
      },
      defaultValues: {
        min: new Date(this.map.parameters.startdate),
        max: new Date(this.map.parameters.enddate)
      },
      scales: [
        {
          next: function(value) {
            var n;
            n = new Date(value);
            return new Date(n.setYear(value.getFullYear() + 20));
          },
          label: function(value) {
            return value.getFullYear();
          }
        }
      ]
    });
    $('#magnitude-slider').val(this.map.parameters.desiredMag || this.map.parameters.mag).slider('refresh');
    $.datepicker.setDefaults({
      minDate: new Date(1900, 0, 1),
      maxDate: 0,
      changeMonth: true,
      changeYear: true
    });
    minSelected = function(dateText) {
      var newDate, prevVals;
      prevVals = $('#daterange').dateRangeSlider('values');
      newDate = new Date(dateText);
      return $('#daterange').dateRangeSlider('values', newDate, prevVals.max);
    };
    maxSelected = function(dateText) {
      var newDate, prevVals;
      prevVals = $('#daterange').dateRangeSlider('values');
      newDate = new Date(dateText);
      return $('#daterange').dateRangeSlider('values', prevVals.min, newDate);
    };
    $('.ui-rangeSlider-leftLabel').click(function(evt) {
      return $('.ui-rangeSlider-leftLabel').datepicker('dialog', $('#daterange').dateRangeSlider('values').min, minSelected, {}, evt);
    });
    $('.ui-rangeSlider-rightLabel').click(function(evt) {
      return $('.ui-rangeSlider-rightLabel').datepicker('dialog', $('#daterange').dateRangeSlider('values').max, maxSelected, {}, evt);
    });
    updateShareLink = (function(_this) {
      return function() {
        var query, range, url;
        range = $('#daterange').dateRangeSlider('values');
        query = _this.util.queryString(_this.map, {
          startdate: _this.util.usgsDate(range.min),
          enddate: _this.util.usgsDate(range.max),
          mag: $('#magnitude-slider').val()
        });
        url = window.location.origin + window.location.pathname + query;
        $('#share-link').attr("href", url);
        return $('#share-link').text(url);
      };
    })(this);
    elem = null;
    $('#getQuakeCount').click((function(_this) {
      return function() {
        var endtime, range, starttime;
        $(_this).addClass('ui-disabled');
        $('#quake-count').html("Earthquakes: ???");
        range = $('#daterange').dateRangeSlider('values');
        starttime = _this.util.usgsDate(range.min);
        endtime = _this.util.usgsDate(range.max);
        elem = document.createElement('script');
        elem.src = "http://earthquake.usgs.gov/fdsnws/event/1/count?starttime=" + starttime + "&endtime=" + endtime + "&eventtype=earthquake&format=geojson" + (_this.geojsonParams());
        elem.id = 'quake-count-script';
        document.body.appendChild(elem);
        return updateShareLink();
      };
    })(this));
    window.updateQuakeCount = function(result) {
      $('#quake-count').html("Earthquakes: " + result.count);
      elem = document.getElementById('quake-count-script');
      document.body.removeChild(elem);
      return $('#getQuakeCount').removeClass('ui-disabled');
    };
    $('#loadSelectedData').click((function(_this) {
      return function() {
        var range;
        range = $('#daterange').dateRangeSlider('values');
        _this.map.parameters.startdate = _this.util.usgsDate(range.min);
        _this.map.parameters.enddate = _this.util.usgsDate(range.max);
        _this.map.parameters.desiredMag = $('#magnitude-slider').val();
        _this.controller.reloadData();
        history.pushState({
          mapParams: _this.map.parameters
        }, 'Seismic Eruptions', _this.util.queryString(_this.map));
        return updateShareLink();
      };
    })(this));
    $('#share-wrapper').hide();
    $('#shareSelectedData').click(function() {
      updateShareLink();
      return $('#share-wrapper').show();
    });
    drawingMode = false;
    $('#drawingTool').click((function(_this) {
      return function() {
        var i, j, ref;
        if (!drawingMode) {
          _this.controller.timeLine.pause();
          $.mobile.loading('show');
          $('#crosssection').fadeIn();
          for (i = j = 0, ref = _this.map.values.size; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
            if (!_this.map.leafletMap.hasLayer(_this.map.earthquakes.circles[i])) {
              _this.map.earthquakes.circles[i].setStyle({
                fillOpacity: 0.5,
                fillColor: "#" + _this.controller.rainbow.colourAt(_this.map.earthquakes.depth[i])
              });
              _this.map.earthquakes.circles[i].addTo(_this.map.leafletMap);
            }
          }
          $.mobile.loading('hide');
          return drawingMode = true;
        }
      };
    })(this));
    $('#drawingToolDone').click((function(_this) {
      return function() {
        if (drawingMode) {
          $.mobile.loading('show');
          $('#crosssection').fadeOut();
          $.mobile.loading('hide');
          drawingMode = false;
          return _this.map.leafletMap.setZoom(2);
        }
      };
    })(this));
    $('#mapselector').change((function(_this) {
      return function() {
        if (_this.map.leafletMap.hasLayer(_this.map.layers.baseLayer1)) {
          _this.map.leafletMap.removeLayer(_this.map.layers.baseLayer1);
        }
        if (_this.map.leafletMap.hasLayer(_this.map.layers.baseLayer2)) {
          _this.map.leafletMap.removeLayer(_this.map.layers.baseLayer2);
        }
        if (_this.map.leafletMap.hasLayer(_this.map.layers.baseLayer3)) {
          _this.map.leafletMap.removeLayer(_this.map.layers.baseLayer3);
        }
        switch ($('#mapselector').val()) {
          case '1':
            _this.map.layers.baseLayer1.addTo(_this.map.leafletMap);
            if (_this.map.leafletMap.hasLayer(_this.map.layers.baseLayer2)) {
              _this.map.leafletMap.removeLayer(_this.map.layers.baseLayer2);
            }
            if (_this.map.leafletMap.hasLayer(_this.map.layers.baseLayer3)) {
              return _this.map.leafletMap.removeLayer(_this.map.layers.baseLayer3);
            }
            break;
          case '2':
            _this.map.layers.baseLayer2.addTo(_this.map.leafletMap);
            if (_this.map.leafletMap.hasLayer(_this.map.layers.baseLayer3)) {
              _this.map.leafletMap.removeLayer(_this.map.layers.baseLayer3);
            }
            if (_this.map.leafletMap.hasLayer(_this.map.layers.baseLayer1)) {
              return _this.map.leafletMap.removeLayer(_this.map.layers.baseLayer1);
            }
            break;
          case '3':
            _this.map.layers.baseLayer3.addTo(_this.map.leafletMap);
            if (_this.map.leafletMap.hasLayer(_this.map.layers.baseLayer2)) {
              _this.map.leafletMap.removeLayer(_this.map.layers.baseLayer2);
            }
            if (_this.map.leafletMap.hasLayer(_this.map.layers.baseLayer1)) {
              return _this.map.leafletMap.removeLayer(_this.map.layers.baseLayer1);
            }
        }
      };
    })(this));
    $('#date-1-y').change(function() {
      return loadCount(1);
    });
    $('#date-1-m').change(function() {
      return loadCount(1);
    });
    $('#date-2-y').change(function() {
      return loadCount(1);
    });
    $('#date-2-m').change(function() {
      return loadCount(1);
    });
    startDrawingTool = function() {
      var i, j, ref;
      $('#overlay').fadeIn();
      $('#startDrawingToolButton').fadeOut();
      $('#Drawingtools').fadeIn();
      $("#slider").slider({
        disabled: true
      });
      document.getElementById("play").disabled = true;
      document.getElementById("pause").disabled = true;
      document.getElementById("speedup").disabled = true;
      document.getElementById("speeddown").disabled = true;
      tl.pause();
      for (i = j = 0, ref = this.map.values.size; j < ref; i = j += 1) {
        if (!this.map.leafletMap.hasLayer(this.map.earthquakes.circles[i])) {
          this.map.earthquakes.circles[i].setStyle({
            fillOpacity: 0.5,
            fillColor: "#" + this.controller.rainbow.colourAt(this.map.earthquakes.depth[i])
          });
          this.map.earthquakes.circles[i].addTo(this.map.leafletMap);
        }
      }
      return $('#overlay').fadeOut();
    };
    return removeDrawingTool = function() {
      $('#overlay').fadeIn();
      $('#startDrawingToolButton').fadeIn();
      $('#Drawingtools').fadeOut();
      $("#slider").slider({
        disabled: false
      });
      document.getElementById("play").disabled = false;
      document.getElementById("pause").disabled = false;
      document.getElementById("speedup").disabled = false;
      document.getElementById("speeddown").disabled = false;
      return $('#overlay').fadeOut();
    };
  };

  App.prototype.geojsonParams = function() {
    var bounds, latSpan, lngSpan, mag, nw, se, url;
    bounds = this.map.leafletMap.getBounds();
    nw = bounds.getNorthWest();
    se = bounds.getSouthEast();
    mag = $('#magnitude-slider').val();
    latSpan = nw.lat - se.lat;
    lngSpan = se.lng - nw.lng;
    if (latSpan >= 180 || latSpan <= -180) {
      nw.lat = 90;
      se.lat = -90;
    }
    if (lngSpan >= 180 || lngSpan <= -180) {
      nw.lng = -180;
      se.lng = 180;
    }
    url = "&minmagnitude=" + mag + "&minlatitude=" + se.lat + "&maxlatitude=" + nw.lat + "&minlongitude=" + nw.lng + "&maxlongitude=" + se.lng + "&callback=updateQuakeCount";
    return url;
  };

  return App;

})();

module.exports = App;


}});

require.define({"2D/thisfolderisacomment/cross-section": function(exports, require, module) {
  var CrossSection, CustomPolyline;

CustomPolyline = require('2D/extensions/custom-polyline');

CrossSection = (function() {
  CrossSection.prototype.width = 1.5;

  CrossSection.prototype.lineOptions = {
    stroke: true,
    color: '#ff0000',
    weight: 4,
    opacity: 0.5,
    fill: false,
    clickable: true
  };

  CrossSection.prototype.points = [];

  CrossSection.prototype._featureGroup = null;

  CrossSection.prototype._line = null;

  CrossSection.prototype._rect = null;

  function CrossSection(map) {
    var polyline;
    this.map = map;
    this._featureGroup = new L.LayerGroup();
    this._editMarkerGroup = new L.LayerGroup();
    this.map.addLayer(this._featureGroup);
    this.map.addLayer(this._editMarkerGroup);
    polyline = new CustomPolyline(this.map);
    polyline.enable();
    this._line = new L.Polyline([], this.lineOptions);
    this._rect = new L.polygon([]);
    this.map.on('draw:created', (function(_this) {
      return function(e) {
        return _this.handleCreate(e);
      };
    })(this));
  }

  CrossSection.prototype.handleCreate = function(e) {
    var p0, p1, ref;
    ref = e.layer.getLatLngs(), p0 = ref[0], p1 = ref[1];
    this._updateLine(p0, p1);
    this._updateRect(p0, p1);
    this._createEditControls();
    this.current = {
      center: this.map.getCenter(),
      zoom: this.map.getZoom()
    };
    if (this._rect != null) {
      return this.map.fitBounds(this._rect.getBounds());
    }
  };

  CrossSection.prototype.destroy = function() {
    this.map.removeLayer(this._featureGroup);
    this.map.removeLayer(this._editMarkerGroup);
    return this.map.setView(this.current.center, this.current.zoom);
  };

  CrossSection.prototype._updateLine = function(p0, p1) {
    this._line.setLatLngs([p0, p1]);
    if (!this._featureGroup.hasLayer(this._line)) {
      this._featureGroup.addLayer(this._line);
    }
    return this._line;
  };

  CrossSection.prototype._updateRect = function(p0, p1) {
    var c0, c1, c3, dLat, dLng, dir, distance, dx, dy, n0, r0, r1, r2, r3;
    c0 = this.map.latLngToContainerPoint(p0);
    c1 = this.map.latLngToContainerPoint(p1);
    dir = this._direction(c0, c1);
    dLng = this.width * Math.cos(dir + Math.PI / 2);
    dLat = this.width * Math.sin(dir + Math.PI / 2);
    n0 = L.latLng(p0.lat + dLat, p0.lng + dLng);
    c3 = this.map.latLngToContainerPoint(n0);
    distance = c0.distanceTo(c3);
    dx = distance * Math.cos(dir + Math.PI / 2);
    dy = distance * Math.sin(dir + Math.PI / 2);
    r0 = c0.add(L.point(dx, dy));
    r1 = c0.add(L.point(-dx, -dy));
    r2 = c1.add(L.point(-dx, -dy));
    r3 = c1.add(L.point(dx, dy));
    this.points = [this.map.containerPointToLatLng(r0), this.map.containerPointToLatLng(r1), this.map.containerPointToLatLng(r2), this.map.containerPointToLatLng(r3)];
    this._rect.setLatLngs(this.points);
    if (!this._featureGroup.hasLayer(this._rect)) {
      this._featureGroup.addLayer(this._rect);
    }
    return this._rect;
  };

  CrossSection.prototype._direction = function(p0, p1) {
    return Math.atan2(p1.y - p0.y, p1.x - p0.x);
  };

  CrossSection.prototype._midPoint = function(p0, p1) {
    var dx, dy;
    dx = p1.lng - p0.lng;
    dy = p1.lat - p0.lat;
    return L.latLng(p0.lat + (dy / 2), p0.lng + (dx / 2));
  };

  CrossSection.prototype._createEditControls = function() {
    var centerControl, leftControl, resizeControl, rightControl;
    leftControl = this._createEditMarker(this._line.getLatLngs()[0], (function(_this) {
      return function(e) {
        _this._updateLine(e.target.getLatLng(), _this._line.getLatLngs()[1]);
        _this._updateRect(e.target.getLatLng(), _this._line.getLatLngs()[1]);
        centerControl.updateLocation(_this._rect.getBounds().getCenter());
        return resizeControl.updateLocation(_this._midPoint(_this._rect.getLatLngs()[0], _this._rect.getLatLngs()[3]));
      };
    })(this));
    rightControl = this._createEditMarker(this._line.getLatLngs()[1], (function(_this) {
      return function(e) {
        _this._updateLine(_this._line.getLatLngs()[0], e.target.getLatLng());
        _this._updateRect(_this._line.getLatLngs()[0], e.target.getLatLng());
        centerControl.updateLocation(_this._rect.getBounds().getCenter());
        return resizeControl.updateLocation(_this._midPoint(_this._rect.getLatLngs()[0], _this._rect.getLatLngs()[3]));
      };
    })(this));
    centerControl = this._createEditMarker(this._midPoint.apply(this, this._line.getLatLngs()), (function(_this) {
      return function(e) {
        var dx, dy, newLatLng, p0, p1, p3, ref;
        newLatLng = e.target.getLatLng();
        dx = newLatLng.lng - centerControl._origLatLng.lng;
        dy = newLatLng.lat - centerControl._origLatLng.lat;
        ref = _this._line.getLatLngs(), p0 = ref[0], p1 = ref[1];
        p0.lat += dy;
        p0.lng += dx;
        p1.lat += dy;
        p1.lng += dx;
        _this._updateLine(p0, p1);
        _this._updateRect(p0, p1);
        leftControl.updateLocation(p0);
        rightControl.updateLocation(p1);
        p3 = resizeControl.getLatLng();
        p3.lat += dy;
        p3.lng += dx;
        resizeControl.setLatLng(p3);
        return centerControl._origLatLng = newLatLng;
      };
    })(this));
    return resizeControl = this._createEditMarker(this._midPoint(this._rect.getLatLngs()[0], this._rect.getLatLngs()[3]), (function(_this) {
      return function(e) {
        var centerLoc, denom, myLoc, numer, p1, p2, ref;
        myLoc = e.target.getLatLng();
        centerLoc = centerControl.getLatLng();
        ref = _this._line.getLatLngs(), p1 = ref[0], p2 = ref[1];
        numer = Math.abs((p2.lat - p1.lat) * myLoc.lng - (p2.lng - p1.lng) * myLoc.lat + p2.lng * p1.lat - p2.lat * p1.lng);
        denom = Math.sqrt(Math.pow(p2.lng - p1.lng, 2) + Math.pow(p2.lat - p1.lat, 2));
        _this.width = numer / denom;
        console.log("new width: ", _this.width, e.target.getLatLng(), centerControl.getLatLng());
        _this._updateLine.apply(_this, _this._line.getLatLngs());
        return _this._updateRect.apply(_this, _this._line.getLatLngs());
      };
    })(this));
  };

  CrossSection.prototype._createEditMarker = function(latlng, onDrag) {
    var editMarker;
    editMarker = new L.Marker(latlng, {
      draggable: true,
      icon: new L.DivIcon({
        iconSize: new L.Point(8, 8),
        className: 'leaflet-div-icon leaflet-editing-icon'
      })
    });
    editMarker._origLatLng = latlng;
    editMarker.updateLocation = function(latLng) {
      this._origLatLng = latLng;
      return this.setLatLng(latLng);
    };
    editMarker.on('drag', onDrag);
    editMarker.on('dragend', onDrag);
    this._editMarkerGroup.addLayer(editMarker);
    return editMarker;
  };

  return CrossSection;

})();

module.exports = CrossSection;


}});

require.define({"2D/thisfolderisacomment/magnitude-search": function(exports, require, module) {
  var MagnitudeSearch;

MagnitudeSearch = (function() {
  function MagnitudeSearch() {}

  MagnitudeSearch.prototype.loadMagArray = function() {
    return new Promise((function(_this) {
      return function(resolve, reject) {
        return $.get('count.txt', function(data) {
          var arr, i, j, k, l, ref;
          arr = data.split(',');
          _this.magarray = [];
          for (i = k = 99; k >= 0; i = --k) {
            magarray[i] = [];
            for (j = l = 0, ref = arr.length / 102; l < ref; j = l += 1) {
              if (_this.magarray[i][j] != null) {
                magarray[i][j] = parseInt(arr[(j * 102) + 2 + i]) + magarray[i][j];
              } else {
                magarray[i][j] = parseInt(arr[(j * 102) + 2 + i]);
              }
              if ((j + 1) < (arr.length / 102)) {
                magarray[i][j + 1] = parseInt(magarray[i][j]);
              }
              if (i < 99) {
                magarray[i][j] = parseInt(magarray[i + 1][j]) + magarray[i][j];
              }
            }
          }
          return resolve();
        });
      };
    })(this));
  };

  MagnitudeSearch.prototype.loadCount = function(click) {
    $("#error-date").html("");
    if (this.magArray == null) {
      this.loadMagArray().then((function(_this) {
        return function() {
          return _this.loadCount(click);
        };
      })(this));
    }
    this.d1 = {
      year: $('#date-1-y').val(),
      month: $('#date-1-m').val()
    };
    this.d2 = {
      year: $('#date-2-y').val(),
      month: $('#date-2-m').val()
    };
    if (click === 0 && !((this.d1.year != null) && (this.d2.year != null))) {
      $("#error-date").html("<p style='color:red'>Select the years</p>");
      return;
    }
    this.d1.year = this.d1.year - 60;
    this.d1.month = this.d1.month - 1;
    this.d2.year = this.d2.year - 60;
    this.d1.month = this.d2.month - 1;
    if (this.d2.year * 12 + this.d2.month <= this.d1.year * 12 + this.d1.month) {
      $("#error-date").html("<p style='color:red'>Select a valid date range</p>");
      return;
    }
    if (click === 0) {
      return window.open("?mag=" + (this._binarySearch(0, 100)) + "&startdate=" + (this.d1.year + 1960) + "-" + (this.d1.month + 1) + "-1&enddate=" + (this.d2.year + 1960) + "-" + (this.d2.month + 1) + "-1", "_self");
    } else {
      return $("#magnitude-search").html("<p>Calculated magnitude cutoff : </p><p style='color:green'>" + (this._binarySearch(0, 100)) + "</p>");
    }
  };

  MagnitudeSearch.prototype._binarySearch = function(mag, max) {
    var count, nextMag;
    if (mag < max) {
      count = 0;
      count = this.magArray[mag][d2.year * 12 + d2.month] - this.magArray[mag][d1.year * 12 + d1.month];
      if (count > 20000) {
        nextMag = mag + (max - mag) / 2;
        return binarySearch(nextMag, max);
      } else if (count < 15000 && mag !== 0) {
        nextMag = mag - (max - mag) / 2;
        return binarySearch(nextMag, mag);
      } else {
        return mag / 10;
      }
    } else {
      return max / 10;
    }
  };

  return MagnitudeSearch;

})();

module.exports = new MagnitudeSearch();


}});

require.define({"2D/thisfolderisacomment/map-controller": function(exports, require, module) {
  var DataLoader, MapController;

DataLoader = require('common/data-loader');

MapController = (function() {
  MapController.EARTHQUAKE_NUM_LIMIT = 500;

  function MapController(map) {
    this.map = map;
    this.map.controller = this;
    this.util = require('common/util');
    this.values = {};
  }

  MapController.prototype.values = {
    timediff: 0,
    size: 0
  };

  MapController.prototype.earthquakes = {
    circles: [],
    time: [],
    depth: []
  };

  MapController.prototype.timeLine = null;

  MapController.prototype.speed = 360;

  MapController.prototype.snd = new Audio("tap.wav");

  MapController.prototype._getDepth = function(feature) {
    var e;
    try {
      return feature.geometry.geometries[0].coordinates[2];
    } catch (_error) {
      e = _error;
      void 0;
    }
    try {
      return feature.geometry.coordinates[2];
    } catch (_error) {
      e = _error;
      void 0;
    }
    console.log('Failed to find depth!', feature);
    return '???';
  };

  MapController.prototype._getCurrentLimit = function(zoom, tileSize) {
    var bottom, bounds, height, left, nw, nwPixel, nwTile, right, se, sePixel, seTile, top, width;
    return MapController.EARTHQUAKE_NUM_LIMIT;
    bounds = this.map.leafletMap.getBounds();
    nw = bounds.getNorthWest();
    se = bounds.getSouthEast();
    nwPixel = this.map.leafletMap.project(nw);
    sePixel = this.map.leafletMap.project(se);
    nwTile = nwPixel.divideBy(tileSize);
    seTile = sePixel.divideBy(tileSize);
    left = Math.floor(nwTile.x);
    right = Math.floor(seTile.x);
    top = Math.floor(nwTile.y);
    bottom = Math.floor(seTile.y);
    if (left > right) {
      left = left - numTiles;
    }
    if (top > bottom) {
      top = top - numTiles;
    }
    width = right - left;
    height = bottom - top;
    return Math.floor(15000 / (width * height));
  };

  MapController.prototype._getCurrentMag = function(zoom) {
    var mag;
    mag = this._getDesiredMag(zoom);
    if (this.map.parameters.mag !== mag) {
      this.map.parameters.mag = mag;
      $('#magnitude-slider').val(mag).slider('refresh');
    }
    return mag;
  };

  MapController.prototype._getDesiredMag = function(zoom) {
    if (this.map.parameters.desiredMag != null) {
      return this.map.parameters.desiredMag;
    }
    if (zoom > 8) {
      return 2;
    }
    if (zoom > 6) {
      return 3;
    }
    if (zoom > 3) {
      return 4;
    }
    if (zoom > 1) {
      return 5;
    }
    return 6;
  };

  MapController.prototype._geojsonURL = function(tileInfo) {
    var bounds, nw, nwPoint, se, sePoint, tilePoint, tileSize, url, zoom;
    if (tileInfo != null) {
      tileSize = tileInfo.tileSize;
      tilePoint = L.point(tileInfo.x, tileInfo.y);
      nwPoint = tilePoint.multiplyBy(tileSize);
      sePoint = nwPoint.add(new L.Point(tileSize, tileSize));
      nw = this.map.leafletMap.unproject(nwPoint);
      se = this.map.leafletMap.unproject(sePoint);
      zoom = tileInfo.z;
    } else {
      bounds = this.map.leafletMap.getBounds();
      if (this.map.parameters.nw != null) {
        nw = this.map.parameters.nw;
      } else if ((this.map.parameters.center != null) && (this.map.parameters.zoom != null)) {
        nw = bounds.getNorthWest();
      }
      if (this.map.parameters.se != null) {
        se = this.map.parameters.se;
      } else if ((this.map.parameters.center != null) && (this.map.parameters.zoom != null)) {
        se = bounds.getSouthEast();
      }
      tileSize = 256;
      zoom = 0;
    }
    url = "&limit=" + (this._getCurrentLimit(zoom, tileSize)) + "&jsonerror=true&minmagnitude=" + (this._getCurrentMag(zoom)) + "&starttime=" + this.map.parameters.startdate + "&endtime=" + this.map.parameters.enddate;
    if ((nw != null) && (se != null)) {
      url += "&minlatitude=" + se.lat + "&maxlatitude=" + nw.lat + "&minlongitude=" + nw.lng + "&maxlongitude=" + se.lng;
    }
    return url;
  };

  MapController.prototype._updateSlider = function() {
    $("#slider").val(Math.ceil(this.timeLine.progress() * this.map.values.timediff)).slider('refresh');
    return $("#date").html(this.util.timeConverter((this.timeLine.progress() * this.map.values.timediff) + this.map.parameters.starttime));
  };

  MapController.prototype._markerStyle = {
    clickable: true,
    color: "#000",
    fillColor: "#00D",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.3
  };

  MapController.prototype._markerCreator = function() {
    return {
      pointToLayer: (function(_this) {
        return function(feature, latlng) {
          return L.circleMarker(latlng, _this._markerStyle);
        };
      })(this),
      style: this._markerStyle,
      onEachFeature: (function(_this) {
        return function(feature, layer) {
          var depth;
          depth = _this._getDepth(feature);
          layer.setStyle({
            radius: 0.9 * Math.pow(1.5, feature.properties.mag - 1),
            fillColor: "#" + _this.rainbow.colourAt(depth)
          });
          if (feature.properties != null) {
            layer.bindPopup("Place: <b>" + feature.properties.place + "</b></br>Magnitude: <b> " + feature.properties.mag + "</b></br>Time: " + (_this.util.timeConverter(feature.properties.time)) + "</br>Depth: " + depth + " km");
          }
          if (!(layer instanceof L.Point)) {
            layer.on('mouseover', function() {
              return layer.setStyle({
                fillOpacity: 1.0
              });
            });
            return layer.on('mouseout', function() {
              return layer.setStyle({
                fillOpacity: 0.3
              });
            });
          }
        };
      })(this)
    };
  };

  MapController.prototype.initController = function() {
    var spinnerOpts;
    this.rainbow = new Rainbow();
    this.rainbow.setNumberRange(0, 700);
    this.timeLine = new TimelineLite({
      onUpdate: (function(_this) {
        return function() {
          return _this._updateSlider();
        };
      })(this)
    });
    spinnerOpts = {
      lines: 13,
      length: 10,
      width: 7,
      radius: 10,
      top: '37px',
      left: '70px',
      color: '#cccccc',
      shadow: true
    };
    if (this.map.parameters.timeline) {
      return this._loadStaticData(spinnerOpts);
    } else {
      this.geojsonTileLayer = new L.TileLayer.GeoJSON('http://earthquake.usgs.gov/fdsnws/event/1/query?eventtype=earthquake&orderby=magnitude&format=geojson{url_params}', {
        url_params: (function(_this) {
          return function(tileInfo) {
            return _this._geojsonURL(tileInfo);
          };
        })(this),
        clipTiles: false,
        wrapPoints: false
      }, this._markerCreator());
      this.geojsonTileLayer.on('loading', (function(_this) {
        return function(event) {
          return _this.map.leafletMap.spin(true, spinnerOpts);
        };
      })(this));
      this.geojsonTileLayer.on('load', (function(_this) {
        return function(event) {
          return _this.map.leafletMap.spin(false);
        };
      })(this));
      return this.geojsonTileLayer.addTo(this.map.leafletMap);
    }
  };

  MapController.prototype.reloadData = function() {
    var circle, j, len, ref;
    if (this.map.parameters.timeline) {
      this.timeLine.pause();
      ref = this.map.earthquakes.circles;
      for (j = 0, len = ref.length; j < len; j++) {
        circle = ref[j];
        if (this.map.leafletMap.hasLayer(circle)) {
          this.map.leafletMap.removeLayer(circle);
        }
      }
      this.map.earthquakes.circles = [];
      this.map.earthquakes.time = [];
      this.map.earthquakes.depth = [];
      return this._loadStaticData();
    } else {
      return this.geojsonTileLayer.redraw();
    }
  };

  MapController.prototype._loadStaticData = function(spinnerOpts) {
    var loader, promise;
    this.timeLine.pause();
    loader = new DataLoader();
    if (this.map.parameters.data != null) {
      promise = loader.load(this.map.parameters.data, {
        ajax: true
      });
    } else if ((this.map.parameters.datap != null) && (this.map.parameters.datap_callback != null)) {
      promise = loader.load(this.map.parameters.datap, {
        callback: this.map.parameters.datap_callback
      });
    } else {
      promise = loader.load("http://earthquake.usgs.gov/fdsnws/event/1/query?eventtype=earthquake&orderby=time-asc&format=geojson" + (this._geojsonURL()), {
        ajax: true
      });
    }
    return promise.then((function(_this) {
      return function(results) {
        var delay, feature, i, j, len, ref;
        _this.map.values.size = results.features.length;
        ref = results.features;
        for (i = j = 0, len = ref.length; j < len; i = ++j) {
          feature = ref[i];
          _this.map.earthquakes.circles[i] = L.geoJson(feature, _this._markerCreator());
          _this.map.earthquakes.time[i] = feature.properties.time;
          _this.map.earthquakes.depth[i] = feature.geometry.coordinates[2];
          delay = i === 0 ? 0 : 20 * ((feature.properties.time - results.features[i - 1].properties.time) / 1000000000);
          _this.timeLine.append(TweenLite.delayedCall(delay, (function(i) {
            return _this.map.mapAdder(i);
          }), [i.toString()]));
        }
        if (_this.map.values.size > 0) {
          _this.map.values.timediff = results.features[_this.map.values.size - 1].properties.time - results.features[0].properties.time;
          _this.map.parameters.starttime = results.features[0].properties.time;
          $("#slider").slider({
            slidestart: function(event) {
              return _this.timeLine.pause();
            },
            slidestop: function(event) {
              $("#date").html(_this.util.timeConverter(_this.map.parameters.starttime));
              return _this.timeLine.progress($("#slider").val() / _this.map.values.timediff);
            }
          });
          $("#info").html("<p>\ntotal earthquakes: " + _this.map.values.size + "<br/>\nminimum depth: " + (Math.min.apply(null, _this.map.earthquakes.depth)) + " km</br>\nmaximum depth: " + (Math.max.apply(null, _this.map.earthquakes.depth)) + " km\n</p>\n<div class='ui-body ui-body-a'><p>\n  <a href='http://github.com/gizmoabhinav/Seismic-Eruptions'>Link to the project</a>\n</p></div>");
          $("#startdate").html("Start date: " + (_this.util.timeConverter(_this.map.parameters.startdate)));
          $("#enddate").html("End date: " + (_this.util.timeConverter(_this.map.parameters.enddate)));
          $("#magcutoff").html("Cutoff magnitude: " + _this.map.parameters.mag);
          return _this.timeLine.resume();
        }
      };
    })(this));
  };

  return MapController;

})();

module.exports = MapController;


}});

require.define({"2D/thisfolderisacomment/map": function(exports, require, module) {
  var CrossSection, Map, util;

CrossSection = require('2D/cross-section');

util = require('common/util');

Map = (function() {
  var p;

  function Map() {
    var base, base1, d;
    d = new Date();
    if (this.parameters.startdate == null) {
      this.parameters.startdate = "1960/1/1";
    }
    if (this.parameters.enddate == null) {
      this.parameters.enddate = (d.getFullYear()) + "/" + (d.getMonth() + 1) + "/" + (d.getDate());
    }
    this.parameters.timeline = true;
    if (!((this.parameters.center != null) && this.parameters.zoom)) {
      (base = this.parameters).nw || (base.nw = L.latLng(50, -40));
      (base1 = this.parameters).se || (base1.se = L.latLng(-20, 40));
    }
  }

  Map.prototype.leafletMap = L.map('map', {
    worldCopyJump: true
  });

  Map.prototype.crossSection = null;

  Map.prototype.parameters = {
    desiredMag: util.getURLParameter("mag"),
    startdate: util.getURLParameter("startdate"),
    enddate: util.getURLParameter("enddate"),
    nw: (p = util.getURLParameter('nw')) ? L.latLng.apply(L, p.split(',')) : null,
    se: (p = util.getURLParameter('se')) ? L.latLng.apply(L, p.split(',')) : null,
    center: (p = util.getURLParameter('center')) ? L.latLng.apply(L, p.split(',')) : null,
    zoom: util.getURLParameter("zoom"),
    data: util.getURLParameter('data'),
    datap: util.getURLParameter('datap'),
    datap_callback: util.getURLParameter('datap_callback')
  };

  Map.prototype.values = {
    timediff: 0,
    size: 0,
    maxdepth: 0,
    mindepth: 2000
  };

  Map.prototype.layers = {
    baseLayer3: L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}),
    baseLayer2: L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png', {
      subdomains: ['otile1', 'otile2', 'otile3', 'otile4']
    }),
    baseLayer1: L.tileLayer('http://{s}.tiles.mapbox.com/v3/bclc-apec.map-rslgvy56/{z}/{x}/{y}.png', {})
  };

  Map.prototype.drawnItems = new L.FeatureGroup();

  Map.prototype.earthquakes = {
    circles: [],
    time: [],
    depth: []
  };

  Map.prototype.array = [];

  Map.prototype.plateBoundaries = new L.KML("plates.kml", {
    async: true
  });

  Map.prototype.plateToggle = function() {
    if ($("#plates").is(':checked')) {
      return this.leafletMap.addLayer(this.plateBoundaries);
    } else {
      return this.leafletMap.removeLayer(this.plateBoundaries);
    }
  };

  Map.prototype.mapAdder = function(i) {
    if (!this.leafletMap.hasLayer(this.earthquakes.circles[i])) {
      this.earthquakes.circles[i].addTo(this.leafletMap);
    }
    this.earthquakes.circles[i].setStyle({
      fillOpacity: 0.5,
      fillColor: "#" + this.controller.rainbow.colourAt(this.earthquakes.depth[i])
    });
    i++;
    while (this.leafletMap.hasLayer(this.earthquakes.circles[i])) {
      this.leafletMap.removeLayer(this.earthquakes.circles[i]);
      i++;
    }
    $("#time").html(util.timeConverter(this.earthquakes.time[i]));
    return this.controller.snd.play();
  };

  Map.prototype.mapRemover = function(i) {
    if (this.leafletMap.hasLayer(this.earthquakes.circles[i])) {
      return this.leafletMap.removeLayer(this.earthquakes.circles[i]);
    }
  };

  Map.prototype.render = function() {
    var pts;
    pts = this.crossSection.points;
    if (pts.length === 4) {
      return this.render3DFrame("../3D/index.html?x1=" + pts[0].lng + "&y1=" + pts[0].lat + "&x2=" + pts[1].lng + "&y2=" + pts[1].lat + "&x3=" + pts[2].lng + "&y3=" + pts[2].lat + "&x4=" + pts[3].lng + "&y4=" + pts[3].lat + "&mag=" + this.parameters.mag + "&startdate=" + this.parameters.startdate + "&enddate=" + this.parameters.enddate);
    }
  };

  Map.prototype.render3DFrame = function(url) {
    var frame;
    frame = document.createElement("div");
    frame.className = 'crosssection-popup';
    frame.innerHTML = "<div class='close-button'><span class='ui-btn-icon-notext ui-icon-delete'></span></div><div class='iframe-wrapper'><iframe class='crosssection-iframe' src='" + url + "'></iframe></div>";
    document.body.appendChild(frame);
    return $('.close-button').click(function() {
      return document.body.removeChild(frame);
    });
  };

  Map.prototype.startdrawing = function() {
    if (this.crossSection != null) {
      alert("Click done on the current cross-section before drawing a new cross-section");
      return;
    }
    return this.crossSection = new CrossSection(this.leafletMap);
  };

  Map.prototype.backtonormalview = function() {
    this.crossSection.destroy();
    return this.crossSection = null;
  };

  return Map;

})();

module.exports = Map;


}});

require.define({"common/data-loader": function(exports, require, module) {
  var DataLoader;

DataLoader = (function() {
  function DataLoader() {}

  DataLoader.prototype.load = function(url, arg) {
    var ajax, callback, ref;
    ref = arg != null ? arg : {}, ajax = ref.ajax, callback = ref.callback;
    return new Promise((function(_this) {
      return function(resolve, reject) {
        var id, scriptDomElement;
        if (ajax) {
          return $.ajax({
            url: url,
            dataType: 'json',
            success: function(data) {
              return resolve(data);
            },
            error: function(request) {
              return reject(request);
            }
          });
        } else {
          id = callback != null ? callback : 'request_' + Math.random().toString(36).substr(2, 8);
          scriptDomElement = _this.injectScript(id, url, callback == null);
          _this.createListener(id, scriptDomElement, resolve, reject);
          return document.body.appendChild(scriptDomElement);
        }
      };
    })(this));
  };

  DataLoader.prototype.createListener = function(id, scriptDomElement, resolve, reject) {
    return window[id] = function(data) {
      document.body.removeChild(scriptDomElement);
      delete window[id];
      return resolve(data);
    };
  };

  DataLoader.prototype.injectScript = function(id, url, appendCallback) {
    var scriptDomElement;
    if (appendCallback == null) {
      appendCallback = true;
    }
    scriptDomElement = document.createElement('script');
    scriptDomElement.src = url + (appendCallback ? '&callback=' + id : '');
    scriptDomElement.id = id;
    return scriptDomElement;
  };

  return DataLoader;

})();

module.exports = DataLoader;


}});

require.define({"common/util": function(exports, require, module) {
  var Util,
  hasProp = {}.hasOwnProperty;

Util = (function() {
  function Util() {}

  Util.prototype.getURLParameter = function(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ""])[1].replace(/\+/g, '%20')) || null;
  };

  Util.prototype.convertCoordinatesx = function(x) {
    x = parseFloat(x);
    x = ((x + 180) * 64) / 360;
    return x;
  };

  Util.prototype.convertCoordinatesy = function(y) {
    y = parseFloat(y);
    y = y * (Math.PI / 180);
    y = (1 - (Math.log(Math.tan(y) + 1.0 / Math.cos(y)) / Math.PI)) * 32;
    return y;
  };

  Util.prototype.toLon = function(x) {
    x = parseFloat(x);
    x = (x * 360 / 64) - 180;
    return x;
  };

  Util.prototype.toLat = function(y) {
    y = parseFloat(y);
    y = 2 * (Math.atan(Math.pow(Math.E, (1 - (y / 32)) * Math.PI)) - (Math.PI / 4));
    y = y * 180 / Math.PI;
    return y;
  };

  Util.prototype._months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  Util.prototype.timeConverter = function(UNIX_timestamp) {
    var a, date, month, time, year;
    a = new Date(UNIX_timestamp);
    year = a.getFullYear();
    month = this._months[a.getMonth()];
    date = a.getDate();
    time = year + ' ' + month + ' ' + date;
    return time;
  };

  Util.prototype.usgsDate = function(date) {
    return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
  };

  Util.prototype.queryString = function(map, overrides) {
    var center, key, params, value;
    if (overrides == null) {
      overrides = {};
    }
    center = map.leafletMap.getCenter();
    params = {
      zoom: map.leafletMap.getZoom(),
      center: center.lat + "," + center.lng,
      mag: map.parameters.desiredMag,
      startdate: map.parameters.startdate,
      enddate: map.parameters.enddate
    };
    if (map.parameters.timeline) {
      params.timeline = true;
    }
    for (key in overrides) {
      if (!hasProp.call(overrides, key)) continue;
      value = overrides[key];
      params[key] = value;
    }
    return '?' + $.param(params);
  };

  return Util;

})();

module.exports = new Util();


}});

