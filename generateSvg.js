function SvgGenerator (options = {}) {
  this.scale   = options.scale   ? parseFloat(options.scale)   : 2;
  this.entropy = options.entropy ? parseFloat(options.entropy) : 0.2;
  this.count   = options.count   ? parseInt(options.count)     : 5;
  this.width   = options.width  || 300;
  this.height  = options.height || 100;
  this.seed    = Math.random();
  if(this.count <= 0){
    this.count = 2;
  }
  this.setColors = [
    ["#EF9A9A", "#EF5350"],
    ["#F48FB1", "#EC407A"],
    ["#CE93D8", "#AB47BC"],
    ["#B39DDB", "#7E57C2"],
    ["#9FA8DA", "#5C6BC0"],
    ["#90CAF9", "#42A5F5"],
    ["#81D4FA", "#29B6F6"],
    ["#80DEEA", "#26C6DA"],
    ["#80CBC4", "#26A69A"],
    ["#A5D6A7", "#66BB6A"],
    ["#C5E1A5", "#9CCC65"],
    ["#9CCC65", "#CDDC39"],
    ["#FFF59D", "#FFEB3B"],
    ["#FFE082", "#FFCA28"],
    ["#FFCC80", "#FFA726"],
    ["#FFAB91", "#FF7043"],
    ["#BCAAA4", "#8D6E63"],
    ["#EEEEEE", "#BDBDBD"],
    ["#B0BEC5", "#78909C"],
  ];

  this.generateStartingPoint = function() {
    startingPoint = {
      x: this.random() * this.width  * this.scale - (this.width  * this.scale - this.width)/2,
      y: this.random() * this.height * this.scale - (this.height * this.scale - this.height)/2
    }
    //startingPoint = { x: this.width / 2, y: this.height / 2 };
    return startingPoint;
  }

  this.random = function () {
      var x = Math.sin(this.seed++) * 10000;
      return x - Math.floor(x);
  }

  this.pixel = function pixel(arr) {
    var o = { r: arr[0], g: arr[1],b: arr[2], a: arr[3] }
    o.toString = function () {
      return "RGBA(" + o.r + "," + o.g + "," + o.b + "," + o.a + ")";
    };
    return o;
  };

  this.stepColors = function colors(steps) {
    var setColor = this.setColors[Math.floor(this.random() * this.setColors.length)];
    var color1 = setColor[0];
    var color2 = setColor[1];
    var canvas = document.createElement('canvas'),
    c = canvas.getContext('2d');
    canvas.width = parseInt(steps, 10);
    canvas.height = 1;
    var grd = c.createLinearGradient(0, 0, canvas.width, 0);
    grd.addColorStop(0, color1);
    grd.addColorStop(1, color2);
    c.fillStyle = grd;
    c.fillRect(0, 0, canvas.width, 1);
    var imgd = c.getImageData(0, 0, canvas.width, 1);
    var pix = [].slice.call(imgd.data);
    var pixels = [];
    while (pix.length) {
      pixels.push(Object.create(this.pixel(pix.splice(0, 4))));
    }
    return pixels;
  };

  this.integerToPoint = function (value){
    value = value % (this.width * 2 + this.height * 2)
    if(value <= this.height){
      return { x: 0, y: this.height - value, value: value, segment: 0};
    }else if(value <= this.height + this.width) {
      return { x: value - this.height, y: 0, value: value, segment: 1 };
    }else if(value <= this.height + this.width + this.height) {
      return { x: this.width, y: value - (this.height + this.width), value: value, segment: 2 };
    }else{
      return { x: this.width - (value - (this.height + this.width + this.height)), y: this.height, value: value, segment: 3 };
    }
  }

  this.generatePoints = function() {
    points = []
    var max = this.width * 2 + this.height * 2;
    for(var i = 0; i < this.count; i++ ){
      points.push(
        this.integerToPoint(
          this.random() * max * this.entropy + max * i / this.count
        )
      );
    }
    points.sort(function(a, b) { return a.value - b.value; });
    return points;
  }

  this.addCorner = function (polygon, segment){
    switch(segment){
      case 0: polygon.push([0, 0].join());                    break;
      case 1: polygon.push([this.width, 0].join());           break;
      case 2: polygon.push([this.width, this.height].join()); break;
      case 3: polygon.push([0, this.height].join());          break;
    }
  }

  this.addCorners = function(polygon, p1, p2){
    var segment = p1.segment;
    while((segment != p2.segment || p1.value > p2.value) && segment < p1.segment + 4 ){
      this.addCorner(polygon, segment % 4);
      segment++;
    }
  }

  this.generatePolygon = function(p1, p2, startingPoint){
    var polygon = [[startingPoint.x, startingPoint.y].join()];
    polygon.push([p1.x, p1.y].join());
    this.addCorners(polygon, p1, p2)
    polygon.push([p2.x, p2.y].join());
    return polygon;
  }

  this.generatePolygons = function(points, startingPoint) {
    polygons = [];
    for(var i = 0; i < this.count; i++) {
      p1 = points[i];
      p2 = points[(i + 1) % this.count];
      polygons.push(
        this.generatePolygon(p1, p2, startingPoint)
      );
    }
    return polygons;
  }

  this.generateHtml = function(polygons){
    var html = "<svg height='" + this.height + "' width='" + this.width + "'>";
    var index = 0;
    polygons = polygons.reverse();
    var colors = this.stepColors(polygons.length);
    polygons.forEach(function (polygon) {
      html += "<polygon stroke='" + colors[index] + "' points=\"" + polygon.join(' ') + "\" style=\"fill:" + colors[index] + "\"/>";
      index ++;
    });
    html += "</svg>";
    return html;
  }

  this.seedFromString = function(string){
    seed = 0;
    for (i = 0; i < string.length; i++) {
      seed += string[i].charCodeAt() * (i+1);
    }
    this.seed = seed;
  }

  this.create = function(params) {
    if(params.seed){
      seedFromString(params.seed);
    }
    html = this.generateHtml(
      this.generatePolygons(
        this.generatePoints(), this.generateStartingPoint()
      )
    );
    document.getElementById(params.id).innerHTML = html
  }
}

