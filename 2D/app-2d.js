(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
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

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
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

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.define({"2D/app": function(exports, require, module) {
  (function() {
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
          elem.src = 'http://comcat.cr.usgs.gov/fdsnws/event/1/count?starttime=' + starttime + '&endtime=' + endtime + '&eventtype=earthquake&format=geojson' + _this.geojsonParams();
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
      if (this.map.parameters.timeline) {
        $('#index').click(function() {
          $('#playcontrols').fadeIn();
          $('#slider-wrapper').fadeIn();
          $('#date').fadeIn();
          setTimeout(function() {
            return $('#playcontrols').fadeOut();
          }, 5000);
          return setTimeout(function() {
            $('#slider-wrapper').fadeOut();
            return $('#date').fadeOut();
          }, 12000);
        });
        $('#playback').hover(function() {
          $('#playcontrols').fadeIn();
          $('#slider-wrapper').fadeIn();
          $('#date').fadeIn();
          return setTimeout(function() {
            $('#slider-wrapper').fadeOut();
            $('#date').fadeOut();
            return $('#playcontrols').fadeOut();
          }, 8000);
        });
        setTimeout(function() {
          $('#slider-wrapper').fadeOut();
          $('#date').fadeOut();
          return $('#playcontrols').fadeOut();
        }, 10000);
      } else {
        $('#playback').fadeOut();
      }
      drawingMode = false;
      $('#drawingTool').click((function(_this) {
        return function() {
          var i, _i, _ref;
          if (!drawingMode) {
            _this.controller.timeLine.pause();
            $.mobile.loading('show');
            $('#playback').fadeOut();
            $('#crosssection').fadeIn();
            for (i = _i = 0, _ref = _this.map.values.size; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
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
            if (_this.map.parameters.timeline) {
              $('#playback').fadeIn();
            }
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
        var i, _i, _ref;
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
        for (i = _i = 0, _ref = this.map.values.size; _i < _ref; i = _i += 1) {
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
      url = '&minmagnitude=' + mag + '&minlatitude=' + se.lat + '&maxlatitude=' + nw.lat + '&minlongitude=' + nw.lng + '&maxlongitude=' + se.lng + '&callback=updateQuakeCount';
      return url;
    };

    return App;

  })();

  module.exports = App;

}).call(this);


}});

require.define({"2D/cross-section": function(exports, require, module) {
  (function() {
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
      var p0, p1, _ref;
      _ref = e.layer.getLatLngs(), p0 = _ref[0], p1 = _ref[1];
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
          var dx, dy, newLatLng, p0, p1, p3, _ref;
          newLatLng = e.target.getLatLng();
          dx = newLatLng.lng - centerControl._origLatLng.lng;
          dy = newLatLng.lat - centerControl._origLatLng.lat;
          _ref = _this._line.getLatLngs(), p0 = _ref[0], p1 = _ref[1];
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
          var centerLoc, denom, myLoc, numer, p1, p2, _ref;
          myLoc = e.target.getLatLng();
          centerLoc = centerControl.getLatLng();
          _ref = _this._line.getLatLngs(), p1 = _ref[0], p2 = _ref[1];
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

}).call(this);


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
  (function() {
  var CustomPolyline,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CustomPolyline = (function(_super) {
    __extends(CustomPolyline, _super);

    function CustomPolyline() {
      return CustomPolyline.__super__.constructor.apply(this, arguments);
    }

    CustomPolyline.prototype._onMouseUp = function(e) {
      var _ref;
      CustomPolyline.__super__._onMouseUp.apply(this, arguments);
      if (((_ref = this._markers) != null ? _ref.length : void 0) === 2) {
        return this._finishShape();
      }
    };

    return CustomPolyline;

  })(L.Draw.Polyline);

  module.exports = CustomPolyline;

}).call(this);


}});

require.define({"2D/magnitude-search": function(exports, require, module) {
  (function() {
  var MagnitudeSearch;

  MagnitudeSearch = (function() {
    function MagnitudeSearch() {}

    MagnitudeSearch.prototype.loadMagArray = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return $.get('count.txt', function(data) {
            var arr, i, j, _i, _j, _ref;
            arr = data.split(',');
            _this.magarray = [];
            for (i = _i = 99; _i >= 0; i = --_i) {
              magarray[i] = [];
              for (j = _j = 0, _ref = arr.length / 102; _j < _ref; j = _j += 1) {
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
        return window.open("?mag=" + this._binarySearch(0, 100) + "&startdate=" + (this.d1.year + 1960) + "-" + (this.d1.month + 1) + "-1" + "&enddate=" + (this.d2.year + 1960) + "-" + (this.d2.month + 1) + "-1", "_self");
      } else {
        return $("#magnitude-search").html("<p>Calculated magnitude cutoff : </p><p style='color:green'>" + this._binarySearch(0, 100) + "</p>");
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

}).call(this);


}});

require.define({"2D/map-controller": function(exports, require, module) {
  (function() {
  var DataLoader, MapController;

  DataLoader = require('common/data-loader');

  MapController = (function() {
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

    MapController.prototype.speed = 6;

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
      var bottom, bounds, height, left, numTiles, nw, nwPixel, nwTile, right, se, sePixel, seTile, top, width;
      numTiles = Math.pow(2, zoom);
      if (zoom === 0) {
        return 20000;
      } else if (zoom <= 3) {
        return Math.floor(20000 / Math.pow(numTiles, 2));
      }
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
      url = '&limit=' + this._getCurrentLimit(zoom, tileSize) + '&minmagnitude=' + this._getCurrentMag(zoom) + '&starttime=' + this.map.parameters.startdate + '&endtime=' + this.map.parameters.enddate;
      if ((nw != null) && (se != null)) {
        url += '&minlatitude=' + se.lat + '&maxlatitude=' + nw.lat + '&minlongitude=' + nw.lng + '&maxlongitude=' + se.lng;
      }
      if ((tileInfo != null ? tileInfo.requestId : void 0) != null) {
        url += '&callback=' + tileInfo.requestId;
      }
      return url;
    };

    MapController.prototype._updateSlider = function() {
      $("#slider").val(Math.ceil(this.timeLine.progress() * this.map.values.timediff)).slider('refresh');
      return $("#date").html(this.util.timeConverter((this.timeLine.progress() * this.map.values.timediff) + this.map.parameters.starttime));
    };

    MapController.prototype.initController = function() {
      var hoverStyle, spinnerOpts, style, unhoverStyle;
      this.rainbow = new Rainbow();
      this.rainbow.setNumberRange(0, 700);
      this.timeLine = new TimelineLite({
        onUpdate: (function(_this) {
          return function() {
            return _this._updateSlider();
          };
        })(this)
      });
      style = {
        "clickable": true,
        "color": "#000",
        "fillColor": "#00D",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.3
      };
      hoverStyle = {
        "fillOpacity": 1.0
      };
      unhoverStyle = {
        "fillOpacity": 0.3
      };
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
        return this._loadStaticData(style, hoverStyle, unhoverStyle, spinnerOpts);
      } else {
        this.geojsonTileLayer = new L.TileLayer.GeoJSONP('http://comcat.cr.usgs.gov/fdsnws/event/1/query?eventtype=earthquake&orderby=time&format=geojson{url_params}', {
          url_params: (function(_this) {
            return function(tileInfo) {
              return _this._geojsonURL(tileInfo);
            };
          })(this),
          clipTiles: false,
          wrapPoints: false
        }, {
          pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, style);
          },
          style: style,
          onEachFeature: (function(_this) {
            return function(feature, layer) {
              var depth;
              depth = _this._getDepth(feature);
              layer.setStyle({
                radius: feature.properties.mag,
                fillColor: "#" + _this.rainbow.colourAt(depth)
              });
              if (feature.properties != null) {
                layer.bindPopup("Place: <b>" + feature.properties.place + "</b></br>Magnitude : <b>" + feature.properties.mag + "</b></br>Time : " + _this.util.timeConverter(feature.properties.time) + "</br>Depth : " + depth + " km");
              }
              if (!(layer instanceof L.Point)) {
                layer.on('mouseover', function() {
                  return layer.setStyle(hoverStyle);
                });
                return layer.on('mouseout', function() {
                  return layer.setStyle(unhoverStyle);
                });
              }
            };
          })(this)
        });
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
      var circle, _i, _len, _ref;
      if (this.map.parameters.timeline) {
        this.timeLine.pause();
        _ref = this.map.earthquakes.circles;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          circle = _ref[_i];
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

    MapController.prototype._loadStaticData = function(style, hoverStyle, unhoverStyle, spinnerOpts) {
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
        promise = loader.load('http://comcat.cr.usgs.gov/fdsnws/event/1/query?eventtype=earthquake&orderby=time-asc&format=geojson' + this._geojsonURL());
      }
      return promise.then((function(_this) {
        return function(results) {
          var delay, feature, i, _i, _len, _ref;
          _this.map.values.size = results.features.length;
          _ref = results.features;
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            feature = _ref[i];
            _this.map.earthquakes.circles[i] = L.geoJson(feature, {
              pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, style);
              },
              style: style,
              onEachFeature: function(feature, layer) {
                var depth;
                depth = _this._getDepth(feature);
                layer.setStyle({
                  radius: feature.properties.mag,
                  fillColor: "#" + _this.rainbow.colourAt(depth)
                });
                if (feature.properties != null) {
                  layer.bindPopup("Place: <b>" + feature.properties.place + "</b></br>Magnitude : <b>" + feature.properties.mag + "</b></br>Time : " + _this.util.timeConverter(feature.properties.time) + "</br>Depth : " + depth + " km");
                }
                if (!(layer instanceof L.Point)) {
                  layer.on('mouseover', function() {
                    return layer.setStyle(hoverStyle);
                  });
                  return layer.on('mouseout', function() {
                    return layer.setStyle(unhoverStyle);
                  });
                }
              }
            }, _this.map.earthquakes.time[i] = feature.properties.time, _this.map.earthquakes.depth[i] = feature.geometry.coordinates[2], delay = i === 0 ? 0 : 20 * ((feature.properties.time - results.features[i - 1].properties.time) / 1000000000), _this.timeLine.append(TweenLite.delayedCall(delay, (function(i) {
              return _this.map.mapAdder(i);
            }), [i.toString()])));
          }
          if (_this.map.values.size > 0) {
            _this.map.values.timediff = results.features[_this.map.values.size - 1].properties.time - results.features[0].properties.time;
            _this.map.parameters.starttime = results.features[0].properties.time;
            $('#slider-wrapper').html("<input id='slider' name='slider' type='range' min='0' max='" + _this.map.values.timediff + "' value='0' step='1' style='display: none;' data-theme='a' data-track-theme='a'>");
            $("#slider").slider({
              slidestart: function(event) {
                return _this.timeLine.pause();
              },
              slidestop: function(event) {
                $("#date").html(_this.util.timeConverter(_this.map.parameters.starttime));
                return _this.timeLine.progress($("#slider").val() / _this.map.values.timediff);
              }
            });
            $("#info").html("<p>total earthquakes : " + _this.map.values.size + "<br/>minimum depth : " + Math.min.apply(null, _this.map.earthquakes.depth) + " km" + "</br>maximum depth : " + Math.max.apply(null, _this.map.earthquakes.depth) + " km</p>" + "<div class='ui-body ui-body-a'><p><a href='http://github.com/gizmoabhinav/Seismic-Eruptions'>Link to the project</a></p></div>");
            $("#startdate").html("Start date : " + _this.util.timeConverter(_this.map.parameters.startdate));
            $("#enddate").html("End date : " + _this.util.timeConverter(_this.map.parameters.enddate));
            $("#magcutoff").html("Cutoff magnitude : " + _this.map.parameters.mag);
            return _this.timeLine.resume();
          }
        };
      })(this));
    };

    return MapController;

  })();

  module.exports = MapController;

}).call(this);


}});

require.define({"2D/map": function(exports, require, module) {
  (function() {
  var CrossSection, Map, util;

  CrossSection = require('2D/cross-section');

  util = require('common/util');

  Map = (function() {
    var p;

    function Map() {
      var d, _base, _base1;
      d = new Date();
      if (this.parameters.startdate == null) {
        this.parameters.startdate = "1900/1/1";
      }
      if (this.parameters.enddate == null) {
        this.parameters.enddate = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
      }
      this.parameters.timeline = (this.parameters.timeline != null) || false;
      if (!((this.parameters.center != null) && this.parameters.zoom)) {
        (_base = this.parameters).nw || (_base.nw = L.latLng(50, -40));
        (_base1 = this.parameters).se || (_base1.se = L.latLng(-20, 40));
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
      timeline: util.getURLParameter('timeline'),
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

}).call(this);


}});

require.define({"common/data-loader": function(exports, require, module) {
  (function() {
  var DataLoader;

  DataLoader = (function() {
    function DataLoader() {}

    DataLoader.prototype.load = function(url, _arg) {
      var ajax, callback, _ref;
      _ref = _arg != null ? _arg : {}, ajax = _ref.ajax, callback = _ref.callback;
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

}).call(this);


}});

require.define({"common/util": function(exports, require, module) {
  (function() {
  var Util,
    __hasProp = {}.hasOwnProperty;

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
        center: "" + center.lat + "," + center.lng,
        mag: map.parameters.desiredMag,
        startdate: map.parameters.startdate,
        enddate: map.parameters.enddate
      };
      if (map.parameters.timeline) {
        params.timeline = true;
      }
      for (key in overrides) {
        if (!__hasProp.call(overrides, key)) continue;
        value = overrides[key];
        params[key] = value;
      }
      return '?' + $.param(params);
    };

    return Util;

  })();

  module.exports = new Util();

}).call(this);


}});

