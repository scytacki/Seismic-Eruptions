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
require.define({"3D/main": function(exports, require, module) {
  var DataLoader, Main, Plot, Scene;

Scene = require('3D/scene');

Plot = require('3D/plot');

DataLoader = require('common/data-loader');

Main = (function() {
  function Main() {
    this.util = require('common/util');
    this.limits = require('3D/map-limits');
  }

  Main.prototype.start = function() {
    $.mobile.loading('show');
    this.scene = new Scene();
    this.scene.initialize();
    $.mobile.loading('hide');
    this.scene.animateScene();
    this.plot = new Plot();
    this.plot.setup(this.scene);
    return this.plot.loadquakes();
  };

  Main.prototype.miniMap = function() {
    var loader, map, ptToLayer, rainbow, script, url;
    rainbow = new Rainbow();
    script = document.createElement('script');
    map = L.map('map');
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      maxZoom: 6
    }).addTo(map);
    ptToLayer = function(feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 3,
        fillColor: "#" + rainbow.colourAt(feature.properties.mag),
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 1
      });
    };
    loader = new DataLoader();
    url = 'http://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time-asc' + '&starttime=' + this.util.getURLParameter("startdate") + 'T00:00:00' + '&endtime=' + this.util.getURLParameter("enddate") + 'T23:59:59' + '&minmagnitude=' + this.util.getURLParameter("mag") + '&minlatitude=' + Math.min(this.limits.latlng.y1, this.limits.latlng.y2, this.limits.latlng.y3, this.limits.latlng.y4) + '&maxlatitude=' + Math.max(this.limits.latlng.y1, this.limits.latlng.y2, this.limits.latlng.y3, this.limits.latlng.y4) + '&minlongitude=' + Math.min(this.limits.latlng.x1, this.limits.latlng.x2, this.limits.latlng.x3, this.limits.latlng.x4) + '&maxlongitude=' + Math.max(this.limits.latlng.x1, this.limits.latlng.x2, this.limits.latlng.x3, this.limits.latlng.x4);
    return loader.load(url).then((function(_this) {
      return function(results) {
        var feature, i, len, ref, size;
        size = results.features.length;
        ref = results.features;
        for (i = 0, len = ref.length; i < len; i++) {
          feature = ref[i];
          L.geoJson(feature, {
            pointToLayer: ptToLayer
          }).bindPopup("Place: <b>" + feature.properties.place + "</b></br>Magnitude : <b>" + feature.properties.mag + "</b></br>Time : " + _this.util.timeConverter(feature.properties.time) + "</br>Depth : " + feature.geometry.coordinates[2] + " km").addTo(map);
        }
        L.polygon([[parseFloat(_this.limits.latlng.y1), parseFloat(_this.limits.latlng.x1)], [parseFloat(_this.limits.latlng.y2), parseFloat(_this.limits.latlng.x2)], [parseFloat(_this.limits.latlng.y3), parseFloat(_this.limits.latlng.x3)], [parseFloat(_this.limits.latlng.y4), parseFloat(_this.limits.latlng.x4)]]).addTo(map);
        map.fitBounds([[parseFloat(_this.limits.latlng.y1), parseFloat(_this.limits.latlng.x1)], [parseFloat(_this.limits.latlng.y2), parseFloat(_this.limits.latlng.x2)], [parseFloat(_this.limits.latlng.y3), parseFloat(_this.limits.latlng.x3)], [parseFloat(_this.limits.latlng.y4), parseFloat(_this.limits.latlng.x4)]]);
        return map.setZoom(map.getZoom() - 1);
      };
    })(this));
  };

  return Main;

})();

module.exports = Main;


}});

