GraphqlDAPv1.prototype.wave_buoy_stations_forecast = function(
                                  
                                            ){
  var query =  `query wave_buoy_stations_forecast
  {
    stations: imi_wave_buoy_forecast(since: "Midnight 3 days ago GMT", until: "Midnight in 5 days GMT") {
        station_id: station_id
        latitude
        longitude
    }
    forecast: imi_wave_buoy_forecast(since: "Midnight 3 days ago GMT", until: "Midnight in 5 days GMT") {
        station_id: station_id
        time
        significant_wave_height
        mean_wave_period
        peak_wave_period: sea_surface_wave_period_at_variance_spectral_density_maximum
        wave_power_per_unit_crest_length
     }
   }
  `;
  var variables = {

  };
  var operationName = "wave_buoy_stations_forecast";
    var endPoint = "/imi/imi_wave_buoy_forecast"

  return this.$fetch(query, variables, operationName, endPoint);
}

var showWaveBuoyForecasts = function(graphqlDAP){
 graphqlDAP.wave_buoy_stations_forecast().then(function(result){
  if(result.errors){
    document.getElementById("warning").innerText = result.errors[0].message;
  }
  var data = extract_stations_with_forecast(result);
   var subtitle = new Date(data.min_timestamp).toLocaleDateString("en-IE",{ weekday: 'short', month: 'long', day: 'numeric' })
   +" - "+ new Date(data.max_timestamp).toLocaleDateString("en-IE",{ weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  var chartoptions = {
    xAxis: { type: 'datetime' },
    series: [],
    navigation: {
        menuItemStyle: {
            fontSize: '10px'
        }
    },
    tooltip: {
        valueSuffix: ' m'
    },
    plotOptions: {
        spline: {
            lineWidth: 2,
            states: {
                hover: {
                    lineWidth: 3
                }
            },
            marker: {
                enabled: false
            }
        }
    },
        chart: {
        type: 'spline'
    },
    title: {
        text: 'Wave Forecast at Buoy Stations'
    },
    subtitle: {
        text: subtitle
    },
    xAxis: {
        type: 'datetime',
        labels: {
            overflow: 'justify'
        }
    },
    yAxis: {
        title: {
            text: 'Significant Wave Height (m)'
        },
        minorGridLineWidth: 0,
        gridLineWidth: 0,
        alternateGridColor: null
    }
  };
   var configs = [
     {
       title_text: 'Wave Height Forecast at Buoy Stations',
       yAxis_title_text: 'Significant Wave Height (m)',
       tooltip_valueSuffix: ' m',
       variable: "significant_wave_height"
     },
     {
       title_text: 'Mean Wave Period Forecast at Buoy Stations',
       yAxis_title_text: 'Mean Wave Period (s)',
       tooltip_valueSuffix: ' s',
       variable: "mean_wave_period"
     },
     {
       title_text: 'Peak Wave Period Forecast at Buoy Stations',
       yAxis_title_text: 'Peak Wave Period (s)',
       tooltip_valueSuffix: ' s',
       variable: "peak_wave_period"
     },
     {
       title_text: 'Wave Power Forecast at Buoy Stations',
       yAxis_title_text: 'Wave Power Per Unit Crest Length (kW/m)',
       tooltip_valueSuffix: ' kW/m',
       variable: "wave_power_per_unit_crest_length"
     },
];
  var charts = [], markers = [];
  for(var c=0;c<configs.length;c++){
    var config = configs[c];
    chartoptions = deepExtend({}, chartoptions);
    chartoptions.series = [];
    chartoptions.title.text = config.title_text;
    chartoptions.yAxis.title.text = config.yAxis_title_text;
    chartoptions.tooltip.valueSuffix = config.tooltip_valueSuffix;
    for(var station_id in data.stations){
      if (data.stations.hasOwnProperty(station_id)) {
          var station = data.stations[station_id];
        var series = {
          location: [station.latitude, station.longitude],
          name: station_id,
          data: station.forecast.map(function(variable,d){return [
            d.timestamp, d[variable]
          ];}.bind(null,config.variable))
        };
         chartoptions.series.push(series);
      }
    }
    charts.push(Highcharts.chart(config.variable, chartoptions));

  }
  var chart = charts[charts.length-1];
   for(var i=0;i<chart.series.length;i++){
     var series = chart.series[i];
     var iconOptions = { color: series.color, fillOpacity:1 };
     var icon = new L.DivIcon.SVGIcon(iconOptions);
     //var marker = L.marker.svgMarker(chartoptions.series[i].location,{ iconOptions: iconOptions}).addTo(mymap);
     var marker = L.marker(chartoptions.series[i].location,{ icon: icon, title: chartoptions.series[i].name}).addTo(mymap);
     marker.on('mouseover', function(series) {
     charts.forEach(function(chart){
      chart.series[series].update({
           lineWidth:6
       });
     })
    }.bind(null,i));
     marker.on('mouseout', function(series) {
     charts.forEach(function(chart){
      chart.series[series].update({
           lineWidth:2
       });
     })
    }.bind(null,i));
   }

 }).catch(function(err){
  console.log(err.message);
});
};

var deepExtend = function(out) {
  // http://youmightnotneedjquery.com/
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];

    if (!obj)
      continue;

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object')
          out[key] = deepExtend(out[key], obj[key]);
        else
          out[key] = obj[key];
      }
    }
  }

  return out;
};

