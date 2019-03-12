
GraphqlDAPv1.prototype.list_argo_float_cycles = function(
                                  bbox
                                            ){
  var query =  [
      "query list_argo_float_cycles($bbox: String!){",
      "  cycles: argoFloats(bbox: $bbox){",
      "      platform_number",
      "      project_name",
      "      cycle_number",
      "      latitude",
      "      longitude",
      "      time",
      "    }",
      "}",
      "",
      "",
      ""
    ].join("\n");
  var variables = {
    bbox: bbox
  };
  if( arguments.length === 1 &&
      typeof arguments[0] === 'object' &&
      arguments[0].hasOwnProperty('bbox')){
    variables = {};
    var varnames = [
          "bbox"
];
    varnames.forEach(function(params,varname){
       if(params.hasOwnProperty(varname)){
         variables[varname] = params[varname];
       };
    }.bind(null,arguments[0]));
  }
  var operationName = "list_argo_float_cycles";
  var endPoint = "/imi/argoFloats"

  return this.$fetch(query, variables, operationName, endPoint);
}

GraphqlDAPv1.prototype.get_platform_route = function(
                                  platform_number
                                            ){
  var query =  [
      "query get_platform_route($platform_number: String!){",
      "  route: argoFloats(platform_number: {eq: $platform_number}){",
      "      cycle_number",
      "      latitude",
      "      longitude",
      "    }",
      "}",
      "",
      "",
      ""
    ].join("\n");
  var variables = {
    platform_number: platform_number
  };
  if( arguments.length === 1 &&
      typeof arguments[0] === 'object' &&
      arguments[0].hasOwnProperty('platform_number')){
    variables = {};
    var varnames = [
          "platform_number"
];
    varnames.forEach(function(params,varname){
       if(params.hasOwnProperty(varname)){
         variables[varname] = params[varname];
       };
    }.bind(null,arguments[0]));
  }
  var operationName = "get_platform_route";
  var endPoint = "/imi/argoFloats"

  return this.$fetch(query, variables, operationName, endPoint);
}
GraphqlDAPv1.prototype.argo_profile = function(
                                  platform_number,
                                  cycle_number
                                            ){
  var query =  [
      "query argo_profile($platform_number: String!, $cycle_number: Int!){",
      "  argo: argoFloats(platform_number: {eq: $platform_number}, cycle_number:{eq:$cycle_number}){",
      "      platform_number",
      "      cycle_number",
      "      project_name",
      "      time",
      "      latitude",
      "      longitude",
      "  }",
      "  profile: argoFloats(platform_number: {eq: $platform_number}, cycle_number: {eq: $cycle_number}){",
      "      pres",
      "      psal",
      "      temp",
      "  }",
      "}",
      ""
    ].join("\n");
  var variables = {
    platform_number: platform_number,
    cycle_number: parseInt(cycle_number)
  };
  if( arguments.length === 1 &&
      typeof arguments[0] === 'object' &&
      arguments[0].hasOwnProperty('platform_number')){
    variables = {};
    var varnames = [
          "platform_number",
          "cycle_number"
];
    varnames.forEach(function(params,varname){
       if(params.hasOwnProperty(varname)){
         variables[varname] = params[varname];
       };
    }.bind(null,arguments[0]));
  }
  var operationName = "argo_profile";
  var endPoint = "/imi/argoFloats"

  return this.$fetch(query, variables, operationName, endPoint);
}


var map = L.map('map').setView([53.227, -10], 5);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


var getCycleTooltip = function(props){
  return ["<b>Project:</b> "+props.project_name,
        "<b>Platform:</b> "+props.platform_number,
        "<b>Cycle:</b> "+props.cycle_number,
        "<b>Date:</b> "+props.time.substring(0,10),
        "<b>Location:</b> "+props.latitude+","+props.longitude].join("<br>")
} 