require.define({"3D/map-limits": function(exports, require, module) {
  var MapLimits;

MapLimits = (function() {
  function MapLimits() {
    this.util = require('common/util');
    this.latlng = {
      x1: this.util.getURLParameter("x1"),
      x2: this.util.getURLParameter("x2"),
      x3: this.util.getURLParameter("x3"),
      x4: this.util.getURLParameter("x4"),
      y1: this.util.getURLParameter("y1"),
      y2: this.util.getURLParameter("y2"),
      y3: this.util.getURLParameter("y3"),
      y4: this.util.getURLParameter("y4")
    };
    this.coords = {
      x1: this.util.convertCoordinatesx(this.latlng.x1),
      y1: this.util.convertCoordinatesy(this.latlng.y1),
      x2: this.util.convertCoordinatesx(this.latlng.x2),
      y2: this.util.convertCoordinatesy(this.latlng.y2),
      x3: this.util.convertCoordinatesx(this.latlng.x3),
      y3: this.util.convertCoordinatesy(this.latlng.y3),
      x4: this.util.convertCoordinatesx(this.latlng.x4),
      y4: this.util.convertCoordinatesy(this.latlng.y4)
    };
    this.coords.minx = Math.min(this.coords.x1, this.coords.x2, this.coords.x3, this.coords.x4);
    this.coords.miny = Math.min(this.coords.y1, this.coords.y2, this.coords.y3, this.coords.y4);
    this.coords.maxx = Math.max(this.coords.x1, this.coords.x2, this.coords.x3, this.coords.x4);
    this.coords.maxy = Math.max(this.coords.y1, this.coords.y2, this.coords.y3, this.coords.y4);
    if ((3 - Math.ceil(this.coords.maxx - this.coords.minx)) >= 0 && (3 - Math.ceil(this.coords.maxy - this.coords.miny)) >= 0) {
      this.coords.leftTileLimit = Math.floor(this.coords.minx - (3 - Math.ceil(this.coords.maxx - this.coords.minx)));
      this.coords.topTileLimit = Math.floor(this.coords.miny - (3 - Math.ceil(this.coords.maxy - this.coords.miny)));
    } else {
      this.coords.leftTileLimit = Math.floor(this.coords.minx);
      this.coords.topTileLimit = Math.floor(this.coords.miny);
    }
    this.coords.midx = (this.coords.maxx + this.coords.minx) / 2;
    this.coords.midy = (this.coords.maxy + this.coords.miny) / 2;
  }

  return MapLimits;

})();

module.exports = new MapLimits();


}});

