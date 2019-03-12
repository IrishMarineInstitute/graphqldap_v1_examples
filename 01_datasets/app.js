GraphqlDAPv1.prototype.findDatasets = function(
                                  searchQuery
                                            ){
  var query =  [
      "query findDatasets($query: String!){",
      "  datasets(query: $query){",
      "    title",
      "    institution",
      "    graphql",
      "    endpoint",
      "  }",
      "}",
      ""
    ].join("\n");
  var variables = {
    searchQuery: searchQuery
  };
  if( arguments.length === 1 &&
      typeof arguments[0] === 'object' &&
      arguments[0].hasOwnProperty('query')){
    variables = {};
    var varnames = [
          "query"
];
    varnames.forEach(function(params,varname){
       if(params.hasOwnProperty(varname)){
         variables[varname] = params[varname];
       };
    }.bind(null,arguments[0]));
  }
  var operationName = "findDatasets";
  var endPoint = "/datasets"
  return this.$fetch(query, variables, operationName, endPoint);
}

var addLinks = function(text){
	// see https://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
    // http://, https://, ftp://
    var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

    // www. sans http:// or https://
    var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

    // Email addresses
    var emailAddressPattern = /[\w.-]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,20})+/gim;

    return (""+text)
        .replace(urlPattern, '<a title="opens in a new window" target="_blank" href="$&">$&</a>')
        .replace(pseudoUrlPattern, '$1<a title="opens in a new window" target="_blank" href="http://$2">$2</a>')
        .replace(emailAddressPattern, '<a target="_blank" href="mailto:$&">$&</a>');
}
var getUrlSearchParams = function(){
	if(location.hash.indexOf('?')>0){
		return new URLSearchParams(location.hash.substring(location.hash.indexOf('?')));
	}
	return new URLSearchParams("?");
}
var onHashChanged = function(){
	var urlParams = getUrlSearchParams();
	var search = urlParams.get('search');
	if(search && search != document.getElementById('search').value){
		document.getElementById("datasets").scrollIntoView();
		document.getElementById('search').value = search;
		searchDatasets();
	}
}
var showSearchResults = function(data){
	document.getElementById("searchResults").innerText = "Searching...";
	var table = document.createElement("table");
	table.setAttribute("class","table");
	var thead = document.createElement("thead");
	table.appendChild(thead);
	var tr = document.createElement("tr");
	thead.appendChild(tr);
	var th = function(text){
		var el = document.createElement("th");
		el.setAttribute('scope','col');
		el.appendChild(document.createTextNode(text));
		return el;
	}
	tr.appendChild(th(""));
	tr.appendChild(th("Title"));
	tr.appendChild(th("Institution"));
	tr.appendChild(th("Graphql Endpoint"));
	var tbody = document.createElement("tbody");
	table.appendChild(tbody);
	var td = function(text){
		var el = document.createElement("td");
		el.appendChild(document.createTextNode(text));
		return el;
	}
	var tr = function(o){
		var el = document.createElement("tr");
		var expand = td("");
		el.appendChild(expand);
		el.appendChild(td(o.title));
		el.appendChild(td(o.institution || ""));
		if(o.endpoint){
			var e = document.createElement("td");
			var link = document.createElement("a");
		    link.href = graphqlDAP.api_url+o.endpoint;
		    link.appendChild(document.createTextNode(o.endpoint));
			e.appendChild(link);
			el.appendChild(e);
			expand.innerText = "+";
			expand.classList.add("btn");
			expand.classList.add("btn-primary");
			expand.addEventListener("click",function(){
				var idx = this.parentNode.rowIndex + 1;
				if(this.innerText == "-"){
					table.deleteRow(idx);
					this.innerText = "+";
					return;
				}

				var row = table.insertRow(idx);
				this.innerText = "-";
				var el = td("...");
				el.setAttribute("colspan",4);
				row.appendChild(el);
				graphqlDAP.getMetadata(o.endpoint).then((metadata)=>{
					var innerTable = document.createElement("table");
					innerTable.setAttribute("class","table");
					var email = {
						"@": '<i class="fa fa-envelope"></i> '
					};
					var url = {
						"ftp": '<i class="fa fa-external-link-alt"></i> ',
						"http": '<i class="fa fa-external-link-alt"></i> '
					}
					var datatype = {
								"grid": '<i class="fas fa-th"></i> ',
								"table": '<i class="fas fa-table"></i> ',
								"timeseries": '<i class="far fa-calendar"></i> ',
								"trajectory": '<i class="fa fa-location-arrow"></i> ',
								"point": '<i class="fas fa-map-marked-alt"></i> '
							};
					var personinst = {
								"person": '<i class="fas fa-user"></i> ',
								"institution": '<i class="fas fa-university"></i> ',
							};
					var extras = {
							cdm_data_type: datatype,
							creator_email: email,
							creator_type: personinst,
							creator_url: url,
							featureType: datatype,
							infoUrl: url,
							institution: {
								"Marine Institute": "<img height='16' src='mi_logo_bw.png' alt='Marine Institute' /> ",
							},
							license: {
								"Creative Commons Attribution 4.0": "<img height='16' src='cc-by-attribution.png' alt='CC BY' /> "
							},
							projection_type: {
								"map": '<i class="fas fa-map"></i> '
							},
							publisher_email: email,
							publisher_type: personinst,
							publisher_url: url,
							source: {
								"satellite": '<i class="fas fa-satellite"></i> ',

							},
							sourceUrl: {
								"local files": '<i class="fa fa-copy"></i> ',
								"local file": '<i class="fa fa-copy"></i> ',
								"database": '<i class="fa fa-database"></i> ',
								"cassandra": '<i class="fa fa-database"></i> ',
								"ftp": '<i class="fa fa-external-link-alt"></i> ',
								"http": '<i class="fa fa-external-link-alt"></i> '
							},
					}
					var default_extras = {
						license: '<i class="fa fa-balance-scale"></i> ',
						institution: '<i class="fas fa-university"></i> ',
						satellite: '<i class="fas fa-satellite"></i> ',
						projection: '<i class="fas fa-atlas"></i> '
					}

					var seen = [];
					var mtds = {};
					var addItem = function(irow,key,colspan){
						seen.push(key);
						var h = document.createElement('th');
						h.setAttribute("style","text-align: right");
						h.innerText = key;
						var d = document.createElement('td');
						if(colspan){
							d.setAttribute("colspan",colspan);
						}
						var html = addLinks(metadata[key]);
						var foundExtra = false;
						if(extras[key]){
							var htmlLowerCase = html.toLowerCase();
							Object.keys(extras[key]).forEach((string)=>{
								if(!foundExtra){
									if(htmlLowerCase.indexOf(string.toLowerCase())>=0){
										html = extras[key][string]+html;
										foundExtra = true;
									}
								}
							})
						}
						if(default_extras[key] && !foundExtra){
							html = default_extras[key]+html;
						}
						d.innerHTML = html;
						irow.appendChild(h);
						irow.appendChild(d);
						mtds[key] = d;
					}
					var addRow = function(key,colspan){
						if(metadata[key] === undefined || seen.indexOf(key) >=0){
							return;
						}
						var irow = innerTable.insertRow(-1);
						addItem(irow,key,colspan);
						return irow;
					};
					var addPair	= function(a,b){
						var irow = addRow(a);
						if(irow){
							addItem(irow,b);
						}
					};

					["title","institution","cdm_data_type","summary","license"].forEach((key)=>{
						addRow(key,3);
					});
					addPair("time_coverage_start","time_coverage_end");
					var spatial = ["geospatial_lat_min","geospatial_lat_max","geospatial_lon_min","geospatial_lon_max"];
					var mapDiv = false;
					var bounds = [];
					var point = false;
					if(spatial.filter(s => metadata[s] !== undefined).length == spatial.length){
						bounds = [[metadata["geospatial_lat_min"],metadata["geospatial_lon_min"]],
									  [metadata["geospatial_lat_max"],metadata["geospatial_lon_max"]]];
						try{
							var parsedRoundedBounds = bounds.map(x=>Math.round(parseFloat(x)*1000));
							if(parsedRoundedBounds[0] == parsedRoundedBounds[1] && parsedRoundedBounds[2] == parsedRoundedBounds[3]){
								point = bounds[0];
							}
						}catch(oh_well){};

						// let's add a map.
						Object.keys(metadata).forEach((key)=>{
							if(key.startsWith("geospatial_") && spatial.indexOf(key)<0)
							spatial.push(key);
						});
						spatial.sort(function(a, b) {
							var sub = (s)=> s.replace("_min","_maa");
							var x = sub(a);
							var y = sub(b);
						  if (x < y) {
						    return -1;
						  }
						  if (x > y) {
						    return 1;
						  }
						  return 0;
						});
						var mapRow = addRow(spatial[0]);
						spatial.forEach((key)=>{
							addRow(key);
						});
						var mapCell = mapRow.insertCell(-1);
						mapCell.setAttribute("rowspan",spatial.length);
						mapCell.setAttribute("colspan",2);
						mapCell.setAttribute("width","50%");
						mapDiv = document.createElement('div');
						mapDiv.setAttribute("style","height: "+(spatial.length * 36)+"px;");
						mapCell.appendChild(mapDiv);
					}
					addPair("Northernmost_Northing", "Easternmost_Easting");
					addPair("Southernmost_Northing", "Westernmost_Easting");
					var irow = addRow("time_coverage_start");
					if(irow){
						addItem("time_coverage_end");
					}

					Object.keys(metadata).forEach((key)=>{
							addRow(key,3);
					});
					el.innerText = "";
					el.appendChild(innerTable);
					if(mapDiv){
						var map = L.map(mapDiv,{attributionControl: false});
						L.control.attribution({position: "bottomleft"}).addTo(map);
						L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
						    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
						}).addTo(map);
						map.fitBounds(bounds);
						if(point){
							var marker = L.marker(point).addTo(map);
							marker.bindPopup(metadata["title"]).openPopup();
							map.setView(point,9);
						}else{
							L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
						}
					}


				})
			}.bind(expand));
		}
		return el;
	}
	if(data.datasets && data.datasets.length){
		data.datasets.forEach((o)=>tbody.appendChild(tr(o)));
	}else{
		tbody.appendChild(tr({title: "No results found"}))

	}
	clearSearchResults();
	document.getElementById("searchResults").appendChild(table);
}
var clearSearchResults = function(info){
	document.getElementById("searchResults").innerText = info || "";
}
var clearSearchDatasets = function(){
	document.getElementById("search").value = "";
	clearSearchResults();
}
var searchDatasets = function(){
	clearSearchResults("Searching datasets...");
	var query = document.getElementById("search").value;
	if(query){
		var urlParams = getUrlSearchParams();;
		urlParams.set("search",query);
		history.replaceState(null, null, document.location.pathname + '#datasets?'+urlParams.toString());
		graphqlDAP.findDatasets({
		  "query": query
		}).then(function(result){
			if(result.errors){
			alert(result.errors[0].message);
			}
			if(result.data){
				showSearchResults(result.data);
			}
		});
	}
}