var argoPathGroup = L.featureGroup();
argoPathGroup.addTo(map);
var selectedArgoLayer = L.geoJSON([],{
    pointToLayer: function (feature, latlng) {
      var props = feature.properties;
    var options = {
      radius: 15,
      fillColor: props.color,
      color: props.color,
      weight: 2,
      opacity: 1,
      fillOpacity: 0.5,
    };
     return L.circleMarker(latlng, options)
       .on('click',unselectArgo)
       .bindTooltip(
       getCycleTooltip(props)
     );
    }
}).addTo(map);

var get_platform_route = function(properties){
  graphqlDAP.get_platform_route(properties).then(
  function(result){
    path_platform_number = properties.platform_number;
    var coordinates = result.data.route.map(function(x){return [x.latitude,x.longitude];});
    var antpath = new L.Polyline.AntPath(coordinates, {
      'delay': 800,
      'dashArray': [8,14],
      'weight': 2,
      'color': '#0000ff',
      'pulseColor': '#FFFFFF'
    });
    argoPathGroup.clearLayers();
    argoPathGroup.addLayer(antpath);
  });
} 
var selected_argo_cycles = [];
var path_platform_number = null;

var updateSelectedArgos = function(){
  var features = selected_argo_cycles.map(argoToFeature);
  selectedArgoLayer.clearLayers();
  showCharts(selected_argo_cycles);
  selectedArgoLayer.addData(features);
  updateHash();
}
var selectArgo = function(props){
   graphqlDAP.argo_profile(props).then(function(result){
     var profile = result.data.profile;
      var cycle = result.data.argo[0];
     profile.forEach(function(x){
        x.depth = calculateSeaDepth(x.pres,cycle.latitude)
      });
      cycle.profile = profile;
      selected_argo_cycles.push(cycle);
      selected_argo_cycles.sort(
         function(a,b) {
           return (a.time > b.time) ? 1 
           : ((b.time > a.time) ? -1 
              : 0);} );
      updateSelectedArgos();
    });
}

var argoClicked = function(e){
  var props = e.target.feature.properties;
  get_platform_route(props);
  selectArgo(props);
}

var argolayer = L.geoJSON([],{
    pointToLayer: function (feature, latlng) {
      var props = feature.properties;
    var options = {
      radius: Math.max(1,map.getZoom()-3),
      fillColor: props.color,
      color: props.color,
      weight: 1,
      opacity: 1,
      fillOpacity: 0.5,
    };
     return L.circleMarker(latlng, options)
       .on('click',argoClicked)
       .bindTooltip(
       getCycleTooltip(props)
     );
    }
}).addTo(map);

var unselectArgo = function(e){
  var discard = e.target.feature.properties;
  selected_argo_cycles = selected_argo_cycles.filter(function(x){
    return !(x.platform_number == discard.platform_number && x.cycle_number == discard.cycle_number);
  });
  updateSelectedArgos();
};


var argoToFeature = function(x){
          x.timestamp = new Date(x.time).getTime();
          return {
            "type": "Feature", 
            "properties": x,
            "geometry": {
              "type": "Point",
              "coordinates": [x.longitude, x.latitude]
          }
        }};
var show_argos = function(){
graphqlDAP.list_argo_float_cycles({ 
  "bbox": map.getBounds().toBBoxString()
}).then(function(result){
  if(result.errors){
    alert(result.errors[0].message);
  }
  if(result.data){
	    var features = result.data.cycles.map(argoToFeature);
    var timestamp = function(x){return x.properties.timestamp};
    var domain = [d3.min(features,timestamp),d3.mean(features,timestamp),d3.max(features,timestamp)];
    var colormap = d3
                    .scaleLinear()
                    .domain(domain)
                    .range(["#feac5e", "#C779D0", "#4BC0C8"])
                    .interpolate(d3.interpolateRgb);
    features.forEach(function(x){
      x.properties.color = d3.color(colormap(x.properties.timestamp)).toString();
    });
    argolayer.clearLayers();
    argolayer.addData(features);
  }
});
}