require.define({"3D/plot": function(exports, require, module) {
  var DataLoader, Plot;

DataLoader = require('common/data-loader');

Plot = (function() {
  function Plot() {}

  Plot.prototype.setup = function(scene) {
    var curr_date, curr_month, curr_year, d;
    this.scene = scene;
    this.util = require('common/util');
    this.limits = require('3D/map-limits');
    this.rainbow = new Rainbow();
    this.rainbow.setSpectrum('#A52A2A', '#FF0000', '#800080', '#FF00FF', "#2f9898", "#266fc1", "#0000ff", "#00FFFF", "#50f950", "#FFFF00");
    this.rainbow.setNumberRange(0, 700);
    this.sphereParent = new THREE.Object3D();
    this.mag = this.util.getURLParameter("mag");
    this.startdate = this.util.getURLParameter("startdate") || "2009/1/1";
    this.enddate = this.util.getURLParameter("enddate");
    if (typeof enddate === "undefined" || enddate === null) {
      d = new Date();
      curr_year = d.getFullYear();
      curr_month = d.getMonth() + 1;
      curr_date = d.getDate();
      return this.enddate = curr_year + '/' + curr_month + '/' + curr_date;
    }
  };

  Plot.prototype.loadquakes = function() {
    var loader, url;
    this.count = 0;
    this.maxdepth = 0;
    this.mindepth = 999;
    this.maxmag = 0;
    this.minmag = 999;
    loader = new DataLoader();
    url = 'http://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time-asc' + '&minmagnitude=' + this.mag + '&starttime=' + this.startdate + '%2000:00:00' + '&endtime=' + this.enddate + '%2023:59:59' + '&minlatitude=' + Math.min(this.limits.latlng.y1, this.limits.latlng.y2, this.limits.latlng.y3, this.limits.latlng.y4) + '&maxlatitude=' + Math.max(this.limits.latlng.y1, this.limits.latlng.y2, this.limits.latlng.y3, this.limits.latlng.y4) + '&minlongitude=' + Math.min(this.limits.latlng.x1, this.limits.latlng.x2, this.limits.latlng.x3, this.limits.latlng.x4) + '&maxlongitude=' + Math.max(this.limits.latlng.x1, this.limits.latlng.x2, this.limits.latlng.x3, this.limits.latlng.x4);
    loader.load(url).then((function(_this) {
      return function(results) {
        var box, feature, i, len, line, lines, mesh, rectmaterial, ref, size, vertex1, vertex2, vertex3, vertex4, vertex5, vertex6, vertex7, vertex8;
        size = results.features.length;
        if (size === 0) {
          alert("No earthquakes inside the cross section in given time range");
          return;
        }
        ref = results.features;
        for (i = 0, len = ref.length; i < len; i++) {
          feature = ref[i];
          if (_this._rect(_this.util.convertCoordinatesx(feature.geometry.coordinates[0]), _this.util.convertCoordinatesy(feature.geometry.coordinates[1]))) {
            _this.count++;
            _this._processFeature(feature);
          }
        }
        $("#info").html("</br></br>total earthquakes : " + size + "</br>minimum depth : " + _this.mindepth + " km</br>maximum depth : " + _this.maxdepth + " km</br></br></br><div class='ui-body ui-body-a'><p><a href='http://github.com/gizmoabhinav/Seismic-Eruptions'>Link to the project</a></p></div>");
        $("#startdate").html("Start date : " + _this.util.timeConverter(_this.startdate));
        $("#enddate").html("End date : " + _this.util.timeConverter(_this.enddate));
        $("#magcutoff").html("Cutoff magnitude : " + _this.minmag);
        _this.sphereParent.position.set(0, 0, 0);
        _this.scene.scene.add(_this.sphereParent);
        vertex1 = new THREE.Vector3(_this.limits.coords.x1 - _this.limits.coords.leftTileLimit - 2, -_this.limits.coords.y1 + _this.limits.coords.topTileLimit + 2, 1);
        vertex2 = new THREE.Vector3(_this.limits.coords.x2 - _this.limits.coords.leftTileLimit - 2, -_this.limits.coords.y2 + _this.limits.coords.topTileLimit + 2, 1);
        vertex3 = new THREE.Vector3(_this.limits.coords.x3 - _this.limits.coords.leftTileLimit - 2, -_this.limits.coords.y3 + _this.limits.coords.topTileLimit + 2, 1);
        vertex4 = new THREE.Vector3(_this.limits.coords.x4 - _this.limits.coords.leftTileLimit - 2, -_this.limits.coords.y4 + _this.limits.coords.topTileLimit + 2, 1);
        vertex5 = new THREE.Vector3(_this.limits.coords.x1 - _this.limits.coords.leftTileLimit - 2, -_this.limits.coords.y1 + _this.limits.coords.topTileLimit + 2, 1.0 - (_this.maxdepth / 1000));
        vertex6 = new THREE.Vector3(_this.limits.coords.x2 - _this.limits.coords.leftTileLimit - 2, -_this.limits.coords.y2 + _this.limits.coords.topTileLimit + 2, 1.0 - (_this.maxdepth / 1000));
        vertex7 = new THREE.Vector3(_this.limits.coords.x3 - _this.limits.coords.leftTileLimit - 2, -_this.limits.coords.y3 + _this.limits.coords.topTileLimit + 2, 1.0 - (_this.maxdepth / 1000));
        vertex8 = new THREE.Vector3(_this.limits.coords.x4 - _this.limits.coords.leftTileLimit - 2, -_this.limits.coords.y4 + _this.limits.coords.topTileLimit + 2, 1.0 - (_this.maxdepth / 1000));
        box = new THREE.Geometry();
        box.vertices.push(vertex1);
        box.vertices.push(vertex2);
        box.vertices.push(vertex3);
        box.vertices.push(vertex4);
        box.vertices.push(vertex5);
        box.vertices.push(vertex6);
        box.vertices.push(vertex7);
        box.vertices.push(vertex8);
        box.faces.push(new THREE.Face3(6, 5, 4));
        box.faces.push(new THREE.Face3(4, 7, 6));
        box.faces.push(new THREE.Face3(4, 5, 6));
        box.faces.push(new THREE.Face3(6, 7, 4));
        box.faces.push(new THREE.Face3(4, 1, 0));
        box.faces.push(new THREE.Face3(5, 1, 4));
        box.faces.push(new THREE.Face3(0, 1, 4));
        box.faces.push(new THREE.Face3(4, 1, 5));
        box.faces.push(new THREE.Face3(1, 2, 5));
        box.faces.push(new THREE.Face3(5, 2, 6));
        box.faces.push(new THREE.Face3(5, 2, 1));
        box.faces.push(new THREE.Face3(6, 2, 5));
        box.faces.push(new THREE.Face3(2, 3, 6));
        box.faces.push(new THREE.Face3(6, 3, 7));
        box.faces.push(new THREE.Face3(6, 3, 2));
        box.faces.push(new THREE.Face3(7, 3, 6));
        box.faces.push(new THREE.Face3(3, 0, 7));
        box.faces.push(new THREE.Face3(7, 0, 3));
        box.faces.push(new THREE.Face3(7, 0, 4));
        box.faces.push(new THREE.Face3(4, 0, 7));
        rectmaterial = new THREE.MeshBasicMaterial({
          color: 0x770000,
          transparency: true,
          opacity: 0.05,
          wireframe: false
        });
        mesh = new THREE.Mesh(box, rectmaterial);
        lines = new THREE.Geometry();
        lines.vertices.push(vertex1);
        lines.vertices.push(vertex2);
        lines.vertices.push(vertex3);
        lines.vertices.push(vertex4);
        lines.vertices.push(vertex1);
        lines.vertices.push(vertex5);
        lines.vertices.push(vertex6);
        lines.vertices.push(vertex7);
        lines.vertices.push(vertex8);
        lines.vertices.push(vertex5);
        lines.vertices.push(vertex6);
        lines.vertices.push(vertex2);
        lines.vertices.push(vertex3);
        lines.vertices.push(vertex7);
        lines.vertices.push(vertex8);
        lines.vertices.push(vertex4);
        line = new THREE.Line(lines, new THREE.LineBasicMaterial({
          color: 0xffffff,
          opacity: 1
        }));
        _this.scene.scene.add(line);
        return _this.scene.controls.target.z = 1.0 - (_this.maxdepth / 2000);
      };
    })(this));
    return document.getElementById("frame").src = "frame.html?x1=" + this.limits.latlng.x1 + "&x2=" + this.limits.latlng.x2 + "&x3=" + this.limits.latlng.x3 + "&x4=" + this.limits.latlng.x4 + "&y1=" + this.limits.latlng.y1 + "&y2=" + this.limits.latlng.y2 + "&y3=" + this.limits.latlng.y3 + "&y4=" + this.limits.latlng.y4 + "&startdate=" + this.startdate + "&enddate=" + this.enddate + "&mag=" + this.mag;
  };

  Plot.prototype._processFeature = function(feature) {
    this._checkMinMax(feature);
    return this._createSphere(feature);
  };

  Plot.prototype._checkMinMax = function(feature) {
    if (feature.geometry.coordinates[2] > this.maxdepth) {
      this.maxdepth = feature.geometry.coordinates[2];
    }
    if (feature.geometry.coordinates[2] < this.mindepth) {
      this.mindepth = feature.geometry.coordinates[2];
    }
    if (feature.properties.mag < this.minmag) {
      this.minmag = feature.properties.mag;
    }
    if (feature.properties.mag > this.maxmag) {
      return this.maxmag = feature.properties.mag;
    }
  };

  Plot.prototype._createSphere = function(feature) {
    var depth, latVal, lonVal, radius, sphere, sphereGeometry, sphereMaterial;
    radius = 0.0025 * Math.pow(2, feature.properties.mag * 4 / 10.);
    latVal = feature.geometry.coordinates[0];
    lonVal = feature.geometry.coordinates[1];
    depth = feature.geometry.coordinates[2];
    sphereGeometry = new THREE.SphereGeometry(radius, 8, 8);
    sphereMaterial = new THREE.MeshPhongMaterial({
      color: parseInt('0x' + this.rainbow.colourAt(feature.geometry.coordinates[2])),
      overdraw: false
    });
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(this.util.convertCoordinatesx(latVal) - this.limits.coords.leftTileLimit - 2, -this.util.convertCoordinatesy(lonVal) + this.limits.coords.topTileLimit + 2, 1.0 - (depth / 1000));
    return this.sphereParent.add(sphere);
  };

  Plot.prototype._rect = function(x, y) {
    var bax, bay, dax, day;
    bax = this.limits.coords.x2 - this.limits.coords.x1;
    bay = this.limits.coords.y2 - this.limits.coords.y1;
    dax = this.limits.coords.x4 - this.limits.coords.x1;
    day = this.limits.coords.y4 - this.limits.coords.y1;
    if ((x - this.limits.coords.x1) * bax + (y - this.limits.coords.y1) * bay < 0.0) {
      return false;
    }
    if ((x - this.limits.coords.x2) * bax + (y - this.limits.coords.y2) * bay > 0.0) {
      return false;
    }
    if ((x - this.limits.coords.x1) * dax + (y - this.limits.coords.y1) * day < 0.0) {
      return false;
    }
    if ((x - this.limits.coords.x4) * dax + (y - this.limits.coords.y4) * day > 0.0) {
      return false;
    }
    return true;
  };

  return Plot;

})();

module.exports = Plot;


}});