var extract_stations_with_forecast = function(result){
  //reshape to station oriented result.
  var reshaped = {
    stations: {},
    min_timestamp: 0, max_timestamp: 0,
    min_ignificant_wave_height: 0, max_ignificant_wave_height: 0,
  }
  var stations =  {};
  if(result.data){
    var arr = result.data.stations;
    while (arr.length) {
      var station = arr.shift();
      station.forecast = [];
      reshaped.stations[station.station_id] = station;
    }
    arr = result.data.forecast;
    // find data range
    for(var i=arr.length;i>0;i--){
      var data = arr[i-1];
      data.date = new Date(data.time);
      //data.timestamp = Math.floor(data.date.getTime()/1000);
      data.timestamp = data.date.getTime();
        reshaped.stations[data.station_id].forecast.unshift(data);
    }
    if(arr.length){
    Object.keys(arr[0]).forEach(function(key){
      if(typeof(arr[0][key]) == "number"){
        reshaped["min_"+key] = Math.min.apply(null, arr.map(function(d){ return d[key];}));
        reshaped["max_"+key] = Math.max.apply(null, arr.map(function(d){ return d[key];}));      }
    })
    }
  }
  return reshaped;
}


//Leaflet-SVGIcon
//SVG icon for any marker class
//Ilya Atkin
//ilya.atkin@unh.edu