//input: pressure in decibars
//output: depth in meters
function calculateSeaDepth(pressure, latitude) {

    //x = [sin (latitude / 57.29578) ] ^ 2
    var xVar = Math.pow((Math.sin(latitude / 57.29578)), 2);

    //g (m/sec2) = 9.780318 * [ 1.0 + ( 5.2788x10 -3  + 2.36x10 -5  * x) * x ] + 1.092x10 -6  * p
    var gravityVar = (9.780318 * (1 + (((5.2788 * Math.pow(10, -3)) + ((2.36 * Math.pow(10, -5)) * xVar)) * xVar))) + ((1.092 * Math.pow(10, -6)) * pressure);

    //depth (meters) = [(((-1.82x10 -15  * p + 2.279x10 -10 ) * p - 2.2512x10 -5 ) * p + 9.72659) * p] / g
    var depth = ((((((((-1.82 * Math.pow(10, -15)) * pressure) + (2.279 * Math.pow(10, -10))) * pressure) - (2.2512 * Math.pow(10, -5))) * pressure) + 9.72659) * pressure) / gravityVar;

    return depth;
}

var showCharts = function(argos){
  showTemperatureChart(argos);
  showSalinityChart(argos);
  showTemperatureSalinityChart(argos);
}

var showTemperatureChart = function(argos){
  var series = argos.map(function(cycle){
    return {
      
      name: cycle.time.substring(0,10),
      data: cycle.profile.map(function(x){return [x.depth, x.temp]}),
      cycle: cycle,
    }
  });
  var chart = Highcharts.chart('temperatureChart', {
    chart: {
        type: 'spline',
        inverted: true
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
    title: {
        text: 'Water Temperature by Depth'
    },
    xAxis: {
        reversed: true,
        title: {
            enabled: true,
            text: 'Depth (m)'
        },
        labels: {
            formatter: function () {
                return this.value + 'm';
            }
        },
        maxPadding: 0.05,
        showLastLabel: true
    },
    yAxis: {
        title: {
            text: 'Temperature'
        },
        labels: {
            formatter: function () {
                return this.value + '°';
            }
        },
        lineWidth: 2
    },
    legend: {
        enabled: true
    },
    tooltipx: {
        headerFormat: '<b>{series.name}</b><br/>',
        pointFormat: '{point.x}m: {point.y}°C'
    },
    plotOptions: {
        spline: {
            marker: {
                enable: false
            }
        }
    },
    series: series,
    tooltip: {
                        shared: true,
                        valueDecimals: 2,
                        useHTML: true,
                        formatter: function () {
                            var s = [
                            '<span style="color:#7cb5ec">●</span><span> ',
                              ': </span><span style="font-weight:bold">',
                              Highcharts.numberFormat(this.y, 2),
                              " ",
                              "</span>",
                              '<br/><span> ',
                              'Depth',
                              ': </span><span style="font-weight:bold">',
                              Highcharts.numberFormat(this.x, 2),
                              " (m)</span>",
                              '<br/><span> ',
                              'Temperature',
                              ': </span><span style="font-weight:bold">',
                              Highcharts.numberFormat(this.y, 2),
                              " (°C)</span>"
                              ];

                            return s.join("");
                        }
                    }
});
  for(var i=0;i<chart.series.length;i++){
    argos[i].color = chart.series[i].color;
  }
}

var showSalinityChart = function(argos){
  var series = argos.map(function(cycle){
    return {
      
      name: cycle.time.substring(0,10),
      data: cycle.profile.map(function(x){return [x.depth, x.psal]}),
      cycle: cycle
    }
  });
  var chart = Highcharts.chart('salinityChart', {
    chart: {
        type: 'spline',
        inverted: true
    },
    title: {
        text: 'Water Salinity by Depth'
    },
    xAxis: {
        reversed: true,
        title: {
            enabled: true,
            text: 'Depth (m)'
        },
        labels: {
            formatter: function () {
                return this.value + 'm';
            }
        },
        maxPadding: 0.05,
        showLastLabel: true
    },
    yAxis: {
        title: {
            text: 'Salinity (PSU)'
        },
        labels: {
            formatter: function () {
                return this.value;
            }
        },
        lineWidth: 2
    },
    legend: {
        enabled: true
    },
    tooltip: {
        headerFormat: '<b>{series.name}</b><br/>',
        pointFormat: '{point.x}m: {point.y} PSU'
    },
    plotOptions: {
        spline: {
            marker: {
                enable: false
            }
        }
    },
    series: series
});
  for(var i=0;i<chart.series.length;i++){
    argos[i].color = chart.series[i].color;
  }
}

var showTemperatureSalinityChart = function(argos){
  var series = argos.map(function(cycle){
    return {
      
      name: cycle.time.substring(0,10),
      data: cycle.profile.map(function(x){return [x.temp, x.psal]}),
      cycle: cycle
    }
  });
  var chart = Highcharts.chart('temperatureSalinityChart', {
    chart: {
        type: 'scatter',
        inverted: true
    },
    title: {
        text: 'Water Temperature / Salinity'
    },
    xAxis: {
        reversed: false,
        title: {
            enabled: true,
            text: 'Temperature (°C)'
        },
        labels: {
            formatter: function () {
                return this.value + '°C';
            }
        },
        maxPadding: 0.05,
        showLastLabel: true
    },
    yAxis: {
        title: {
            text: 'Salinity (PSU)'
        },
        labels: {
            formatter: function () {
                return this.value ;
            }
        },
        lineWidth: 2
    },
    legend: {
        enabled: true
    },
    tooltip: {
        headerFormat: '<b>{series.name}</b><br/>',
        pointFormat: '{point.x}°C: {point.y} PSU'
    },
    plotOptions: {
        spline: {
            marker: {
                enable: false
            }
        }
    },
    series: series
});
  for(var i=0;i<chart.series.length;i++){
    argos[i].color = chart.series[i].color;
  }
}

var loadArgosFromHash = function(){
  var settings = {};
  var parts = window.location.hash.split(/[?&]/);
  parts.forEach(function(part){
    var kv = part.split('=');
    if(kv.length == 2){
      settings[kv[0]] = settings[kv[0]] || [];
      settings[kv[0]].push(kv[1]);
    }
  });
  if(settings.bbox){
    map.fitBounds(fromBBoxString(settings.bbox[0]));
  }
  if(settings.argo){
    settings.argo.forEach(function(argo){
      var parts = argo.split(",");
      if(parts.length == 2){
        selectArgo({
          platform_number: parts[0],
          cycle_number: parseInt(parts[1])
        });
      }
    });
  }
  if(settings.path_platform_number){
    get_platform_route({platform_number: settings.path_platform_number[0]});
  }
}

var fromBBoxString = function(bbox){
  var wsen = decodeURIComponent(bbox).split(',').map(parseFloat)
  return new L.LatLngBounds(new L.LatLng(wsen[1], wsen[0]), new L.LatLng(wsen[3], wsen[2]))  
}
var updateHash = function(api_key,api){
  var urlParams = new URLSearchParams("?");
  if(location.hash.indexOf('?')>0){
    var oldUrlParams = new URLSearchParams(location.hash.substring(location.hash.indexOf('?')));
    ['api_key','api'].forEach(function(key){
      if(oldUrlParams.get(key)){
        urlParams.set(key,oldUrlParams.get(key));
      }
    });
  }
  urlParams.set('api_key',urlParams.get('api_key')|| api_key);
  urlParams.set('api',urlParams.get('api')|| api);

  var hash = selected_argo_cycles.map(function(x){return "argo="+x.platform_number+","+x.cycle_number;});
  hash.unshift("bbox="+map.getBounds().toBBoxString());
  if(path_platform_number){
    hash.push("path_platform_number="+path_platform_number);
  }
  history.replaceState(null, null, document.location.pathname + '#?'+urlParams.toString()+'&'+hash.join("&"));
}
map.on('moveend', function(e) {
   show_argos();
  updateHash();
});