require.define({"3D/scene": function(exports, require, module) {
  var Scene;

Scene = (function() {
  function Scene() {}

  Scene.prototype.initialize = function() {
    var ambientLight, canvasHeight, canvasWidth, cubeMesh, directionalLight, glassTexture, i, j, k, l, planeGeometry, planeMaterial, starfieldgeometry, starmaterial, starmesh, tileSource;
    this.limits = require('3D/map-limits');
    if (Detector.webgl) {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true
      });
      $("#rendererInfo").html("<font color='white'>WebGL Renderer</font>");
    } else {
      this.renderer = new THREE.CanvasRenderer();
      $("#rendererInfo").html("<font color='white'>Canvas Renderer</font>");
    }
    this.renderer.setClearColor(0x777777, 1);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    this.renderer.setSize(canvasWidth, canvasHeight);
    document.getElementById("WebGLCanvas").appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(25, canvasWidth / canvasHeight, 1, 100);
    this.camera.lookAt(new THREE.Vector3(this.limits.coords.midx - this.limits.coords.leftTileLimit - 2, -this.limits.coords.midy + this.limits.coords.topTileLimit + 2, 1));
    this.camera.position.set(0.1953529215215685, -5.647229198648456, 1.4347925563786978);
    this.camera.rotation.set(1.439025394333189, 0.03591325303244356, 0.004758846432708524);
    this.camera.up.set(0, 0, 1);
    this.scene.add(this.camera);
    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = '0px';
    document.getElementById("WebGLCanvas").appendChild(this.stats.domElement);
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.x = this.limits.coords.midx - this.limits.coords.leftTileLimit - 2;
    this.controls.target.y = -this.limits.coords.midy + this.limits.coords.topTileLimit + 2;
    this.controls.target.z = 1;
    this.controls.maxDistance = 8;
    starfieldgeometry = new THREE.SphereGeometry(90, 32, 32);
    starmaterial = new THREE.MeshBasicMaterial({
      color: 0x999999
    });
    starmaterial.side = THREE.BackSide;
    starmesh = new THREE.Mesh(starfieldgeometry, starmaterial);
    this.scene.add(starmesh);
    this.group = new THREE.Object3D();
    if (Detector.webgl) {
      planeGeometry = new THREE.PlaneGeometry(1, 1, 1);
    } else {
      planeGeometry = new THREE.PlaneGeometry(1, 1, 1, 2, 0, 2);
    }
    if (Detector.webgl) {
      tileSource = "../images/tiles/6/";
    } else {
      tileSource = "http://otile1.mqcdn.com/tiles/1.0.0/sat/6/";
    }
    for (j = k = 0; k < 4; j = ++k) {
      for (i = l = 0; l < 4; i = ++l) {
        glassTexture = new THREE.ImageUtils.loadTexture(tileSource + (this.limits.coords.leftTileLimit + i) + "/" + (this.limits.coords.topTileLimit + j) + ".png");
        glassTexture.wrapS = glassTexture.wrapT = THREE.RepeatWrapping;
        glassTexture.repeat.set(1, 1);
        planeMaterial = new THREE.MeshBasicMaterial({
          map: glassTexture,
          depthWrite: false,
          depthTest: false,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          combine: THREE.MixOperation
        });
        cubeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        cubeMesh.position.set(i + 0.5 - 2, -j - 0.5 + 2, 1.0);
        this.group.add(cubeMesh);
      }
    }
    this.scene.add(this.group);
    ambientLight = new THREE.AmbientLight(0x101010, 10.0);
    this.scene.add(ambientLight);
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position = this.camera.position;
    return this.scene.add(directionalLight);
  };

  Scene.prototype.animateScene = function() {
    requestAnimationFrame(this.animateScene.bind(this));
    this.renderScene();
    return this.stats.update();
  };

  Scene.prototype.renderScene = function() {
    return this.renderer.render(this.scene, this.camera);
  };

  Scene.prototype.mapToggle = function() {
    if ($("#maptoggle").is(':checked')) {
      group.traverse(function(object) {
        return object.visible = true;
      });
      return group.visible = true;
    } else {
      group.traverse(function(object) {
        return object.visible = false;
      });
      return group.visible = false;
    }
  };

  Scene.prototype.thumbnailToggle = function() {
    if ($("#thumbnail").is(':checked')) {
      return $('#iframe2d').fadeIn();
    } else {
      return $('#iframe2d').fadeOut();
    }
  };

  return Scene;

})();

module.exports = Scene;


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