function run(){
  scale = document.getElementById('scale').value;
  entropy = document.getElementById('entropy').value;
  count = document.getElementById('count').value;
  generator = new SvgGenerator({scale: scale, entropy: entropy, count: count});
  generator.create({ id: 'svg1' })
  generator.create({ id: 'svg2' })
  generator.create({ id: 'svg3' })
  generator.create({ id: 'svg4' })
  generator.create({ id: 'svg5' })
  generator.create({ id: 'svg6' })
  generator.create({ id: 'svg7' })
  generator.create({ id: 'svg8' })
  generator.create({ id: 'svg9' })
}

document.getElementById("experiment").innerHTML = "\
<div class='ui labeled input'>\
  <div class='ui label'>Scale</div>\
  <input id= 'scale' type='text' value='2'>\
</div>\
<div class='ui labeled input'>\
  <div class='ui label'>Entropy</div>\
  <input id= 'entropy' type='text' value='0.2'>\
</div>\
<div class='ui labeled input'>\
  <div class='ui label'>Count</div>\
  <input id= 'count' type='text' value='5'>\
</div>\
<div style='margin:1em' class='ui button' onclick='run()'>generate</div>\
<div>\
    <div style='float:left;margin: 0.5em' id='svg1'></div>\
    <div style='float:left;margin: 0.5em' id='svg2'></div>\
    <div style='float:left;margin: 0.5em' id='svg3'></div>\
    <div style='float:left;margin: 0.5em' id='svg4'></div>\
    <div style='float:left;margin: 0.5em' id='svg5'></div>\
    <div style='float:left;margin: 0.5em' id='svg6'></div>\
    <div style='float:left;margin: 0.5em' id='svg7'></div>\
    <div style='float:left;margin: 0.5em' id='svg8'></div>\
    <div style='float:left;margin: 0.5em' id='svg9'></div>\
    <div style='clear:both'></div>\
</table>";
run();