L.DivIcon.SVGIcon = L.DivIcon.extend({
    options: {
        "circleText": "",
        "className": "svg-icon",
        "circleAnchor": null, //defaults to [iconSize.x/2, iconSize.x/2]
        "circleColor": null, //defaults to color
        "circleOpacity": null, // defaults to opacity
        "circleFillColor": "rgb(255,255,255)",
        "circleFillOpacity": null, //default to opacity 
        "circleRatio": 0.5,
        "circleWeight": null, //defaults to weight
        "color": "rgb(0,102,255)",
        "fillColor": null, // defaults to color
        "fillOpacity": 0.4,
        "fontColor": "rgb(0, 0, 0)",
        "fontOpacity": "1",
        "fontSize": null, // defaults to iconSize.x/4
        "iconAnchor": null, //defaults to [iconSize.x/2, iconSize.y] (point tip)
        "iconSize": L.point(32,48),
        "opacity": 1,
        "popupAnchor": null,
        "weight": 2
    },
    initialize: function(options) {
        options = L.Util.setOptions(this, options)

        if (!options.circleAnchor) {
            options.circleAnchor = L.point(Number(options.iconSize.x)/2, Number(options.iconSize.x)/2)
        }
        if (!options.circleColor) {
            options.circleColor = options.color
        }
        if (!options.circleFillOpacity) {
            options.circleFillOpacity = options.opacity
        }
        if (!options.circleOpacity) {
            options.circleOpacity = options.opacity
        }
        if (!options.circleWeight) {
            options.circleWeight = options.weight
        }
        if (!options.fillColor) { 
            options.fillColor = options.color
        }
        if (!options.fontSize) {
            options.fontSize = Number(options.iconSize.x/4) 
        }
        if (!options.iconAnchor) {
            options.iconAnchor = L.point(Number(options.iconSize.x)/2, Number(options.iconSize.y))
        }
        if (!options.popupAnchor) {
            options.popupAnchor = L.point(0, (-0.75)*(options.iconSize.y))
        }

        var path = this._createPath()
        var circle = this._createCircle()

        options.html = this._createSVG()
    },
    _createCircle: function() {
        var cx = Number(this.options.circleAnchor.x)
        var cy = Number(this.options.circleAnchor.y)
        var radius = this.options.iconSize.x/2 * Number(this.options.circleRatio)
        var fill = this.options.circleFillColor
        var fillOpacity = this.options.circleFillOpacity
        var stroke = this.options.circleColor
        var strokeOpacity = this.options.circleOpacity
        var strokeWidth = this.options.circleWeight
        var className = this.options.className + "-circle"        
       
        var circle = '<circle class="' + className + '" cx="' + cx + '" cy="' + cy + '" r="' + radius +
            '" fill="' + fill + '" fill-opacity="'+ fillOpacity + 
            '" stroke="' + stroke + '" stroke-opacity=' + strokeOpacity + '" stroke-width="' + strokeWidth + '"/>'
        
        return circle
    },
    _createPathDescription: function() {
        var height = Number(this.options.iconSize.y)
        var width = Number(this.options.iconSize.x)
        var weight = Number(this.options.weight)
        var margin = weight / 2

        var startPoint = "M " + margin + " " + (width/2) + " "
        var leftLine = "L " + (width/2) + " " + (height - weight) + " "
        var rightLine = "L " + (width - margin) + " " + (width/2) + " "
        var arc = "A " + (width/4) + " " + (width/4) + " 0 0 0 " + margin + " " + (width/2) + " Z"

        var d = startPoint + leftLine + rightLine + arc

        return d
    },
    _createPath: function() {
        var pathDescription = this._createPathDescription()
        var strokeWidth = this.options.weight
        var stroke = this.options.color
        var strokeOpacity = this.options.Opacity
        var fill = this.options.fillColor
        var fillOpacity = this.options.fillOpacity
        var className = this.options.className + "-path"

        var path = '<path class="' + className + '" d="' + pathDescription +
            '" stroke-width="' + strokeWidth + '" stroke="' + stroke + '" stroke-opacity="' + strokeOpacity +
            '" fill="' + fill + '" fill-opacity="' + fillOpacity + '"/>'

        return path
    },
    _createSVG: function() {
        var path = this._createPath()
        var circle = this._createCircle()
        var text = this._createText()
        var className = this.options.className + "-svg"

        var style = "width:" + this.options.iconSize.x + "; height:" + this.options.iconSize.y + ";"

        var svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="' + className + '" style="' + style + '">' + path + circle + text + '</svg>'

        return svg
    },
    _createText: function() {
        var fontSize = this.options.fontSize + "px"
        var lineHeight = Number(this.options.fontSize)

        var x = Number(this.options.iconSize.x) / 2
        var y = x + (lineHeight * 0.35) //35% was found experimentally 
        var circleText = this.options.circleText
        var textColor = this.options.fontColor.replace("rgb(", "rgba(").replace(")", "," + this.options.fontOpacity + ")")

        var text = '<text text-anchor="middle" x="' + x + '" y="' + y + '" style="font-size: ' + fontSize + '" fill="' + textColor + '">' + circleText + '</text>'

        return text
    }
})

L.divIcon.svgIcon = function(options) {
    return new L.DivIcon.SVGIcon(options)
}

L.Marker.SVGMarker = L.Marker.extend({
    options: {
        "iconFactory": L.divIcon.svgIcon,
        "iconOptions": {}
    },
    initialize: function(latlng, options) {
        options = L.Util.setOptions(this, options)
        options.icon = options.iconFactory(options.iconOptions)
        this._latlng = latlng
    },
    onAdd: function(map) {
        L.Marker.prototype.onAdd.call(this, map)
    },
    setStyle: function(style) {
        if (this._icon) {
            var svg = this._icon.children[0]
            var iconBody = this._icon.children[0].children[0]
            var iconCircle = this._icon.children[0].children[1]

            if (style.color && !style.iconOptions) {
                var stroke = style.color.replace("rgb","rgba").replace(")", ","+this.options.icon.options.opacity+")")
                var fill = style.color.replace("rgb","rgba").replace(")", ","+this.options.icon.options.fillOpacity+")")
                iconBody.setAttribute("stroke", stroke)
                iconBody.setAttribute("fill", fill)
                iconCircle.setAttribute("stroke", stroke)

                this.options.icon.fillColor = fill
                this.options.icon.color = stroke
                this.options.icon.circleColor = stroke
            }
            if (style.opacity) {
                this.setOpacity(style.opacity)
            }
            if (style.iconOptions) {
                if (style.color) { style.iconOptions.color = style.color }
                iconOptions = L.Util.setOptions(this.options.icon, style.iconOptions)
                this.setIcon(L.divIcon.svgIcon(iconOptions))
            }
        }
    }
})

L.marker.svgMarker = function(latlng, options) {
    return new L.Marker.SVGMarker(latlng, options)
}